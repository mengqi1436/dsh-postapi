import { jsx, jsxs } from "react/jsx-runtime";
import { useRef } from "react";
const W = 960;
const MARGIN_X = 64;
const ACTOR_W = 132;
const ACTOR_H = 36;
const TOP_Y = 40;
const LIFELINE_TOP = TOP_Y + ACTOR_H;
const MSG_START = 108;
const MSG_GAP = 32;
const NOTE_GAP = 24;
const ACT_W = 8;
const FRAME_PAD_X = 40;
const FRAME_PAD_TOP = 22;
const FRAME_PAD_BOTTOM = 24;
const BOTTOM_PAD = 28;
const LEGEND_H = 44;
const INK = "var(--fg)";
const MUTED = "var(--fg-secondary)";
const ACCENT = "var(--accent)";
const PAPER = "var(--paper)";
const FONT_SANS = "var(--font-sans)";
const FONT_MONO = "var(--font-mono)";
function collectActors(steps) {
  const actors = [];
  for (const s of steps) {
    for (const name of [s.actor, s.target]) {
      if (name && !actors.includes(name)) actors.push(name);
    }
  }
  return actors;
}
function centerX(i, n) {
  if (n <= 1) return W / 2;
  return MARGIN_X + i * (W - 2 * MARGIN_X) / (n - 1);
}
function layoutSequence(steps) {
  const actors = collectActors(steps);
  const centers = actors.map((_, i) => centerX(i, actors.length));
  const idxOf = (name) => actors.indexOf(name);
  const rows = [];
  let y = MSG_START;
  for (const step of steps) {
    rows.push({ step, y });
    y += step.action === "note" ? NOTE_GAP : MSG_GAP;
    if (step.guard) y += 16;
    if (step.divider) y += 16;
  }
  const contentBottom = rows.length ? rows[rows.length - 1].y + 20 : MSG_START;
  const frames = [];
  let open = null;
  rows.forEach((row, i) => {
    const s = row.step;
    if (s.op === "alt" || s.op === "opt") {
      if (open) frames.push(closeFrame(open, i - 1));
      open = { op: s.op, startIdx: i, guards: [], dividers: [] };
    }
    if (open) {
      if (s.guard) open.guards.push({ text: s.guard, y: row.y - (s.divider ? 32 : 16) });
      if (s.divider) open.dividers.push(row.y - 8);
    }
  });
  if (open) frames.push(closeFrame(open, rows.length - 1));
  function closeFrame(frame, endIdx) {
    const from = rows[frame.startIdx].y;
    const to = rows[endIdx].y;
    const participants = /* @__PURE__ */ new Set();
    for (let i = frame.startIdx; i <= endIdx; i++) {
      const s = rows[i].step;
      if (s.actor) participants.add(s.actor);
      if (s.target) participants.add(s.target);
    }
    const idxs = [...participants].map(idxOf).filter((i) => i >= 0);
    const left = Math.min(...idxs);
    const right = Math.max(...idxs);
    const x = centers[left] - FRAME_PAD_X;
    const w = centers[right] - centers[left] + FRAME_PAD_X * 2;
    return {
      op: frame.op,
      guards: frame.guards,
      dividers: frame.dividers,
      x,
      y: from - FRAME_PAD_TOP,
      w,
      h: to - from + FRAME_PAD_TOP + FRAME_PAD_BOTTOM
    };
  }
  const activations = [];
  rows.forEach((row, i) => {
    const s = row.step;
    if (s.action !== "call" || !s.target) return;
    let endY = rows[rows.length - 1].y;
    for (let j = i + 1; j < rows.length; j++) {
      const r = rows[j].step;
      if (r.action === "return" && r.actor === s.target) {
        endY = rows[j].y;
        break;
      }
    }
    activations.push({ cx: centers[idxOf(s.target)], fromY: row.y, toY: endY });
  });
  const height = contentBottom + BOTTOM_PAD + LEGEND_H;
  return { actors, centers, idxOf, rows, frames, activations, width: W, height, lifelineBottom: contentBottom + 8 };
}
function exportSequenceSvg(svgEl, filename = "flow-sequence.svg") {
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(svgEl) : null;
  const raw = new XMLSerializer().serializeToString(clone);
  const resolved = cs ? raw.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || "#000000") : raw;
  const blob = new Blob([resolved], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function msgLabel(row) {
  const s = row.step;
  if (s.action === "note") return s.message || "";
  return (s.message || "").toUpperCase();
}
function maskWidth(text) {
  return Math.max(24, Math.round(text.length * 5 + 10));
}
function SequenceDiagram({ steps, idPrefix = "flow-seq", title = "\u65F6\u5E8F\u56FE", desc = "\u63A5\u53E3\u8C03\u7528\u65F6\u5E8F", svgRef: externalSvgRef }) {
  const innerRef = useRef(null);
  const svgRef = externalSvgRef || innerRef;
  if (!steps || steps.length === 0) return null;
  const L = layoutSequence(steps);
  const { actors, centers, idxOf, rows, frames, activations, width, height, lifelineBottom } = L;
  const aId = idPrefix + "-title";
  const dId = idPrefix + "-desc";
  const markers = /* @__PURE__ */ jsxs("defs", { children: [
    /* @__PURE__ */ jsx("marker", { id: idPrefix + "-arrow", markerWidth: "8", markerHeight: "6", refX: "7", refY: "3", orient: "auto", children: /* @__PURE__ */ jsx("polygon", { points: "0 0, 8 3, 0 6", fill: MUTED }) }),
    /* @__PURE__ */ jsx("marker", { id: idPrefix + "-arrow-accent", markerWidth: "8", markerHeight: "6", refX: "7", refY: "3", orient: "auto", children: /* @__PURE__ */ jsx("polygon", { points: "0 0, 8 3, 0 6", fill: ACCENT }) })
  ] });
  const lifelines = actors.map((name, i) => /* @__PURE__ */ jsx(
    "line",
    {
      x1: centers[i],
      y1: LIFELINE_TOP,
      x2: centers[i],
      y2: lifelineBottom,
      stroke: INK,
      strokeOpacity: "0.2",
      strokeWidth: "1",
      strokeDasharray: "3,3"
    },
    "ll-" + name
  ));
  const acts = activations.map((a, i) => /* @__PURE__ */ jsx(
    "rect",
    {
      x: a.cx - ACT_W / 2,
      y: a.fromY,
      width: ACT_W,
      height: Math.max(a.toY - a.fromY, 16),
      fill: INK,
      fillOpacity: "0.06",
      stroke: MUTED,
      strokeWidth: "0.8"
    },
    "act-" + i
  ));
  const messages = rows.map((row, i) => {
    const s = row.step;
    const y = row.y;
    if (s.action === "note") {
      const cx = centers[idxOf(s.actor)] ?? W / 2;
      return /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx(
          "rect",
          {
            x: cx - 60,
            y: y - 12,
            width: 120,
            height: 20,
            rx: "4",
            fill: PAPER,
            stroke: INK,
            strokeOpacity: "0.22",
            strokeWidth: "1"
          }
        ),
        /* @__PURE__ */ jsx(
          "text",
          {
            x: cx,
            y: y + 2,
            fill: MUTED,
            fontSize: "8",
            fontFamily: FONT_MONO,
            textAnchor: "middle",
            letterSpacing: "0.04em",
            children: (s.message || "").toUpperCase()
          }
        )
      ] }, "m-" + i);
    }
    if (s.action === "self") {
      const cx = centers[idxOf(s.actor)] ?? W / 2;
      const label2 = msgLabel(row);
      return /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: `M ${cx} ${y} h 28 v 20 h -28`,
            fill: "none",
            stroke: MUTED,
            strokeWidth: "1",
            markerEnd: `url(#${idPrefix}-arrow)`
          }
        ),
        /* @__PURE__ */ jsx("rect", { x: cx + 36, y: y - 6, width: maskWidth(label2), height: 12, rx: "2", fill: PAPER }),
        /* @__PURE__ */ jsx(
          "text",
          {
            x: cx + 36 + maskWidth(label2) / 2,
            y: y + 3,
            fill: MUTED,
            fontSize: "8",
            fontFamily: FONT_MONO,
            textAnchor: "middle",
            letterSpacing: "0.06em",
            children: label2
          }
        )
      ] }, "m-" + i);
    }
    const from = centers[idxOf(s.actor)];
    const to = centers[idxOf(s.target)];
    if (from == null || to == null || from === to) return null;
    const left = Math.min(from, to);
    const right = Math.max(from, to);
    const x1 = from < to ? from + ACT_W / 2 : from - ACT_W / 2;
    const x2 = from < to ? to - ACT_W / 2 : to + ACT_W / 2;
    const isReturn = s.action === "return";
    const headline = s.headline === true;
    const stroke = headline ? ACCENT : MUTED;
    const marker = headline ? idPrefix + "-arrow-accent" : idPrefix + "-arrow";
    const label = msgLabel(row);
    const mw = maskWidth(label);
    return /* @__PURE__ */ jsxs("g", { children: [
      /* @__PURE__ */ jsx(
        "line",
        {
          x1,
          y1: y,
          x2,
          y2: y,
          stroke,
          strokeWidth: "1",
          strokeDasharray: isReturn && !headline ? "5,4" : void 0,
          markerEnd: `url(#${marker})`
        }
      ),
      /* @__PURE__ */ jsx("rect", { x: (left + right) / 2 - mw / 2, y: y - 20, width: mw, height: 12, rx: "2", fill: PAPER }),
      /* @__PURE__ */ jsx(
        "text",
        {
          x: (left + right) / 2,
          y: y - 11,
          fill: MUTED,
          fontSize: "8",
          fontFamily: FONT_MONO,
          textAnchor: "middle",
          letterSpacing: "0.06em",
          children: label
        }
      )
    ] }, "m-" + i);
  });
  const frameEls = frames.map((f, i) => /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx(
      "rect",
      {
        x: f.x,
        y: f.y,
        width: f.w,
        height: f.h,
        rx: "4",
        fill: INK,
        fillOpacity: "0.02",
        stroke: INK,
        strokeOpacity: "0.22",
        strokeWidth: "1"
      }
    ),
    /* @__PURE__ */ jsx(
      "rect",
      {
        x: f.x,
        y: f.y,
        width: "40",
        height: "16",
        rx: "2",
        fill: PAPER,
        stroke: INK,
        strokeOpacity: "0.22",
        strokeWidth: "1"
      }
    ),
    /* @__PURE__ */ jsx(
      "text",
      {
        x: f.x + 20,
        y: f.y + 12,
        fill: MUTED,
        fontSize: "8",
        fontFamily: FONT_MONO,
        textAnchor: "middle",
        letterSpacing: "0.12em",
        children: f.op.toUpperCase()
      }
    ),
    f.guards.map((g, gi) => /* @__PURE__ */ jsx(
      "text",
      {
        x: f.x + 12,
        y: g.y,
        fill: MUTED,
        fontSize: "8",
        fontFamily: FONT_MONO,
        letterSpacing: "0.04em",
        children: g.text
      },
      "g-" + gi
    )),
    f.dividers.map((dy, di) => /* @__PURE__ */ jsx(
      "line",
      {
        x1: f.x + 8,
        y1: dy,
        x2: f.x + f.w - 8,
        y2: dy,
        stroke: INK,
        strokeOpacity: "0.2",
        strokeWidth: "1",
        strokeDasharray: "4,3"
      },
      "d-" + di
    ))
  ] }, "f-" + i));
  const actorBoxes = actors.map((name, i) => /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx(
      "rect",
      {
        x: centers[i] - ACTOR_W / 2,
        y: TOP_Y,
        width: ACTOR_W,
        height: ACTOR_H,
        rx: "6",
        fill: PAPER,
        stroke: INK,
        strokeWidth: "1"
      }
    ),
    /* @__PURE__ */ jsx(
      "text",
      {
        x: centers[i],
        y: TOP_Y + 23,
        fill: INK,
        fontSize: "12",
        fontWeight: "600",
        fontFamily: FONT_SANS,
        textAnchor: "middle",
        children: name
      }
    )
  ] }, "a-" + name));
  const legendY = height - LEGEND_H + 8;
  const legend = /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx(
      "line",
      {
        x1: MARGIN_X,
        y1: legendY - 8,
        x2: width - MARGIN_X,
        y2: legendY - 8,
        stroke: INK,
        strokeOpacity: "0.1",
        strokeWidth: "0.8"
      }
    ),
    /* @__PURE__ */ jsx(
      "text",
      {
        x: MARGIN_X,
        y: legendY + 8,
        fill: MUTED,
        fontSize: "8",
        fontFamily: FONT_MONO,
        letterSpacing: "0.14em",
        children: "LEGEND"
      }
    ),
    /* @__PURE__ */ jsx("text", { x: MARGIN_X + 80, y: legendY + 8, fill: MUTED, fontSize: "8", fontFamily: FONT_MONO, children: "SOLID = CALL" }),
    /* @__PURE__ */ jsx("text", { x: MARGIN_X + 200, y: legendY + 8, fill: MUTED, fontSize: "8", fontFamily: FONT_MONO, children: "DASHED = RETURN" }),
    /* @__PURE__ */ jsx("text", { x: MARGIN_X + 340, y: legendY + 8, fill: ACCENT, fontSize: "8", fontFamily: FONT_MONO, children: "ACCENT = HEADLINE" }),
    /* @__PURE__ */ jsx("text", { x: MARGIN_X + 520, y: legendY + 8, fill: MUTED, fontSize: "8", fontFamily: FONT_MONO, children: "FRAME = BRANCH" })
  ] });
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      ref: svgRef,
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-labelledby": `${aId} ${dId}`,
      style: { width: "100%", height: "auto", display: "block" },
      children: [
        /* @__PURE__ */ jsx("title", { id: aId, children: title }),
        /* @__PURE__ */ jsx("desc", { id: dId, children: desc }),
        markers,
        frameEls,
        lifelines,
        acts,
        messages,
        actorBoxes,
        legend
      ]
    }
  );
}
export {
  SequenceDiagram,
  exportSequenceSvg,
  layoutSequence
};
