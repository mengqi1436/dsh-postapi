/**
 * PostAPI 客户端文案字典：zh 为 key-set 的事实来源（官方 sidebar-files 惯例），
 * en 与 zh 键集逐项对齐；注册于 'postapi' 命名空间。
 */
export const POSTAPI_NS = 'postapi'

/** 简体中文字典（键集事实来源）。 */
export const zh = {
  'type.label': 'PostAPI',
  'guide.title': '打开 PostAPI',
  'guide.description': '接口设计、调试、Mock、测试与文档',
  'nav.overview': '总览',
  'nav.doc': '文档',
  'nav.debug': '调试',
  'nav.mock': 'Mock',
  'nav.schema': '数据模型',
  'nav.env': '环境',
  'nav.history': '历史',
  'nav.test': '测试',
  'nav.import': '导入导出',
  'nav.flow': '流程图',
  'nav.search': '搜索',
  'nav.settings': '设置',
  'placeholder.title': '页面未注册',
  'placeholder.body': '该页面尚未注册：页面由 src/client/pages/ 自注册（window.__postapiPages.register）。',
  'placeholder.hint': '页面注册后此处渲染对应内容。',
  'api.missing': 'postapi.storage / postapi.request 桥尚未连通，当前为内存桩。',
}

/** 英文字典，键集与 zh 完全一致。 */
export const en = {
  'type.label': 'PostAPI',
  'guide.title': 'Open PostAPI',
  'guide.description': 'API design, debug, mock, test and docs',
  'nav.overview': 'Overview',
  'nav.doc': 'Doc',
  'nav.debug': 'Debug',
  'nav.mock': 'Mock',
  'nav.schema': 'Schemas',
  'nav.env': 'Envs',
  'nav.history': 'History',
  'nav.test': 'Tests',
  'nav.import': 'Import/Export',
  'nav.flow': 'Flow',
  'nav.search': 'Search',
  'nav.settings': 'Settings',
  'placeholder.title': 'Page not registered',
  'placeholder.body': 'This page is not registered yet: pages self-register from src/client/pages/ (window.__postapiPages.register).',
  'placeholder.hint': 'The page renders here once registered.',
  'api.missing': 'postapi.storage / postapi.request bridge not reachable; using the in-memory stub.',
}
