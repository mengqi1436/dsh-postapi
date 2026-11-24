// schema.jsx — 数据模型页（对齐 Apifox 2.8.55「数据模型」：左目录/模型树 + 右 JSON Schema 编辑器）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.getProject / saveSchema / deleteSchema；示例与校验优先 api.schema.*，缺失走本文件本地降级
// Apifox 取证（.research/apifox/app/dist/renderer/22718.09ba70da.async.js + async_data_schema_folder.1310deed.css）：
//   左侧是「目录 → 模型」两级树（.content-PEa5n_ / .content__block__title-In0EcA），
//   右侧编辑区顶部是基本信息（名称 / 说明 / 描述），下面是 Schema 编辑（树 / 源码双模式），
//   底部是示例与校验结果（async_json_schema_example_viewer 与 async_spec_json_schema）。
//   本插件契约 §2 schemas[] 只有 { id, name, folderId, jsonSchema, description }，
//   故「目录」用 project.folders 里同名结构渲染，不新增落盘字段。
// 视觉基线：docs/apifox-visual-parity-spec.md —— .pp-tree-row / .pp-json-editor / .pp-note-ok / .pp-note-bad
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'
import { EmptyState } from './components/EmptyState.jsx'

;(window.__postapiQueue = window.__postapiQueue || []).push(['schema', SchemaPage]) // 注册表就绪前入队

// 文件内 mock：仅在 api.storage 缺失时用于渲染结构示例（id 不参与写操作）
const MOCK_SCHEMAS = [
  {
    id: 'sch_sample_order',
    name: 'Order',
    description: '订单对象',
    jsonSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'ORD-001' },
        status: { type: 'string', enum: ['CREATED', 'PAID', 'CANCELED'] },
        amount: { type: 'number' },
        items: { type: 'array', items: { type: 'object', properties: { skuId: { type: 'string' } } } },
      },
      required: ['orderId', 'status'],
    },
  },
]

/** 本地 JSON Schema 轻量校验（api.schema.validate 缺失时的降级实现）。 */
export function localValidateSchema(text) {
  let parsed
  try {
    parsed = JSON.parse(String(text || ''))
  } catch (err) {
    return { ok: false, error: 'JSON 解析失败：' + (err && err.message ? err.message : String(err)) }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'JSON Schema 必须是对象' }
  }
  const hasShape = parsed.type || parsed.properties || parsed.items || parsed.$ref || parsed.allOf || parsed.oneOf || parsed.anyOf
  if (!hasShape) return { ok: false, error: 'JSON Schema 至少需要 type / properties / items / $ref 之一' }
  if (parsed.type && !['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'].includes(parsed.type)) {
    return { ok: false, error: '未知 type：' + String(parsed.type) }
  }
  return { ok: true, schema: parsed }
}

/** 从 JSON Schema 生成示例值（api.schema.example 缺失时的降级实现）。 */
export function localExampleFromSchema(schema) {
  if (!schema || typeof schema !== 'object') return null
  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0]
  if (schema.$ref) return { $ref: schema.$ref }
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) return localExampleFromSchema(schema.oneOf[0])
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) return localExampleFromSchema(schema.anyOf[0])
  const type = schema.type || (schema.properties ? 'object' : schema.items ? 'array' : 'string')
  if (type === 'object') {
    const out = {}
    const props = schema.properties && typeof schema.properties === 'object' ? schema.properties : {}
    for (const key of Object.keys(props)) out[key] = localExampleFromSchema(props[key])
    return out
  }
  if (type === 'array') return [localExampleFromSchema(schema.items || { type: 'string' })]
  if (type === 'integer') return 0
  if (type === 'number') return 0
  if (type === 'boolean') return true
  if (type === 'null') return null
  return 'string'
}

/**
 * Schema 字段展开（树模式数据）：把 jsonSchema.properties 拍平成一行行字段。
 * 递归展开 object / array.items，depth 用于缩进；$ref 只显示引用不解析。
 */
