/**
 * 集成接线（T4 lead）：聚合页面模块，触发各页顶层 register。
 * esbuild bundle 为 cjs 时按源码语句序执行：先初始化注册表（ensureGlobals，
 * 含队列 drain），页面模块顶层 window.__postapiPages.register 即可命中。
 * 本文件是唯一静态引用 pages 的位置；shell 与页面保持注册表解耦（契约偏离已标注）。
 */
import { ensureGlobals } from './shell/registry.js'
ensureGlobals()
import './pages/overview.jsx'
import './pages/doc.jsx'
import './pages/debug.jsx'
import './pages/mock.jsx'
import './pages/schema.jsx'
import './pages/env.jsx'
import './pages/history.jsx'
import './pages/test.jsx'
import './pages/import.jsx'
import './pages/flow.jsx'
import './pages/search.jsx'
import './pages/settings.jsx'
