// menu.test.js — 新建三级菜单：数据层级 + 纯函数 + 骨架静态纪律
// 形态照抄 shell-frame.test.js：静态读源断言 + esbuild 打包后直接调纯函数。
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const SHELL = join(REPO, 'src', 'client', 'shell')
const CSS = join(REPO, 'src', 'client', 'pages', 'design-tokens.css')

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')
const assert = (cond, message) => { if (!cond) throw new Error(message) }

const mod = await import('file://' + join(SHELL, 'menu.js').replace(/\\/g, '/'))
const { NEW_MENU, menuDepth, findMenuNode, menuPath, actionHash } = mod

export const tests = [
  {
    name: 'menu: 三级结构——一级 8 项，最大深度正好 3',
    fn() {
      assert(Array.isArray(NEW_MENU), 'NEW_MENU 应为数组')
      const top = NEW_MENU.filter((n) => n && !n.separator)
      assert(top.length === 8, '一级非分隔项应为 8 个，实际 ' + top.length)
      assert(menuDepth(NEW_MENU) === 3, '菜单最大深度应为 3，实际 ' + menuDepth(NEW_MENU))
    },
  },
  {
    name: 'menu: 每个有 children 的节点都至少 2 个子项（不会出现单分支空壳）',
    fn() {
      const walk = (items, trail) => {
        for (const n of items) {
          if (!n || n.separator) continue
          if (Array.isArray(n.children)) {
            assert(n.children.length >= 2, trail + n.id + ' 子项少于 2 个')
            walk(n.children, trail + n.id + '/')
          }
        }
      }
      walk(NEW_MENU, '')
    },
  },
  {
    name: 'menu: 叶子节点都有 action，且 route 类 action 能折成 hash',
    fn() {
      const walk = (items) => {
        for (const n of items) {
          if (!n || n.separator) continue
          if (Array.isArray(n.children)) { walk(n.children); continue }
          assert(n.action && typeof n.action === 'object', n.id + ' 叶子缺 action')
          if (n.action.kind === 'route') {
            const hash = actionHash(n.action)
            assert(hash.indexOf('#/') === 0, n.id + ' 的 hash 应以 #/ 开头，实际 ' + hash)
          }
        }
      }
      walk(NEW_MENU)
    },
  },
  {
    name: 'menu: actionHash 正确拼接查询串（有无 ? 两种情况）',
    fn() {
      assert(actionHash({ kind: 'route', hash: '#/doc' }) === '#/doc', '无 query 应原样返回')
      assert(actionHash({ kind: 'route', hash: '#/doc', query: 'new=1' }) === '#/doc?new=1', '无 ? 时应补 ?')
      assert(actionHash({ kind: 'route', hash: '#/doc?x=1', query: 'new=1' }) === '#/doc?x=1&new=1', '已有 ? 时应补 &')
      assert(actionHash(null) === '', 'null action 应返回空串')
      assert(actionHash({ kind: 'event', name: 'x' }) === '', '非 route 类返回空串')
    },
  },
  {
    name: 'menu: findMenuNode 能查到三级节点，未知 id 返回 null',
    fn() {
      const leaf = findMenuNode(NEW_MENU, 'import-openapi')
      assert(leaf && leaf.labelKey === 'menu.new.importOpenapi', '三级叶子查找失败')
      const mid = findMenuNode(NEW_MENU, 'api-http')
      assert(mid && Array.isArray(mid.children), '二级节点查找失败')
      assert(findMenuNode(NEW_MENU, 'not-exist') === null, '未知 id 应返回 null')
    },
  },
  {
    name: 'menu: menuPath 返回从根到叶子的完整链，未知 id 返回 null',
    fn() {
      const p = menuPath(NEW_MENU, 'import-postman')
      assert(Array.isArray(p) && p.length === 3, '三级节点路径长度应为 3，实际 ' + (p ? p.length : 'null'))
      assert(p[0].id === 'import' && p[1].id === 'import-doc' && p[2].id === 'import-postman', '路径顺序错误：' + p.map((n) => n.id).join('/'))
      assert(menuPath(NEW_MENU, 'nope') === null, '未知 id 应返回 null')
      const one = menuPath(NEW_MENU, 'quick')
      assert(one.length === 1, '一级节点路径长度应为 1')
    },
  },
  {
    name: 'menu: 每个 labelKey 在 zh 与 en 字典里都存在',
    fn() {
      const src = read(join(SHELL, 'locales.js'))
      const keys = new Set()
      const walk = (items) => {
        for (const n of items) {
          if (!n || n.separator) continue
          if (n.labelKey) keys.add(n.labelKey)
          if (Array.isArray(n.children)) walk(n.children)
        }
      }
      walk(NEW_MENU)
      for (const key of keys) {
        const hits = src.split("'" + key + "':").length - 1
        assert(hits === 2, key + ' 应在 zh 与 en 各定义一次，实际 ' + hits + ' 次')
      }
    },
  },
  {
    name: 'menu: 三级面板 CSS 就位（fixed 定位 / 项高 token / 逐层 z-index）',
    fn() {
      const css = read(CSS)
      for (const cls of ['.pp-menu {', '.pp-menu-item {', '.pp-menu-arrow {', '.pp-menu-anchor {']) {
        assert(css.includes(cls), 'CSS 缺规则 ' + cls)
      }
      assert(/--menu-item-h:\s*32px/.test(css), '--menu-item-h 应为 32px（Apifox 菜单项高）')
      assert(/--menu-w:\s*200px/.test(css), '--menu-w 应为 200px')
      // fixed 定位是必须的：宿主侧边栏 720px 且 overflow:hidden，absolute 级联会被裁掉
      assert(/\.pp-menu \{[^}]*position:\s*fixed/.test(css), '.pp-menu 必须用 fixed 定位（逃出宿主 overflow 裁剪）')
      assert(/\.pp-menu \{[^}]*overflow:\s*visible/.test(css), '.pp-menu 不能设 overflow 裁剪')
      assert(/data-depth="2"\]\s*\{\s*z-index:\s*calc/.test(css), '二级面板应抬高层级')
      assert(/data-depth="3"\]\s*\{\s*z-index:\s*calc/.test(css), '三级面板应再抬高层级')
    },
  },
  {
    name: 'menu: Body.js 用 getBoundingClientRect 算 fixed 坐标，且支持越界翻转',
    fn() {
      const src = read(join(SHELL, 'Body.js'))
      assert(src.includes('getBoundingClientRect'), 'Body.js 应用 getBoundingClientRect 量坐标')
      assert(/r\.left - w - gap >= gap \? r\.left - w - gap : r\.right \+ gap/.test(src),
        '子面板应默认向左开、左侧放不下时向右翻')
      assert(src.includes('menuBtnRef'), '顶层面板应贴按钮定位（menuBtnRef）')
      assert(src.includes('setMenuPos'), '顶层面板坐标应存在 state 里')
    },
  },
  {
    name: 'menu: Body.js 用 MenuTree 递归渲染，且层数由 openPath 驱动（无硬编码三级）',
    fn() {
      const src = read(join(SHELL, 'Body.js'))
      assert(src.includes('function MenuTree'), 'Body.js 缺 MenuTree 组件')
      assert(src.includes('data-depth={depth}'), '面板应带 data-depth 便于断言层级')
      assert(src.includes('depth + 1'), 'MenuTree 应递归渲染下一层')
      assert(src.includes('NEW_MENU'), 'Body.js 未引用 NEW_MENU')
      // 不应出现写死的第二/第三级 JSX（说明是递归而非复制粘贴）
      const menuItemCount = (src.match(/className="pp-menu-item"/g) || []).length
      assert(menuItemCount <= 3, 'pp-menu-item 渲染点应集中在 MenuTree 内，实际出现 ' + menuItemCount + ' 次')
    },
  },
]
