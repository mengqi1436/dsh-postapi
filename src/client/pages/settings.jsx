// settings.jsx — 设置页（Apifox 工作台：表单行 + 只读存储路径 + 保存提示条）
// 自注册：模块求值期入队 __postapiQueue
// 存储路径由 host 构造参数注入（页面只读展示）；后四项经 api.storage.saveProjectSettings 落盘
// 视觉基线：docs/apifox-design-spec.md —— .pp-form-row / .pp-form-label / .pp-input / .pp-note-ok
import React, { useEffect, useRef, useState } from 'react'
import { applyTheme, readLocale, readTheme, saveLocale, saveTheme } from './theme.js'

;(window.__postapiQueue = window.__postapiQueue || []).push(['settings', SettingsPage]) // 注册表就绪前入队

const DEFAULT_STORE_ROOT = 'E:/User/文档/api'
const DEFAULT_SETTINGS = { mockPort: 4010, proxyUrl: '', requestTimeoutMs: 30000, historyLimit: 200 }

/** 项目设置规整：数字项转 number 并夹到合法区间，代理留空即无代理。 */
export function normalizeSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const num = (v, fallback) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }
  return {
    mockPort: Math.min(65535, Math.max(1, Math.round(num(src.mockPort, DEFAULT_SETTINGS.mockPort)))),
    proxyUrl: String(src.proxyUrl || ''),
    requestTimeoutMs: Math.max(1000, Math.round(num(src.requestTimeoutMs, DEFAULT_SETTINGS.requestTimeoutMs))),
    historyLimit: Math.max(1, Math.round(num(src.historyLimit, DEFAULT_SETTINGS.historyLimit))),
  }
}

/** 存储路径展示值：host 注入优先，其次本地草稿，最后契约默认值。 */
export function storeRootOf(injected) {
  if (typeof injected === 'string' && injected.trim()) return injected
  try {
    const draft = typeof localStorage !== 'undefined' ? localStorage.getItem('postapi.settings.storeRoot') : null
    return draft || DEFAULT_STORE_ROOT
  } catch {
    return DEFAULT_STORE_ROOT
  }
}

function errText(err) {
  return err && err.message ? err.message : String(err)
}

