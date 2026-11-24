// settings.jsx — 项目设置页（对齐 Apifox 2.8.55「项目设置」分组表单：
//   基础信息 / 请求设置 / Mock 设置 / 数据目录，每组一张卡，行式表单 + 只读存储路径）
// 自注册：模块求值期入队 __postapiQueue
// 存储路径由 host 构造参数注入（页面只读展示）；其余设置经 api.storage.saveProjectSettings 落盘
// Apifox 取证（.research/apifox/app/dist/renderer/33943.aff16685.async.js + async_panel_settings.b8c96200.css）：
//   .formItem-LC5_OA 行间距 16、.title-BHDEFI 组标题 14/500、.description-wJZyFP 组说明 14 次级色，
//   每组是「标题 → 说明 → 若干表单行」；本插件契约 §2 settings 只有四项，故其余组以「规划中」标注。
// 视觉基线：docs/apifox-visual-parity-spec.md —— .pp-form-row / .pp-form-label / .pp-input / .pp-note-ok
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
  // 默认态：项目列表为空、当前项目为空（用户自己选）
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  // 存储根目录：props.storeRoot（宿主注入）优先，其次 api.storeRoot，最后契约默认值
  const [storeRoot] = useState(() => storeRootOf((props && props.storeRoot) || (api && api.storeRoot)))
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
        } else {
          setIsMock(false)
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
    setNotice('')
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
    setNotice('')
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
        <div className="pp-overview-actions">
          <label className="pp-meta">项目</label>
          <select className="pp-select" value={projectId}
            onChange={(e) => { const v = e.target.value; setProjectId(v); reloadProject(v) }}>
            <option value="">{projects.length ? '请选择项目' : '暂无项目'}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <button className="pp-btn pp-btn-primary" onClick={persist}>保存项目设置</button>
        </div>
      </div>
      <div className="pp-overview-content">
        <div className="pp-toolbar">
          <span className="pp-meta">
            {isMock
              ? '示例数据 — api.storage 不可用，项目设置项为文件内默认值'
              : '数据来源：api.storage（getProject / saveProjectSettings）'}
          </span>
          <span className="pp-toolbar-spacer" />
          <span className="pp-meta">{projectId ? '当前项目：' + projectId : '未选择项目'}</span>
        </div>
        {error ? <div className="pp-note pp-note-bad">{error}</div> : null}
        {notice ? <div className="pp-note pp-note-ok">{notice}</div> : null}

        <div className="pp-cols-2">
          {/* 组 1：基础信息（外观 + 语言，本地草稿，不落项目文件） */}
          <div className="pp-pane">
            <div className="pp-card-title">基础信息</div>
            <p className="pp-meta" style={{ marginTop: 0 }}>外观与语言存在本机草稿（localStorage），不随项目文件同步</p>
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
            <div className="pp-form-row">
              <label className="pp-form-label">项目</label>
              <span className="pp-meta">{projectId || '（未选择项目）'}</span>
            </div>
          </div>

          {/* 组 2：请求设置（超时 + 代理 + 历史条数，落 project.settings） */}
          <div className="pp-pane">
            <div className="pp-card-title">请求设置</div>
            <p className="pp-meta" style={{ marginTop: 0 }}>发送请求时的超时、代理与历史保留条数</p>
            <div className="pp-form-row">
              <label className="pp-form-label">超时 (ms)</label>
              <input className="pp-input pp-input-mono" value={settings.requestTimeoutMs}
                onChange={(e) => patch({ requestTimeoutMs: e.target.value })} />
            </div>
            <div className="pp-form-row">
              <label className="pp-form-label">代理</label>
              <input className="pp-input pp-input-mono" placeholder="http://127.0.0.1:7890（留空为直连）"
                value={settings.proxyUrl} onChange={(e) => patch({ proxyUrl: e.target.value })} />
            </div>
            <div className="pp-form-row">
              <label className="pp-form-label">历史条数</label>
              <input className="pp-input pp-input-mono" value={settings.historyLimit}
                onChange={(e) => patch({ historyLimit: e.target.value })} />
            </div>
          </div>

          {/* 组 3：Mock 设置（端口，落 project.settings.mockPort） */}
          <div className="pp-pane">
            <div className="pp-card-title">Mock 设置</div>
            <p className="pp-meta" style={{ marginTop: 0 }}>本地 Mock 服务监听端口（1~65535），保存后下次启动生效</p>
            <div className="pp-form-row">
              <label className="pp-form-label">Mock 端口</label>
              <input className="pp-input pp-input-mono" value={settings.mockPort}
                onChange={(e) => patch({ mockPort: e.target.value })} />
            </div>
            <div className="pp-form-row">
              <label className="pp-form-label">Mock 地址</label>
              <span className="pp-mono pp-ellipsis">
                {'http://127.0.0.1:' + normalizeSettings(settings).mockPort + '/mock/' + (projectId || '<projectId>')}
              </span>
            </div>
          </div>

          {/* 组 4：数据目录（host 注入只读） */}
          <div className="pp-pane">
            <div className="pp-card-title">数据目录</div>
            <p className="pp-meta" style={{ marginTop: 0 }}>存储根目录由 host 构造参数注入（createStorageService(basePath)），页面只读展示</p>
            <div className="pp-form-row">
              <label className="pp-form-label">存储路径</label>
              <input className="pp-input pp-input-mono" style={{ flex: 1 }} readOnly value={storeRoot} />
            </div>
            <div className="pp-form-row">
              <label className="pp-form-label">项目文件</label>
              <span className="pp-mono pp-ellipsis">
                {storeRoot + '/' + (projectId || '<projectId>') + '/project.json'}
              </span>
            </div>
          </div>
        </div>

        <div className="pp-card" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="pp-card-title">协作（规划中）</div>
          <p className="pp-muted">
            成员管理、变更历史与审计日志为 P2 占位：本插件无服务端，不做云端账号 / 团队同步 / 审计日志。
          </p>
        </div>
      </div>
    </div>
  )
}
