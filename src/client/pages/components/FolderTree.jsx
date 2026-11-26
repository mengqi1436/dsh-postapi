// FolderTree — 多级分组树（递归渲染 project.folders 的 parentId 层级）
// 观感对齐 Apifox 左侧目录树（spec §12.3），供 doc / debug / schema 页共用。
// 纪律：类名只用 design-tokens.css 既有 .pp-tree / .pp-tree-row / .pp-tree-group / .pp-tree-row-count /
// .pp-tree-switcher / .pp-tree-icon / .pp-method / .pp-ellipsis / .pp-empty；
// 颜色/字号/高度全部由 CSS 承载，内联样式只放缩进（layout）。
// 不引图标库：展开箭头用 ▸ / ▾ 文本，目录图标用 ▦ 文本。
// 行内顺序（Apifox 实测，docs/apifox-visual-parity-spec.md §4 §12.3）：
//   目录行 switcher → icon → 名称 → 计数；接口行 方法徽标 → 名称（无 switcher / icon，靠 paddingLeft 负补偿对齐）。
// 数据契约（契约 §2）：folders[{ id, name, parentId, order }]，endpoints[{ id, name, method, folderId, order }]。
// v3 追加：HTML5 拖拽排序（computeTreeMove 纯函数）与右键菜单（onContextMenu），
//   落点提示只变文字色不变布局（data-drop="true"，样式见 design-tokens.css 尾部新增规则）。
import { useRef, useState } from 'react'
import { EmptyState } from './EmptyState.jsx'

/** 缩进步长：0 层沿用 .pp-tree-row 自带内边距，深层按 calc(var(--sp-1) * depth) 累加（纯 layout）。 */
const INDENT_STEP = 'var(--sp-1)'

/** 目录行缩进：depth 级目录各占一个步长。 */
function indentStyle(depth) {
  if (!depth) return undefined
  return { paddingLeft: 'calc(' + INDENT_STEP + ' * ' + depth + ')' }
}

/**
 * 接口行缩进：接口行没有 switcher + icon（那两格共 20px + 两个 4px gap = 28px 占位带），
 * 方法徽标 .pp-method 的 min-width 44px 恰好顶住这格占位带，所以接口行比同层目录行少一个步长，
 * 否则接口名会随层级累积右移、与目录名错位。depth 参数仍是「所在层级」（≥1），
 * 用 calc(... - var(--sp-1)) 表达负补偿，不额外引入 state。
 */
function endpointIndentStyle(depth) {
  if (!depth) return undefined
  return { paddingLeft: 'calc(' + INDENT_STEP + ' * ' + depth + ' - ' + INDENT_STEP + ')' }
}

/** order 升序；缺省按 0（sort 稳定，同序保持入参顺序）。 */
function byOrder(a, b) {
  return (Number(a && a.order) || 0) - (Number(b && b.order) || 0)
}

/** 行 order 取数：缺省 / 非数一律按 0（与 byOrder 同口径）。 */
function orderOf(item) {
  return Number(item && item.order) || 0
}

/** parentId / folderId 的「空」判定：null 与 '' 同层（根 / 未归类）。 */
function isBlankParent(v) {
  return v == null || v === ''
}

/** target 是否在 rootId 目录的子树内（rootId 自身不算子孙）。 */
function isDescendantFolder(targetId, rootId, folders) {
  let cur = folders.find((f) => f.id === targetId)
  const guard = new Set()
  while (cur) {
    if (guard.has(cur.id)) return false // 脏数据成环时终止
    guard.add(cur.id)
    if (cur.parentId === rootId) return true
    cur = cur.parentId == null ? null : folders.find((f) => f.id === cur.parentId)
  }
  return false
}

