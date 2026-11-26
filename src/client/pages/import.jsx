// import.jsx — 导入导出 + 代码生成页（Apifox 工作台：导入卡片 + 导出按钮组 + 结果 pre）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.import.{openapi,postman,apifox,yapi,har,curl} / api.export.{openapi,postman,har,markdown} / api.codegen.run
// 失败页面内显示错误文案（不弹窗）；结果统一渲染到可复制的 pre 块
// 视觉基线：docs/apifox-design-spec.md —— .pp-card / .pp-btn 按钮组 / .pp-pre / .pp-select
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['import', ImportPage]) // 注册表就绪前入队

/** 顶部页签（Apifox「导入导出数据」把导入 / 导出分成两页，代码生成单列一块） */
const IO_TABS = [
  { id: 'import', label: '导入' },
  { id: 'export', label: '导出' },
  { id: 'codegen', label: '代码生成' },
]

/** 占位提示：用数组 join 构造多行文本，避免在源码里出现裸换行 */
const PH_OPENAPI = ['{', '  "openapi": "3.0.0",', '  "info": { "title": "示例", "version": "1.0.0" },', '  "paths": {}', '}'].join('\n')
const PH_POSTMAN = ['{', '  "info": { "name": "示例" },', '  "item": []', '}'].join('\n')
const PH_HAR = ['{', '  "log": { "version": "1.2", "entries": [] }', '}'].join('\n')
const PH_CURL = "curl -X GET 'https://api.example.com/pets' -H 'Accept: application/json'"
const PH_APIFOX = ['{', '  "name": "Apifox 导出的项目",', '  "apiCollection": [ { "type": "folder", "name": "目录", "items": [] } ],', '  "models": []', '}'].join('\n')
const PH_YAPI = ['{', '  "name": "YApi 项目",', '  "list": [ { "title": "接口", "path": "/api/x", "method": "GET" } ]', '}'].join('\n')

const IMPORT_KINDS = [
  { id: 'openapi', label: 'OpenAPI / Swagger', hint: '粘贴 OpenAPI 3 或 Swagger 2 JSON/YAML 文本', placeholder: PH_OPENAPI },
  { id: 'postman', label: 'Postman', hint: '粘贴 Postman Collection v2.1 JSON 文本', placeholder: PH_POSTMAN },
  { id: 'apifox', label: 'Apifox JSON', hint: '粘贴 Apifox 导出的项目 JSON（apiCollection / items 树与 models 模型）', placeholder: PH_APIFOX },
  { id: 'yapi', label: 'YApi', hint: '粘贴 YApi 数据管理导出的 JSON（list 接口数组）', placeholder: PH_YAPI },
  { id: 'har', label: 'HAR', hint: '粘贴浏览器导出的 HAR JSON 文本', placeholder: PH_HAR },
  { id: 'curl', label: 'cURL', hint: '粘贴 cURL 命令（可多条，逐行）', placeholder: PH_CURL },
]

const EXPORT_KINDS = [
  { id: 'openapi', label: 'OpenAPI 3', hint: '标准 OpenAPI 3.0 文档' },
  { id: 'postman', label: 'Postman', hint: 'Postman Collection v2.1' },
  { id: 'har', label: 'HAR', hint: 'HTTP Archive 1.2' },
  { id: 'markdown', label: 'Markdown', hint: '可读文档' },
]

const LANGS = [
  { id: 'curl', label: 'cURL' },
  { id: 'fetch', label: 'JavaScript fetch' },
  { id: 'axios', label: 'JavaScript axios' },
  { id: 'python', label: 'Python requests' },
  { id: 'go', label: 'Go net/http' },
]

const MOCK_CURL = "curl -X GET 'https://api.example.test/api/v1/orders?page=1' -H 'Accept: application/json'"

const MOCK_ENDPOINT = {
  id: 'ep_1001', name: '查询订单列表', method: 'GET', url: 'https://api.example.test/api/v1/orders',
  params: [{ key: 'page', value: '1', enabled: true }],
  headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  body: { type: 'none', content: '' },
}

