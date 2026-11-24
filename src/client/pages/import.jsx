// import.jsx — 导入 / 导出 / 代码生成（对齐 Apifox 2.8.55「导入导出数据」：
//   页签分区（导入 / 导出 / 代码生成）+ 左格式列表 + 右内容，导入分「解析预览 → 保存到项目」两步）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.import.{openapi,postman,har,curl} / api.export.{openapi,postman,har,markdown} / api.codegen.run
//      api.storage.listProjects / getProject / importBundle
// 失败页面内显示错误文案（不弹窗）；结果统一渲染到可复制的 pre 块
// 视觉基线：docs/apifox-visual-parity-spec.md —— .pp-io-layout / .pp-io-side / .pp-io-main / .pp-btn / .pp-pre
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

const IMPORT_KINDS = [
  { id: 'openapi', label: 'OpenAPI / Swagger', hint: '粘贴或选择 OpenAPI 3 / Swagger 2 JSON 文档', placeholder: PH_OPENAPI, accept: '.json,.yaml,.yml' },
  { id: 'postman', label: 'Postman', hint: '粘贴或选择 Postman Collection v2.1 JSON', placeholder: PH_POSTMAN, accept: '.json' },
  { id: 'har', label: 'HAR', hint: '粘贴或选择浏览器导出的 HAR JSON', placeholder: PH_HAR, accept: '.json,.har' },
  { id: 'curl', label: 'cURL', hint: '粘贴 cURL 命令（可多条，逐行）', placeholder: PH_CURL, accept: '.txt,.sh' },
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

// 文件内 mock：仅在 api.* 缺失时用于渲染结构示例
const MOCK_CURL = "curl -X GET 'https://api.example.test/api/v1/orders?page=1' -H 'Accept: application/json'"
const MOCK_ENDPOINT = {
  id: 'ep_sample01', name: '查询订单列表', method: 'GET', url: 'https://api.example.test/api/v1/orders',
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
  // 默认态：项目列表为空、当前项目为空（用户自己选）
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [ioTab, setIoTab] = useState('import')
  const [importKind, setImportKind] = useState('openapi')
  const [importText, setImportText] = useState('')
  const [importOut, setImportOut] = useState('')
  // 最近一次导入的 bundle（folders/endpoints/schemas 骨架），供「保存到项目」真正落盘
  const [bundle, setBundle] = useState(null)
  const [fileName, setFileName] = useState('')
  const [exportKind, setExportKind] = useState('openapi')
  const [exportOut, setExportOut] = useState('')
  const [lang, setLang] = useState('curl')
  const [codeOut, setCodeOut] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { applyTheme(rootRef.current) }, [])

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') {
        setIsMock(true)
        return
      }
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setIsMock(false)
        } else {
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
    setFileName('')
    setError('')
    setNotice('')
  }

  // 文件选择：读文本进 textarea（Apifox 导入支持「粘贴」与「选文件」两种入口）
  const pickFile = (file) => {
    if (!file) return
    const reader = typeof FileReader === 'function' ? new FileReader() : null
    if (!reader) {
      setError('当前环境不支持读取本地文件，请直接粘贴文本')
      return
    }
    reader.onload = () => {
      setImportText(String(reader.result || ''))
      setFileName(file.name || '')
      setImportOut('')
      setBundle(null)
      setError('')
      setNotice('已载入文件：' + (file.name || '未命名') + '，点「开始导入」解析')
    }
    reader.onerror = () => setError('读取文件失败：' + errText(reader.error))
    reader.readAsText(file)
  }

  const runImport = async () => {
    const fn = api && api.import && api.import[importKind]
    if (typeof fn !== 'function') {
      setError('当前桥未提供 api.import.' + importKind + '（契约 §5 POST /import/' + importKind + '）')
      return
    }
    const raw = String(importText || '')
    if (!raw.trim()) {
      setError('导入内容为空')
      return
    }
    // 桥签名：curl 接字符串（api.import.curl(text)），其余三种接已解析的 JSON 对象。
    let payload = raw
    if (importKind !== 'curl') {
      try {
        payload = JSON.parse(raw)
      } catch (err) {
        setError('导入内容不是合法 JSON：' + errText(err))
        return
      }
    }
    setBusy(true)
    setError('')
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
      setError('导入失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  /** 把上一次导入的骨架真正落盘：storage.importBundle 单次原子写入。 */
  const saveImport = async () => {
    if (!bundle || typeof bundle !== 'object') {
      setError('还没有可保存的导入结果，先点「开始导入」')
      return
    }
    if (!storage || typeof storage.importBundle !== 'function') {
      setError('当前桥未提供 api.storage.importBundle（契约 §3）')
      return
    }
    if (!projectId) {
      setError('请先在页头选择目标项目')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await storage.importBundle(projectId, bundle)
      const written = res && typeof res === 'object' ? res : {}
      const num = (v) => (typeof v === 'number' ? v : 0)
      setNotice('已保存到项目：目录 ' + num(written.folders) + ' 个 / 接口 ' + num(written.endpoints) + ' 个 / 模型 ' + num(written.schemas) + ' 个')
    } catch (err) {
      setError('保存失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  const runExport = async (kind) => {
    const id = kind || exportKind
    const fn = api && api.export && api.export[id]
    if (typeof fn !== 'function') {
      setError('当前桥未提供 api.export.' + id + '（契约 §5 POST /export/' + id + '）')
      return
    }
    if (!storage || typeof storage.getProject !== 'function') {
      setError('导出需要先读取项目：当前桥未提供 api.storage.getProject')
      return
    }
    setBusy(true)
    setError('')
    setExportOut('')
    try {
      // 桥签名：export.<kind>(project) 接项目对象（不是 projectId），故先读盘再导出。
      const project = await storage.getProject(projectId)
      const res = await fn(project)
      setExportKind(id)
      setExportOut(resultText(res))
      setNotice('导出完成：' + id)
    } catch (err) {
      setError('导出失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  const runCodegen = async () => {
    if (!api || !api.codegen || typeof api.codegen.run !== 'function') {
      setError('当前桥未提供 api.codegen.run（契约 §5 POST /codegen/run）')
      return
    }
    setBusy(true)
    setError('')
    setCodeOut('')
    try {
      // 桥签名：codegen.run({ endpoint, env, lang })，返回生成后的代码字符串。
      const res = await api.codegen.run({ endpoint: MOCK_ENDPOINT, lang })
      setCodeOut(resultText(res))
      setNotice('代码生成完成：' + lang)
    } catch (err) {
      setError('代码生成失败：' + errText(err))
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text, label) => {
    if (!text) {
      setError('没有可复制的内容（先执行一次）')
      return
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        setNotice(label + '已复制到剪贴板')
      } else {
        setError('当前环境无剪贴板权限，请手动选中下方文本复制')
      }
    } catch (err) {
      setError('复制失败：' + errText(err))
    }
  }

  const currentImport = IMPORT_KINDS.find((k) => k.id === importKind) || IMPORT_KINDS[0]
  const currentExport = EXPORT_KINDS.find((k) => k.id === exportKind) || EXPORT_KINDS[0]
  const currentLang = LANGS.find((l) => l.id === lang) || LANGS[0]
  const summary = bundle ? importSummary(bundle) : null

  return (
    <div className="pp-scope pp-page" data-page="import" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">导入导出与代码生成</span>
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock ? '示例数据 — api 桥不可用，操作按钮会提示缺失的方法' : '数据来源：api.import / api.export / api.codegen / api.storage.importBundle'}
          </span>
          <span className="pp-toolbar-spacer" />
          <span className="pp-meta">{projectId ? '目标项目：' + projectId : '未选择目标项目'}</span>
        </div>
        {error ? <div className="pp-note pp-note-bad">{error}</div> : null}
        {notice ? <div className="pp-note pp-note-ok">{notice}</div> : null}

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
                    <button className="pp-btn pp-btn-sm" onClick={() => { setImportText(''); setImportOut(''); setBundle(null); setFileName('') }}
                      disabled={busy || !importText}>
                      清空
                    </button>
                  </div>
                  <div className="pp-note">{currentImport.hint}</div>
                  <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-2)' }}>
                    <label className="pp-meta">选择文件</label>
                    <input className="pp-input pp-input-sm" type="file" accept={currentImport.accept}
                      onChange={(e) => pickFile(e.target.files && e.target.files[0])} />
                    {fileName ? <span className="pp-meta pp-ellipsis">{fileName}</span> : null}
                  </div>
                  <textarea className="pp-textarea pp-io-input" rows={10} value={importText}
                    placeholder={currentImport.placeholder}
                    onChange={(e) => setImportText(e.target.value)} />
                  <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                    <button className="pp-btn pp-btn-primary" onClick={runImport} disabled={busy}>开始导入</button>
                    <button className="pp-btn" onClick={saveImport} disabled={busy || !bundle}>保存到项目</button>
                    <button className="pp-btn" onClick={() => copy(importOut, '导入结果')} disabled={!importOut}>复制结果</button>
                  </div>
                  {/* 解析预览卡：Apifox 导入的「预览 → 保存到项目」两步中的预览块 */}
                  <div className="pp-card" style={{ marginTop: 'var(--sp-3)' }}>
                    <div className="pp-card-title">解析预览</div>
                    {summary ? (
                      <div className="pp-io-stats">
                        <span className="pp-pill pp-pill-ok">已解析</span>
                        <span className="pp-meta">接口 {summary.endpoints} 条</span>
                        <span className="pp-meta">目录 {summary.folders} 个</span>
                        <span className="pp-meta">模型 {summary.schemas} 个</span>
                      </div>
                    ) : (
                      <p className="pp-meta">尚未解析：点「开始导入」后在此显示接口 / 目录 / 模型计数与原始返回</p>
                    )}
                    {importOut ? <pre className="pp-pre pp-pre-scroll pp-io-pre">{importOut}</pre> : null}
                  </div>
                </>
              ) : null}

              {ioTab === 'export' ? (
                <>
                  <div className="pp-io-head">
                    <span className="pp-io-title">{currentExport.label}</span>
                    <span className="pp-meta">{currentExport.hint}</span>
                  </div>
                  <div className="pp-note">导出读取当前项目对象后交给 api.export，结果可直接复制或另存。</div>
                  <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                    <button className="pp-btn pp-btn-primary" onClick={() => runExport(exportKind)} disabled={busy}>
                      导出 {currentExport.label}
                    </button>
                    <button className="pp-btn" onClick={() => copy(exportOut, '导出结果')} disabled={!exportOut}>复制结果</button>
                  </div>
                  <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>
                    当前项目：{projectId || '（未选择）'} · 格式：{exportKind}
                  </div>
                  {exportOut ? <pre className="pp-pre pp-pre-scroll pp-io-pre">{exportOut}</pre> : null}
                </>
              ) : null}

              {ioTab === 'codegen' ? (
                <>
                  <div className="pp-io-head">
                    <span className="pp-io-title">{currentLang.label}</span>
                  </div>
                  <div className="pp-io-sample">
                    <span className="pp-meta">示例接口</span>
                    <span className="pp-method" data-method={MOCK_ENDPOINT.method}>{MOCK_ENDPOINT.method}</span>
                    <span className="pp-mono pp-ellipsis">{MOCK_ENDPOINT.url}</span>
                  </div>
                  <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
                    <button className="pp-btn pp-btn-primary" onClick={runCodegen} disabled={busy}>生成代码</button>
                    <button className="pp-btn" onClick={() => copy(codeOut, '生成代码')} disabled={!codeOut}>复制代码</button>
                  </div>
                  {codeOut ? <pre className="pp-pre pp-pre-scroll pp-io-pre">{codeOut}</pre> : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