/** 某一层（父目录）里同 kind 的成员列表。根层的接口含「未归类」：folderId 为空或悬挂都算。 */
function layerSiblings(kind, parentId, folders, endpoints, folderIds) {
  if (kind === 'folder') {
    return folders.filter((f) => (parentId == null ? isBlankParent(f.parentId) : f.parentId === parentId))
  }
  return endpoints.filter((e) => {
    if (parentId == null) return isBlankParent(e.folderId) || !folderIds.has(e.folderId)
    return e.folderId === parentId
  })
}

/**
 * computeTreeMove — 拖拽排序纯函数（可脱离 React 测试）。
 * 入参 { kind:'folder'|'endpoint', id, targetKind:'root'|'folder'|'endpoint', targetId, position:'into'|'before' }
 * 语义：落在目录行（targetKind 'folder' + 'into'）= 移入该目录（末尾）；
 *       落在接口行（targetKind 'endpoint' + 'before'）= 同层重排到其前；
 *       targetKind 'root' = 根 / 未归类层（parentId: null），仅接受 'into'。
 * 返回 moveNode 操作数组 [{ kind, id, parentId, order }]：被移动节点 1 条 + 受影响同层兄弟的
 * order 重排（同层整体归一化 0..n）。不存在 / 非法移动（拖进自己或子孙目录、
 * 目录插到接口行前、接口行接受 into 等）一律返回 []。
 */
export function computeTreeMove(project, move) {
  const m = move && typeof move === 'object' ? move : {}
  const folders = (Array.isArray(project && project.folders) ? project.folders : []).filter(Boolean)
  const endpoints = (Array.isArray(project && project.endpoints) ? project.endpoints : []).filter(Boolean)
  const folderIds = new Set(folders.map((f) => f.id))
  const kind = m.kind === 'folder' || m.kind === 'endpoint' ? m.kind : ''
  const id = m.id == null ? '' : String(m.id)
  const position = m.position === 'before' ? 'before' : 'into'
  const targetId = m.targetId == null ? '' : String(m.targetId)
  if (!kind || id === '') return []
  const node = kind === 'folder' ? folders.find((f) => f.id === id) : endpoints.find((e) => e.id === id)
  if (!node) return []

  // —— 目标定位：算出落点父层 parentId 与该层同 kind 兄弟 ——
  let parentId = null
  let siblings = []
  if (m.targetKind === 'root') {
    if (position === 'before') return [] // 根 / 未归类层没有参照行，'before' 非法
    parentId = null
    siblings = layerSiblings(kind, null, folders, endpoints, folderIds)
  } else if (m.targetKind === 'folder') {
    const target = folders.find((f) => f.id === targetId)
    if (!target) return []
    if (kind === 'folder') {
      // 禁止拖进自己或自己的子孙目录（Apifox 同规则）
      if (target.id === node.id) return []
      if (isDescendantFolder(target.id, node.id, folders)) return []
      // 目录拖到目录行：into = 移入该目录（末尾）；before = 与目标同层重排到其前
      parentId = position === 'before'
        ? (isBlankParent(target.parentId) ? null : target.parentId)
        : target.id
    } else {
      // 接口拖到目录行：一律移入该目录
      parentId = target.id
    }
    siblings = layerSiblings(kind, parentId, folders, endpoints, folderIds)
  } else if (m.targetKind === 'endpoint') {
    const target = endpoints.find((e) => e.id === targetId)
    if (!target) return []
    if (position !== 'before') return [] // 接口不是容器，不接受 into
    if (kind !== 'endpoint') return [] // 目录没有「插到接口行前」的语义
    if (target.id === node.id) return []
    parentId = isBlankParent(target.folderId) || !folderIds.has(target.folderId) ? null : target.folderId
    siblings = layerSiblings('endpoint', parentId, folders, endpoints, folderIds)
  } else {
    return []
  }

  // —— 排布：目标层按 order 升序，摘出被移动节点后插入，再整体归一化 0..n ——
  const rest = siblings.slice().sort(byOrder).filter((x) => x.id !== node.id)
  let insertIndex = rest.length // into：末尾
  if (position === 'before') {
    const ti = rest.findIndex((x) => x.id === targetId)
    insertIndex = ti < 0 ? rest.length : ti
  }
  const arrangement = rest.slice()
  arrangement.splice(insertIndex, 0, node)

  // 被移动节点的旧父层：跨层移动时源层剩余兄弟同样要归一化（少一个成员，后续 order 前移）
  const oldParentId = kind === 'folder'
    ? (isBlankParent(node.parentId) ? null : node.parentId)
    : (isBlankParent(node.folderId) || !folderIds.has(node.folderId) ? null : node.folderId)
  const sameLayer = oldParentId === parentId

  /** 生成一条 op：被移节点落新父层；兄弟保持自己的父层，仅在 order 变化时产出。 */
  const opOf = (item, index, moved) => {
    const itemParentId = kind === 'folder'
      ? (isBlankParent(item.parentId) ? null : item.parentId)
      : (isBlankParent(item.folderId) || !folderIds.has(item.folderId) ? null : item.folderId)
    return {
      kind,
      id: item.id,
      parentId: moved ? parentId : itemParentId,
      order: index,
    }
  }

  const ops = []
  arrangement.forEach((item, index) => {
    const moved = item.id === node.id
    if (moved || orderOf(item) !== index) ops.push(opOf(item, index, moved))
  })
  if (!sameLayer) {
    // 源层剩余兄弟归一化 0..n（只产出 order 变化的条目）
    const sourceRest = layerSiblings(kind, oldParentId, folders, endpoints, folderIds)
      .slice().sort(byOrder).filter((x) => x.id !== node.id)
    sourceRest.forEach((item, index) => {
      if (orderOf(item) !== index) ops.push(opOf(item, index, false))
    })
  }
  return ops
}

