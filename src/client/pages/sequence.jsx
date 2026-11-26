// sequence.jsx — React+SVG 时序图公共组件
// 移植自 diagram-design skill（type-sequence.md）：生命线 / 激活条 / 消息箭头 / 自消息 / alt-opt 片段最小集
// 哲学：密度 4/10；几何走 4px 网格；颜色全部引用 design-tokens.css，导出 SVG 时解析为实际值
import { useRef } from 'react'

// —— 几何常量（4px 网格）——
// 画布宽度按参与方数量自适应：固定 960 在 545px 的右栏里被缩到 0.57 倍，
// 8px 的图注变成 4.5px 完全读不出。间距 150 是 actor 框 132 + 呼吸 18 的下限。
const ACTOR_GAP = 150
const MIN_W = 480
const MAX_W = 960
const MARGIN_X = 64
const ACTOR_W = 132
const ACTOR_H = 36
const TOP_Y = 40
const LIFELINE_TOP = TOP_Y + ACTOR_H // 76
const MSG_START = 108
const MSG_GAP = 32                  // 相邻消息 y 间距 ≥24（skill 规则）
const NOTE_GAP = 24
const ACT_W = 8                     // 激活条宽（skill：w=8）
const FRAME_PAD_X = 40              // fragment 左右外扩（≥12 生效）
const FRAME_PAD_TOP = 22
const FRAME_PAD_BOTTOM = 24
const BOTTOM_PAD = 28
const LEGEND_H = 44

// —— 颜色角色：全部引用 Apifox token（见 docs/apifox-design-spec.md §1）——
const INK = 'var(--fg)'
const MUTED = 'var(--fg-secondary)'
const ACCENT = 'var(--accent)'
const PAPER = 'var(--bg-app)'
const FONT_SANS = 'var(--font-sans)'
const FONT_MONO = 'var(--font-mono)'

function collectActors(steps) {
  const actors = []
  for (const s of steps) {
    for (const name of [s.actor, s.target]) {
      if (name && !actors.includes(name)) actors.push(name)
    }
  }
  return actors
}

/** 画布宽度：随参与方数量增长，夹在 [MIN_W, MAX_W] 之间。 */
export function sequenceWidth(n) {
  if (n <= 1) return MIN_W
  return Math.max(MIN_W, Math.min(MAX_W, MARGIN_X * 2 + (n - 1) * ACTOR_GAP))
}

function centerX(i, n, width) {
  if (n <= 1) return width / 2
  return MARGIN_X + (i * (width - 2 * MARGIN_X)) / (n - 1)
}

// —— 布局计算：rows / frames / activations ——
export function layoutSequence(steps) {
  const actors = collectActors(steps)
  const width = sequenceWidth(actors.length)
  const centers = actors.map((_, i) => centerX(i, actors.length, width))
  const idxOf = (name) => actors.indexOf(name)

  const rows = []
  let y = MSG_START
  for (const step of steps) {
    rows.push({ step, y })
    y += step.action === 'note' ? NOTE_GAP : MSG_GAP
    if (step.guard) y += 16
    if (step.divider) y += 16
  }
  const contentBottom = rows.length ? rows[rows.length - 1].y + 20 : MSG_START

  // fragment（alt/opt）：op 开启 frame，直到下一个 op 或末尾；guard/divider 随行
  const frames = []
  let open = null
  rows.forEach((row, i) => {
    const s = row.step
    if (s.op === 'alt' || s.op === 'opt') {
      if (open) frames.push(closeFrame(open, i - 1))
      open = { op: s.op, startIdx: i, guards: [], dividers: [] }
    }
    if (open) {
      if (s.guard) open.guards.push({ text: s.guard, y: row.y - (s.divider ? 32 : 16) })
      if (s.divider) open.dividers.push(row.y - 8)
    }
  })
  if (open) frames.push(closeFrame(open, rows.length - 1))

  function closeFrame(frame, endIdx) {
    const from = rows[frame.startIdx].y
    const to = rows[endIdx].y
    const participants = new Set()
    for (let i = frame.startIdx; i <= endIdx; i++) {
      const s = rows[i].step
      if (s.actor) participants.add(s.actor)
      if (s.target) participants.add(s.target)
    }
    const idxs = [...participants].map(idxOf).filter((i) => i >= 0)
    const left = Math.min(...idxs)
    const right = Math.max(...idxs)
    const x = centers[left] - FRAME_PAD_X
    const w = centers[right] - centers[left] + FRAME_PAD_X * 2
    return {
      op: frame.op,
      guards: frame.guards,
      dividers: frame.dividers,
      x,
      y: from - FRAME_PAD_TOP,
      w,
      h: to - from + FRAME_PAD_TOP + FRAME_PAD_BOTTOM,
    }
  }

  // 激活条：target 收到 call 即激活，到其发出的下一条 return（或末尾）
  const activations = []
  rows.forEach((row, i) => {
    const s = row.step
    if (s.action !== 'call' || !s.target) return
    let endY = rows[rows.length - 1].y
    for (let j = i + 1; j < rows.length; j++) {
      const r = rows[j].step
      if (r.action === 'return' && r.actor === s.target) { endY = rows[j].y; break }
    }
    activations.push({ cx: centers[idxOf(s.target)], fromY: row.y, toY: endY })
  })

  const height = contentBottom + BOTTOM_PAD + LEGEND_H
  return { actors, centers, idxOf, rows, frames, activations, width, height, lifelineBottom: contentBottom + 8 }
}