export function SettingsPage(props) {
  const rootRef = useRef(null)
  const api = (props && props.api) || (typeof window !== 'undefined' ? window.__postapiApi : undefined)
  const storage = api && api.storage
  const [projects, setProjects] = useState([{ id: 'proj_demo01', name: '订单中心' }])
  const [projectId, setProjectId] = useState('proj_demo01')
  const [storeRoot, setStoreRoot] = useState(() => storeRootOf(api && api.storeRoot))
  const [theme, setTheme] = useState(readTheme)
  const [locale, setLocale] = useState(readLocale)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  // 脏标记：与最近一次落盘/载入的规整结果比对，只有真的改过才允许保存
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(normalizeSettings(DEFAULT_SETTINGS)))
  const settingsKey = JSON.stringify(normalizeSettings(settings))
  const dirty = settingsKey !== savedSnapshot
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    applyTheme(rootRef.current)
  }, [])

  // storeRoot 经 /health 异步回填（installApi 拉取），挂载后短轮询等它到位；
  // 4s 内没等到就保持本地草稿/默认值，不再无限轮询。
  useEffect(() => {
    if (api && typeof api.storeRoot === 'string' && api.storeRoot.trim()) return undefined
    let tries = 0
    const id = setInterval(() => {
      tries += 1
      const value = api && api.storeRoot
      if (typeof value === 'string' && value.trim()) {
        setStoreRoot(value)
        clearInterval(id)
        return
      }
      if (tries > 20) clearInterval(id)
    }, 200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== 'function') return
      try {
        const list = await storage.listProjects()
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list)
          setProjectId(list[0].id)
          setIsMock(false)
          if (typeof storage.getProject === 'function') {
            const loaded = await storage.getProject(list[0].id)
            if (loaded && loaded.settings) {
              const payload = normalizeSettings(loaded.settings)
              setSettings(payload)
              setSavedSnapshot(JSON.stringify(payload))
            }
          }
        }
      } catch (err) {
        setError('加载设置失败：' + errText(err))
      }
    }
    boot()
  }, [])

  const patch = (p) => { setSettings({ ...settings, ...p }); setNotice('') }

  // 主题/语言即时生效并写本地草稿（theme.js 既有机制）；提示显示用户所选 label
  const applyThemeChoice = (value) => {
    setTheme(value)
    saveTheme(value)
    if (rootRef.current) rootRef.current.setAttribute('data-theme', value)
    setNotice('主题已切换：' + (value === 'dark' ? '深色' : '浅色'))
  }
  const applyLocaleChoice = (value) => {
    setLocale(value)
    saveLocale(value)
    setNotice('语言已切换：' + (value === 'zh-CN' ? '简体中文' : 'English'))
  }

  const persist = async () => {
    if (!storage || typeof storage.saveProjectSettings !== 'function') {
      setError('当前桥未提供 api.storage.saveProjectSettings，设置仅保存在页面内')
      return
    }
    setError('')
    try {
      const payload = normalizeSettings(settings)
      await storage.saveProjectSettings(projectId, payload)
      setSettings(payload)
      setSavedSnapshot(JSON.stringify(payload))
      setNotice('已保存项目设置')
    } catch (err) {
      setError('保存设置失败：' + errText(err))
    }
  }

  const reloadProject = async (id) => {
    if (!storage || typeof storage.getProject !== 'function') {
      setError('当前桥未提供 api.storage.getProject')
      return
    }
    setError('')
    try {
      const loaded = await storage.getProject(id)
      if (loaded) setSettings(normalizeSettings(loaded.settings))
      setNotice('已载入项目设置')
    } catch (err) {
      setError('载入设置失败：' + errText(err))
    }
  }

  return (
    <div className="pp-scope pp-page" data-page="settings" ref={rootRef}>
      <div className="pp-overview-head">
        <span className="pp-overview-title">设置</span>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock
              ? '示例数据 — api.storage 不可用，项目设置项为文件内默认值'
              : '数据来源：api.storage（getProject / saveProjectSettings）'}
          </span>
        </div>
        {error ? <p className="pp-error-text">{error}</p> : null}
        {notice ? <div className="pp-note pp-note-ok">{notice}</div> : null}

        <div className="pp-cols-2">
          <div className="pp-pane">
            <div className="pp-card-title">外观与存储</div>
            <div className="pp-meta" style={{ marginBottom: 'var(--sp-3)' }}>
              主题 / 语言选择即生效；存储路径由 host 注入只读。项目设置（右侧）需保存落盘。
            </div>
            <div className="pp-form-row">
              <label className="pp-form-label">存储路径</label>
              <input className="pp-input pp-input-mono" readOnly value={storeRoot} />
            </div>
            <div className="pp-form-grid">
              <label className="pp-form-label">主题</label>
              <select className="pp-select" value={theme} onChange={(e) => applyThemeChoice(e.target.value)}>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
              <label className="pp-form-label">语言</label>
              <select className="pp-select" value={locale} onChange={(e) => applyLocaleChoice(e.target.value)}>
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="pp-note" style={{ marginTop: 'var(--sp-3)' }}>
              存储根目录由 host 构造参数注入（createStorageService(basePath)），页面只读展示，不可修改。
            </div>
          </div>
  
          <div className="pp-pane">
            <div className="pp-card-title">项目设置</div>
            <div className="pp-form-grid">
              <label className="pp-form-label">项目</label>
              <select className="pp-select" value={projectId}
                onChange={(e) => { setProjectId(e.target.value); reloadProject(e.target.value) }}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
              </select>
              <label className="pp-form-label">Mock 端口</label>
              <input className="pp-input pp-input-mono" inputMode="numeric" value={settings.mockPort}
                onBlur={() => patch(normalizeSettings(settings))}
                onChange={(e) => patch({ mockPort: e.target.value })} />
              <label className="pp-form-label">代理</label>
              <input className="pp-input pp-input-mono" placeholder="http://127.0.0.1:7890（留空为直连）"
                value={settings.proxyUrl} onChange={(e) => patch({ proxyUrl: e.target.value })} />
              <label className="pp-form-label">超时 (ms)</label>
              <input className="pp-input pp-input-mono" inputMode="numeric" value={settings.requestTimeoutMs}
                onBlur={() => patch(normalizeSettings(settings))}
                onChange={(e) => patch({ requestTimeoutMs: e.target.value })} />
              <label className="pp-form-label">历史条数</label>
              <input className="pp-input pp-input-mono" inputMode="numeric" value={settings.historyLimit}
                onBlur={() => patch(normalizeSettings(settings))}
                onChange={(e) => patch({ historyLimit: e.target.value })} />
            </div>
            {/* 保存动作收进它实际作用的面板：带未保存标记，不再与即改即存的外观项混在页头 */}
            <div className="pp-form-actions">
              {dirty ? <span className="pp-pill pp-pill-warn">未保存</span> : null}
              <button className="pp-btn pp-btn-primary" onClick={persist} disabled={!dirty}>保存项目设置</button>
            </div>
          </div>
        </div>
  
        <div className="pp-card">
          <div className="pp-card-title">协作（规划中）</div>
          <p className="pp-muted">
            成员管理与变更历史为 P2 占位：本插件无服务端，不做云端账号 / 团队同步 / 审计日志。
          </p>
        </div>
      
      </div>
    </div>
  )
}
