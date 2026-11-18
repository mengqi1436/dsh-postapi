// import.jsx — 导入导出 + 代码生成页（Apifox 工作台：导入卡片 + 导出按钮组 + 结果 pre）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.import.{openapi,postman,har,curl} / api.export.{openapi,postman,har,markdown} / api.codegen.run
// 失败页面内显示错误文案（不弹窗）；结果统一渲染到可复制的 pre 块
// 视觉基线：docs/apifox-design-spec.md —— .pp-card / .pp-btn 按钮组 / .pp-pre / .pp-select
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['import', ImportPage]) // 注册表就绪前入队

const IMPORT_KINDS = [
  { id: 'openapi', label: 'OpenAPI / Swagger', hint: '粘贴 OpenAPI 3 或 Swagger 2 JSON/YAML 文本' },
  { id: 'postman', label: 'Postman', hint: '粘贴 Postman Collection v2.1 JSON 文本' },
  { id: 'har', label: 'HAR', hint: '粘贴浏览器导出的 HAR JSON 文本' },
  { id: 'curl', label: 'cURL', hint: '粘贴 cURL 命令（可多条，逐行）' },
]

const EXPORT_KINDS = [
  { id: 'openapi', label: 'OpenAPI 3' },
  { id: 'postman', label: 'Postman' },
  { id: 'har', label: 'HAR' },
  { id: 'markdown', label: 'Markdown' },
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
  const [notice, setNotice] = useState('')
  const [importKind, setImportKind] = useState('openapi')
  const [importText, setImportText] = useState(MOCK_CURL)
  const [importOut, setImportOut] = useState('')
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
    setError('')
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
    try {
      const res = await fn(payload)
      const summary = importSummary(res)
      setImportOut(resultText(res))
      setNotice('导入完成：接口 ' + summary.endpoints + ' 条 / 目录 ' + summary.folders + ' 个 / 模型 ' + summary.schemas + ' 个（导入结果需在文档页确认后再保存）')
    } catch (err) {
      setError('导入失败：' + errText(err))
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

  return (
    <div className="pp-scope pp-page" data-page="import" ref={rootRef}>
      <h1 className="pp-page-title">导入导出与代码生成</h1>
      <div className="pp-toolbar">
        <span className="pp-meta">
          {isMock ? '示例数据 — api 桥不可用，操作按钮会提示缺失的方法' : '数据来源：api.import / api.export / api.codegen'}
        </span>
        <span className="pp-toolbar-spacer" />
        <label className="pp-meta">项目</label>
        <select className="pp-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
        </select>
      </div>
      {error ? <p className="pp-error-text">{error}</p> : null}
      {notice ? <p className="pp-muted">{notice}</p> : null}

      <div className="pp-cols-2">
        <div className="pp-card pp-card-hover">
          <div className="pp-card-title">导入</div>
          <div className="pp-tabs">
            {IMPORT_KINDS.map((k) => (
              <button key={k.id} className="pp-tab" data-active={importKind === k.id ? 'true' : 'false'}
                onClick={() => pickImportKind(k.id)}>{k.label}</button>
            ))}
          </div>
          <div className="pp-note" style={{ marginTop: 'var(--sp-2)' }}>{currentImport.hint}</div>
          <textarea className="pp-textarea" rows={8} value={importText}
            onChange={(e) => setImportText(e.target.value)} />
          <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
            <button className="pp-btn pp-btn-primary" onClick={runImport} disabled={busy}>开始导入</button>
            <button className="pp-btn" onClick={() => copy(importOut, '导入结果')}>复制结果</button>
          </div>
          {importOut ? <pre className="pp-pre pp-pre-scroll" style={{ marginTop: 'var(--sp-2)' }}>{importOut}</pre> : null}
        </div>

        <div className="pp-card pp-card-hover">
          <div className="pp-card-title">导出</div>
          <div className="pp-note">导出读取当前项目对象后交给 api.export，结果可直接复制。</div>
          <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
            {EXPORT_KINDS.map((k) => (
              <button key={k.id} className="pp-btn" onClick={() => runExport(k.id)} disabled={busy}>{k.label}</button>
            ))}
            <button className="pp-btn" onClick={() => copy(exportOut, '导出结果')}>复制结果</button>
          </div>
          <div className="pp-meta" style={{ marginTop: 'var(--sp-2)' }}>当前导出格式：{exportKind}</div>
          {exportOut ? <pre className="pp-pre pp-pre-scroll" style={{ marginTop: 'var(--sp-2)' }}>{exportOut}</pre> : null}
        </div>
      </div>

      <div className="pp-card" style={{ marginTop: 'var(--sp-4)' }}>
        <div className="pp-card-title">代码生成</div>
        <div className="pp-form-row">
          <label className="pp-form-label">语言</label>
          <select className="pp-select" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button className="pp-btn pp-btn-primary" onClick={runCodegen} disabled={busy}>生成代码</button>
          <button className="pp-btn" onClick={() => copy(codeOut, '生成代码')}>复制代码</button>
        </div>
        <div className="pp-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          示例接口：
          <span className="pp-method" data-method={MOCK_ENDPOINT.method}>{MOCK_ENDPOINT.method}</span>
          <span className="pp-mono">{MOCK_ENDPOINT.url}</span>
        </div>
        {codeOut ? <pre className="pp-pre pp-pre-scroll" style={{ marginTop: 'var(--sp-2)' }}>{codeOut}</pre> : null}
      </div>
    </div>
  )
}
