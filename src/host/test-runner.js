/**
 * 自动化测试执行：契约 §4 createTestRunner。
 * runCase 跑单用例；runScenario 跑多步骤场景，步骤间用 extract 提取的局部变量传递。
 * 断言来源两处：endpoint.postProcessors 里 type=assert 的内置断言 + 用例自带 assertions。
 */
import { pickValue } from './request.js'

function endpointAssertions(endpoint) {
  const out = []
  const list = Array.isArray(endpoint.postProcessors) ? endpoint.postProcessors : []
  for (const p of list) {
    if (!p || p.enabled === false || p.type !== 'assert') continue
    for (const a of Array.isArray(p.assertions) ? p.assertions : []) out.push(a)
  }
  return out
}

function firstScript(processors) {
  const list = Array.isArray(processors) ? processors : []
  for (const p of list) {
    if (p && p.enabled !== false && p.type === 'script' && p.code) return String(p.code)
  }
  return ''
}

function extractAll(res, extractors) {
  const out = {}
  for (const ex of Array.isArray(extractors) ? extractors : []) {
    if (!ex || !ex.name) continue
    const v = pickValue(res, ex.source || 'body', ex.path)
    if (v !== undefined) out[String(ex.name)] = v
  }
  return out
}

export function createTestRunner({ storage, request } = {}) {
  function defaultEnv(project) {
    const envs = Array.isArray(project.environments) ? project.environments : []
    return envs.find((e) => e && e.isDefault) || envs[0] || null
  }

  function endpointOf(project, endpointId) {
    const list = Array.isArray(project.endpoints) ? project.endpoints : []
    return list.find((e) => e && String(e.id) === String(endpointId)) || null
  }

  /** endpoint + override 合并成 request.send 参数；local 为场景内累积变量。 */
  function buildSendOptions(project, endpoint, override, local) {
    const merged = { ...endpoint, ...(override && typeof override === 'object' ? override : {}) }
    const settings = project.settings && typeof project.settings === 'object' ? project.settings : {}
    return {
      method: merged.method,
      url: merged.url,
      params: merged.params,
      headers: merged.headers,
      body: merged.body,
      auth: merged.auth,
      variables: { globals: project.globals, environment: defaultEnv(project), local },
      timeoutMs: Number(settings.requestTimeoutMs) || 30000,
      assertions: endpointAssertions(endpoint),
      preScript: firstScript(endpoint.preProcessors),
      postScript: firstScript(endpoint.postProcessors),
    }
  }

  function verdict(res, extra) {
    const results = [...((res && res.tests) || []), ...(extra || [])]
    const error = res && res.error ? `${res.error.kind}: ${res.error.message}` : undefined
    return { results, error, passed: results.every((r) => r.passed) && !res.error }
  }

  async function runCase(projectId, caseId) {
    const started = Date.now()
    const project = await storage.getProject(projectId)
    // 用例落点：project.testCases 优先，回落 project.settings.testCases
    // （test 页把用例与场景写在 settings 里，运行器必须两处都能读到，否则运行按钮永远报「用例不存在」）
    const tcPool = Array.isArray(project.testCases) && project.testCases.length > 0
      ? project.testCases
      : (Array.isArray(project.settings && project.settings.testCases) ? project.settings.testCases : [])
    const tc = tcPool.find((c) => c && String(c.id) === String(caseId))
    if (!tc) throw new Error(`test case not found: ${caseId}`)
    const endpoint = endpointOf(project, tc.endpointId)
    if (!endpoint) throw new Error(`endpoint not found: ${tc.endpointId}`)
    const options = buildSendOptions(project, endpoint, tc.override, {})
    if (Array.isArray(tc.assertions)) options.assertions = [...options.assertions, ...tc.assertions]
    const res = await request.send(options)
    const { results, passed } = verdict(res)
    return {
      caseId,
      passed,
      results,
      extracted: extractAll(res, tc.extractors),
      durationMs: Date.now() - started,
    }
  }

  async function runScenario(projectId, scenarioId) {
    const started = Date.now()
    const project = await storage.getProject(projectId)
    const tsPool = Array.isArray(project.testScenarios) && project.testScenarios.length > 0
      ? project.testScenarios
      : (Array.isArray(project.settings && project.settings.testScenarios) ? project.settings.testScenarios : [])
    const ts = tsPool.find((s) => s && String(s.id) === String(scenarioId))
    if (!ts) throw new Error(`test scenario not found: ${scenarioId}`)
    const local = {}
    const steps = []
    for (const step of Array.isArray(ts.steps) ? ts.steps : []) {
      const stepId = step && step.id ? String(step.id) : `step_${steps.length + 1}`
      const name = (step && step.name) || stepId
      const endpoint = step ? endpointOf(project, step.endpointId) : null
      if (!endpoint) {
        steps.push({ id: stepId, name, status: 0, passed: false, extracted: {}, error: `endpoint not found: ${step && step.endpointId}` })
        continue
      }
      // 局部变量按值快照传入，避免后续步骤写入影响已发出的请求
      const res = await request.send(buildSendOptions(project, endpoint, step.override, { ...local }))
      const extracted = extractAll(res, step.extract)
      Object.assign(local, extracted)
      const { results, passed, error } = verdict(res)
      steps.push({ id: stepId, name, status: res.status, passed, extracted, results, error })
    }
    return { scenarioId, passed: steps.every((s) => s.passed), steps, durationMs: Date.now() - started }
  }

  return { runCase, runScenario }
}
