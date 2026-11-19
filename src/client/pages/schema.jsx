// schema.jsx — 数据模型页（Apifox 工作台：左模型列表 + 右 JSON 编辑器 + 校验提示）
// 自注册：模块求值期入队 __postapiQueue
// 数据：api.storage.getProject / saveSchema / deleteSchema；校验与示例优先 api.schema.*，缺失走本文件本地降级
// 视觉基线：docs/apifox-design-spec.md —— .pp-tree-row / .pp-json-editor / .pp-note-ok / .pp-note-bad
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['schema', SchemaPage]) // 注册表就绪前入队

const MOCK_SCHEMAS = [
  {
    id: 'sch_order',
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
  const [projects, setProjects] = useState([{ id: 'proj_demo01', name: '订单中心' }])
  const [projectId, setProjectId] = useState('proj_demo01')
  const [schemas, setSchemas] = useState(MOCK_SCHEMAS)
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [currentId, setCurrentId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [text, setText] = useState(toText(MOCK_SCHEMAS[0].jsonSchema))
  const [checkResult, setCheckResult] = useState(null)
  const [example, setExample] = useState('')

  useEffect(() => applyTheme(rootRef.current), [])

  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== 'function') {
      setIsMock(true)
      setSchemas(MOCK_SCHEMAS)
      return
    }
    try {
      const loaded = await storage.getProject(id)
      if (loaded) {
        const list = Array.isArray(loaded.schemas) ? loaded.schemas : []
        setSchemas(list)
        setIsMock(false)
        const wanted = route.arg && list.find((s) => s.id === route.arg)
        if (wanted) pick(wanted)
      }
    } catch (err) {
      setError('加载项目失败：' + errText(err))
    }
  }

  useEffect(() => {
    const boot = async () => {
      if (storage && typeof storage.listProjects === 'function') {
        try {
          const list = await storage.listProjects()
          if (Array.isArray(list) && list.length > 0) {
            setProjects(list)
            setProjectId(list[0].id)
            await loadProject(list[0].id)
            return
          }
        } catch (err) {
          setError('加载项目列表失败：' + errText(err))
        }
      }
      setIsMock(true)
    }
    boot()
  }, [])

  const pick = (s) => {
    setCurrentId(s.id || '')
    setName(s.name || '')
    setDescription(s.description || '')
    setText(toText(s.jsonSchema))
    setCheckResult(null)
    setExample('')
    setNotice('')
    setError('')
  }

  const blank = () => {
    setCurrentId('')
    setName('新模型')
    setDescription('')
    setText(toText({ type: 'object', properties: {} }))
    setCheckResult(null)
    setExample('')
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
      }
    }
    const res = localValidateSchema(text)
    setCheckResult({
      ok: res.ok,
      message: res.ok ? '校验通过（本地降级校验：api.schema.validate 未提供）' : res.error,
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
      }
    }
    setExample(toText(localExampleFromSchema(parsed)))
  }

  const save = async () => {
    if (!storage || typeof storage.saveSchema !== 'function') {
      setError('当前桥未提供 api.storage.saveSchema')
      return
    }
    const parsed = localValidateSchema(text)
    if (!parsed.ok) {
      setError('保存前校验失败：' + parsed.error)
      return
    }
    setError('')
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

  const remove = async () => {
    if (!currentId) {
      setError('请先选中一个模型')
      return
    }
    if (!storage || typeof storage.deleteSchema !== 'function') {
      setError('当前桥未提供 api.storage.deleteSchema')
      return
    }
    setError('')
    try {
      await storage.deleteSchema(projectId, currentId)
      setNotice('已删除模型：' + currentId)
      blank()
      await loadProject(projectId)
    } catch (err) {
      setError('删除模型失败：' + errText(err))
    }
  }

  return (
    <div className="pp-scope pp-page" data-page="schema" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">数据模型</span>
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId}
            onChange={(e) => { setProjectId(e.target.value); loadProject(e.target.value) }}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
        </div>
      </div>
      <div className="pp-overview-content">
        <p className="pp-muted">
          {isMock ? '示例数据 — api.storage 不可用，以下为文件内 mock' : '数据来源：api.storage（saveSchema / deleteSchema）'}
        </p>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <p className="pp-muted">{notice}</p> : null}
  
        <div className="pp-debug-layout">
          <div className="pp-pane">
            <div className="pp-card-title">模型</div>
            <div className="pp-tree">
              {schemas.map((s) => (
                <div key={s.id} className="pp-tree-row" data-active={s.id === currentId ? 'true' : 'false'} onClick={() => pick(s)}>
                  <span className="pp-ellipsis">{s.name || s.id}</span>
                </div>
              ))}
            </div>
            {schemas.length === 0 ? <div className="pp-empty">暂无模型</div> : null}
            <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
              <button className="pp-btn pp-btn-sm" onClick={blank}>新建模型</button>
            </div>
          </div>
  
          <div className="pp-pane">
            <div className="pp-card-title">编辑</div>
            <div className="pp-form-grid" style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="pp-form-label">名称</label>
              <input className="pp-input" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="pp-form-label">说明</label>
              <input className="pp-input" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <textarea className="pp-json-editor" rows={14} value={text}
              onChange={(e) => { setText(e.target.value); setCheckResult(null) }} />
            <div className="pp-toolbar-inline" style={{ marginTop: 'var(--sp-3)' }}>
              <button className="pp-btn" onClick={validate}>校验</button>
              <button className="pp-btn" onClick={makeExample}>生成示例</button>
              <button className="pp-btn pp-btn-primary" onClick={save}>保存</button>
              <button className="pp-btn pp-btn-danger" onClick={remove}>删除</button>
            </div>
            {checkResult ? (
              <div className={checkResult.ok ? 'pp-note pp-note-ok' : 'pp-note pp-note-bad'} style={{ marginTop: 'var(--sp-3)' }}>
                {checkResult.ok ? '通过：' : '失败：'}{checkResult.message}
              </div>
            ) : null}
          </div>
  
          <div className="pp-pane">
            <div className="pp-card-title">示例数据</div>
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
