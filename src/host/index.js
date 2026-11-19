/**
 * Host 侧入口：组装 storage / request 与扩展服务（variables / sandbox / mock / runner /
 * importExport / codegen），统一经 webServer prefix 桥暴露给 client。
 *
 * web client 无法注入插件自定义 face（官方机制核实：样板 inject 全为宿主内置 face），
 * 契约 §3 的 inject face 方案作废，改走 dsh-db-tool 同款 webServer prefix 桥（0.2.x 生产验证）。
 */
import { createStorageService } from './storage.js'
import { createRequestService } from './request.js'
import { createMockServer } from './mock-server.js'
import { createTestRunner } from './test-runner.js'
import { runScript } from './script-sandbox.js'
import { createVariableResolver, DYNAMIC_VARS } from './variables.js'
import * as importExport from './import-export.js'
import * as codegen from './codegen.js'
import { handlePostapiRequest } from './bridge.js'
import { appendFileSync } from 'node:fs'

/** cordis 受控 ctx：宿主按此清单注入服务，未声明的属性访问会直接抛错（without inject）。 */
export const inject = ['webServer', 'connection']

/**
 * 自诊断日志路径：仅当 POSTAPI_DEBUG_LOG 指定具体文件时才落盘。
 * 默认不写任何文件——发布版不能往使用者机器上固定路径写日志。
 */
const POSTAPI_DEBUG_LOG = (process.env.POSTAPI_DEBUG_LOG || '').trim()

/** 自诊断日志：写失败不得影响插件加载（磁盘只读 / 目录缺失时静默跳过）。 */
function bootLog(line) {
  if (POSTAPI_DEBUG_LOG === '') return
  try {
    appendFileSync(POSTAPI_DEBUG_LOG, new Date().toISOString() + ' ' + line + '\n')
  } catch {
    // 诊断日志不是功能路径，写不了就算了
  }
}

export function apply(ctx, config) {
  // 自诊断：host 半边是否被 cordis 加载（定位插件未生效时用；稳定后可删）。
  bootLog('host apply called')
  const basePath = (config && (config.storage?.basePath ?? config.basePath)) || undefined
  const storage = createStorageService(basePath)
  const request = createRequestService()

  // Mock 服务按需持有单例：项目数据从 storage 现取，端口取项目 settings.mockPort。
  const mock = createMockServer({
    getProject: (projectId) => storage.getProject(projectId),
    port: (config && config.mockPort) || 4010,
  })
  const runner = createTestRunner({ storage, request })

  // 桥第三参：服务方法缺失时对应路由返回 501 NOT_WIRED，绝不崩 handler。
  const services = {
    variables: {
      createVariableResolver,
      DYNAMIC_VARS,
    },
    sandbox: { runScript },
    mock,
    runner,
    importExport,
    codegen,
  }

  // cordis ctx 为受控对象，禁止直接挂属性（cannot set property without provide）；
  // client 经 webServer prefix 桥取数，全部服务以闭包形式供 handler 使用。

  // 形态对齐 dsh-db-tool lib/index.ts:136-181：register 缺失时给空 disposer，并带 effect 名。
  ctx.effect?.(
    () =>
      ctx.webServer?.register({
        kind: 'prefix',
        path: '/dsh-postapi/api',
        handler: async (req, res) => {
          // 宿主 Connection 栅栏优先（同 db-tool lib/index.ts 141-158 形态）：
          // 插件前缀路由不经宿主鉴权，必须显式应用 requestRejection（Host/Origin + 浏览器 token）；
          // 401/403 时由本处兜底写出 JSON 响应（宿主只返回状态码）。
          const rejection = ctx.connection?.requestRejection?.(req)
          if (rejection !== undefined) {
            res.statusCode = rejection
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({
              ok: false,
              error: rejection === 401 ? 'unauthorized: browser authentication required' : 'forbidden: untrusted request',
              code: rejection === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
            }))
            return
          }
          await handlePostapiRequest(req, res, { storage, request, services })
        },
      }) ?? (() => {}),
    'postapi-api',
  )

  // 插件卸载时收掉可能仍在监听的 Mock 端口（effect disposer 随插件生命周期释放）。
  ctx.effect?.(
    () => () => {
      mock.stop().catch(() => {})
    },
    'postapi-mock-teardown',
  )
}
