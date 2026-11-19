// FolderTree — 多级分组树（递归渲染 project.folders 的 parentId 层级）
// 观感对齐 Apifox 左侧目录树，供 doc / debug / schema 页共用。
// 纪律：类名只用 design-tokens.css 既有 .pp-tree / .pp-tree-row / .pp-tree-group / .pp-tree-row-count /
// .pp-method / .pp-ellipsis / .pp-faint / .pp-empty；颜色/字号/高度全部由 CSS 承载，
// 内联样式只放缩进（layout）。不引图标库：展开箭头用 ▸ / ▾ 文本。
// 数据契约（契约 §2）：folders[{ id, name, parentId, order }]，endpoints[{ id, name, method, folderId, order }]。
import { EmptyState } from './EmptyState.jsx'

/** 缩进基准/步长：0 层沿用 .pp-tree-row 自带 padding，深层用 calc 累加（纯 layout）。 */
const INDENT_BASE = 'var(--sp-2)'
const INDENT_STEP = 'var(--sp-3)'

function indentStyle(depth) {
  if (!depth) return undefined
  return { paddingLeft: 'calc(' + INDENT_BASE + ' + ' + INDENT_STEP + ' * ' + depth + ')' }
}

/** order 升序；缺省按 0（sort 稳定，同序保持入参顺序）。 */
function byOrder(a, b) {
  return (Number(a && a.order) || 0) - (Number(b && b.order) || 0)
}

export function FolderTree({ project, activeEndpointId, onPick, onToggle, collapsed, readOnly = false }) {
  const folders = (Array.isArray(project && project.folders) ? project.folders : []).filter(Boolean)
  const endpoints = (Array.isArray(project && project.endpoints) ? project.endpoints : []).filter(Boolean)
  const collapsedMap = collapsed && typeof collapsed === 'object' ? collapsed : {}
  // 悬挂 folderId（目录已删/导入残留）同样收进「未归类」，避免接口凭空消失。
  const folderIds = new Set(folders.map((f) => f.id))

  const pick = (endpointId) => {
    if (readOnly || typeof onPick !== 'function') return
    onPick(endpointId)
  }
  const toggle = (folderId) => {
    if (typeof onToggle !== 'function') return
    onToggle(folderId)
  }

  const renderEndpoint = (ep, depth) => (
    <div
      key={ep.id}
      className="pp-tree-row"
      data-active={Boolean(activeEndpointId) && ep.id === activeEndpointId}
      onClick={() => pick(ep.id)}
      style={indentStyle(depth)}
    >
      <span className="pp-method" data-method={ep.method}>{ep.method}</span>
      <span className="pp-ellipsis">{ep.name || '未命名接口'}</span>
    </div>
  )

  /**
   * 递归渲染一个目录：目录行 → （未折叠时）子目录 → 属于本目录的接口行。
   * 规模假设：单项目目录/接口数百级，直接 filter 比预建索引更短；上万级再改 Map。
   */
  const renderFolder = (folder, depth) => {
    const children = folders.filter((f) => f.parentId === folder.id).sort(byOrder)
    const own = endpoints.filter((e) => e.folderId === folder.id).sort(byOrder)
    const isCollapsed = Boolean(collapsedMap[folder.id])
    return (
      <div key={folder.id}>
        <div className="pp-tree-row" style={indentStyle(depth)} onClick={() => toggle(folder.id)}>
          <span className="pp-faint">{isCollapsed ? '▸' : '▾'}</span>
          <span className="pp-ellipsis">{folder.name || '未命名目录'}</span>
          <span className="pp-tree-row-count">{own.length}</span>
        </div>
        {isCollapsed ? null : (
          <>
            {children.map((child) => renderFolder(child, depth + 1))}
            {own.map((ep) => renderEndpoint(ep, depth + 1))}
          </>
        )}
      </div>
    )
  }

  const topFolders = folders.filter((f) => f.parentId == null || f.parentId === '').sort(byOrder)
  const loose = endpoints.filter((e) => e.folderId == null || e.folderId === '' || !folderIds.has(e.folderId)).sort(byOrder)
  const isEmpty = folders.length === 0 && endpoints.length === 0

  return (
    <div className="pp-tree">
      <div className="pp-tree-group">{(project && project.name) || '未命名项目'}</div>
      {topFolders.map((folder) => renderFolder(folder, 0))}
      {loose.length > 0 ? (
        <div>
          <div className="pp-tree-group">未归类</div>
          {loose.map((ep) => renderEndpoint(ep, 0))}
        </div>
      ) : null}
      {isEmpty ? <EmptyState text="暂无目录与接口" hint="先在总览页创建项目与接口" /> : null}
    </div>
  )
}