export function schemaFields(schema, depth = 0) {
  const out = []
  if (!schema || typeof schema !== 'object' || depth > 6) return out
  const props = schema.properties && typeof schema.properties === 'object' ? schema.properties : null
  if (!props) return out
  const required = Array.isArray(schema.required) ? schema.required : []
  for (const key of Object.keys(props)) {
    const field = props[key] && typeof props[key] === 'object' ? props[key] : {}
    const type = field.type || (field.properties ? 'object' : field.items ? 'array' : field.$ref ? '$ref' : 'string')
    out.push({
      key,
      depth,
      type,
      required: required.includes(key),
      description: String(field.description || field.title || ''),
      example: field.example === undefined ? '' : String(field.example),
    })
    if (type === 'object') out.push(...schemaFields(field, depth + 1))
    else if (type === 'array' && field.items) out.push(...schemaFields(field.items, depth + 1))
  }
  return out
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

function toText(value) {
  try {
    return JSON.stringify(value === undefined ? {} : value, null, 2)
  } catch {
    return '{}'
  }
}

export function SchemaPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const route = (props && props.route) || {}
  // 默认态：项目列表为空、当前项目为空、未选中模型
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [schemas, setSchemas] = useState([])
  const [folders, setFolders] = useState([])
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [currentId, setCurrentId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [text, setText] = useState(toText({ type: 'object', properties: {} }))
  // 默认源码模式：JSON 编辑器常驻（树模式按当前源码解析展示字段，切换不丢编辑内容）
  const [mode, setMode] = useState('source')
  const [checkResult, setCheckResult] = useState(null)
  const [example, setExample] = useState('')
  const [pendingDelete, setPendingDelete] = useState('')

  useEffect(() => { applyTheme(rootRef.current) }, [])

  const applyMock = () => {
    setIsMock(true)
    setProjects([{ id: 'schema_sample_project', name: '示例项目' }])
    setSchemas(MOCK_SCHEMAS)
    setFolders([])
    pick(MOCK_SCHEMAS[0])
  }

  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== 'function') { applyMock(); return }
    if (!id) { setSchemas([]); setFolders([]); return }
    try {
      const loaded = await storage.getProject(id)
      if (!loaded) { setSchemas([]); setFolders([]); return }
      const list = Array.isArray(loaded.schemas) ? loaded.schemas : []
      setSchemas(list)
      setFolders(Array.isArray(loaded.folders) ? loaded.folders : [])
      setIsMock(false)
      const wanted = route.arg && list.find((s) => s.id === route.arg)
      if (wanted) pick(wanted)
    } catch (err) {
      setError('加载项目失败：' + errText(err))
    }
  }

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') { applyMock(); return }
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
          await loadProject(list[0].id)
          return
        }
        setIsMock(false)
      } catch (err) {
        setError('加载项目列表失败：' + errText(err))
      }
    }
    boot()
  }, [])

  function pick(s) {
    setCurrentId(s.id || '')
    setName(s.name || '')
    setDescription(s.description || '')
    setText(toText(s.jsonSchema))
    setCheckResult(null)
    setExample('')
    setNotice('')
    setError('')
    setPendingDelete('')
  }

  const blank = () => {
    setCurrentId('')
    setName('新建模型')
    setDescription('')
    setText(toText({ type: 'object', properties: {} }))
    setCheckResult(null)
    setExample('')
    setNotice('')
    setError('')
  }

  const validate = async () => {
    setError('')
    setCheckResult(null)
    if (api && api.schema && typeof api.schema.validate === 'function') {
      try {
        const res = await api.schema.validate({ schema: safeParse(text) })
        setCheckResult({ ok: res && res.ok !== false, message: (res && res.message) || (res && res.ok === false ? '校验未通过' : '校验通过') })
        return
      } catch (err) {
        setError('api.schema.validate 调用失败：' + errText(err))
        return
      }
    }
    const res = localValidateSchema(text)
    setCheckResult({
      ok: res.ok,
      message: res.ok ? '校验通过（本地降级校验：api.schema.validate 未提供）' : res.error + '（api.schema.validate 未提供）',
    })
  }

  const makeExample = async () => {
    setError('')
    setExample('')
    const parsed = safeParse(text)
    if (api && api.schema && typeof api.schema.example === 'function') {
      try {
        const res = await api.schema.example({ schema: parsed })
        setExample(toText(res && res.example !== undefined ? res.example : res))
        return
      } catch (err) {
        setError('api.schema.example 调用失败：' + errText(err))
        return
      }
    }
    setExample(toText(localExampleFromSchema(parsed)))
  }

  const save = async () => {
    if (!storage || typeof storage.saveSchema !== 'function') {
      setError('当前桥未提供 api.storage.saveSchema（契约 §3）')
      return
    }
    const parsed = localValidateSchema(text)
    if (!parsed.ok) {
      setError('保存前校验失败：' + parsed.error)
      return
    }
    setError('')
    setNotice('')
    try {
      const payload = { name: name || '未命名模型', description, jsonSchema: parsed.schema }
      if (currentId) payload.id = currentId
      const saved = await storage.saveSchema(projectId, payload)
      setNotice('已保存模型：' + ((saved && saved.name) || payload.name))
      if (saved && saved.id) setCurrentId(saved.id)
      await loadProject(projectId)
    } catch (err) {
      setError('保存模型失败：' + errText(err))
    }
  }

  // 两段式删除
  const remove = async () => {
    if (!currentId) {
      setError('请先选中一个模型')
      return
    }
    if (pendingDelete !== currentId) {
      setPendingDelete(currentId)
      setNotice('再次点击「确认删除模型」将删除该模型')
      return
    }
    if (!storage || typeof storage.deleteSchema !== 'function') {
      setError('当前桥未提供 api.storage.deleteSchema（契约 §3）')
      return
    }
    setError('')
    setPendingDelete('')
    try {
      await storage.deleteSchema(projectId, currentId)
      setNotice('已删除模型：' + currentId)
      blank()
      await loadProject(projectId)
    } catch (err) {
      setError('删除模型失败：' + errText(err))
    }
  }

  // 目录分组：schema.folderId 命中的目录名，未命中归「未归类」
  const folderName = (folderId) => {
    const hit = folders.find((f) => f.id === folderId)
    return hit ? (hit.name || hit.id) : ''
  }
  const grouped = (() => {
    const map = new Map()
    for (const s of schemas) {
      const label = folderName(s.folderId) || '未归类'
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(s)
    }
    return [...map.entries()]
  })()

  const parsed = safeParse(text)
  const fields = schemaFields(parsed)

  return (
    <div className="pp-scope pp-page" data-page="schema" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">数据模型</span>
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId}
            onChange={(e) => { const v = e.target.value; setProjectId(v); loadProject(v) }}>
            <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock
              ? '示例数据 — api.storage 不可用，以下为文件内 mock'
              : '数据来源：api.storage（getProject / saveSchema / deleteSchema）+ api.schema（validate / example）'}
          </span>
          <span className="pp-toolbar-spacer" />
          <span className="pp-meta">{schemas.length} 个模型 · {folders.length} 个目录</span>
        </div>
        {error ? <div className="pp-note pp-note-bad">{error}</div> : null}
        {notice ? <div className="pp-note pp-note-ok">{notice}</div> : null}

        <div className="pp-debug-layout">
          {/* 左：目录 → 模型 两级树（Apifox 数据模型树） */}
          <nav className="pp-panel" aria-label="数据模型树">
            <div className="pp-env-side-head">
              <span className="pp-card-title">数据模型</span>
              <button className="pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent" onClick={blank}>+ 新建模型</button>
            </div>
            <div className="pp-tree">
              {grouped.map(([label, list]) => (
                <div key={label}>
                  <div className="pp-tree-group">{label}</div>
                  {list.map((s) => (
                    <div key={s.id} className="pp-tree-row" data-active={s.id === currentId ? 'true' : 'false'}
                      onClick={() => pick(s)}>
                      <span className="pp-ellipsis">{s.name || s.id}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {schemas.length === 0 ? (
              <EmptyState text="暂无数据模型" hint="点上方「+ 新建模型」创建第一个模型" />
            ) : null}
          </nav>

          {/* 右：基本信息 + Schema 编辑（树 / 源码双模式）+ 示例与校验 */}
          <div className="pp-pane">
            <div className="pp-io-head">
              <span className="pp-io-title">{currentId ? '编辑模型' : '新建模型'}</span>
              <div className="pp-seg">
                <button data-active={mode === 'tree' ? 'true' : 'false'} onClick={() => setMode('tree')}>树模式</button>
                <button data-active={mode === 'source' ? 'true' : 'false'} onClick={() => setMode('source')}>源码模式</button>
              </div>
            </div>
            <div className="pp-form-grid" style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="pp-form-label">名称</label>
              <input className="pp-input" value={name} onChange={(e) => { setName(e.target.value); setNotice('') }} />
              <label className="pp-form-label">说明</label>
              <input className="pp-input" value={description}
                onChange={(e) => { setDescription(e.target.value); setNotice('') }} />
            </div>

            {mode === 'source' ? (
              <textarea className="pp-json-editor" rows={14} value={text}
                onChange={(e) => { setText(e.target.value); setCheckResult(null) }} />
            ) : (
              <div className="pp-table-wrap">
                <table className="pp-table pp-table-wide">
                  <thead>
                    <tr>
                      <th>字段名</th>
                      <th style={{ width: '96px' }}>类型</th>
                      <th style={{ width: '64px' }}>必填</th>
                      <th>说明</th>
                      <th style={{ width: '140px' }}>示例</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f.depth + '-' + f.key}>
                        <td className="pp-table-mono">
                          <span style={{ paddingLeft: 'calc(var(--sp-3) * ' + f.depth + ')' }}>{f.key}</span>
                        </td>
                        <td><span className="pp-pill">{f.type}</span></td>
                        <td className="pp-meta">{f.required ? '是' : '-'}</td>
                        <td className="pp-meta pp-ellipsis">{f.description || '-'}</td>
                        <td className="pp-table-mono pp-ellipsis">{f.example || '-'}</td>
                      </tr>
                    ))}
                    {fields.length === 0 ? (
                      <tr><td colSpan={5} className="pp-muted">当前 Schema 无可展开字段；切「源码模式」直接编辑 JSON</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
              <button className="pp-btn" onClick={validate}>校验</button>
              <button className="pp-btn" onClick={makeExample}>生成示例</button>
              <button className="pp-btn pp-btn-primary" onClick={save}>保存</button>
              <button className="pp-btn pp-btn-danger" onClick={remove}>
                {pendingDelete && pendingDelete === currentId ? '确认删除模型' : '删除'}
              </button>
            </div>

            {checkResult ? (
              <div className={checkResult.ok ? 'pp-note pp-note-ok' : 'pp-note pp-note-bad'} style={{ marginTop: 'var(--sp-3)' }}>
                {checkResult.ok ? '通过：' : '失败：'}{checkResult.message}
              </div>
            ) : null}

            <div className="pp-card-title" style={{ marginTop: 'var(--sp-4)' }}>示例数据</div>
            <pre className="pp-pre pp-pre-scroll">{example || '（点「生成示例」按当前 JSON Schema 生成）'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function safeParse(text) {
  try {
    return JSON.parse(String(text || '{}'))
  } catch {
    return null
  }
}