// —— SVG 导出：clone 后把 var(--x) 解析为计算值，Blob 下载 ——
export function exportSequenceSvg(svgEl, filename = 'flow-sequence.svg') {
  if (!svgEl) return
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const cs = typeof getComputedStyle === 'function' ? getComputedStyle(svgEl) : null
  const raw = new XMLSerializer().serializeToString(clone)
  const resolved = cs
    ? raw.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || 'currentColor')
    : raw
  const blob = new Blob([resolved], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function msgLabel(row) {
  const s = row.step
  if (s.action === 'note') return s.message || ''
  return (s.message || '').toUpperCase()
}

function maskWidth(text) {
  // --fs-chart(10px) mono ≈ 6.2px/char，加两侧 padding（原按 8px 字宽估 5px/char，
  // 遮罩恒窄于文字，消息标签两端压到生命线上）
  return Math.max(24, Math.round(text.length * 6 + 12))
}

export function SequenceDiagram({ steps, idPrefix = 'flow-seq', title = '时序图', desc = '接口调用时序', svgRef: externalSvgRef, activeIndex = -1, onSelectRow }) {
  const innerRef = useRef(null)
  const svgRef = externalSvgRef || innerRef
  if (!steps || steps.length === 0) return null
  const L = layoutSequence(steps)
  const { actors, centers, idxOf, rows, frames, activations, width, height, lifelineBottom } = L
  const aId = idPrefix + '-title'
  const dId = idPrefix + '-desc'

  const markers = (
    <defs>
      <marker id={idPrefix + '-arrow'} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={MUTED} />
      </marker>
      <marker id={idPrefix + '-arrow-accent'} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={ACCENT} />
      </marker>
    </defs>
  )

  // 生命线（先画，压在箭头之下）
  const lifelines = actors.map((name, i) => (
    <line key={'ll-' + name} x1={centers[i]} y1={LIFELINE_TOP} x2={centers[i]} y2={lifelineBottom}
      stroke={INK} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3,3" />
  ))

  // 激活条（skill：w=8，ink@0.06 填充，muted 0.8 描边）
  const acts = activations.map((a, i) => (
    <rect key={'act-' + i} x={a.cx - ACT_W / 2} y={a.fromY} width={ACT_W} height={Math.max(a.toY - a.fromY, 16)}
      fill={INK} fillOpacity="0.06" stroke={MUTED} strokeWidth="0.8" />
  ))

  // 选中行：主色半透明底条 + 左侧序号徽标，让「左列表选中 ↔ 图元」一一对上。
  // 之前画布只画整图、不标选中项，切哪一步看起来都一样。
  const highlightBands = rows.map((row, i) => {
    if (i !== activeIndex) return null
    return (
      <g key={'hl-' + i} pointerEvents="none">
        <rect x={8} y={row.y - 14} width={width - 16} height={28} rx="4"
          fill={ACCENT} fillOpacity="0.08" />
        <circle cx={MARGIN_X - 32} cy={row.y} r="8" fill={ACCENT} />
        <text x={MARGIN_X - 32} y={row.y + 3} fill="var(--fg-on-accent)" fontSize="var(--fs-chart)"
          fontFamily={FONT_MONO} textAnchor="middle">{i + 1}</text>
      </g>
    )
  })

  // 消息箭头 / 自消息 / note
  const messages = rows.map((row, i) => {
    const s = row.step
    const y = row.y
    const isActive = i === activeIndex
    if (s.action === 'note') {
      const cx = centers[idxOf(s.actor)] ?? width / 2
      // note 框宽度随文案：固定 120px 会让长备注溢出边框压到邻近图元
      const nw = Math.max(120, maskWidth((s.message || '').toUpperCase()) + 16)
      return (
        <g key={'m-' + i}>
          <rect x={cx - nw / 2} y={y - 12} width={nw} height={20} rx="4" fill={PAPER}
            stroke={INK} strokeOpacity="0.22" strokeWidth="1" />
          <text x={cx} y={y + 2} fill={MUTED} fontSize="var(--fs-chart)" fontFamily={FONT_MONO}
            textAnchor="middle" letterSpacing="0.04em">{(s.message || '').toUpperCase()}</text>
        </g>
      )
    }
    if (s.action === 'self') {
      const cx = centers[idxOf(s.actor)] ?? width / 2
      const label = msgLabel(row)
      return (
        <g key={'m-' + i}>
          <path d={`M ${cx} ${y} h 28 v 20 h -28`} fill="none" stroke={MUTED} strokeWidth="1"
            markerEnd={`url(#${idPrefix}-arrow)`} />
          <rect x={cx + 36} y={y - 6} width={maskWidth(label)} height={12} rx="2" fill={PAPER} />
          <text x={cx + 36 + maskWidth(label) / 2} y={y + 3} fill={MUTED} fontSize="var(--fs-chart)"
            fontFamily={FONT_MONO} textAnchor="middle" letterSpacing="0.06em">{label}</text>
        </g>
      )
    }
    const from = centers[idxOf(s.actor)]
    const to = centers[idxOf(s.target)]
    if (from == null || to == null || from === to) return null
    const left = Math.min(from, to)
    const right = Math.max(from, to)
    const x1 = from < to ? from + ACT_W / 2 : from - ACT_W / 2
    const x2 = from < to ? to - ACT_W / 2 : to + ACT_W / 2
    const isReturn = s.action === 'return'
    // 选中行按 headline 处理：主色实线箭头，一眼看出改的是哪一步
    const headline = s.headline === true || isActive
    const stroke = headline ? ACCENT : MUTED
    const marker = headline ? idPrefix + '-arrow-accent' : idPrefix + '-arrow'
    const label = msgLabel(row)
    const mw = maskWidth(label)
    return (
      <g key={'m-' + i}>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={isActive ? 2 : 1}
          strokeDasharray={isReturn && !headline ? '5,4' : undefined}
          markerEnd={`url(#${marker})`} />
        {/* 标签 mask：底边距箭头 8px（skill 规则 6-10px） */}
        <rect x={(left + right) / 2 - mw / 2} y={y - 20} width={mw} height={12} rx="2" fill={PAPER} />
        <text x={(left + right) / 2} y={y - 11} fill={isActive ? ACCENT : MUTED}
          fontWeight={isActive ? 600 : undefined}
          fontSize="var(--fs-chart)" fontFamily={FONT_MONO}
          textAnchor="middle" letterSpacing="0.06em">{label}</text>
      </g>
    )
  })

  // 行命中区：点画布上的任意一行，左侧步骤列表同步选中（双向联动）。
  // 只在传入 onSelectRow 时渲染，导出 SVG 不含这些热区。
  const hitAreas = onSelectRow
    ? rows.map((row, i) => (
      <rect key={'hit-' + i} x={MARGIN_X - 48} y={row.y - 14}
        width={width - MARGIN_X * 2 + 96} height={28} fill="transparent"
        style={{ cursor: 'pointer' }} onClick={() => onSelectRow(i)} />
    ))
    : null

  // fragment 框（alt/opt 最小集：单层、tab 左上、guard mono、divider 虚线）
  const frameEls = frames.map((f, i) => (
    <g key={'f-' + i}>
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="4"
        fill={INK} fillOpacity="0.02" stroke={INK} strokeOpacity="0.22" strokeWidth="1" />
      <rect x={f.x} y={f.y} width="40" height="16" rx="2" fill={PAPER}
        stroke={INK} strokeOpacity="0.22" strokeWidth="1" />
      <text x={f.x + 20} y={f.y + 12} fill={MUTED} fontSize="var(--fs-chart)" fontFamily={FONT_MONO}
        textAnchor="middle" letterSpacing="0.12em">{f.op.toUpperCase()}</text>
      {f.guards.map((g, gi) => (
        <g key={'g-' + gi}>
          {/* 条件文字加底色遮罩：直接压线会与生命线/箭头糊在一起 */}
          <rect x={f.x + 8} y={g.y - 11} width={Math.max(40, g.text.length * 6 + 12)} height={14} rx="2"
            fill={PAPER} fillOpacity="0.92" />
          <text x={f.x + 12} y={g.y} fill={MUTED} fontSize="var(--fs-chart)"
            fontFamily={FONT_MONO} letterSpacing="0.04em">{g.text}</text>
        </g>
      ))}
      {f.dividers.map((dy, di) => (
        <line key={'d-' + di} x1={f.x + 8} y1={dy} x2={f.x + f.w - 8} y2={dy}
          stroke={INK} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4,3" />
      ))}
    </g>
  ))

  // actor 框（最后画，遮住生命线顶端）
  const actorBoxes = actors.map((name, i) => (
    <g key={'a-' + name}>
      <rect x={centers[i] - ACTOR_W / 2} y={TOP_Y} width={ACTOR_W} height={ACTOR_H} rx="6"
        fill={PAPER} stroke={INK} strokeWidth="1" />
      <text x={centers[i]} y={TOP_Y + 23} fill={INK} fontSize="var(--fs-12)" fontWeight="600"
        fontFamily={FONT_SANS} textAnchor="middle">{name}</text>
    </g>
  ))

  // 图例：水平底条（skill：legend 不许浮在图内）
  const legendY = height - LEGEND_H + 8
  // 图例分段随画布宽度自适应：窄画布（1 个参与方，MIN_W=480）只放 3 段，
  // ≥640px 再补第 4 段；固定 x 偏移在窄画布上会把「FRAME = BRANCH」顶出 viewBox
  const legendItems = [
    { text: 'SOLID = CALL', fill: MUTED },
    { text: 'DASHED = RETURN', fill: MUTED },
    { text: 'ACCENT = HEADLINE', fill: ACCENT },
    { text: 'FRAME = BRANCH', fill: MUTED },
  ]
  const legendCols = width >= 640 ? 4 : 3
  const legendStep = Math.round((width - MARGIN_X * 2 - 80) / legendCols)
  const legend = (
    <g>
      <line x1={MARGIN_X} y1={legendY - 8} x2={width - MARGIN_X} y2={legendY - 8}
        stroke={INK} strokeOpacity="0.1" strokeWidth="0.8" />
      <text x={MARGIN_X} y={legendY + 8} fill={MUTED} fontSize="var(--fs-chart)" fontFamily={FONT_MONO}
        letterSpacing="0.14em">LEGEND</text>
      {legendItems.slice(0, legendCols).map((item, i) => (
        <text key={item.text} x={MARGIN_X + 80 + i * legendStep} y={legendY + 8}
          fill={item.fill} fontSize="var(--fs-chart)" fontFamily={FONT_MONO}>{item.text}</text>
      ))}
    </g>
  )

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${aId} ${dId}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}>
      <title id={aId}>{title}</title>
      <desc id={dId}>{desc}</desc>
      {markers}
      {highlightBands}
      {frameEls}
      {lifelines}
      {acts}
      {messages}
      {actorBoxes}
      {hitAreas}
      {legend}
    </svg>
  )
}