export function FolderTree({ project, activeEndpointId, onPick, onToggle, collapsed, readOnly = false, onMove, onContextMenu }) {
  const folders = (Array.isArray(project && project.folders) ? project.folders : []).filter(Boolean)
  const endpoints = (Array.isArray(project && project.endpoints) ? project.endpoints : []).filter(Boolean)
  const collapsedMap = collapsed && typeof collapsed === 'object' ? collapsed : {}
  // 悬挂 folderId（目录已删/导入残留）同样收进「未归类」，避免接口凭空消失。
  const folderIds = new Set(folders.map((f) => f.id))

  // —— 拖拽态：dragRef 记 {kind,id}（dataTransfer 仅作兜底），dropHint 驱动落点高亮 ——
  const dragRef = useRef(null)
  const [dropHint, setDropHint] = useState(null)

  const pick = (endpointId) => {
    if (readOnly || typeof onPick !== 'function') return
    onPick(endpointId)
  }
  const toggle = (folderId) => {
    if (typeof onToggle !== 'function') return
    onToggle(folderId)
  }
  const contextMenuAt = (kind, id) => (e) => {
    if (typeof onContextMenu !== 'function' || !e) return
    e.preventDefault()
    // 行菜单必须阻断冒泡：.pp-tree / .pp-tree-group 上的 root 兜底菜单会在
    // 同一次右键里覆盖行菜单（React 合成事件按冒泡序执行，最后 setState 者胜）。
    if (typeof e.stopPropagation === 'function') e.stopPropagation()
    onContextMenu(kind, id, e.clientX, e.clientY)
  }

  /** dragstart：本地 ref 记来源（dataTransfer 同步写，env 不支持时静默跳过）。 */
  const dragStart = (kind, id) => (e) => {
    dragRef.current = { kind, id }
    const dt = e && e.dataTransfer
    if (dt && typeof dt.setData === 'function') {
      try { dt.setData('application/x-postapi-node', JSON.stringify({ kind, id })) } catch { /* 旧浏览器忽略 */ }
      if (typeof dt.setDragImage !== 'function') { /* 无需处理 */ }
    }
  }
  const dragEnd = () => {
    dragRef.current = null
    setDropHint(null)
  }
  /** dragover：仅标记当前悬停行（换行才 setState，避免高频重渲染）。 */
  const dragOver = (kind, id) => (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const dt = e && e.dataTransfer
    if (dt) dt.dropEffect = 'move'
    setDropHint((prev) => (prev && prev.kind === kind && prev.id === id ? prev : { kind, id }))
  }
  const dragLeave = (kind, id) => () => {
    setDropHint((prev) => (prev && prev.kind === kind && prev.id === id ? null : prev))
  }

  /** drop：算 ops 并逐条回调 onMove（每 op 一次调用，doc 页负责落库）。 */
  const drop = (targetKind, targetId) => (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const from = dragRef.current || parseDragPayload(e)
    dragRef.current = null
    setDropHint(null)
    if (!from) return
    const position = targetKind === 'endpoint' ? 'before' : 'into'
    let mv = { kind: from.kind, id: from.id, targetKind, targetId, position }
    if (from.kind === 'folder' && targetKind === 'endpoint') {
      // 目录没有「插到接口行前」的语义：就近映射为移入该接口所在目录（根 / 未归类 → root）
      const ep = endpoints.find((x) => x.id === targetId)
      if (!ep) return
      mv = isBlankParent(ep.folderId) || !folderIds.has(ep.folderId)
        ? { kind: from.kind, id: from.id, targetKind: 'root', position: 'into' }
        : { kind: from.kind, id: from.id, targetKind: 'folder', targetId: ep.folderId, position: 'into' }
    }
    const ops = computeTreeMove(project, mv)
    if (typeof onMove !== 'function') return
    for (const op of ops) onMove(op)
  }

  /** dataTransfer 兜底读取：本地 ref 丢失（如拖拽跨组件树）时还原来源。 */
  const parseDragPayload = (e) => {
    const dt = e && e.dataTransfer
    if (!dt || typeof dt.getData !== 'function') return null
    try {
      const raw = dt.getData('application/x-postapi-node')
      const parsed = raw ? JSON.parse(raw) : null
      return parsed && parsed.id ? parsed : null
    } catch {
      return null
    }
  }

  const rowDropProps = (kind, id) => (readOnly ? {} : {
    draggable: true,
    onDragStart: dragStart(kind, id),
    onDragEnd: dragEnd,
    onDragOver: dragOver(kind, id),
    onDragLeave: dragLeave(kind, id),
    onDrop: drop(kind, id),
    'data-drop': dropHint && dropHint.kind === kind && dropHint.id === id ? 'true' : undefined,
  })

  const renderEndpoint = (ep, depth) => (
    <div
      key={ep.id}
      className="pp-tree-row"
      data-active={Boolean(activeEndpointId) && ep.id === activeEndpointId}
      onClick={() => pick(ep.id)}
      onContextMenu={contextMenuAt('endpoint', ep.id)}
      style={endpointIndentStyle(depth)}
      {...rowDropProps('endpoint', ep.id)}
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
        <div
          className="pp-tree-row"
          style={indentStyle(depth)}
          onClick={() => toggle(folder.id)}
          onContextMenu={contextMenuAt('folder', folder.id)}
          {...rowDropProps('folder', folder.id)}
        >
          <span className="pp-tree-switcher">{isCollapsed ? '▸' : '▾'}</span>
          <span className="pp-tree-icon">▦</span>
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
    <div className="pp-tree" onContextMenu={contextMenuAt('root', '')}>
      <div className="pp-tree-group" onContextMenu={contextMenuAt('root', '')}>
        {(project && project.name) || '未命名项目'}
      </div>
      {topFolders.map((folder) => renderFolder(folder, 0))}
      {loose.length > 0 ? (
        <div>
          <div className="pp-tree-group">未归类</div>
          {loose.map((ep) => renderEndpoint(ep, 0))}
        </div>
      ) : null}
      {isEmpty ? <EmptyState icon={null} text="暂无目录与接口" /> : null}
    </div>
  )
}
