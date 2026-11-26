/**
 * 新建菜单数据（三级，与 Apifox 左侧「+」按钮同构）。
 *
 * Apifox 的「+」是三级结构：
 *   一级：接口 / 目录 / 快捷请求 / 数据模型 / 导入 / 模块 …（按资源类型分组）
 *   二级：一级项自身的具体类型（如「接口」下的 HTTP / WebSocket / gRPC / GraphQL）
 *   三级：具体格式或子类型（如「导入」下的 OpenAPI / Postman / HAR / cURL）
 *
 * 这里只描述数据与动作，不渲染任何 DOM；渲染由 Body.js 的 MenuTree 负责，
 * 便于单测直接断言层级与动作。
 */

/** 叶子动作的形态：navigate 跳路由，trigger 触发页内行为（由 body 注入回调）。 */
export function leaf(id, labelKey, action) {
  return { id, labelKey, action }
}

/**
 * 三级菜单树。
 * action 形态：
 *   { kind: 'route', hash: '#/doc' }        跳转路由
 *   { kind: 'route', hash: '#/doc', query } 带查询串
 *   { kind: 'event', name: 'new-endpoint' } 交给页面/宿主处理
 */
export const NEW_MENU = [
  {
    id: 'api',
    labelKey: 'menu.new.api',
    children: [
      {
        id: 'api-http',
        labelKey: 'menu.new.apiHttp',
        children: [
          { id: 'api-http-blank', labelKey: 'menu.new.apiHttpBlank', action: { kind: 'route', hash: '#/doc', query: 'new=1' } },
          { id: 'api-http-copy', labelKey: 'menu.new.apiHttpCopy', action: { kind: 'route', hash: '#/doc', query: 'copy=1' } },
        ],
      },
      {
        id: 'api-ws',
        labelKey: 'menu.new.apiWs',
        children: [
          { id: 'api-ws-blank', labelKey: 'menu.new.apiWsBlank', action: { kind: 'route', hash: '#/doc', query: 'protocol=websocket' } },
          { id: 'api-ws-copy', labelKey: 'menu.new.apiWsCopy', action: { kind: 'route', hash: '#/doc', query: 'protocol=websocket&copy=1' } },
        ],
      },
      {
        id: 'api-rpc',
        labelKey: 'menu.new.apiRpc',
        children: [
          { id: 'api-rpc-grpc', labelKey: 'menu.new.apiGrpc', action: { kind: 'route', hash: '#/doc', query: 'protocol=grpc' } },
          { id: 'api-rpc-graphql', labelKey: 'menu.new.apiGraphql', action: { kind: 'route', hash: '#/doc', query: 'protocol=graphql' } },
        ],
      },
    ],
  },
  {
    id: 'folder',
    labelKey: 'menu.new.folder',
    children: [
      { id: 'folder-blank', labelKey: 'menu.new.folderBlank', action: { kind: 'route', hash: '#/doc', query: 'newFolder=1' } },
      {
        id: 'folder-sub',
        labelKey: 'menu.new.folderSub',
        children: [
          { id: 'folder-sub-one', labelKey: 'menu.new.folderSubOne', action: { kind: 'route', hash: '#/doc', query: 'newFolder=1&depth=2' } },
          { id: 'folder-sub-two', labelKey: 'menu.new.folderSubTwo', action: { kind: 'route', hash: '#/doc', query: 'newFolder=1&depth=3' } },
        ],
      },
    ],
  },
  {
    id: 'schema',
    labelKey: 'menu.new.schema',
    children: [
      { id: 'schema-json', labelKey: 'menu.new.schemaJson', action: { kind: 'route', hash: '#/schema', query: 'new=1' } },
      { id: 'schema-import', labelKey: 'menu.new.schemaImport', action: { kind: 'route', hash: '#/schema', query: 'import=1' } },
    ],
  },
  {
    id: 'quick',
    labelKey: 'menu.new.quick',
    action: { kind: 'route', hash: '#/debug', query: 'quick=1' },
  },
  {
    id: 'import',
    labelKey: 'menu.new.import',
    children: [
      {
        id: 'import-doc',
        labelKey: 'menu.new.importDoc',
        children: [
          { id: 'import-openapi', labelKey: 'menu.new.importOpenapi', action: { kind: 'route', hash: '#/import', query: 'kind=openapi' } },
          { id: 'import-postman', labelKey: 'menu.new.importPostman', action: { kind: 'route', hash: '#/import', query: 'kind=postman' } },
          { id: 'import-apifox', labelKey: 'menu.new.importApifox', action: { kind: 'route', hash: '#/import', query: 'kind=apifox' } },
          { id: 'import-yapi', labelKey: 'menu.new.importYapi', action: { kind: 'route', hash: '#/import', query: 'kind=yapi' } },
          { id: 'import-har', labelKey: 'menu.new.importHar', action: { kind: 'route', hash: '#/import', query: 'kind=har' } },
          { id: 'import-curl', labelKey: 'menu.new.importCurl', action: { kind: 'route', hash: '#/import', query: 'kind=curl' } },
        ],
      },
      {
        id: 'import-data',
        labelKey: 'menu.new.importData',
        children: [
          { id: 'import-env', labelKey: 'menu.new.importEnv', action: { kind: 'route', hash: '#/import', query: 'kind=env' } },
          { id: 'import-schema', labelKey: 'menu.new.importSchema', action: { kind: 'route', hash: '#/import', query: 'kind=schema' } },
        ],
      },
    ],
  },
  { id: 'sep-1', separator: true },
  {
    id: 'test',
    labelKey: 'menu.new.test',
    children: [
      { id: 'test-case', labelKey: 'menu.new.testCase', action: { kind: 'route', hash: '#/test', query: 'new=case' } },
      { id: 'test-scenario', labelKey: 'menu.new.testScenario', action: { kind: 'route', hash: '#/test', query: 'new=scenario' } },
    ],
  },
  {
    id: 'env',
    labelKey: 'menu.new.env',
    action: { kind: 'route', hash: '#/env', query: 'new=1' },
  },
  {
    id: 'flow',
    labelKey: 'menu.new.flow',
    action: { kind: 'route', hash: '#/flow', query: 'new=1' },
  },
]

/** 树深度（1 = 只有一级；本表最大 3）。 */
export function menuDepth(items) {
  let max = 0
  for (const item of Array.isArray(items) ? items : []) {
    const d = item && Array.isArray(item.children) && item.children.length
      ? 1 + menuDepth(item.children)
      : 1
    if (d > max) max = d
  }
  return max
}

/** 按 id 查节点（递归）。 */
export function findMenuNode(items, id) {
  for (const item of Array.isArray(items) ? items : []) {
    if (!item) continue
    if (item.id === id) return item
    if (Array.isArray(item.children)) {
      const hit = findMenuNode(item.children, id)
      if (hit) return hit
    }
  }
  return null
}

/** 从根到目标 id 的路径（用于键盘导航与面包屑式展开）。 */
export function menuPath(items, id, trail) {
  const base = Array.isArray(trail) ? trail : []
  for (const item of Array.isArray(items) ? items : []) {
    if (!item) continue
    const next = base.concat([item])
    if (item.id === id) return next
    if (Array.isArray(item.children)) {
      const hit = menuPath(item.children, id, next)
      if (hit) return hit
    }
  }
  return null
}

/** 把 action 折成 hash（route 类）。 */
export function actionHash(action) {
  if (!action || action.kind !== 'route') return ''
  const q = action.query ? (action.hash.indexOf('?') >= 0 ? '&' : '?') + action.query : ''
  return action.hash + q
}
