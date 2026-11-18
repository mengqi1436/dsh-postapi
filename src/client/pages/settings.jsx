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
  const [isMock, setIsMock] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    applyTheme(rootRef.current)
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
            if (loaded && loaded.settings) setSettings(normalizeSettings(loaded.settings))
          }
        }
      } catch (err) {
        setError('加载设置失败：' + errText(err))
      }
    }
    boot()
  }, [])

  const patch = (p) => { setSettings({ ...settings, ...p }); setNotice('') }

  // 主题/语言即时生效并写本地草稿（theme.js 既有机制）
  const applyThemeChoice = (value) => {
    setTheme(value)
    saveTheme(value)
    if (rootRef.current) rootRef.current.setAttribute('data-theme', value)
    setNotice('主题已切换：' + value)
  }
  const applyLocaleChoice = (value) => {
    setLocale(value)
    saveLocale(value)
    setNotice('语言已切换：' + value)
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
      <h1 className="pp-page-title">设置</h1>
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
          <div className="pp-form-row">
            <label className="pp-form-label">存储路径</label>
            <input className="pp-input pp-input-mono" style={{ flex: 1 }} readOnly value={storeRoot} />
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">主题</label>
            <select className="pp-select" value={theme} onChange={(e) => applyThemeChoice(e.target.value)}>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">语言</label>
            <select className="pp-select" value={locale} onChange={(e) => applyLocaleChoice(e.target.value)}>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="pp-note">
            存储根目录由 host 构造参数注入（createStorageService(basePath)），页面只读展示，不可修改。
          </div>
        </div>

        <div className="pp-pane">
          <div className="pp-card-title">项目设置</div>
          <div className="pp-form-row">
            <label className="pp-form-label">项目</label>
            <select className="pp-select" value={projectId}
              onChange={(e) => { setProjectId(e.target.value); reloadProject(e.target.value) }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">Mock 端口</label>
            <input className="pp-input pp-input-mono" style={{ width: '120px' }} value={settings.mockPort}
              onChange={(e) => patch({ mockPort: e.target.value })} />
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">代理</label>
            <input className="pp-input pp-input-mono" style={{ flex: 1 }} placeholder="http://127.0.0.1:7890（留空为直连）"
              value={settings.proxyUrl} onChange={(e) => patch({ proxyUrl: e.target.value })} />
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">超时 (ms)</label>
            <input className="pp-input pp-input-mono" style={{ width: '120px' }} value={settings.requestTimeoutMs}
              onChange={(e) => patch({ requestTimeoutMs: e.target.value })} />
          </div>
          <div className="pp-form-row">
            <label className="pp-form-label">历史条数</label>
            <input className="pp-input pp-input-mono" style={{ width: '120px' }} value={settings.historyLimit}
              onChange={(e) => patch({ historyLimit: e.target.value })} />
          </div>
          <button className="pp-btn pp-btn-primary" onClick={persist}>保存项目设置</button>
        </div>
      </div>

      <div className="pp-card" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="pp-card-title">协作（规划中）</div>
        <p className="pp-muted">
          成员管理与变更历史为 P2 占位：本插件无服务端，不做云端账号 / 团队同步 / 审计日志。
        </p>
      </div>
    </div>
  )
}