/** 结果文本化：字符串原样、对象 JSON 美化（页面 pre 与复制共用）。 */
export function resultText(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** 导入结果摘要：把各 importer 返回结构折算成统一计数。 */
export function importSummary(res) {
  const data = res && res.data !== undefined ? res.data : res
  if (!data || typeof data !== 'object') return { endpoints: 0, folders: 0, schemas: 0 }
  const count = (v) => (Array.isArray(v) ? v.length : 0)
  return {
    endpoints: count(data.endpoints),
    folders: count(data.folders),
    schemas: count(data.schemas),
  }
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

export function ImportPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const [projects, setProjects] = useState([{ id: 'proj_demo01', name: '订单中心' }])
  const [projectId, setProjectId] = useState('proj_demo01')
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  // 动作反馈（导入/导出/生成/复制）：挂在 io-main 内贴着触发按钮，不再上翻整页找结果
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [ioTab, setIoTab] = useState('import')
  const [importKind, setImportKind] = useState('openapi')
  const [importText, setImportText] = useState(MOCK_CURL)
  const [importOut, setImportOut] = useState('')
  // 最近一次导入的 bundle（folders/endpoints/schemas 骨架），供「保存到项目」真正落盘
  const [bundle, setBundle] = useState(null)
  const [exportKind, setExportKind] = useState('openapi')
  const [exportOut, setExportOut] = useState('')
  const [lang, setLang] = useState('curl')
  const [codeOut, setCodeOut] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => applyTheme(rootRef.current), [])

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') return
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
          setIsMock(false)
        }
      } catch (err) {
        setError('加载项目列表失败：' + errText(err))
      }
    }
    boot()
  }, [])

  const pickImportKind = (id) => {
    setImportKind(id)
    setImportOut('')
    setBundle(null)
    setActionError('')
  }

  const runImport = async () => {
    const fn = api && api.import && api.import[importKind]
    if (typeof fn !== 'function') {
      setActionError('当前桥未提供 api.import.' + importKind + '（契约 §5 POST /import/' + importKind + '）')
      return
    }
    const raw = String(importText || '')
    if (!raw.trim()) {
      setActionError('导入内容为空')
      return
    }
    // 桥签名：curl 接字符串（api.import.curl(text)），其余三种接已解析的 JSON 对象。
    let payload = raw
    if (importKind !== 'curl') {
      try {
        payload = JSON.parse(raw)
      } catch (err) {
        setActionError('导入内容不是合法 JSON：' + errText(err))
        return
      }
    }
    setBusy(true)
    setActionError('')
    setImportOut('')
    setBundle(null)
    try {
      const res = await fn(payload)
      const summary = importSummary(res)
      setImportOut(resultText(res))
      // 解析结果留在页面里；点「保存到项目」才真正写盘（纯本地，不涉及云端）
      setBundle(res && res.data !== undefined ? res.data : res)
      setNotice('解析完成：接口 ' + summary.endpoints + ' 条 / 目录 ' + summary.folders + ' 个 / 模型 ' + summary.schemas + ' 个，点「保存到项目」写入当前项目')
    } catch (err) {
      setActionError('导入失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  /** 把上一次导入的骨架真正落盘：storage.importBundle 单次原子写入。 */
  const saveImport = async () => {
    if (!bundle || typeof bundle !== 'object') {
      setNotice('还没有可保存的导入结果，先点「开始导入」')
      return
    }
    if (!storage || typeof storage.importBundle !== 'function') {
      setActionError('当前桥未提供 api.storage.importBundle（契约 §5 POST /storage/importBundle）')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      const res = await storage.importBundle(projectId, bundle)
      const written = res && typeof res === 'object' ? res : {}
      const num = (v) => (typeof v === 'number' ? v : 0)
      setNotice('已保存到项目：目录 ' + num(written.folders) + ' 个 / 接口 ' + num(written.endpoints) + ' 个 / 模型 ' + num(written.schemas) + ' 个')
    } catch (err) {
      setActionError('保存失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  const runExport = async (kind) => {
    const id = kind || exportKind
    const fn = api && api.export && api.export[id]
    if (typeof fn !== 'function') {
      setActionError('当前桥未提供 api.export.' + id + '（契约 §5 POST /export/' + id + '）')
      return
    }
    if (!storage || typeof storage.getProject !== 'function') {
      setActionError('导出需要先读取项目：当前桥未提供 api.storage.getProject')
      return
    }
    setBusy(true)
    setActionError('')
    setExportOut('')
    try {
      // 桥签名：export.<kind>(project) 接项目对象（不是 projectId），故先读盘再导出。
      const project = await storage.getProject(projectId)
      const res = await fn(project)
      setExportKind(id)
      setExportOut(resultText(res))
      setNotice('导出完成：' + id)
    } catch (err) {
      setActionError('导出失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  const runCodegen = async () => {
    if (!api || !api.codegen || typeof api.codegen.run !== 'function') {
      setActionError('当前桥未提供 api.codegen.run（契约 §5 POST /codegen/run）')
      return
    }
    setBusy(true)
    setActionError('')
    setCodeOut('')
    try {
      // 桥签名：codegen.run({ endpoint, env, lang })，返回生成后的代码字符串。
      const res = await api.codegen.run({ endpoint: MOCK_ENDPOINT, lang })
      setCodeOut(resultText(res))
      setNotice('代码生成完成：' + lang)
    } catch (err) {
      setActionError('代码生成失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text, label) => {
    if (!text) {
      setActionError('没有可复制的内容（先执行一次）')
      return
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        setNotice(label + '已复制到剪贴板')
      } else {
        setActionError('当前环境无剪贴板权限，请手动选中下方文本复制')
      }
    } catch (err) {
      setActionError('复制失败：' + errText(err))
    }
  }

  const currentImport = IMPORT_KINDS.find((k) => k.id === importKind) || IMPORT_KINDS[0]
  const currentExport = EXPORT_KINDS.find((k) => k.id === exportKind) || EXPORT_KINDS[0]
  const currentLang = LANGS.find((l) => l.id === lang) || LANGS[0]

  return (
    <div className="pp-scope pp-page" data-page="import" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">导入导出与代码生成</span>
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock ? '示例数据 — api 桥不可用，操作按钮会提示缺失的方法' : '数据来源：api.import / api.export / api.codegen'}
          </span>
        </div>
        {error ? <p className="pp-error-text">{error}</p> : null}

        {/* Apifox 导入导出同构：顶部页签分区（导入 / 导出 / 代码生成），
            每区「左格式列表 + 右内容」。原来「导入 + 导出」两列并排各占 240px，
            textarea 与按钮组都被压到换行；代码生成又单独占一整张卡，三块高度参差。 */}
        <div className="pp-io-layout">
          <div className="pp-tabs">
            {IO_TABS.map((t) => (
              <button key={t.id} className="pp-tab" data-active={ioTab === t.id ? 'true' : 'false'}
                onClick={() => setIoTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <div className="pp-io-body">
            <nav className="pp-io-side" aria-label={ioTab === 'export' ? '导出格式' : ioTab === 'codegen' ? '目标语言' : '导入格式'}>
              {ioTab === 'import' ? (
                <>
                  <div className="pp-io-side-title">导入来源</div>
                  {IMPORT_KINDS.map((k) => (
                    <button key={k.id} className="pp-io-item" data-active={importKind === k.id ? 'true' : 'false'}
                      onClick={() => pickImportKind(k.id)}>{k.label}</button>
                  ))}
                </>
              ) : null}
              {ioTab === 'export' ? (
                <>
                  <div className="pp-io-side-title">导出格式</div>
                  {EXPORT_KINDS.map((k) => (
                    <button key={k.id} className="pp-io-item" data-active={exportKind === k.id ? 'true' : 'false'}
                      onClick={() => setExportKind(k.id)}>{k.label}</button>
                  ))}
                </>
              ) : null}
              {ioTab === 'codegen' ? (
                <>
                  <div className="pp-io-side-title">目标语言</div>
                  {LANGS.map((l) => (
                    <button key={l.id} className="pp-io-item" data-active={lang === l.id ? 'true' : 'false'}
                      onClick={() => setLang(l.id)}>{l.label}</button>
                  ))}
                </>
              ) : null}
            </nav>

            <div className="pp-io-main">
              {ioTab === 'import' ? (
                <>
                  <div className="pp-io-head">
                    <span className="pp-io-title">{currentImport.label}</span>
                    <button className="pp-btn pp-btn-sm" onClick={() => setImportText('')} disabled={busy || !importText}>
                      清空
                    </button>
                  </div>
                  <div className="pp-note">{currentImport.hint}</div>
                  <textarea className="pp-textarea pp-io-input" value={importText}
                    placeholder={currentImport.placeholder}
                    onChange={(e) => setImportText(e.target.value)} />
                  <div className="pp-toolbar-inline">
                    <button className="pp-btn pp-btn-primary" onClick={runImport} disabled={busy}>开始导入</button>
                    <button className="pp-btn" onClick={saveImport} disabled={busy || !bundle}
                      title={bundle ? '' : '先点「开始导入」解析出结果后可保存'}>保存到项目</button>
                    <button className="pp-btn" onClick={() => copy(importOut, '导入结果')} disabled={!importOut}>复制结果</button>
                  </div>
                  {bundle ? (
                    <div className="pp-io-stats">
                      <span className="pp-pill pp-pill-ok">已解析</span>
                      <span className="pp-meta">接口 {importSummary(bundle).endpoints} 条</span>
                      <span className="pp-meta">目录 {importSummary(bundle).folders} 个</span>
                      <span className="pp-meta">模型 {importSummary(bundle).schemas} 个</span>
                    </div>
                  ) : null}
                  {importOut ? <pre className="pp-pre pp-pre-scroll pp-io-pre">{importOut}</pre> : null}
                </>
              ) : null}

              {ioTab === 'export' ? (
                <>
                  <div className="pp-io-head">
                    <span className="pp-io-title">{currentExport.label}</span>
                  </div>
                  <div className="pp-note">
                    {currentExport.hint} — 导出读取当前项目对象后交给 api.export，结果可直接复制或另存。
                  </div>
                  <div className="pp-toolbar-inline">
                    <button className="pp-btn pp-btn-primary" onClick={() => runExport(exportKind)} disabled={busy}>
                      导出 {currentExport.label}
                    </button>
                    <button className="pp-btn" onClick={() => copy(exportOut, '导出结果')} disabled={!exportOut}>复制结果</button>
                  </div>
                  <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>
                    当前项目：{projectId} · 格式：{exportKind}
                  </div>
                  {exportOut ? <pre className="pp-pre pp-pre-scroll pp-io-pre">{exportOut}</pre> : null}
                </>
              ) : null}

              {ioTab === 'codegen' ? (
                <>
                  <div className="pp-io-head">
                    <span className="pp-io-title">{currentLang.label}</span>
                  </div>
                  <div className="pp-note">以示例接口生成目标语言代码，结果可复制；可先到「调试」页验证接口。</div>
                  <div className="pp-io-sample">
                    <span className="pp-meta">示例接口</span>
                    <span className="pp-method" data-method={MOCK_ENDPOINT.method}>{MOCK_ENDPOINT.method}</span>
                    <span className="pp-mono pp-ellipsis">{MOCK_ENDPOINT.url}</span>
                  </div>
                  <div className="pp-toolbar-inline">
                    <button className="pp-btn pp-btn-primary" onClick={runCodegen} disabled={busy}>生成代码</button>
                    <button className="pp-btn" onClick={() => copy(codeOut, '生成代码')} disabled={!codeOut}>复制代码</button>
                  </div>
                  {codeOut ? <pre className="pp-pre pp-pre-scroll pp-io-pre">{codeOut}</pre> : null}
                </>
              ) : null}

              {/* 动作反馈贴着触发按钮：error/notice 不再挂整页顶部（窄容器里视线要跨整屏找结果） */}
              <div className="pp-io-status">
                {actionError ? <p className="pp-error-text">{actionError}</p> : null}
                {notice ? <div className="pp-note pp-note-ok">{notice}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
