window.__ModuleLoader__.load({
  id: 'dsh-postapi',
  factory(require) {
    var module = { exports: {} };
    var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/jsx-shim.js
var import_react = require("react");

// src/client/index.js
var import_react18 = require("react");

// src/client/shell/definition.js
var import_react2 = require("react");

// src/client/shell/locales.js
var POSTAPI_NS = "postapi";
var zh = {
  "type.label": "PostAPI",
  "guide.title": "\u6253\u5F00 PostAPI",
  "guide.description": "\u63A5\u53E3\u8BBE\u8BA1\u3001\u8C03\u8BD5\u3001Mock\u3001\u6D4B\u8BD5\u4E0E\u6587\u6863",
  "nav.overview": "\u603B\u89C8",
  "nav.doc": "\u6587\u6863",
  "nav.debug": "\u8C03\u8BD5",
  "nav.mock": "Mock",
  "nav.schema": "\u6570\u636E\u6A21\u578B",
  "nav.env": "\u73AF\u5883",
  "nav.history": "\u5386\u53F2",
  "nav.test": "\u6D4B\u8BD5",
  "nav.import": "\u5BFC\u5165\u5BFC\u51FA",
  "nav.flow": "\u6D41\u7A0B\u56FE",
  "nav.search": "\u641C\u7D22",
  "nav.settings": "\u8BBE\u7F6E",
  "placeholder.title": "\u9875\u9762\u672A\u6CE8\u518C",
  "placeholder.body": "\u8BE5\u9875\u9762\u5C1A\u672A\u6CE8\u518C\uFF1A\u9875\u9762\u7531 src/client/pages/ \u81EA\u6CE8\u518C\uFF08window.__postapiPages.register\uFF09\u3002",
  "placeholder.hint": "\u9875\u9762\u6CE8\u518C\u540E\u6B64\u5904\u6E32\u67D3\u5BF9\u5E94\u5185\u5BB9\u3002",
  "api.missing": "postapi.storage / postapi.request \u6865\u5C1A\u672A\u8FDE\u901A\uFF0C\u5F53\u524D\u4E3A\u5185\u5B58\u6869\u3002"
};
var en = {
  "type.label": "PostAPI",
  "guide.title": "Open PostAPI",
  "guide.description": "API design, debug, mock, test and docs",
  "nav.overview": "Overview",
  "nav.doc": "Doc",
  "nav.debug": "Debug",
  "nav.mock": "Mock",
  "nav.schema": "Schemas",
  "nav.env": "Envs",
  "nav.history": "History",
  "nav.test": "Tests",
  "nav.import": "Import/Export",
  "nav.flow": "Flow",
  "nav.search": "Search",
  "nav.settings": "Settings",
  "placeholder.title": "Page not registered",
  "placeholder.body": "This page is not registered yet: pages self-register from src/client/pages/ (window.__postapiPages.register).",
  "placeholder.hint": "The page renders here once registered.",
  "api.missing": "postapi.storage / postapi.request bridge not reachable; using the in-memory stub."
};

// src/client/shell/definition.js
var POSTAPI_ID = "postapi";
var POSTAPI_KIND = "postapi";
function PostApiIcon(props) {
  const s = props && props.size || 16;
  return (0, import_react2.createElement)("svg", {
    viewBox: "0 0 64 64",
    width: s,
    height: s,
    "aria-hidden": true,
    style: { display: "block" }
  }, (0, import_react2.createElement)("path", { d: "M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z", fill: "currentColor" }));
}
function postapiDefinition(t) {
  return {
    id: POSTAPI_ID,
    kind: POSTAPI_KIND,
    keepMounted: true,
    // 页类型（无 patterns），priority 不参与路由排序；显式写 'extension' 与 db-tool 一致。
    priority: "extension",
    title: () => t("type.label"),
    guide: [{
      // guide 条目 id 与类型 id 一致（db-tool 同款）：空态入口卡片按它打开本页签。
      id: POSTAPI_ID,
      order: 10,
      title: () => t("guide.title"),
      description: () => t("guide.description"),
      // icon 是 React 组件；缺它时官方 guide 只画立方体占位图。
      icon: PostApiIcon
    }]
  };
}

// src/client/shell/Body.js
var import_react3 = require("react");

// src/client/shell/registry.js
var pages = /* @__PURE__ */ new Map();
var pageRegistry = {
  register(name, component) {
    pages.set(name, component);
  },
  get(name) {
    return pages.get(name);
  },
  has(name) {
    return pages.has(name);
  },
  names() {
    return [...pages.keys()];
  }
};
function ensureGlobals() {
  if (typeof window === "undefined") return;
  window.__postapiPages = pageRegistry;
  const queued = window.__postapiQueue;
  if (Array.isArray(queued)) {
    for (const entry of queued.splice(0)) pageRegistry.register(entry[0], entry[1]);
  }
}
var BRIDGE_BASE = "/dsh-postapi/api";
async function bridgeCall(path, init) {
  const res = await fetch(BRIDGE_BASE + path, init);
  if (!res.ok) throw new Error("postapi bridge: HTTP " + res.status + " " + path);
  const payload = await res.json();
  if (!payload || payload.ok !== true) {
    const reason = payload && payload.error && payload.error.message ? payload.error.message : "\u54CD\u5E94\u7F3A\u5C11 ok:true";
    throw new Error("postapi bridge: " + reason + " (" + path + ")");
  }
  return payload.data;
}
function bridgePost(path, body) {
  return bridgeCall(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
}
function bridgeGet(path, query) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== void 0 && v !== null && v !== "") qs.set(k, String(v));
  }
  const tail = qs.toString();
  return bridgeCall(path + (tail ? "?" + tail : ""));
}
function createBridgeStorage() {
  const post = (method, body) => bridgePost("/storage/" + method, body);
  return {
    // 既有 9 方法（签名保持不变）
    listProjects: () => bridgeCall("/storage/listProjects"),
    createProject: (name) => post("createProject", { name }),
    renameProject: (id, name) => post("renameProject", { id, name }),
    deleteProject: (id) => post("deleteProject", { id }),
    getProject: (id) => post("getProject", { id }),
    saveEndpoint: (projectId, endpoint) => post("saveEndpoint", { projectId, endpoint }),
    deleteEndpoint: (projectId, endpointId) => post("deleteEndpoint", { projectId, endpointId }),
    saveFolder: (projectId, folder) => post("saveFolder", { projectId, folder }),
    deleteFolder: (projectId, folderId) => post("deleteFolder", { projectId, folderId }),
    // 契约 §3 新增
    moveNode: (projectId, node) => post("moveNode", { projectId, ...node ?? {} }),
    saveSchema: (projectId, schema) => post("saveSchema", { projectId, schema }),
    deleteSchema: (projectId, schemaId) => post("deleteSchema", { projectId, schemaId }),
    saveEnvironment: (projectId, environment) => post("saveEnvironment", { projectId, environment }),
    deleteEnvironment: (projectId, envId) => post("deleteEnvironment", { projectId, envId }),
    saveGlobals: (projectId, globals) => post("saveGlobals", { projectId, globals }),
    saveProjectSettings: (projectId, settings) => post("saveProjectSettings", { projectId, settings }),
    saveFlow: (projectId, flow) => post("saveFlow", { projectId, flow }),
    saveResponse: (projectId, endpointId, response) => post("saveResponse", { projectId, endpointId, response }),
    deleteResponse: (projectId, endpointId, responseId) => post("deleteResponse", { projectId, endpointId, responseId }),
    getHistory: (projectId) => bridgeGet("/storage/getHistory", { projectId }),
    appendHistory: (projectId, entry) => post("appendHistory", { projectId, entry }),
    clearHistory: (projectId) => post("clearHistory", { projectId }),
    search: (projectId, keyword) => bridgeGet("/storage/search", { projectId, keyword })
  };
}
function createBridgeRequest() {
  return {
    send: (opts) => bridgePost("/request/send", opts ?? {}),
    preview: (opts) => bridgePost("/request/preview", opts ?? {})
  };
}
function createBridgeServices() {
  const post = bridgePost;
  return {
    script: { run: (code, options) => post("/script/run", { code, ...options ?? {} }) },
    mock: {
      start: (port) => post("/mock/start", { port }),
      stop: () => post("/mock/stop", {}),
      status: () => post("/mock/status", {})
    },
    schema: {
      example: (opts) => post("/schema/example", opts ?? {}),
      validate: (opts) => post("/schema/validate", opts ?? {})
    },
    import: {
      openapi: (json) => post("/import/openapi", { json }),
      postman: (json) => post("/import/postman", { json }),
      har: (json) => post("/import/har", { json }),
      curl: (text) => post("/import/curl", { text })
    },
    export: {
      openapi: (project) => post("/export/openapi", { project }),
      postman: (project) => post("/export/postman", { project }),
      har: (project) => post("/export/har", { project }),
      markdown: (project) => post("/export/markdown", { project })
    },
    codegen: { run: (opts) => post("/codegen/run", opts ?? {}) },
    test: {
      runCase: (projectId, caseId) => post("/test/runCase", { projectId, caseId }),
      runScenario: (projectId, scenarioId) => post("/test/runScenario", { projectId, scenarioId })
    },
    db: {
      test: (opts) => post("/db/test", opts ?? {}),
      query: (opts) => post("/db/query", opts ?? {}),
      close: (opts) => post("/db/close", opts ?? {})
    }
  };
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function makeId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
}
function emptyProject(id, name) {
  return {
    id,
    name,
    description: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    schemaVersion: 2,
    folders: [],
    endpoints: [],
    schemas: [],
    environments: [],
    globals: { variables: [] },
    mocks: [],
    testCases: [],
    testScenarios: [],
    flow: { name: "", steps: [] },
    settings: { mockPort: 4010, proxyUrl: "", requestTimeoutMs: 3e4, historyLimit: 200 }
  };
}
function upsert(list, item, prefix) {
  const ts = nowIso();
  if (item && item.id) {
    const at = list.findIndex((x) => x.id === item.id);
    const merged = { ...at >= 0 ? list[at] : { createdAt: ts }, ...item, updatedAt: ts };
    if (at >= 0) list[at] = merged;
    else list.push(merged);
    return merged;
  }
  const created = { ...item, id: makeId(prefix), createdAt: ts, updatedAt: ts };
  list.push(created);
  return created;
}
function createStubStorage() {
  const projects = /* @__PURE__ */ new Map();
  const history = /* @__PURE__ */ new Map();
  const project = (id) => projects.get(id);
  const clone = (v) => v === void 0 ? void 0 : structuredClone(v);
  return {
    listProjects() {
      return [...projects.values()].map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt })).sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
    },
    createProject(name) {
      const created = emptyProject(makeId("proj_"), String(name ?? "\u65B0\u9879\u76EE"));
      projects.set(created.id, created);
      return clone(created);
    },
    renameProject(id, name) {
      const p = project(id);
      if (p) {
        p.name = String(name ?? p.name);
        p.updatedAt = nowIso();
      }
      return clone(p);
    },
    deleteProject(id) {
      projects.delete(id);
      history.delete(id);
    },
    getProject(id) {
      return clone(project(id));
    },
    saveEndpoint(projectId, endpoint) {
      const p = project(projectId);
      if (!p) return void 0;
      p.updatedAt = nowIso();
      return clone(upsert(p.endpoints, endpoint ?? {}, "ep_"));
    },
    deleteEndpoint(projectId, endpointId) {
      const p = project(projectId);
      if (!p) return void 0;
      p.endpoints = p.endpoints.filter((e) => e.id !== endpointId);
      p.updatedAt = nowIso();
      return { id: endpointId };
    },
    saveFolder(projectId, folder) {
      const p = project(projectId);
      if (!p) return void 0;
      p.updatedAt = nowIso();
      return clone(upsert(p.folders, folder ?? {}, "fld_"));
    },
    deleteFolder(projectId, folderId) {
      const p = project(projectId);
      if (!p) return void 0;
      p.folders = p.folders.filter((f) => f.id !== folderId);
      for (const e of p.endpoints) if (e.folderId === folderId) e.folderId = null;
      for (const f of p.folders) if (f.parentId === folderId) f.parentId = null;
      p.updatedAt = nowIso();
      return { id: folderId };
    },
    moveNode(projectId, node) {
      const p = project(projectId);
      if (!p) return void 0;
      const { kind, id, parentId = null, order } = node ?? {};
      const list = kind === "folder" ? p.folders : p.endpoints;
      const hit = list.find((x) => x.id === id);
      if (!hit) return void 0;
      if (kind === "folder") hit.parentId = parentId;
      else hit.folderId = parentId;
      if (order !== void 0) hit.order = order;
      p.updatedAt = nowIso();
      return clone(hit);
    },
    saveSchema(projectId, schema) {
      const p = project(projectId);
      if (!p) return void 0;
      p.updatedAt = nowIso();
      return clone(upsert(p.schemas, schema ?? {}, "sch_"));
    },
    deleteSchema(projectId, schemaId) {
      const p = project(projectId);
      if (!p) return void 0;
      p.schemas = p.schemas.filter((s) => s.id !== schemaId);
      p.updatedAt = nowIso();
      return { id: schemaId };
    },
    saveEnvironment(projectId, environment) {
      const p = project(projectId);
      if (!p) return void 0;
      p.updatedAt = nowIso();
      return clone(upsert(p.environments, environment ?? {}, "env_"));
    },
    deleteEnvironment(projectId, envId) {
      const p = project(projectId);
      if (!p) return void 0;
      p.environments = p.environments.filter((e) => e.id !== envId);
      p.updatedAt = nowIso();
      return { id: envId };
    },
    saveGlobals(projectId, globals) {
      const p = project(projectId);
      if (!p) return void 0;
      p.globals = { variables: [], ...globals ?? {} };
      p.updatedAt = nowIso();
      return clone(p.globals);
    },
    saveProjectSettings(projectId, settings) {
      const p = project(projectId);
      if (!p) return void 0;
      p.settings = { ...p.settings, ...settings ?? {} };
      p.updatedAt = nowIso();
      return clone(p.settings);
    },
    saveFlow(projectId, flow) {
      const p = project(projectId);
      if (!p) return void 0;
      p.flow = { name: "", steps: [], ...flow ?? {} };
      p.updatedAt = nowIso();
      return clone(p.flow);
    },
    saveResponse(projectId, endpointId, response) {
      const p = project(projectId);
      if (!p) return void 0;
      const ep = p.endpoints.find((e) => e.id === endpointId);
      if (!ep) return void 0;
      ep.responses = Array.isArray(ep.responses) ? ep.responses : [];
      p.updatedAt = nowIso();
      return clone(upsert(ep.responses, response ?? {}, "res_"));
    },
    deleteResponse(projectId, endpointId, responseId) {
      const p = project(projectId);
      if (!p) return void 0;
      const ep = p.endpoints.find((e) => e.id === endpointId);
      if (ep && Array.isArray(ep.responses)) ep.responses = ep.responses.filter((r) => r.id !== responseId);
      p.updatedAt = nowIso();
      return { id: responseId };
    },
    getHistory(projectId) {
      return { entries: clone(history.get(projectId) || []) };
    },
    appendHistory(projectId, entry) {
      const p = project(projectId);
      const limit = p && p.settings && p.settings.historyLimit || 200;
      const list = history.get(projectId) || [];
      const created = { id: makeId("his_"), at: nowIso(), ...entry ?? {} };
      list.unshift(created);
      history.set(projectId, list.slice(0, limit));
      return clone(created);
    },
    clearHistory(projectId) {
      const n = (history.get(projectId) || []).length;
      history.set(projectId, []);
      return { cleared: n };
    },
    search(projectId, keyword) {
      const p = project(projectId);
      const kw = String(keyword ?? "").toLowerCase();
      if (!p || kw === "") return { endpoints: [], schemas: [], folders: [] };
      const hit = (obj, fields) => fields.some((f) => String(obj[f] ?? "").toLowerCase().includes(kw));
      return {
        endpoints: clone(p.endpoints.filter((e) => hit(e, ["name", "url", "description"]))),
        schemas: clone(p.schemas.filter((s) => hit(s, ["name", "description"]))),
        folders: clone(p.folders.filter((f) => hit(f, ["name"])))
      };
    }
  };
}
function createStubRequest() {
  return async function send(opts = {}) {
    const { method = "GET", url = "", params, headers, body, auth, timeoutMs = 3e4 } = opts;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const finalUrl = new URL(url, typeof location !== "undefined" ? location.href : "http://localhost/");
      for (const { key, value, enabled = true } of params ?? []) {
        if (enabled && key) finalUrl.searchParams.set(String(key), String(value ?? ""));
      }
      const h = new Headers();
      for (const { key, value, enabled = true } of headers ?? []) {
        if (enabled && key) h.set(String(key), String(value ?? ""));
      }
      let bodyText;
      if (body && body.type !== "none" && method !== "GET" && method !== "HEAD") {
        if (body.type === "json") {
          bodyText = body.content ?? "";
          if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
        } else if (body.type === "form") {
          bodyText = body.content ?? "";
          if (!h.has("Content-Type")) h.set("Content-Type", "application/x-www-form-urlencoded");
        } else {
          bodyText = body.content ?? "";
        }
      }
      if (auth?.type === "bearer" && auth.token) h.set("Authorization", "Bearer " + auth.token);
      if (auth?.type === "basic" && auth.username !== void 0) {
        h.set("Authorization", "Basic " + btoa(auth.username + ":" + (auth.password ?? "")));
      }
      const res = await fetch(finalUrl.toString(), { method, headers: h, body: bodyText, signal: controller.signal });
      const text = await res.text();
      return {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
        bodySize: text.length,
        timeMs: Date.now() - started
      };
    } catch (error) {
      return {
        status: 0,
        statusText: "",
        headers: {},
        body: "",
        bodySize: 0,
        timeMs: Date.now() - started,
        error: { message: error instanceof Error ? error.message : String(error), aborted: controller.signal.aborted }
      };
    } finally {
      clearTimeout(timer);
    }
  };
}
function createStubServices() {
  return {
    script: {
      run: async () => ({ ok: false, error: "\u811A\u672C\u6C99\u7BB1\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF1A\u9700 host \u4FA7 vm \u6C99\u7BB1\uFF09", logs: [], variables: {}, tests: [], exports: {} })
    },
    mock: {
      start: async () => ({ running: false, port: 0, error: "Mock \u670D\u52A1\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" }),
      stop: async () => ({ running: false, port: 0 }),
      status: async () => ({ running: false, port: 0 })
    },
    schema: {
      example: async () => ({ example: {} }),
      validate: async () => ({ ok: true, message: "\u964D\u7EA7\uFF1A\u6865\u4E0D\u53EF\u8FBE\uFF0C\u672A\u6267\u884C\u670D\u52A1\u7AEF\u6821\u9A8C" })
    },
    import: {
      openapi: async () => ({ folders: [], endpoints: [], schemas: [] }),
      postman: async () => ({ folders: [], endpoints: [], schemas: [] }),
      har: async () => ({ folders: [], endpoints: [], schemas: [] }),
      curl: async () => ({ folders: [], endpoints: [], schemas: [], endpoint: null })
    },
    export: {
      openapi: async () => "",
      postman: async () => "",
      har: async () => "",
      markdown: async () => ""
    },
    codegen: { run: async () => "" },
    test: {
      runCase: async (projectId, caseId) => ({ caseId, passed: false, results: [], durationMs: 0, error: "\u6D4B\u8BD5\u8FD0\u884C\u5668\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" }),
      runScenario: async (projectId, scenarioId) => ({ scenarioId, passed: false, steps: [], durationMs: 0, error: "\u6D4B\u8BD5\u8FD0\u884C\u5668\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" })
    },
    db: {
      test: async () => ({ available: false, message: "\u6570\u636E\u5E93\u64CD\u4F5C\u89C4\u5212\u4E2D\uFF08P2\uFF09" }),
      query: async () => ({ available: false, message: "\u6570\u636E\u5E93\u64CD\u4F5C\u89C4\u5212\u4E2D\uFF08P2\uFF09" }),
      close: async () => ({ available: false, message: "\u6570\u636E\u5E93\u64CD\u4F5C\u89C4\u5212\u4E2D\uFF08P2\uFF09" })
    }
  };
}
var STORAGE_METHODS = [
  "listProjects",
  "createProject",
  "renameProject",
  "deleteProject",
  "getProject",
  "saveEndpoint",
  "deleteEndpoint",
  "saveFolder",
  "deleteFolder",
  "moveNode",
  "saveSchema",
  "deleteSchema",
  "saveEnvironment",
  "deleteEnvironment",
  "saveGlobals",
  "saveProjectSettings",
  "saveFlow",
  "saveResponse",
  "deleteResponse",
  "getHistory",
  "appendHistory",
  "clearHistory",
  "search"
];
var REQUEST_METHODS = ["send", "preview"];
var SERVICE_METHODS = {
  script: ["run"],
  mock: ["start", "stop", "status"],
  schema: ["example", "validate"],
  import: ["openapi", "postman", "har", "curl"],
  export: ["openapi", "postman", "har", "markdown"],
  codegen: ["run"],
  test: ["runCase", "runScenario"],
  db: ["test", "query", "close"]
};
function installApi() {
  if (typeof window === "undefined") return void 0;
  let warned = false;
  const warnOnce = () => {
    if (warned) return;
    warned = true;
    try {
      console.warn("[dsh-postapi] " + BRIDGE_BASE + " \u6865\u4E0D\u53EF\u8FBE\uFF0C\u672C\u6B21\u8D77\u964D\u7EA7\u5185\u5B58\u6869\uFF08\u6570\u636E\u4E0D\u843D\u76D8\uFF09");
    } catch {
    }
  };
  const wrap = (bridgeFn, stubFn) => (...args) => Promise.resolve().then(() => bridgeFn(...args)).catch(() => {
    warnOnce();
    return stubFn(...args);
  });
  const bridgeStorage = createBridgeStorage();
  const stubStorage = createStubStorage();
  const storage = {};
  for (const method of STORAGE_METHODS) storage[method] = wrap(bridgeStorage[method], stubStorage[method]);
  const bridgeRequest = createBridgeRequest();
  const stubSend = createStubRequest();
  const requestStub = {
    send: stubSend,
    preview: async (opts = {}) => ({ url: { resolved: String(opts.url ?? ""), missing: [] }, params: opts.params ?? [], headers: opts.headers ?? [], body: opts.body ?? null })
  };
  const request = {};
  for (const method of REQUEST_METHODS) request[method] = wrap(bridgeRequest[method], requestStub[method]);
  const bridgeServices = createBridgeServices();
  const stubServices = createStubServices();
  const api = { storage, request };
  for (const [ns, methods] of Object.entries(SERVICE_METHODS)) {
    api[ns] = {};
    for (const method of methods) api[ns][method] = wrap(bridgeServices[ns][method], stubServices[ns][method]);
  }
  window.__postapiApi = api;
  return api;
}

// src/client/shell/Body.js
var ROUTES = [
  { name: "overview", hash: "#/overview", labelKey: "nav.overview" },
  { name: "doc", hash: "#/doc", labelKey: "nav.doc" },
  { name: "debug", hash: "#/debug", labelKey: "nav.debug" },
  { name: "mock", hash: "#/mock", labelKey: "nav.mock" },
  { name: "schema", hash: "#/schema", labelKey: "nav.schema" },
  { name: "env", hash: "#/env", labelKey: "nav.env" },
  { name: "history", hash: "#/history", labelKey: "nav.history" },
  { name: "test", hash: "#/test", labelKey: "nav.test" },
  { name: "import", hash: "#/import", labelKey: "nav.import" },
  { name: "flow", hash: "#/flow", labelKey: "nav.flow" },
  { name: "search", hash: "#/search", labelKey: "nav.search" },
  { name: "settings", hash: "#/settings", labelKey: "nav.settings" }
];
var PARAM_ROUTES = ["doc", "schema"];
function parseHash() {
  const raw = typeof location !== "undefined" ? location.hash : "";
  const clean = String(raw || "#/overview").replace(/^#\/?/, "");
  const qAt = clean.indexOf("?");
  const pathPart = qAt >= 0 ? clean.slice(0, qAt) : clean;
  const query = qAt >= 0 ? clean.slice(qAt + 1) : "";
  const [first, ...rest] = pathPart.split("/");
  if (PARAM_ROUTES.indexOf(first) >= 0) {
    return { name: first, arg: rest.length ? decodeURIComponent(rest.join("/")) : "", query };
  }
  if (ROUTES.some((r) => r.name === first)) return { name: first, arg: "", query };
  return { name: "overview", arg: "", query };
}
function useHashRoute() {
  const [route, setRoute] = (0, import_react3.useState)(parseHash);
  (0, import_react3.useEffect)(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
function Placeholder({ route }) {
  return /* @__PURE__ */ (0, import_react.createElement)("div", { style: { padding: 24, fontSize: 13, lineHeight: 1.45, color: "#666" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { fontWeight: 600, marginBottom: 8, color: "#000" } }, zh["placeholder.title"], ": ", route.name, route.arg ? "/" + route.arg : ""), /* @__PURE__ */ (0, import_react.createElement)("div", null, zh["placeholder.body"]), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: 8 } }, zh["placeholder.hint"]));
}
function PostApiBody({ useTabInfo }) {
  const route = useHashRoute();
  const Page = pageRegistry.get(route.name);
  const navStyle = {
    display: "flex",
    gap: 4,
    padding: "6px 10px",
    borderBottom: "1px solid #eaeaea",
    flexWrap: "wrap",
    position: "sticky",
    top: 0,
    background: "#ffffff",
    zIndex: 2
  };
  const linkStyle = {
    padding: "0 8px",
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 6,
    fontSize: 12,
    lineHeight: "24px",
    textDecoration: "none",
    color: "#666"
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 } }, /* @__PURE__ */ (0, import_react.createElement)("nav", { style: navStyle }, ROUTES.map((item) => /* @__PURE__ */ (0, import_react.createElement)(
    "a",
    {
      key: item.name,
      href: item.name === "doc" && route.arg ? "#/doc/" + encodeURIComponent(route.arg) : item.hash,
      style: { ...linkStyle, fontWeight: route.name === item.name ? 600 : 400, color: route.name === item.name ? "#000" : "#666", background: route.name === item.name ? "#f5f5f5" : "transparent" }
    },
    zh[item.labelKey]
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { flex: 1, minHeight: 0, overflow: "auto" } }, Page ? /* @__PURE__ */ (0, import_react.createElement)(Page, { route, api: typeof window !== "undefined" ? window.__postapiApi : void 0 }) : /* @__PURE__ */ (0, import_react.createElement)(Placeholder, { route })));
}

// src/client/shell/ApiTitle.js
function ApiTitle({ useTabInfo }) {
  const { tab } = useTabInfo();
  return /* @__PURE__ */ (0, import_react.createElement)("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ (0, import_react.createElement)(
    "svg",
    {
      viewBox: "0 0 64 64",
      width: 14,
      height: 14,
      "aria-hidden": "true",
      style: { display: "block", flexShrink: 0 }
    },
    /* @__PURE__ */ (0, import_react.createElement)("path", { d: "M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z", fill: "currentColor" })
  ), /* @__PURE__ */ (0, import_react.createElement)("span", null, tab.title));
}

// src/client/pages/overview.jsx
var import_react4 = __toESM(require("react"), 1);

// src/client/pages/theme.js
var THEME_KEY = "postapi.settings.theme";
var LOCALE_KEY = "postapi.settings.locale";
function readTheme() {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(THEME_KEY) || "light" : "light";
  } catch {
    return "light";
  }
}
function saveTheme(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
  }
}
function readLocale() {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(LOCALE_KEY) || "zh-CN" : "zh-CN";
  } catch {
    return "zh-CN";
  }
}
function saveLocale(value) {
  try {
    localStorage.setItem(LOCALE_KEY, value);
  } catch {
  }
}
function applyTheme(el) {
  if (el) el.setAttribute("data-theme", readTheme());
}

// src/client/pages/overview.jsx
(window.__postapiQueue = window.__postapiQueue || []).push(["overview", OverviewPage]);
var MOCK_PROJECTS = [
  { id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3", updatedAt: "2026-11-17T10:20:00.000Z" },
  { id: "proj_demo02", name: "\u7528\u6237\u670D\u52A1", updatedAt: "2026-11-16T18:40:00.000Z" }
];
var MOCK_PROJECT = {
  id: "proj_demo01",
  name: "\u8BA2\u5355\u4E2D\u5FC3",
  endpoints: [
    { id: "ep_1001", name: "\u67E5\u8BE2\u8BA2\u5355\u5217\u8868", method: "GET", url: "/api/v1/orders", updatedAt: "2026-11-17T10:20:00.000Z" },
    { id: "ep_1002", name: "\u521B\u5EFA\u8BA2\u5355", method: "POST", url: "/api/v1/orders", updatedAt: "2026-11-17T09:05:00.000Z" },
    { id: "ep_1003", name: "\u53D6\u6D88\u8BA2\u5355", method: "DELETE", url: "/api/v1/orders/{orderId}", updatedAt: "2026-11-16T21:30:00.000Z" }
  ]
};
var RECENT_LIMIT = 5;
function fmtTime(iso) {
  if (!iso) return "-";
  return String(iso).slice(0, 16).replace("T", " ");
}
function projectCards(projects) {
  return (Array.isArray(projects) ? projects : []).map((p) => ({
    id: p.id,
    name: p.name || p.id,
    updatedAt: p.updatedAt || "",
    endpointCount: Array.isArray(p.endpoints) ? p.endpoints.length : p.endpointCount
  }));
}
function recentEndpoints(project, limit = RECENT_LIMIT) {
  const list = Array.isArray(project && project.endpoints) ? project.endpoints.slice() : [];
  list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return list.slice(0, limit);
}
function errText(err) {
  return err && err.message ? err.message : String(err);
}
var SHORTCUTS = [
  { hash: "#/debug", label: "\u8C03\u8BD5\u53D1\u9001" },
  { hash: "#/doc", label: "\u63A5\u53E3\u6587\u6863" },
  { hash: "#/env", label: "\u73AF\u5883\u4E0E\u53D8\u91CF" },
  { hash: "#/test", label: "\u81EA\u52A8\u5316\u6D4B\u8BD5" }
];
function OverviewPage(props) {
  const rootRef = (0, import_react4.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react4.useState)(MOCK_PROJECTS);
  const [project, setProject] = (0, import_react4.useState)(MOCK_PROJECT);
  const [currentId, setCurrentId] = (0, import_react4.useState)(MOCK_PROJECT.id);
  const [isMock, setIsMock] = (0, import_react4.useState)(true);
  const [error, setError] = (0, import_react4.useState)("");
  const [notice, setNotice] = (0, import_react4.useState)("");
  const [newName, setNewName] = (0, import_react4.useState)("");
  const [renameName, setRenameName] = (0, import_react4.useState)(MOCK_PROJECT.name);
  const [pendingDelete, setPendingDelete] = (0, import_react4.useState)("");
  (0, import_react4.useEffect)(() => applyTheme(rootRef.current), []);
  const refresh = async () => {
    if (!storage || typeof storage.listProjects !== "function") {
      setIsMock(true);
      return;
    }
    try {
      const list = await storage.listProjects();
      if (Array.isArray(list)) {
        setProjects(list);
        setIsMock(false);
        if (list.length > 0 && typeof storage.getProject === "function") {
          const loaded = await storage.getProject(list[0].id);
          if (loaded) {
            setProject(loaded);
            setCurrentId(loaded.id || list[0].id);
            setRenameName(loaded.name || "");
          }
        }
      }
    } catch (err) {
      setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText(err));
    }
  };
  (0, import_react4.useEffect)(() => {
    refresh();
  }, []);
  const openProject = async (projectId) => {
    if (!storage || typeof storage.getProject !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.getProject");
      return;
    }
    setError("");
    try {
      const loaded = await storage.getProject(projectId);
      if (loaded) {
        setProject(loaded);
        setCurrentId(loaded.id || projectId);
        setRenameName(loaded.name || "");
        setNotice("\u5DF2\u6253\u5F00\uFF1A" + (loaded.name || loaded.id || projectId));
      } else {
        setError("\u9879\u76EE\u4E0D\u5B58\u5728\uFF1A" + projectId);
      }
    } catch (err) {
      setError("\u6253\u5F00\u9879\u76EE\u5931\u8D25\uFF1A" + errText(err));
    }
  };
  const createProject = async () => {
    if (!storage || typeof storage.createProject !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.createProject");
      return;
    }
    const name = String(newName || "").trim();
    if (!name) {
      setError("\u9879\u76EE\u540D\u4E0D\u80FD\u4E3A\u7A7A");
      return;
    }
    setError("");
    try {
      const created = await storage.createProject(name);
      setNewName("");
      setNotice("\u5DF2\u521B\u5EFA\uFF1A" + (created && created.name ? created.name : name));
      await refresh();
      if (created && created.id) await openProject(created.id);
    } catch (err) {
      setError("\u521B\u5EFA\u9879\u76EE\u5931\u8D25\uFF1A" + errText(err));
    }
  };
  const renameProject = async () => {
    if (!storage || typeof storage.renameProject !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.renameProject");
      return;
    }
    const name = String(renameName || "").trim();
    if (!name) {
      setError("\u65B0\u9879\u76EE\u540D\u4E0D\u80FD\u4E3A\u7A7A");
      return;
    }
    if (!currentId) {
      setError("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u9879\u76EE\u518D\u91CD\u547D\u540D");
      return;
    }
    setError("");
    try {
      await storage.renameProject(currentId, name);
      setNotice("\u5DF2\u91CD\u547D\u540D\uFF1A" + name);
      await refresh();
    } catch (err) {
      setError("\u91CD\u547D\u540D\u5931\u8D25\uFF1A" + errText(err));
    }
  };
  const deleteProject = async (projectId) => {
    if (pendingDelete !== projectId) {
      setPendingDelete(projectId);
      setNotice("\u518D\u6B21\u70B9\u51FB\u300C\u5220\u9664\u300D\u786E\u8BA4\u5220\u9664\u9879\u76EE " + projectId);
      return;
    }
    if (!projectId) {
      setError("\u9879\u76EE id \u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u5220\u9664");
      return;
    }
    if (!storage || typeof storage.deleteProject !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.deleteProject");
      return;
    }
    setError("");
    setPendingDelete("");
    try {
      await storage.deleteProject(projectId);
      setNotice("\u5DF2\u5220\u9664\uFF1A" + projectId);
      await refresh();
    } catch (err) {
      setError("\u5220\u9664\u9879\u76EE\u5931\u8D25\uFF1A" + errText(err));
    }
  };
  const recent = recentEndpoints(project);
  const cards = projectCards(projects);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "overview", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u9879\u76EE\u603B\u89C8"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u672A\u6CE8\u5165\u6216\u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08listProjects / getProject\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { marginBottom: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u65B0\u5EFA\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      placeholder: "\u9879\u76EE\u540D",
      value: newName,
      onChange: (e) => {
        setNewName(e.target.value);
        setNotice("");
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: createProject }, "\u65B0\u5EFA")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5F53\u524D\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, readOnly: true, value: currentId || "-" }), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      placeholder: "\u91CD\u547D\u540D",
      value: renameName,
      onChange: (e) => {
        setRenameName(e.target.value);
        setNotice("");
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: renameProject }, "\u91CD\u547D\u540D"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-grid" }, cards.map((p) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: p.id, className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, p.name), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-muted" }, p.endpointCount === void 0 ? "\u63A5\u53E3\u6570\u672A\u77E5" : p.endpointCount + " \u4E2A\u63A5\u53E3", " \xB7 \u66F4\u65B0\u4E8E ", fmtTime(p.updatedAt)), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => openProject(p.id) }, "\u6253\u5F00"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => deleteProject(p.id) }, pendingDelete === p.id ? "\u786E\u8BA4\u5220\u9664" : "\u5220\u9664")))), cards.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, "\u6682\u65E0\u9879\u76EE\uFF0C\u5148\u5728\u4E0A\u65B9\u65B0\u5EFA\u4E00\u4E2A") : null), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u6700\u8FD1\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "90px" } }, "\u65B9\u6CD5"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "URL"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "150px" } }, "\u66F4\u65B0\u65F6\u95F4"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, recent.map((e) => /* @__PURE__ */ (0, import_react.createElement)(
    "tr",
    {
      key: e.id,
      onClick: () => {
        window.location.hash = "#/doc/" + encodeURIComponent(e.id);
      },
      style: { cursor: "pointer" }
    },
    /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": e.method }, e.method)),
    /* @__PURE__ */ (0, import_react.createElement)("td", null, e.name || "-"),
    /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono pp-muted" }, e.url || "-"),
    /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, fmtTime(e.updatedAt))
  )), recent.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 4, className: "pp-muted" }, "\u5F53\u524D\u9879\u76EE\u6682\u65E0\u63A5\u53E3")) : null))), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u5FEB\u6377\u5165\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" } }, SHORTCUTS.map((s) => /* @__PURE__ */ (0, import_react.createElement)("a", { key: s.hash, className: "pp-btn", style: { display: "inline-flex", alignItems: "center", textDecoration: "none" }, href: s.hash }, s.label))));
}

// src/client/pages/doc.jsx
var import_react6 = require("react");

// src/client/pages/components/EmptyState.jsx
function EmptyState({ text = "\u6682\u65E0\u6570\u636E", hint = "" }) {
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, /* @__PURE__ */ (0, import_react.createElement)("div", null, text), hint ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-muted" }, hint) : null);
}

// src/client/pages/components/ParamTable.jsx
var COLUMN_META = {
  enabled: { title: "\u542F\u7528", width: "56px" },
  key: { title: "\u53C2\u6570", width: "160px" },
  value: { title: "\u503C" },
  type: { title: "\u7C7B\u578B", width: "88px" },
  required: { title: "\u5FC5\u586B", width: "56px" },
  description: { title: "\u8BF4\u660E", width: "160px" }
};
var DEFAULT_COLUMNS = ["enabled", "key", "value", "type", "required", "description"];
function blankParamRow() {
  return { key: "", value: "", enabled: true, type: "string", required: false, description: "" };
}
function renderCell(col, row, index, editable, patch) {
  const value = row ? row[col] : void 0;
  if (col === "enabled" || col === "required") {
    if (!editable) return value ? "\u662F" : "\u5426";
    return /* @__PURE__ */ (0, import_react.createElement)(
      "input",
      {
        type: "checkbox",
        checked: Boolean(value),
        onChange: (e) => patch(index, col, e.target.checked)
      }
    );
  }
  if (!editable) {
    const mono = col === "key" || col === "value";
    return /* @__PURE__ */ (0, import_react.createElement)("span", { className: mono ? "pp-table-mono" : void 0 }, value == null || value === "" ? "-" : String(value));
  }
  return /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      value: value == null ? "" : String(value),
      onChange: (e) => patch(index, col, e.target.value)
    }
  );
}
function ParamTable({
  rows,
  onChange,
  readOnly = false,
  columns = DEFAULT_COLUMNS,
  emptyText = "\u65E0",
  addLabel = "+ \u6DFB\u52A0"
}) {
  const list = Array.isArray(rows) ? rows : [];
  const editable = !readOnly && typeof onChange === "function";
  const patch = (index, field, value) => {
    const next = list.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };
  const remove = (index) => {
    const next = list.slice();
    next.splice(index, 1);
    onChange(next);
  };
  if (list.length === 0 && !editable) return /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: emptyText });
  return /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, columns.map((col) => /* @__PURE__ */ (0, import_react.createElement)(
    "th",
    {
      key: col,
      style: COLUMN_META[col] && COLUMN_META[col].width ? { width: COLUMN_META[col].width } : void 0
    },
    COLUMN_META[col] ? COLUMN_META[col].title : col
  )), editable ? /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "64px" } }, "\u64CD\u4F5C") : null)), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, list.map((row, index) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: index }, columns.map((col) => /* @__PURE__ */ (0, import_react.createElement)("td", { key: col }, renderCell(col, row, index, editable, patch))), editable ? /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => remove(index) }, "\u5220\u9664")) : null)), editable ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: columns.length + 1 }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => onChange(list.concat([blankParamRow()])) }, addLabel))) : null));
}

// src/client/pages/components/JsonEditor.jsx
var import_react5 = require("react");
function JsonEditor({ value = "", onChange, readOnly = false, rows = 8, placeholder = "{}" }) {
  const [error, setError] = (0, import_react5.useState)("");
  const text = value == null ? "" : String(value);
  const transform = (fn, label) => {
    try {
      const next = fn(JSON.parse(text));
      setError("");
      if (typeof onChange === "function") onChange(next);
    } catch (err) {
      setError(label + "\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
    }
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", null, readOnly ? null : /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => transform((v) => JSON.stringify(v, null, 2), "\u683C\u5F0F\u5316") }, "\u683C\u5F0F\u5316"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => transform((v) => JSON.stringify(v), "\u538B\u7F29") }, "\u538B\u7F29")), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-input pp-input-mono",
      rows,
      readOnly,
      placeholder,
      style: { width: "100%", height: "auto", padding: "var(--sp-2)", resize: "vertical" },
      value: text,
      onChange: (e) => {
        if (typeof onChange === "function") onChange(e.target.value);
      }
    }
  ), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, error) : null);
}

// src/client/pages/components/StatusPill.jsx
function statusTone(status) {
  const code = Number(status);
  if (!Number.isFinite(code) || code <= 0) return "var(--error)";
  if (code < 300) return "var(--success)";
  if (code < 400) return "var(--warning)";
  return "var(--error)";
}
function StatusPill({ status, text = "", tone }) {
  const color = tone || statusTone(status);
  return /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill", style: { color, borderColor: color } }, status == null || status === "" ? "-" : String(status), text ? " " + text : "");
}

// src/client/pages/doc.jsx
(window.__postapiQueue = window.__postapiQueue || []).push(["doc", DocPage]);
var FENCE = "```";
var MOCK_PROJECT2 = {
  id: "proj_demo01",
  name: "\u8BA2\u5355\u4E2D\u5FC3\uFF08\u793A\u4F8B\u6570\u636E\uFF09",
  description: "\u6F14\u793A\u9879\u76EE\uFF1A\u5305\u542B\u8BA2\u5355\u4E0E\u652F\u4ED8\u4E24\u6761\u4E1A\u52A1\u7EBF\u3002",
  folders: [
    { id: "fld_01", name: "\u8BA2\u5355\u7BA1\u7406", parentId: null, order: 0 },
    { id: "fld_02", name: "\u652F\u4ED8", parentId: null, order: 1 }
  ],
  environments: [
    { id: "env_01", name: "\u5F00\u53D1\u73AF\u5883", baseUrl: "https://api.example.test", isDefault: true, variables: [] }
  ],
  endpoints: [
    {
      id: "ep_1001",
      name: "\u67E5\u8BE2\u8BA2\u5355\u5217\u8868",
      folderId: "fld_01",
      order: 0,
      protocol: "http",
      method: "GET",
      url: "/api/v1/orders",
      description: "\u5206\u9875\u67E5\u8BE2\u5F53\u524D\u7528\u6237\u7684\u8BA2\u5355\uFF0C\u652F\u6301\u6309\u72B6\u6001\u8FC7\u6EE4\u3002\n\n### \u8BF4\u660E\n- \u9700\u8981 Bearer \u8BA4\u8BC1\n- \u5355\u9875\u6700\u591A 100 \u6761",
      params: [
        { key: "page", value: "1", enabled: true, description: "\u9875\u7801", required: false, type: "number" },
        { key: "pageSize", value: "20", enabled: true, description: "\u6BCF\u9875\u6761\u6570", required: false, type: "number" },
        { key: "status", value: "PAID", enabled: false, description: "\u8BA2\u5355\u72B6\u6001", required: false, type: "string" }
      ],
      pathParams: [],
      headers: [
        { key: "Accept", value: "application/json", enabled: true, description: "", required: false, type: "string" }
      ],
      cookies: [],
      body: { type: "none", content: "", schema: null, examples: [] },
      auth: { type: "bearer", token: "{{token}}", username: "", password: "", key: "", value: "", addTo: "header" },
      responses: [
        {
          id: "res_1001a",
          name: "\u6210\u529F",
          code: 200,
          contentType: "application/json",
          body: '{\n  "code": 0,\n  "data": {\n    "total": 42,\n    "items": [\n      { "orderId": "ORD-001", "status": "PAID", "amount": 9900 }\n    ]\n  }\n}',
          schema: null,
          headers: [{ key: "content-type", value: "application/json" }],
          enabled: true,
          isDefault: true
        },
        {
          id: "res_1001b",
          name: "\u672A\u8BA4\u8BC1",
          code: 401,
          contentType: "application/json",
          body: '{\n  "code": 401,\n  "message": "unauthorized"\n}',
          schema: null,
          headers: [],
          enabled: true,
          isDefault: false
        }
      ],
      tags: ["\u8BA2\u5355"],
      status: "developing"
    },
    {
      id: "ep_1002",
      name: "\u521B\u5EFA\u8BA2\u5355",
      folderId: "fld_01",
      order: 1,
      protocol: "http",
      method: "POST",
      url: "/api/v1/orders",
      description: "\u6839\u636E\u5546\u54C1\u6761\u76EE\u521B\u5EFA\u8BA2\u5355\u3002",
      params: [],
      pathParams: [],
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true, description: "", required: true, type: "string" }
      ],
      cookies: [],
      body: { type: "json", content: '{\n  "skuId": "SKU-1001",\n  "quantity": 2\n}', schema: null, examples: [] },
      auth: { type: "bearer", token: "{{token}}", username: "", password: "", key: "", value: "", addTo: "header" },
      responses: [
        {
          id: "res_1002a",
          name: "\u521B\u5EFA\u6210\u529F",
          code: 201,
          contentType: "application/json",
          body: '{\n  "code": 0,\n  "data": { "orderId": "ORD-002", "status": "CREATED" }\n}',
          schema: null,
          headers: [],
          enabled: true,
          isDefault: true
        }
      ],
      tags: ["\u8BA2\u5355"],
      status: "developing"
    },
    {
      id: "ep_1003",
      name: "\u53D6\u6D88\u8BA2\u5355",
      folderId: "fld_01",
      order: 2,
      protocol: "http",
      method: "DELETE",
      url: "/api/v1/orders/{orderId}",
      description: "\u53D6\u6D88\u672A\u652F\u4ED8\u7684\u8BA2\u5355\u3002",
      params: [],
      pathParams: [
        { key: "orderId", value: "ORD-001", enabled: true, description: "\u8BA2\u5355\u53F7", required: true, type: "string" }
      ],
      headers: [],
      cookies: [],
      body: { type: "none", content: "", schema: null, examples: [] },
      auth: { type: "none", token: "", username: "", password: "", key: "", value: "", addTo: "header" },
      responses: [
        { id: "res_1003a", name: "\u5DF2\u53D6\u6D88", code: 204, contentType: "application/json", body: "", schema: null, headers: [], enabled: true, isDefault: true }
      ],
      tags: ["\u8BA2\u5355"],
      status: "developing"
    },
    {
      id: "ep_2001",
      name: "\u53D1\u8D77\u652F\u4ED8",
      folderId: "fld_02",
      order: 0,
      protocol: "http",
      method: "POST",
      url: "/api/v1/payments",
      description: "\u5BF9\u6307\u5B9A\u8BA2\u5355\u53D1\u8D77\u652F\u4ED8\u3002",
      params: [],
      pathParams: [],
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true, description: "", required: true, type: "string" }
      ],
      cookies: [{ key: "session", value: "{{sessionId}}", enabled: false, description: "\u4F1A\u8BDD\u7968\u636E", required: false, type: "string" }],
      body: { type: "json", content: '{\n  "orderId": "ORD-001",\n  "channel": "alipay"\n}', schema: null, examples: [] },
      auth: { type: "apikey", token: "", username: "", password: "", key: "X-Api-Key", value: "{{apiKey}}", addTo: "header" },
      responses: [
        {
          id: "res_2001a",
          name: "\u6210\u529F",
          code: 200,
          contentType: "application/json",
          body: '{\n  "code": 0,\n  "data": { "paymentId": "PAY-001", "qrUrl": "https://example.test/qr" }\n}',
          schema: null,
          headers: [],
          enabled: true,
          isDefault: true
        }
      ],
      tags: ["\u652F\u4ED8"],
      status: "developing"
    }
  ]
};
var TOC = [
  { id: "sec-info", label: "\u57FA\u672C\u4FE1\u606F" },
  { id: "sec-path", label: "Path \u53C2\u6570" },
  { id: "sec-params", label: "Query \u53C2\u6570" },
  { id: "sec-headers", label: "\u8BF7\u6C42\u5934" },
  { id: "sec-cookies", label: "Cookies" },
  { id: "sec-body", label: "\u8BF7\u6C42\u4F53" },
  { id: "sec-auth", label: "\u8BA4\u8BC1" },
  { id: "sec-response", label: "\u54CD\u5E94" },
  { id: "sec-code", label: "\u4EE3\u7801\u751F\u6210" }
];
var BODY_TYPES = ["none", "json", "form", "urlencoded", "raw", "binary", "xml", "graphql"];
var AUTH_LABEL = {
  none: "\u65E0\u8BA4\u8BC1",
  bearer: "Bearer Token\uFF08Authorization: Bearer <token>\uFF09",
  basic: "Basic\uFF08\u7528\u6237\u540D / \u5BC6\u7801\uFF09",
  apikey: "API Key\uFF08\u5199\u5165 header \u6216 query\uFF09",
  oauth2: "OAuth 2.0\uFF08\u89C4\u5212\u4E2D\uFF1A\u4EC5\u4FDD\u7559\u7C7B\u578B\u4F4D\uFF09",
  digest: "Digest\uFF08\u89C4\u5212\u4E2D\uFF1A\u4EC5\u4FDD\u7559\u7C7B\u578B\u4F4D\uFF09"
};
function resolveApi() {
  return typeof window !== "undefined" ? window.__postapiApi : null;
}
function readEndpointIdFromHash() {
  if (typeof window === "undefined") return "";
  const m = /^#\/doc\/([^/?#]+)/.exec(window.location.hash || "");
  return m ? decodeURIComponent(m[1]) : "";
}
function renderInline(text, keyPrefix) {
  const nodes = [];
  const re = /(\x60[^\x60]+\x60)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  let i = 0;
  while (m = re.exec(text)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    const key = keyPrefix + "-" + i++;
    if (token.charAt(0) === "`") nodes.push(/* @__PURE__ */ (0, import_react.createElement)("code", { key, className: "pp-table-mono" }, token.slice(1, -1)));
    else if (token.slice(0, 2) === "**") nodes.push(/* @__PURE__ */ (0, import_react.createElement)("strong", { key }, token.slice(2, -2)));
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      nodes.push(/* @__PURE__ */ (0, import_react.createElement)("a", { key, href: link[2] }, link[1]));
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function Markdown({ text }) {
  const src = text == null ? "" : String(text);
  if (src.trim() === "") return /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\uFF08\u65E0\u63CF\u8FF0\uFF09" });
  const blocks = [];
  let buffer = [];
  let inFence = false;
  let listItems = [];
  const flushFence = (key) => {
    blocks.push(/* @__PURE__ */ (0, import_react.createElement)("pre", { key, className: "pp-pre" }, buffer.join("\n")));
    buffer = [];
  };
  const flushList = (key) => {
    if (listItems.length === 0) return;
    blocks.push(
      /* @__PURE__ */ (0, import_react.createElement)("ul", { key, style: { margin: "0 0 var(--sp-2) 0", paddingLeft: "var(--sp-4)" } }, listItems.map((item, idx) => /* @__PURE__ */ (0, import_react.createElement)("li", { key: idx }, renderInline(item, key + "-li" + idx))))
    );
    listItems = [];
  };
  src.split("\n").forEach((line, index) => {
    const key = "md-" + index;
    if (line.trim().startsWith(FENCE)) {
      if (inFence) {
        flushFence(key);
        inFence = false;
      } else {
        flushList(key + "-l");
        inFence = true;
      }
      return;
    }
    if (inFence) {
      buffer.push(line);
      return;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushList(key + "-l");
      blocks.push(/* @__PURE__ */ (0, import_react.createElement)("div", { key, className: "pp-card-title" }, renderInline(heading[2], key)));
      return;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      listItems.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flushList(key + "-l");
    if (line.trim() === "") return;
    blocks.push(/* @__PURE__ */ (0, import_react.createElement)("p", { key, style: { margin: "0 0 var(--sp-2) 0" } }, renderInline(line, key)));
  });
  flushList("md-end-list");
  if (inFence) flushFence("md-end-fence");
  return /* @__PURE__ */ (0, import_react.createElement)("div", null, blocks);
}
function joinUrl(baseUrl, url) {
  const raw = String(url || "");
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(baseUrl || "").replace(/\/+$/, "");
  if (!base) return raw;
  return base + (raw.charAt(0) === "/" ? raw : "/" + raw);
}
function buildCurl(ep, baseUrl) {
  if (!ep) return "";
  const enabled = (rows) => (Array.isArray(rows) ? rows : []).filter((r) => r && r.enabled !== false && r.key);
  let url = joinUrl(baseUrl, ep.url);
  for (const p of enabled(ep.pathParams)) url = url.replace("{" + p.key + "}", String(p.value == null ? "" : p.value));
  const query = enabled(ep.params).map((p) => encodeURIComponent(p.key) + "=" + encodeURIComponent(p.value == null ? "" : p.value)).join("&");
  if (query) url += (url.indexOf("?") >= 0 ? "&" : "?") + query;
  const lines = ["curl -X " + (ep.method || "GET") + " '" + url + "'"];
  for (const h of enabled(ep.headers)) lines.push("  -H '" + h.key + ": " + (h.value == null ? "" : h.value) + "'");
  const auth = ep.auth || {};
  if (auth.type === "bearer" && auth.token) lines.push("  -H 'Authorization: Bearer " + auth.token + "'");
  if (auth.type === "basic") lines.push("  -u '" + (auth.username || "") + ":" + (auth.password || "") + "'");
  if (auth.type === "apikey" && auth.key) {
    if (auth.addTo === "query") lines.push("  # query: " + auth.key + "=" + (auth.value || ""));
    else lines.push("  -H '" + auth.key + ": " + (auth.value || "") + "'");
  }
  const body = ep.body || {};
  if (body.type && body.type !== "none" && body.content) {
    lines.push("  --data-raw '" + String(body.content).replace(/'/g, "'\\''") + "'");
  }
  return lines.join(" \\\n");
}
function DocPage({ route, api }) {
  const rootRef = (0, import_react6.useRef)(null);
  (0, import_react6.useEffect)(() => applyTheme(rootRef.current), []);
  const apiRef = resolveApi() || api;
  const [project, setProject] = (0, import_react6.useState)(MOCK_PROJECT2);
  const [isMock, setIsMock] = (0, import_react6.useState)(true);
  const [error, setError] = (0, import_react6.useState)("");
  const [selectedId, setSelectedId] = (0, import_react6.useState)(() => route && route.arg || readEndpointIdFromHash());
  const [collapsed, setCollapsed] = (0, import_react6.useState)({});
  const [activeSec, setActiveSec] = (0, import_react6.useState)("sec-info");
  const [responseId, setResponseId] = (0, import_react6.useState)("");
  const [copied, setCopied] = (0, import_react6.useState)("");
  (0, import_react6.useEffect)(() => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.listProjects !== "function" || typeof storage.getProject !== "function") return void 0;
    let cancelled = false;
    Promise.resolve().then(() => storage.listProjects()).then((list) => {
      const first = Array.isArray(list) && list.length ? list[0] : null;
      return first ? storage.getProject(first.id) : null;
    }).then((data) => {
      if (cancelled || !data) return;
      setProject(data);
      setIsMock(false);
      setError("");
    }).catch((err) => {
      if (cancelled) return;
      setError("\u8BFB\u53D6\u9879\u76EE\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
    });
    return () => {
      cancelled = true;
    };
  }, [apiRef]);
  (0, import_react6.useEffect)(() => {
    if (typeof window === "undefined") return void 0;
    const onHash = () => setSelectedId(readEndpointIdFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const endpoints = (0, import_react6.useMemo)(() => Array.isArray(project && project.endpoints) ? project.endpoints : [], [project]);
  const folders = (0, import_react6.useMemo)(() => Array.isArray(project && project.folders) ? project.folders : [], [project]);
  const ep = endpoints.find((e) => e.id === selectedId) || endpoints[0] || null;
  const responses = (0, import_react6.useMemo)(() => {
    const list = Array.isArray(ep && ep.responses) ? ep.responses.filter((r) => r && r.enabled !== false) : [];
    return list;
  }, [ep]);
  const activeResponse = (0, import_react6.useMemo)(() => {
    const found = responses.find((r) => r.id === responseId);
    if (found) return found;
    return responses.find((r) => r.isDefault) || responses[0] || null;
  }, [responses, responseId]);
  const baseUrl = (0, import_react6.useMemo)(() => {
    const envs = Array.isArray(project && project.environments) ? project.environments : [];
    const def = envs.find((e) => e.isDefault) || envs[0];
    return def && def.baseUrl ? def.baseUrl : "";
  }, [project]);
  const canSaveResponse = Boolean(apiRef && apiRef.storage && typeof apiRef.storage.saveResponse === "function");
  const pick = (endpointId) => {
    setSelectedId(endpointId);
    setResponseId("");
    if (typeof window !== "undefined") window.location.hash = "#/doc/" + endpointId;
  };
  const jump = (secId) => {
    setActiveSec(secId);
    if (typeof document === "undefined") return;
    const el = document.getElementById(secId);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const copyCurl = () => {
    const text = buildCurl(ep, baseUrl);
    const fail = () => setCopied("\u590D\u5236\u5931\u8D25\uFF1A\u526A\u8D34\u677F\u4E0D\u53EF\u7528");
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        Promise.resolve(navigator.clipboard.writeText(text)).then(() => setCopied("\u5DF2\u590D\u5236")).catch(fail);
        return;
      }
    } catch {
    }
    fail();
  };
  const patchResponse = (patch) => {
    if (!ep || !activeResponse) return;
    const next = { ...activeResponse, ...patch };
    const list = (Array.isArray(ep.responses) ? ep.responses : []).map((r) => r.id === next.id ? next : r);
    setProject((prev) => ({
      ...prev,
      endpoints: (prev.endpoints || []).map((e) => e.id === ep.id ? { ...e, responses: list } : e)
    }));
  };
  const saveResponse = () => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.saveResponse !== "function" || !ep || !activeResponse) return;
    Promise.resolve().then(() => storage.saveResponse(project.id, ep.id, activeResponse)).then(() => setError("")).catch((err) => setError("\u4FDD\u5B58\u54CD\u5E94\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err))));
  };
  const tree = /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-pane", style: { padding: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { padding: "0 var(--sp-2)" } }, project.name || "\u672A\u547D\u540D\u9879\u76EE"), folders.map((folder) => {
    const inFolder = endpoints.filter((e) => e.folderId === folder.id);
    const isCollapsed = Boolean(collapsed[folder.id]);
    return /* @__PURE__ */ (0, import_react.createElement)("div", { key: folder.id }, /* @__PURE__ */ (0, import_react.createElement)(
      "div",
      {
        className: "pp-tree-row pp-muted",
        "data-active": false,
        onClick: () => setCollapsed((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }))
      },
      /* @__PURE__ */ (0, import_react.createElement)("span", null, isCollapsed ? "\u25B8" : "\u25BE"),
      /* @__PURE__ */ (0, import_react.createElement)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, folder.name),
      /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, inFolder.length)
    ), isCollapsed ? null : inFolder.map((e) => /* @__PURE__ */ (0, import_react.createElement)(
      "div",
      {
        key: e.id,
        className: "pp-tree-row",
        "data-active": Boolean(ep) && e.id === ep.id,
        onClick: () => pick(e.id),
        style: { paddingLeft: "var(--sp-4)" }
      },
      /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": e.method }, e.method),
      /* @__PURE__ */ (0, import_react.createElement)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, e.name)
    )));
  }), endpoints.filter((e) => !e.folderId).length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree-row pp-muted" }, "\u672A\u5F52\u7C7B"), endpoints.filter((e) => !e.folderId).map((e) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: e.id, className: "pp-tree-row", "data-active": Boolean(ep) && e.id === ep.id, onClick: () => pick(e.id) }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": e.method }, e.method), /* @__PURE__ */ (0, import_react.createElement)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, e.name)))) : null, endpoints.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u63A5\u53E3", hint: "\u5148\u5728\u603B\u89C8\u9875\u521B\u5EFA\u9879\u76EE\u4E0E\u63A5\u53E3" }) : null);
  if (!ep) {
    return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "doc", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u63A5\u53E3\u6587\u6863"), tree);
  }
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "doc", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-doc-layout" }, tree, /* @__PURE__ */ (0, import_react.createElement)("main", { style: { minWidth: 0 } }, isMock ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock") : null, error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, error) : null, /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-info" }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": ep.method }, ep.method), " ", ep.name), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-table-mono" }, ep.method, " ", ep.url), ep.protocol && ep.protocol !== "http" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u534F\u8BAE ", ep.protocol, "\uFF1A\u89C4\u5212\u4E2D\uFF08\u4EC5\u4FDD\u7559\u7C7B\u578B\u4F4D\uFF0C\u53D1\u9001\u56DE\u843D HTTP\uFF09") : null, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)(Markdown, { text: ep.description })), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: copyCurl }, "\u590D\u5236\u4E3A cURL"), copied ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, copied) : null)), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-path", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "Path \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.pathParams, readOnly: true, emptyText: "\u65E0 Path \u53C2\u6570" })), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-params", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "Query \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.params, readOnly: true, emptyText: "\u65E0 Query \u53C2\u6570" })), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-headers", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u8BF7\u6C42\u5934"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.headers, readOnly: true, emptyText: "\u65E0\u8BF7\u6C42\u5934" })), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-cookies", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "Cookies"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.cookies, readOnly: true, emptyText: "\u65E0 Cookies" })), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-body", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u8BF7\u6C42\u4F53\uFF08", ep.body && ep.body.type ? ep.body.type : "none", "\uFF09"), ep.body && ep.body.content ? /* @__PURE__ */ (0, import_react.createElement)(JsonEditor, { value: ep.body.content, readOnly: true, rows: 8 }) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u8BF7\u6C42\u4F53" }), ep.body && ep.body.type && BODY_TYPES.indexOf(ep.body.type) < 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u672A\u77E5 body \u7C7B\u578B\uFF1A", ep.body.type) : null), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-auth", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u8BA4\u8BC1"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, AUTH_LABEL[ep.auth && ep.auth.type || "none"] || ep.auth && ep.auth.type), ep.auth && ep.auth.type === "apikey" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-table-mono" }, (ep.auth.key || "key") + " \u2192 " + (ep.auth.addTo === "query" ? "query" : "header")) : null), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-response", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u54CD\u5E94"), responses.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u5C1A\u672A\u5B9A\u4E49\u54CD\u5E94", hint: "\u5728\u8C03\u8BD5\u9875\u53D1\u9001\u540E\u4FDD\u5B58\u4E3A\u63A5\u53E3\uFF0C\u6216\u65B0\u589E\u54CD\u5E94" }) : /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, responses.map((r) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: r.id,
      className: "pp-tab",
      "data-active": Boolean(activeResponse) && r.id === activeResponse.id,
      onClick: () => setResponseId(r.id)
    },
    r.code,
    " ",
    r.name || ""
  ))), activeResponse ? /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", marginBottom: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)(StatusPill, { status: activeResponse.code, text: activeResponse.name || "" }), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, activeResponse.contentType || "application/json"), activeResponse.isDefault ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill" }, "\u9ED8\u8BA4") : null, canSaveResponse ? /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: saveResponse }, "\u4FDD\u5B58\u54CD\u5E94") : /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, "\u53EA\u8BFB\uFF1Astorage.saveResponse \u4E0D\u53EF\u7528")), /* @__PURE__ */ (0, import_react.createElement)(
    JsonEditor,
    {
      value: activeResponse.body,
      rows: 10,
      readOnly: !canSaveResponse,
      onChange: (next) => patchResponse({ body: next })
    }
  ), Array.isArray(activeResponse.headers) && activeResponse.headers.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u54CD\u5E94\u5934"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: activeResponse.headers, readOnly: true, columns: ["key", "value"], emptyText: "\u65E0\u54CD\u5E94\u5934" })) : null) : null)), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-code", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u4EE3\u7801\u751F\u6210\uFF08cURL\uFF09"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre" }, buildCurl(ep, baseUrl)))), /* @__PURE__ */ (0, import_react.createElement)("aside", { style: { position: "sticky", top: "var(--sp-6)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u672C\u9875\u76EE\u5F55"), TOC.map((t) => /* @__PURE__ */ (0, import_react.createElement)(
    "a",
    {
      key: t.id,
      className: "pp-toc-item",
      "data-active": activeSec === t.id,
      onClick: (e) => {
        e.preventDefault();
        jump(t.id);
      },
      href: "#/doc/" + encodeURIComponent(ep.id)
    },
    t.label
  )))));
}

// src/client/pages/debug.jsx
var import_react7 = require("react");
(window.__postapiQueue = window.__postapiQueue || []).push(["debug", DebugPage]);
var METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
var BODY_TYPES2 = ["none", "json", "form", "urlencoded", "raw", "xml", "graphql"];
var AUTH_TYPES = ["none", "bearer", "basic", "apikey"];
var MOCK_PROJECT3 = {
  id: "proj_demo01",
  name: "\u8BA2\u5355\u4E2D\u5FC3\uFF08\u793A\u4F8B\u6570\u636E\uFF09",
  environments: [
    {
      id: "env_01",
      name: "\u5F00\u53D1\u73AF\u5883",
      baseUrl: "https://api.example.test",
      isDefault: true,
      variables: [{ key: "token", value: "demo-token", enabled: true, secret: false }]
    },
    { id: "env_02", name: "\u751F\u4EA7\u73AF\u5883", baseUrl: "https://api.example.com", isDefault: false, variables: [] }
  ],
  globals: { variables: [{ key: "apiKey", value: "demo-key", enabled: true, secret: false }] },
  folders: [{ id: "fld_01", name: "\u8BA2\u5355\u7BA1\u7406", parentId: null, order: 0 }],
  endpoints: [
    {
      id: "ep_1001",
      name: "\u67E5\u8BE2\u8BA2\u5355\u5217\u8868",
      folderId: "fld_01",
      method: "GET",
      url: "/api/v1/orders",
      params: [
        { key: "page", value: "1", enabled: true, type: "number", description: "", required: false },
        { key: "pageSize", value: "20", enabled: true, type: "number", description: "", required: false }
      ],
      pathParams: [],
      headers: [{ key: "Accept", value: "application/json", enabled: true, type: "string", description: "", required: false }],
      cookies: [],
      body: { type: "none", content: "" },
      auth: { type: "bearer", token: "{{token}}", username: "", password: "", key: "", value: "", addTo: "header" },
      responses: [{
        id: "res_a",
        name: "\u6210\u529F",
        code: 200,
        contentType: "application/json",
        body: '{\n  "code": 0,\n  "data": { "total": 42, "items": [] }\n}',
        headers: [],
        enabled: true,
        isDefault: true
      }]
    },
    {
      id: "ep_1002",
      name: "\u521B\u5EFA\u8BA2\u5355",
      folderId: "fld_01",
      method: "POST",
      url: "/api/v1/orders",
      params: [],
      pathParams: [],
      headers: [{ key: "Content-Type", value: "application/json", enabled: true, type: "string", description: "", required: true }],
      cookies: [],
      body: { type: "json", content: '{\n  "skuId": "SKU-1001",\n  "quantity": 2\n}' },
      auth: { type: "bearer", token: "{{token}}", username: "", password: "", key: "", value: "", addTo: "header" },
      responses: [{
        id: "res_b",
        name: "\u521B\u5EFA\u6210\u529F",
        code: 201,
        contentType: "application/json",
        body: '{\n  "code": 0,\n  "data": { "orderId": "ORD-002" }\n}',
        headers: [],
        enabled: true,
        isDefault: true
      }]
    },
    {
      id: "ep_3001",
      name: "\u66F4\u65B0\u652F\u4ED8\u72B6\u6001",
      folderId: null,
      method: "PATCH",
      url: "/api/v1/payments/{paymentId}",
      params: [],
      pathParams: [{ key: "paymentId", value: "PAY-001", enabled: true, type: "string", description: "", required: true }],
      headers: [],
      cookies: [],
      body: { type: "json", content: '{\n  "status": "PAID"\n}' },
      auth: { type: "none", token: "", username: "", password: "", key: "", value: "", addTo: "header" },
      responses: [{ id: "res_c", name: "\u6210\u529F", code: 200, contentType: "application/json", body: "{}", headers: [], enabled: true, isDefault: true }]
    }
  ]
};
var TABS = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "auth", label: "Auth" }
];
var PARAM_COLUMNS = ["enabled", "key", "value", "description"];
var AUTH_LABEL2 = { none: "\u65E0\u8BA4\u8BC1", bearer: "Bearer", basic: "Basic", apikey: "API Key" };
function resolveApi2() {
  return typeof window !== "undefined" ? window.__postapiApi : null;
}
function emptyDraft(ep) {
  return {
    id: ep && ep.id ? ep.id : "",
    name: ep && ep.name ? ep.name : "",
    folderId: ep && ep.folderId ? ep.folderId : null,
    method: ep && ep.method || "GET",
    url: ep && ep.url || "",
    params: (ep && Array.isArray(ep.params) ? ep.params : []).map((r) => ({ ...r })),
    pathParams: (ep && Array.isArray(ep.pathParams) ? ep.pathParams : []).map((r) => ({ ...r })),
    headers: (ep && Array.isArray(ep.headers) ? ep.headers : []).map((r) => ({ ...r })),
    cookies: (ep && Array.isArray(ep.cookies) ? ep.cookies : []).map((r) => ({ ...r })),
    body: { type: ep && ep.body && ep.body.type || "none", content: ep && ep.body && ep.body.content || "" },
    auth: {
      type: ep && ep.auth && ep.auth.type || "none",
      token: ep && ep.auth && ep.auth.token || "",
      username: ep && ep.auth && ep.auth.username || "",
      password: ep && ep.auth && ep.auth.password || "",
      key: ep && ep.auth && ep.auth.key || "",
      value: ep && ep.auth && ep.auth.value || "",
      addTo: ep && ep.auth && ep.auth.addTo || "header"
    },
    responses: (ep && Array.isArray(ep.responses) ? ep.responses : []).map((r) => ({ ...r }))
  };
}
function collectVarRefs(draft) {
  const found = [];
  const push = (text) => {
    const re = /\{\{\s*([^}\s]+)\s*\}\}/g;
    let m;
    const src = String(text == null ? "" : text);
    while (m = re.exec(src)) if (found.indexOf(m[1]) < 0) found.push(m[1]);
  };
  if (!draft) return found;
  push(draft.url);
  for (const rows of [draft.params, draft.pathParams, draft.headers, draft.cookies]) {
    for (const r of Array.isArray(rows) ? rows : []) {
      push(r && r.key);
      push(r && r.value);
    }
  }
  if (draft.body) push(draft.body.content);
  if (draft.auth) {
    push(draft.auth.token);
    push(draft.auth.value);
  }
  return found;
}
function varTable(project, envId) {
  const table = {};
  const globals = project && project.globals && Array.isArray(project.globals.variables) ? project.globals.variables : [];
  for (const v of globals) if (v && v.enabled !== false && v.key) table[v.key] = v.value;
  const envs = project && Array.isArray(project.environments) ? project.environments : [];
  const env = envs.find((e) => e.id === envId) || envs.find((e) => e.isDefault) || envs[0];
  for (const v of env && Array.isArray(env.variables) ? env.variables : []) {
    if (v && v.enabled !== false && v.key) table[v.key] = v.value;
  }
  return { table, env };
}
function joinUrl2(baseUrl, url) {
  const raw = String(url || "");
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(baseUrl || "").replace(/\/+$/, "");
  if (!base) return raw;
  return base + (raw.charAt(0) === "/" ? raw : "/" + raw);
}
function prettyJson(text) {
  if (text == null) return "";
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text == null ? "" : String(text);
  }
}
function DebugPage({ route, api }) {
  const rootRef = (0, import_react7.useRef)(null);
  const abortRef = (0, import_react7.useRef)({ cancelled: false });
  (0, import_react7.useEffect)(() => applyTheme(rootRef.current), []);
  const apiRef = resolveApi2() || api;
  const [project, setProject] = (0, import_react7.useState)(MOCK_PROJECT3);
  const [isMock, setIsMock] = (0, import_react7.useState)(true);
  const [error, setError] = (0, import_react7.useState)("");
  const [envId, setEnvId] = (0, import_react7.useState)(() => {
    const envs2 = MOCK_PROJECT3.environments;
    const def = envs2.find((e) => e.isDefault) || envs2[0];
    return def ? def.id : "";
  });
  const [draft, setDraft] = (0, import_react7.useState)(() => emptyDraft(MOCK_PROJECT3.endpoints[0]));
  const [tab, setTab] = (0, import_react7.useState)("params");
  const [resp, setResp] = (0, import_react7.useState)(null);
  const [sending, setSending] = (0, import_react7.useState)(false);
  const [bodyView, setBodyView] = (0, import_react7.useState)("pretty");
  const [savedHint, setSavedHint] = (0, import_react7.useState)("");
  (0, import_react7.useEffect)(() => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.listProjects !== "function" || typeof storage.getProject !== "function") return void 0;
    let cancelled = false;
    Promise.resolve().then(() => storage.listProjects()).then((list) => {
      const first = Array.isArray(list) && list.length ? list[0] : null;
      return first ? storage.getProject(first.id) : null;
    }).then((data) => {
      if (cancelled || !data) return;
      setProject(data);
      setIsMock(false);
      setError("");
      const envs2 = Array.isArray(data.environments) ? data.environments : [];
      const def = envs2.find((e) => e.isDefault) || envs2[0];
      setEnvId(def ? def.id : "");
      const list = Array.isArray(data.endpoints) ? data.endpoints : [];
      setDraft(emptyDraft(list[0] || null));
    }).catch((err) => {
      if (cancelled) return;
      setError("\u8BFB\u53D6\u9879\u76EE\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
    });
    return () => {
      cancelled = true;
    };
  }, [apiRef]);
  const endpoints = (0, import_react7.useMemo)(() => Array.isArray(project && project.endpoints) ? project.endpoints : [], [project]);
  const envs = (0, import_react7.useMemo)(() => Array.isArray(project && project.environments) ? project.environments : [], [project]);
  const { table, env } = (0, import_react7.useMemo)(() => varTable(project, envId), [project, envId]);
  const varRefs = (0, import_react7.useMemo)(() => collectVarRefs(draft), [draft]);
  const missingVars = (0, import_react7.useMemo)(() => varRefs.filter((k) => !(k in table)), [varRefs, table]);
  const finalUrl = (0, import_react7.useMemo)(() => joinUrl2(env && env.baseUrl, draft.url), [env, draft.url]);
  const loadEndpoint = (ep) => {
    setDraft(emptyDraft(ep));
    setResp(null);
    setSavedHint("");
  };
  const patch = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));
  const patchAuth = (field, value) => setDraft((prev) => ({ ...prev, auth: { ...prev.auth, [field]: value } }));
  const send = () => {
    const requestApi = apiRef && apiRef.request;
    const cancelled = { cancelled: false };
    abortRef.current = cancelled;
    setSending(true);
    setResp(null);
    const payload = {
      method: draft.method,
      url: finalUrl,
      params: draft.params.filter((p) => p && p.enabled !== false && p.key),
      headers: draft.headers.filter((h) => h && h.enabled !== false && h.key),
      body: draft.body,
      auth: draft.auth,
      timeoutMs: 3e4,
      variables: {
        globals: project && project.globals ? project.globals.variables || [] : [],
        environment: env && Array.isArray(env.variables) ? env.variables : [],
        local: []
      },
      projectId: project && project.id ? project.id : ""
    };
    if (!requestApi || typeof requestApi.send !== "function") {
      setResp({
        status: /DELETE|PATCH/.test(draft.method) ? 204 : 200,
        statusText: "OK (mock)",
        headers: { "content-type": "application/json" },
        body: '{\n  "code": 0,\n  "data": { "mock": true }\n}',
        bodySize: 128,
        timeMs: 42,
        tests: [{ name: "status \u4E3A 2xx", passed: true }],
        logs: []
      });
      setSending(false);
      return;
    }
    Promise.resolve().then(() => requestApi.send(payload)).then((result) => {
      if (cancelled.cancelled) return;
      setResp(result || {});
      setError("");
    }).catch((err) => {
      if (cancelled.cancelled) return;
      setResp({
        status: 0,
        statusText: "",
        headers: {},
        body: "",
        bodySize: 0,
        timeMs: 0,
        error: { message: err && err.message ? err.message : String(err) }
      });
    }).finally(() => {
      if (!cancelled.cancelled) setSending(false);
    });
  };
  const cancel = () => {
    abortRef.current.cancelled = true;
    setSending(false);
    setError("\u5DF2\u53D6\u6D88\u672C\u6B21\u53D1\u9001\uFF08\u54CD\u5E94\u4E0D\u518D\u56DE\u586B\uFF09");
  };
  const saveAsEndpoint = () => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.saveEndpoint !== "function" || !project || !project.id) {
      setSavedHint("\u4FDD\u5B58\u5931\u8D25\uFF1Astorage.saveEndpoint \u4E0D\u53EF\u7528");
      return;
    }
    const endpoint = {
      ...draft,
      name: draft.name || draft.method + " " + draft.url,
      responses: draft.responses.length ? draft.responses : []
    };
    Promise.resolve().then(() => storage.saveEndpoint(project.id, endpoint)).then((saved) => {
      setSavedHint("\u5DF2\u4FDD\u5B58\uFF1A" + (saved && saved.name || endpoint.name));
      setDraft((prev) => ({ ...prev, id: saved && saved.id || prev.id }));
    }).catch((err) => setSavedHint("\u4FDD\u5B58\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err))));
  };
  const respBodyText = resp ? bodyView === "pretty" ? prettyJson(resp.body) : String(resp.body == null ? "" : resp.body) : "";
  const respHeaders = (0, import_react7.useMemo)(() => {
    const h = resp && resp.headers;
    if (!h || typeof h !== "object") return [];
    return Object.keys(h).map((key) => ({ key, value: h[key] }));
  }, [resp]);
  const responsePanel = /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u54CD\u5E94"), !resp ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u5C1A\u672A\u53D1\u9001\u8BF7\u6C42", hint: "\u586B\u5199 URL \u540E\u70B9\u300C\u53D1\u9001\u300D" }) : null, resp && resp.error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u9519\u8BEF\uFF1A", resp.error.message || String(resp.error)) : null, resp && !resp.error ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ (0, import_react.createElement)(StatusPill, { status: resp.status, text: resp.statusText || "" }), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, resp.timeMs == null ? "-" : resp.timeMs, " ms"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, resp.bodySize == null ? "-" : resp.bodySize, " B"), resp.truncated ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill" }, "\u5DF2\u622A\u65AD") : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs", style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": bodyView === "pretty", onClick: () => setBodyView("pretty") }, "\u7F8E\u5316"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": bodyView === "raw", onClick: () => setBodyView("raw") }, "\u539F\u6587")), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre", style: { marginTop: "var(--sp-2)" } }, respBodyText), respHeaders.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u54CD\u5E94\u5934"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: respHeaders, readOnly: true, columns: ["key", "value"], emptyText: "\u65E0\u54CD\u5E94\u5934" })) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u65AD\u8A00 / \u811A\u672C\u7ED3\u679C"), Array.isArray(resp.tests) && resp.tests.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "72px" } }, "\u7ED3\u679C"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "160px" } }, "\u9519\u8BEF"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, resp.tests.map((t, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", null, t.name), /* @__PURE__ */ (0, import_react.createElement)("td", null, t.passed ? "\u901A\u8FC7" : "\u5931\u8D25"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, t.error || "-"))))) : /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u65E0\u65AD\u8A00")), Array.isArray(resp.logs) && resp.logs.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u811A\u672C\u65E5\u5FD7"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre" }, resp.logs.join("\n"))) : null) : null);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "debug", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u8C03\u8BD5"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u53D1\u9001\u5C06\u8FD4\u56DE mock \u54CD\u5E94" : "\u6570\u636E\u6765\u6E90\uFF1Apostapi.storage + postapi.request"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, error) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-pane", style: { padding: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { padding: "0 var(--sp-2)" } }, "\u63A5\u53E3"), endpoints.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u63A5\u53E3" }) : null, endpoints.map((ep) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: ep.id, className: "pp-tree-row", "data-active": ep.id === draft.id, onClick: () => loadEndpoint(ep) }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": ep.method }, ep.method), /* @__PURE__ */ (0, import_react.createElement)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, ep.name))), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("a", { className: "pp-toc-item", href: "#/history" }, "\u8BF7\u6C42\u5386\u53F2 / \u56DE\u653E"))), /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", marginBottom: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, "\u73AF\u5883"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: envId, onChange: (e) => setEnvId(e.target.value) }, envs.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u65E0\u73AF\u5883\uFF09") : null, envs.map((e) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: e.id, value: e.id }, e.name))), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, env && env.baseUrl ? env.baseUrl : "\u672A\u914D\u7F6E baseUrl")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-url-row" }, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: draft.method, onChange: (e) => patch("method", e.target.value) }, METHODS.map((m) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: m, value: m }, m))), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      value: draft.url,
      placeholder: "/api/v1/... \u6216 https://TARGET/endpoint\uFF0C\u652F\u6301 {{var}}",
      onChange: (e) => patch("url", e.target.value)
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: send, disabled: sending }, sending ? "\u53D1\u9001\u4E2D\u2026" : "\u53D1\u9001"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: cancel, disabled: !sending }, "\u53D6\u6D88")), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted pp-table-mono", style: { marginTop: "var(--sp-2)" } }, "\u5B9E\u9645\u5730\u5740\uFF1A", finalUrl || "\uFF08\u672A\u586B\u5199 URL\uFF09"), varRefs.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u53D8\u91CF ", varRefs.join("\u3001"), missingVars.length > 0 ? "\uFF08\u672A\u5B9A\u4E49\uFF1A" + missingVars.join("\u3001") + "\uFF09" : "\uFF08\u5747\u5DF2\u5B9A\u4E49\uFF09") : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs", style: { marginTop: "var(--sp-3)" } }, TABS.map((t) => /* @__PURE__ */ (0, import_react.createElement)("button", { key: t.id, className: "pp-tab", "data-active": tab === t.id, onClick: () => setTab(t.id) }, t.label))), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, tab === "params" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "Path \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.pathParams, onChange: (rows) => patch("pathParams", rows), columns: PARAM_COLUMNS, emptyText: "\u65E0 Path \u53C2\u6570" }), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { marginTop: "var(--sp-3)" } }, "Query \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.params, onChange: (rows) => patch("params", rows), columns: PARAM_COLUMNS, emptyText: "\u65E0 Query \u53C2\u6570" })) : null, tab === "headers" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u8BF7\u6C42\u5934"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.headers, onChange: (rows) => patch("headers", rows), columns: PARAM_COLUMNS, emptyText: "\u65E0\u8BF7\u6C42\u5934" }), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { marginTop: "var(--sp-3)" } }, "Cookies"), /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.cookies, onChange: (rows) => patch("cookies", rows), columns: PARAM_COLUMNS, emptyText: "\u65E0 Cookies" })) : null, tab === "body" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7C7B\u578B"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: draft.body.type, onChange: (e) => patch("body", { ...draft.body, type: e.target.value }) }, BODY_TYPES2.map((t) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: t, value: t }, t)))), draft.body.type === "none" ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u8BF7\u6C42\u4F53" }) : /* @__PURE__ */ (0, import_react.createElement)(
    JsonEditor,
    {
      value: draft.body.content,
      rows: 8,
      onChange: (next) => patch("body", { ...draft.body, content: next })
    }
  )) : null, tab === "auth" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7C7B\u578B"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: draft.auth.type, onChange: (e) => patchAuth("type", e.target.value) }, AUTH_TYPES.map((t) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: t, value: t }, AUTH_LABEL2[t] || t)))), draft.auth.type === "bearer" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Token"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.token, onChange: (e) => patchAuth("token", e.target.value) })) : null, draft.auth.type === "basic" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7528\u6237\u540D"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.username, onChange: (e) => patchAuth("username", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5BC6\u7801"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.password, onChange: (e) => patchAuth("password", e.target.value) }))) : null, draft.auth.type === "apikey" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Key"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.key, onChange: (e) => patchAuth("key", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Value"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.value, onChange: (e) => patchAuth("value", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4F4D\u7F6E"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: draft.auth.addTo, onChange: (e) => patchAuth("addTo", e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "header" }, "header"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "query" }, "query")))) : null, draft.auth.type === "none" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u65E0\u8BA4\u8BC1") : null) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      placeholder: "\u63A5\u53E3\u540D\u79F0",
      value: draft.name,
      onChange: (e) => patch("name", e.target.value)
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: saveAsEndpoint }, "\u4FDD\u5B58\u4E3A\u63A5\u53E3"), savedHint ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, savedHint) : null)), responsePanel));
}

// src/client/pages/mock.jsx
var import_react8 = require("react");
(window.__postapiQueue = window.__postapiQueue || []).push(["mock", MockPage]);
var RULES = ["fixed", "regex", "increment", "random", "template"];
var RULE_LABEL = { fixed: "\u56FA\u5B9A\u503C", regex: "\u6B63\u5219\u751F\u6210", increment: "\u81EA\u589E", random: "\u968F\u673A", template: "\u6A21\u677F" };
var MOCK_PROJECT4 = {
  id: "proj_demo01",
  name: "\u8BA2\u5355\u4E2D\u5FC3\uFF08\u793A\u4F8B\u6570\u636E\uFF09",
  endpoints: [
    {
      id: "ep_1001",
      name: "\u67E5\u8BE2\u8BA2\u5355\u5217\u8868",
      method: "GET",
      url: "/api/v1/orders",
      mock: {
        enabled: true,
        delayMs: 120,
        rules: [
          { id: "mk_01", endpointId: "ep_1001", field: "data.total", rule: "fixed", value: "42", enabled: true },
          { id: "mk_02", endpointId: "ep_1001", field: "data.items[0].orderId", rule: "template", value: "ORD-{{$randomInt}}", enabled: true },
          { id: "mk_03", endpointId: "ep_1001", field: "data.items[0].status", rule: "fixed", value: "PAID", enabled: false }
        ]
      },
      responses: [{ id: "res_a", name: "\u6210\u529F", code: 200, contentType: "application/json", body: "{}", headers: [], enabled: true, isDefault: true }]
    },
    {
      id: "ep_1002",
      name: "\u521B\u5EFA\u8BA2\u5355",
      method: "POST",
      url: "/api/v1/orders",
      mock: { enabled: false, delayMs: 0, rules: [] },
      responses: [{ id: "res_b", name: "\u521B\u5EFA\u6210\u529F", code: 201, contentType: "application/json", body: "{}", headers: [], enabled: true, isDefault: true }]
    }
  ],
  mocks: []
};
function resolveApi3() {
  return typeof window !== "undefined" ? window.__postapiApi : null;
}
function blankRule(endpointId) {
  return { id: "", endpointId: endpointId || "", field: "", rule: "fixed", value: "", enabled: true };
}
function hitUrls(projectId, endpoint, port) {
  const base = "http://127.0.0.1:" + (port || 4010);
  if (!projectId || !endpoint) return [];
  return [
    base + "/mock/" + projectId + "/" + endpoint.id,
    base + "/mock/" + projectId + (endpoint.url || "")
  ];
}
function MockPage({ route, api }) {
  const rootRef = (0, import_react8.useRef)(null);
  (0, import_react8.useEffect)(() => applyTheme(rootRef.current), []);
  const apiRef = resolveApi3() || api;
  const [project, setProject] = (0, import_react8.useState)(MOCK_PROJECT4);
  const [isMock, setIsMock] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)("");
  const [notice, setNotice] = (0, import_react8.useState)("");
  const [currentId, setCurrentId] = (0, import_react8.useState)(MOCK_PROJECT4.endpoints[0].id);
  const [delayMs, setDelayMs] = (0, import_react8.useState)(MOCK_PROJECT4.endpoints[0].mock.delayMs);
  const [rules, setRules] = (0, import_react8.useState)(MOCK_PROJECT4.endpoints[0].mock.rules);
  const [mockEnabled, setMockEnabled] = (0, import_react8.useState)(MOCK_PROJECT4.endpoints[0].mock.enabled);
  const [service, setService] = (0, import_react8.useState)({ running: false, port: 4010 });
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const endpoints = (0, import_react8.useMemo)(() => Array.isArray(project && project.endpoints) ? project.endpoints : [], [project]);
  const current = (0, import_react8.useMemo)(() => endpoints.find((e) => e.id === currentId) || endpoints[0] || null, [endpoints, currentId]);
  const port = project && project.settings && project.settings.mockPort || 4010;
  (0, import_react8.useEffect)(() => {
    const storage = apiRef && apiRef.storage;
    let cancelled = false;
    if (storage && typeof storage.listProjects === "function" && typeof storage.getProject === "function") {
      Promise.resolve().then(() => storage.listProjects()).then((list) => {
        const first = Array.isArray(list) && list.length ? list[0] : null;
        return first ? storage.getProject(first.id) : null;
      }).then((data) => {
        if (cancelled || !data) return;
        setProject(data);
        setIsMock(false);
        const list = Array.isArray(data.endpoints) ? data.endpoints : [];
        const first = list[0] || null;
        setCurrentId(first ? first.id : "");
        setRules(first && first.mock && Array.isArray(first.mock.rules) ? first.mock.rules : []);
        setDelayMs(first && first.mock ? first.mock.delayMs || 0 : 0);
        setMockEnabled(Boolean(first && first.mock && first.mock.enabled));
      }).catch((err) => {
        if (cancelled) return;
        setError("\u8BFB\u53D6\u9879\u76EE\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
      });
    }
    const mockApi = apiRef && apiRef.mock;
    if (mockApi && typeof mockApi.status === "function") {
      Promise.resolve().then(() => mockApi.status()).then((st) => {
        if (cancelled || !st) return;
        setService({ running: Boolean(st.running), port: st.port || port });
      }).catch(() => {
      });
    }
    return () => {
      cancelled = true;
    };
  }, [apiRef]);
  const selectEndpoint = (ep) => {
    setCurrentId(ep.id);
    setRules(ep.mock && Array.isArray(ep.mock.rules) ? ep.mock.rules.map((r) => ({ ...r })) : []);
    setDelayMs(ep.mock ? ep.mock.delayMs || 0 : 0);
    setMockEnabled(Boolean(ep.mock && ep.mock.enabled));
    setNotice("");
  };
  const persist = () => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.saveEndpoint !== "function" || !project || !project.id || !current) {
      setNotice("\u4FDD\u5B58\u5931\u8D25\uFF1Astorage.saveEndpoint \u4E0D\u53EF\u7528");
      return;
    }
    const endpoint = {
      ...current,
      mock: { enabled: mockEnabled, delayMs: Number(delayMs) || 0, rules }
    };
    setBusy(true);
    Promise.resolve().then(() => storage.saveEndpoint(project.id, endpoint)).then(() => {
      setProject((prev) => ({
        ...prev,
        endpoints: (prev.endpoints || []).map((e) => e.id === endpoint.id ? { ...e, mock: endpoint.mock } : e)
      }));
      setNotice("\u5DF2\u4FDD\u5B58 Mock \u914D\u7F6E");
      setError("");
    }).catch((err) => setNotice("\u4FDD\u5B58\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)))).finally(() => setBusy(false));
  };
  const startService = () => {
    const mockApi = apiRef && apiRef.mock;
    if (!mockApi || typeof mockApi.start !== "function") {
      setNotice("\u542F\u52A8\u5931\u8D25\uFF1Aapi.mock.start \u4E0D\u53EF\u7528");
      return;
    }
    setBusy(true);
    Promise.resolve().then(() => mockApi.start({ projectId: project && project.id, port })).then((st) => {
      setService({ running: true, port: st && st.port || port });
      setNotice("Mock \u670D\u52A1\u5DF2\u542F\u52A8");
    }).catch((err) => setNotice("\u542F\u52A8\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)))).finally(() => setBusy(false));
  };
  const stopService = () => {
    const mockApi = apiRef && apiRef.mock;
    if (!mockApi || typeof mockApi.stop !== "function") {
      setNotice("\u505C\u6B62\u5931\u8D25\uFF1Aapi.mock.stop \u4E0D\u53EF\u7528");
      return;
    }
    setBusy(true);
    Promise.resolve().then(() => mockApi.stop()).then(() => {
      setService({ running: false, port });
      setNotice("Mock \u670D\u52A1\u5DF2\u505C\u6B62");
    }).catch((err) => setNotice("\u505C\u6B62\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)))).finally(() => setBusy(false));
  };
  const patchRule = (index, field, value) => {
    const next = rules.slice();
    next[index] = { ...next[index], [field]: value };
    setRules(next);
  };
  const urls = (0, import_react8.useMemo)(() => hitUrls(project && project.id, current, service.port || port), [project, current, service.port, port]);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "mock", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "Mock"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Apostapi.storage + postapi.mock"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-pane", style: { padding: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { padding: "0 var(--sp-2)" } }, "\u63A5\u53E3"), endpoints.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u63A5\u53E3" }) : null, endpoints.map((ep) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: ep.id, className: "pp-tree-row", "data-active": ep.id === currentId, onClick: () => selectEndpoint(ep) }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": ep.method }, ep.method), /* @__PURE__ */ (0, import_react.createElement)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, ep.name)))), /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, current ? current.name : "\u672A\u9009\u62E9\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u542F\u7528 Mock"), /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: mockEnabled, onChange: (e) => setMockEnabled(e.target.checked) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5EF6\u8FDF (ms)"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "120px" },
      value: String(delayMs),
      onChange: (e) => setDelayMs(e.target.value.replace(/[^0-9]/g, ""))
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { marginTop: "var(--sp-3)" } }, "\u5B57\u6BB5\u89C4\u5219"), rules.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u5C1A\u65E0\u89C4\u5219", hint: "\u672A\u547D\u4E2D\u89C4\u5219\u65F6\u56DE\u843D\u9ED8\u8BA4\u54CD\u5E94" }) : null, rules.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "56px" } }, "\u542F\u7528"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "180px" } }, "\u5B57\u6BB5"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "110px" } }, "\u89C4\u5219"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u503C"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "64px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, rules.map((rule, index) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: index }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: rule.enabled !== false, onChange: (e) => patchRule(index, "enabled", e.target.checked) })), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      value: rule.field || "",
      placeholder: "data.items[0].id",
      onChange: (e) => patchRule(index, "field", e.target.value)
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: rule.rule || "fixed", onChange: (e) => patchRule(index, "rule", e.target.value) }, RULES.map((r) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: r, value: r }, RULE_LABEL[r] || r)))), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      value: rule.value || "",
      onChange: (e) => patchRule(index, "value", e.target.value)
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => setRules(rules.filter((_, i) => i !== index)) }, "\u5220\u9664")))))) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => setRules(rules.concat([blankRule(current && current.id)])) }, "+ \u6DFB\u52A0\u89C4\u5219"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: persist, disabled: busy }, "\u4FDD\u5B58\u914D\u7F6E"))), /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u672C\u5730 Mock \u670D\u52A1"), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill" }, service.running ? "\u8FD0\u884C\u4E2D" : "\u5DF2\u505C\u6B62"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, "\u7AEF\u53E3 ", service.port || port)), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: startService, disabled: busy || service.running }, "\u542F\u52A8"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: stopService, disabled: busy || !service.running }, "\u505C\u6B62")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title", style: { marginTop: "var(--sp-3)" } }, "\u547D\u4E2D\u5730\u5740"), urls.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u9009\u62E9\u63A5\u53E3\u540E\u663E\u793A\u547D\u4E2D\u5730\u5740" }) : null, urls.map((u) => /* @__PURE__ */ (0, import_react.createElement)("pre", { key: u, className: "pp-pre", style: { marginBottom: "var(--sp-1)" } }, u)), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted", style: { marginTop: "var(--sp-2)" } }, "\u89C4\u5219\u4F18\u5148\u7EA7\uFF1A\u5B57\u6BB5\u89C4\u5219 \u2192 \u9ED8\u8BA4\u54CD\u5E94\uFF08isDefault\uFF09\u2192 200 ", "{}"))));
}

// src/client/pages/schema.jsx
var import_react9 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["schema", SchemaPage]);
var MOCK_SCHEMAS = [
  {
    id: "sch_order",
    name: "Order",
    description: "\u8BA2\u5355\u5BF9\u8C61",
    jsonSchema: {
      type: "object",
      properties: {
        orderId: { type: "string", example: "ORD-001" },
        status: { type: "string", enum: ["CREATED", "PAID", "CANCELED"] },
        amount: { type: "number" },
        items: { type: "array", items: { type: "object", properties: { skuId: { type: "string" } } } }
      },
      required: ["orderId", "status"]
    }
  }
];
function localValidateSchema(text) {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ""));
  } catch (err) {
    return { ok: false, error: "JSON \u89E3\u6790\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)) };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON Schema \u5FC5\u987B\u662F\u5BF9\u8C61" };
  }
  const hasShape = parsed.type || parsed.properties || parsed.items || parsed.$ref || parsed.allOf || parsed.oneOf || parsed.anyOf;
  if (!hasShape) return { ok: false, error: "JSON Schema \u81F3\u5C11\u9700\u8981 type / properties / items / $ref \u4E4B\u4E00" };
  if (parsed.type && !["object", "array", "string", "number", "integer", "boolean", "null"].includes(parsed.type)) {
    return { ok: false, error: "\u672A\u77E5 type\uFF1A" + String(parsed.type) };
  }
  return { ok: true, schema: parsed };
}
function localExampleFromSchema(schema) {
  if (!schema || typeof schema !== "object") return null;
  if (schema.example !== void 0) return schema.example;
  if (schema.default !== void 0) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
  if (schema.$ref) return { $ref: schema.$ref };
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) return localExampleFromSchema(schema.oneOf[0]);
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) return localExampleFromSchema(schema.anyOf[0]);
  const type = schema.type || (schema.properties ? "object" : schema.items ? "array" : "string");
  if (type === "object") {
    const out = {};
    const props = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
    for (const key of Object.keys(props)) out[key] = localExampleFromSchema(props[key]);
    return out;
  }
  if (type === "array") return [localExampleFromSchema(schema.items || { type: "string" })];
  if (type === "integer") return 0;
  if (type === "number") return 0;
  if (type === "boolean") return true;
  if (type === "null") return null;
  return "string";
}
function errText2(err) {
  return err && err.message ? err.message : String(err);
}
function toText(value) {
  try {
    return JSON.stringify(value === void 0 ? {} : value, null, 2);
  } catch {
    return "{}";
  }
}
function SchemaPage(props) {
  const rootRef = (0, import_react9.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const route = props && props.route || {};
  const [projects, setProjects] = (0, import_react9.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react9.useState)("proj_demo01");
  const [schemas, setSchemas] = (0, import_react9.useState)(MOCK_SCHEMAS);
  const [isMock, setIsMock] = (0, import_react9.useState)(true);
  const [error, setError] = (0, import_react9.useState)("");
  const [notice, setNotice] = (0, import_react9.useState)("");
  const [currentId, setCurrentId] = (0, import_react9.useState)("");
  const [name, setName] = (0, import_react9.useState)("");
  const [description, setDescription] = (0, import_react9.useState)("");
  const [text, setText] = (0, import_react9.useState)(toText(MOCK_SCHEMAS[0].jsonSchema));
  const [checkResult, setCheckResult] = (0, import_react9.useState)(null);
  const [example, setExample] = (0, import_react9.useState)("");
  (0, import_react9.useEffect)(() => applyTheme(rootRef.current), []);
  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== "function") {
      setIsMock(true);
      setSchemas(MOCK_SCHEMAS);
      return;
    }
    try {
      const loaded = await storage.getProject(id);
      if (loaded) {
        const list = Array.isArray(loaded.schemas) ? loaded.schemas : [];
        setSchemas(list);
        setIsMock(false);
        const wanted = route.arg && list.find((s) => s.id === route.arg);
        if (wanted) pick(wanted);
      }
    } catch (err) {
      setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText2(err));
    }
  };
  (0, import_react9.useEffect)(() => {
    const boot = async () => {
      if (storage && typeof storage.listProjects === "function") {
        try {
          const list = await storage.listProjects();
          if (Array.isArray(list) && list.length > 0) {
            setProjects(list);
            setProjectId(list[0].id);
            await loadProject(list[0].id);
            return;
          }
        } catch (err) {
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText2(err));
        }
      }
      setIsMock(true);
    };
    boot();
  }, []);
  const pick = (s) => {
    setCurrentId(s.id || "");
    setName(s.name || "");
    setDescription(s.description || "");
    setText(toText(s.jsonSchema));
    setCheckResult(null);
    setExample("");
    setNotice("");
    setError("");
  };
  const blank = () => {
    setCurrentId("");
    setName("\u65B0\u6A21\u578B");
    setDescription("");
    setText(toText({ type: "object", properties: {} }));
    setCheckResult(null);
    setExample("");
  };
  const validate = async () => {
    setError("");
    setCheckResult(null);
    if (api && api.schema && typeof api.schema.validate === "function") {
      try {
        const res2 = await api.schema.validate({ schema: safeParse(text) });
        setCheckResult({ ok: res2 && res2.ok !== false, message: res2 && res2.message || (res2 && res2.ok === false ? "\u6821\u9A8C\u672A\u901A\u8FC7" : "\u6821\u9A8C\u901A\u8FC7") });
        return;
      } catch (err) {
        setError("api.schema.validate \u8C03\u7528\u5931\u8D25\uFF1A" + errText2(err));
      }
    }
    const res = localValidateSchema(text);
    setCheckResult({
      ok: res.ok,
      message: res.ok ? "\u6821\u9A8C\u901A\u8FC7\uFF08\u672C\u5730\u964D\u7EA7\u6821\u9A8C\uFF1Aapi.schema.validate \u672A\u63D0\u4F9B\uFF09" : res.error
    });
  };
  const makeExample = async () => {
    setError("");
    setExample("");
    const parsed = safeParse(text);
    if (api && api.schema && typeof api.schema.example === "function") {
      try {
        const res = await api.schema.example({ schema: parsed });
        setExample(toText(res && res.example !== void 0 ? res.example : res));
        return;
      } catch (err) {
        setError("api.schema.example \u8C03\u7528\u5931\u8D25\uFF1A" + errText2(err));
      }
    }
    setExample(toText(localExampleFromSchema(parsed)));
  };
  const save = async () => {
    if (!storage || typeof storage.saveSchema !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.saveSchema");
      return;
    }
    const parsed = localValidateSchema(text);
    if (!parsed.ok) {
      setError("\u4FDD\u5B58\u524D\u6821\u9A8C\u5931\u8D25\uFF1A" + parsed.error);
      return;
    }
    setError("");
    try {
      const payload = { name: name || "\u672A\u547D\u540D\u6A21\u578B", description, jsonSchema: parsed.schema };
      if (currentId) payload.id = currentId;
      const saved = await storage.saveSchema(projectId, payload);
      setNotice("\u5DF2\u4FDD\u5B58\u6A21\u578B\uFF1A" + (saved && saved.name || payload.name));
      if (saved && saved.id) setCurrentId(saved.id);
      await loadProject(projectId);
    } catch (err) {
      setError("\u4FDD\u5B58\u6A21\u578B\u5931\u8D25\uFF1A" + errText2(err));
    }
  };
  const remove = async () => {
    if (!currentId) {
      setError("\u8BF7\u5148\u9009\u4E2D\u4E00\u4E2A\u6A21\u578B");
      return;
    }
    if (!storage || typeof storage.deleteSchema !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.deleteSchema");
      return;
    }
    setError("");
    try {
      await storage.deleteSchema(projectId, currentId);
      setNotice("\u5DF2\u5220\u9664\u6A21\u578B\uFF1A" + currentId);
      blank();
      await loadProject(projectId);
    } catch (err) {
      setError("\u5220\u9664\u6A21\u578B\u5931\u8D25\uFF1A" + errText2(err));
    }
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "schema", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u6570\u636E\u6A21\u578B"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08saveSchema / deleteSchema\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        loadProject(e.target.value);
      }
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u6A21\u578B\u5217\u8868"), schemas.map((s) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: s.id, className: "pp-tree-row", "data-active": s.id === currentId ? "true" : "false", onClick: () => pick(s) }, /* @__PURE__ */ (0, import_react.createElement)("span", null, s.name || s.id))), schemas.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, "\u6682\u65E0\u6A21\u578B") : null, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: blank }, "\u65B0\u5EFA\u6A21\u578B"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u7F16\u8F91"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", style: { flex: 1 }, value: name, onChange: (e) => setName(e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8BF4\u660E"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", style: { flex: 1 }, value: description, onChange: (e) => setDescription(e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%", minHeight: "var(--ctl-h)" },
      rows: 14,
      value: text,
      onChange: (e) => {
        setText(e.target.value);
        setCheckResult(null);
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", flexWrap: "wrap" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: validate }, "\u6821\u9A8C"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: makeExample }, "\u751F\u6210\u793A\u4F8B"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: save }, "\u4FDD\u5B58"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: remove }, "\u5220\u9664")), checkResult ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: checkResult.ok ? "pp-muted" : "pp-error-text" }, checkResult.ok ? "\u901A\u8FC7\uFF1A" : "\u5931\u8D25\uFF1A", checkResult.message) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u793A\u4F8B\u6570\u636E"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre" }, example || "\uFF08\u70B9\u300C\u751F\u6210\u793A\u4F8B\u300D\u6309\u5F53\u524D JSON Schema \u751F\u6210\uFF09"))));
}
function safeParse(text) {
  try {
    return JSON.parse(String(text || "{}"));
  } catch {
    return null;
  }
}

// src/client/pages/env.jsx
var import_react10 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["env", EnvPage]);
var MOCK_PROJECT5 = {
  id: "proj_demo01",
  name: "\u8BA2\u5355\u4E2D\u5FC3",
  environments: [
    {
      id: "env_dev",
      name: "\u5F00\u53D1\u73AF\u5883",
      baseUrl: "http://127.0.0.1:8080",
      isDefault: true,
      variables: [
        { key: "token", value: "dev-token", enabled: true, secret: true },
        { key: "tenantId", value: "t-1001", enabled: true, secret: false }
      ]
    },
    { id: "env_prod", name: "\u751F\u4EA7\u73AF\u5883", baseUrl: "https://api.example.test", isDefault: false, variables: [] }
  ],
  globals: { variables: [{ key: "userAgent", value: "postapi/0.1.0", enabled: true, secret: false }] }
};
var VAR_COLUMNS = ["\u53D8\u91CF\u540D", "\u503C", "\u542F\u7528", "\u5BC6\u94A5", "\u64CD\u4F5C"];
var PRIORITY_ROWS = [
  { level: "1\uFF08\u6700\u9AD8\uFF09", scope: "\u63A5\u53E3\u5C40\u90E8\u53D8\u91CF", note: "\u63A5\u53E3 params / headers / body \u91CC\u76F4\u63A5\u5199\u6B7B\u7684\u503C" },
  { level: "2", scope: "\u73AF\u5883\u53D8\u91CF", note: "\u5F53\u524D\u73AF\u5883 environments[].variables\uFF08enabled \u4E3A true \u624D\u53C2\u4E0E\u66FF\u6362\uFF09" },
  { level: "3", scope: "\u5168\u5C40\u53D8\u91CF", note: "globals.variables\uFF0C\u8DE8\u73AF\u5883\u5171\u7528" },
  { level: "4\uFF08\u6700\u4F4E\uFF09", scope: "\u52A8\u6001\u53D8\u91CF", note: "{{$timestamp}} {{$uuid}} {{$randomInt}} \u7B49\uFF0C\u7531 host-runtime \u751F\u6210" }
];
function normalizeVars(list) {
  return (Array.isArray(list) ? list : []).filter((v) => v && typeof v === "object").map((v) => ({
    key: String(v.key || ""),
    value: String(v.value === void 0 || v.value === null ? "" : v.value),
    enabled: v.enabled !== false,
    secret: v.secret === true
  }));
}
function priorityRows() {
  return PRIORITY_ROWS.slice();
}
function envSummary(envs) {
  return (Array.isArray(envs) ? envs : []).map((e) => ({
    id: e.id,
    name: e.name || e.id,
    baseUrl: e.baseUrl || "",
    isDefault: e.isDefault === true,
    varCount: Array.isArray(e.variables) ? e.variables.length : 0
  }));
}
function errText3(err) {
  return err && err.message ? err.message : String(err);
}
function blankEnv() {
  return { name: "\u65B0\u73AF\u5883", baseUrl: "", isDefault: false, variables: [] };
}
function EnvPage(props) {
  const rootRef = (0, import_react10.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react10.useState)([{ id: MOCK_PROJECT5.id, name: MOCK_PROJECT5.name }]);
  const [projectId, setProjectId] = (0, import_react10.useState)(MOCK_PROJECT5.id);
  const [project, setProject] = (0, import_react10.useState)(MOCK_PROJECT5);
  const [isMock, setIsMock] = (0, import_react10.useState)(true);
  const [error, setError] = (0, import_react10.useState)("");
  const [notice, setNotice] = (0, import_react10.useState)("");
  const [draft, setDraft] = (0, import_react10.useState)(MOCK_PROJECT5.environments[0]);
  const [globals, setGlobals] = (0, import_react10.useState)(normalizeVars(MOCK_PROJECT5.globals.variables));
  (0, import_react10.useEffect)(() => applyTheme(rootRef.current), []);
  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== "function") {
      setIsMock(true);
      setProject(MOCK_PROJECT5);
      setDraft(MOCK_PROJECT5.environments[0]);
      setGlobals(normalizeVars(MOCK_PROJECT5.globals.variables));
      return;
    }
    try {
      const loaded = await storage.getProject(id);
      if (loaded) {
        setProject(loaded);
        const envs2 = Array.isArray(loaded.environments) ? loaded.environments : [];
        setDraft(envs2.length > 0 ? envs2[0] : blankEnv());
        setGlobals(normalizeVars(loaded.globals && loaded.globals.variables));
        setIsMock(false);
      }
    } catch (err) {
      setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText3(err));
    }
  };
  (0, import_react10.useEffect)(() => {
    const boot = async () => {
      if (storage && typeof storage.listProjects === "function") {
        try {
          const list = await storage.listProjects();
          if (Array.isArray(list) && list.length > 0) {
            setProjects(list);
            setProjectId(list[0].id);
            await loadProject(list[0].id);
            return;
          }
        } catch (err) {
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText3(err));
        }
      }
      setIsMock(true);
    };
    boot();
  }, []);
  const envs = Array.isArray(project.environments) ? project.environments : [];
  const pickEnv = (env) => {
    setDraft({ ...env, variables: normalizeVars(env.variables) });
    setNotice("");
    setError("");
  };
  const patchDraft = (patch) => setDraft({ ...draft, ...patch });
  const setVarAt = (i, patch) => {
    const next = normalizeVars(draft.variables);
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, variables: next });
  };
  const addVar = () => setDraft({ ...draft, variables: normalizeVars(draft.variables).concat([{ key: "", value: "", enabled: true, secret: false }]) });
  const removeVar = (i) => setDraft({ ...draft, variables: normalizeVars(draft.variables).filter((_, idx) => idx !== i) });
  const setGlobalAt = (i, patch) => {
    const next = globals.slice();
    next[i] = { ...next[i], ...patch };
    setGlobals(next);
  };
  const addGlobal = () => setGlobals(globals.concat([{ key: "", value: "", enabled: true, secret: false }]));
  const removeGlobal = (i) => setGlobals(globals.filter((_, idx) => idx !== i));
  const saveEnv = async () => {
    if (!storage || typeof storage.saveEnvironment !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.saveEnvironment");
      return;
    }
    if (!String(draft.name || "").trim()) {
      setError("\u73AF\u5883\u540D\u4E0D\u80FD\u4E3A\u7A7A");
      return;
    }
    setError("");
    try {
      const payload = { ...draft, variables: normalizeVars(draft.variables) };
      const saved = await storage.saveEnvironment(projectId, payload);
      setNotice("\u5DF2\u4FDD\u5B58\u73AF\u5883\uFF1A" + (saved && saved.name || payload.name));
      await loadProject(projectId);
    } catch (err) {
      setError("\u4FDD\u5B58\u73AF\u5883\u5931\u8D25\uFF1A" + errText3(err));
    }
  };
  const removeEnv = async (envId) => {
    if (!storage || typeof storage.deleteEnvironment !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.deleteEnvironment");
      return;
    }
    setError("");
    try {
      await storage.deleteEnvironment(projectId, envId);
      setNotice("\u5DF2\u5220\u9664\u73AF\u5883\uFF1A" + envId);
      await loadProject(projectId);
    } catch (err) {
      setError("\u5220\u9664\u73AF\u5883\u5931\u8D25\uFF1A" + errText3(err));
    }
  };
  const saveGlobals = async () => {
    if (!storage || typeof storage.saveGlobals !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.saveGlobals");
      return;
    }
    setError("");
    try {
      await storage.saveGlobals(projectId, { variables: globals });
      setNotice("\u5DF2\u4FDD\u5B58\u5168\u5C40\u53D8\u91CF");
      await loadProject(projectId);
    } catch (err) {
      setError("\u4FDD\u5B58\u5168\u5C40\u53D8\u91CF\u5931\u8D25\uFF1A" + errText3(err));
    }
  };
  const draftVars = normalizeVars(draft.variables);
  const varTable2 = (rows, onChange, onRemove) => /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, VAR_COLUMNS.map((c) => /* @__PURE__ */ (0, import_react.createElement)("th", { key: c }, c)))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, rows.map((v, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      value: v.key,
      onChange: (e) => onChange(i, { key: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      type: v.secret ? "password" : "text",
      value: v.value,
      onChange: (e) => onChange(i, { value: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: v.enabled, onChange: (e) => onChange(i, { enabled: e.target.checked }) })), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: v.secret, onChange: (e) => onChange(i, { secret: e.target.checked }) })), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => onRemove(i) }, "\u5220\u9664")))), rows.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: VAR_COLUMNS.length, className: "pp-muted" }, "\u6682\u65E0\u53D8\u91CF")) : null));
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "env", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u73AF\u5883\u4E0E\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08saveEnvironment / saveGlobals\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        loadProject(e.target.value);
      }
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u73AF\u5883\u5217\u8868"), envSummary(envs).map((e) => /* @__PURE__ */ (0, import_react.createElement)(
    "div",
    {
      key: e.id,
      className: "pp-tree-row",
      "data-active": draft && draft.id === e.id ? "true" : "false",
      onClick: () => pickEnv(envs.find((x) => x.id === e.id) || blankEnv())
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", null, e.name, e.isDefault ? " \xB7 \u9ED8\u8BA4" : ""),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted", style: { marginLeft: "auto" } }, e.varCount)
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => pickEnv(blankEnv()) }, "\u65B0\u5EFA\u73AF\u5883"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u73AF\u5883\u7F16\u8F91"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      value: draft.name || "",
      onChange: (e) => patchDraft({ name: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "baseUrl"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { flex: 1 },
      value: draft.baseUrl || "",
      onChange: (e) => patchDraft({ baseUrl: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8BBE\u4E3A\u9ED8\u8BA4"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      type: "checkbox",
      checked: draft.isDefault === true,
      onChange: (e) => patchDraft({ isDefault: e.target.checked })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u73AF\u5883\u53D8\u91CF"), varTable2(draftVars, setVarAt, removeVar), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: addVar }, "\u65B0\u589E\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: saveEnv }, "\u4FDD\u5B58\u73AF\u5883"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => removeEnv(draft.id || "") }, "\u5220\u9664\u73AF\u5883"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u5168\u5C40\u53D8\u91CF"), varTable2(globals, setGlobalAt, removeGlobal), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: addGlobal }, "\u65B0\u589E\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: saveGlobals }, "\u4FDD\u5B58\u5168\u5C40")))), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u53D8\u91CF\u4F18\u5148\u7EA7"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "110px" } }, "\u4F18\u5148\u7EA7"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "160px" } }, "\u4F5C\u7528\u57DF"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u8BF4\u660E"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, priorityRows().map((r) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: r.level }, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, r.level), /* @__PURE__ */ (0, import_react.createElement)("td", null, r.scope), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, r.note)))))));
}

// src/client/pages/history.jsx
var import_react11 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["history", HistoryPage]);
var REPLAY_KEY = "postapi.debug.replay";
var MOCK_ENTRIES = [
  {
    id: "his_1001",
    at: "2026-11-17T10:20:11.000Z",
    method: "GET",
    url: "http://127.0.0.1:8080/api/v1/orders?page=1",
    status: 200,
    timeMs: 42,
    bodySize: 512,
    request: { method: "GET", url: "/api/v1/orders", headers: [{ key: "Accept", value: "application/json" }], body: "" },
    response: { status: 200, headers: { "content-type": "application/json" }, body: '{\n  "code": 0\n}' }
  },
  {
    id: "his_1002",
    at: "2026-11-17T09:05:03.000Z",
    method: "POST",
    url: "http://127.0.0.1:8080/api/v1/orders",
    status: 500,
    timeMs: 918,
    bodySize: 128,
    request: { method: "POST", url: "/api/v1/orders", headers: [{ key: "Content-Type", value: "application/json" }], body: '{"skuId":"SKU-1001"}' },
    response: { status: 500, headers: { "content-type": "application/json" }, body: '{\n  "error": "internal"\n}' }
  }
];
function fmtDateTime(iso) {
  if (!iso) return "-";
  return String(iso).slice(0, 19).replace("T", " ");
}
function fmtSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "-";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}
function statusTone2(status) {
  const s = Number(status);
  if (s >= 200 && s < 300) return "success";
  if (s >= 400 && s < 500) return "warning";
  return "error";
}
function replayPayload(entry) {
  const req = entry && entry.request || {};
  return {
    method: req.method || entry && entry.method || "GET",
    url: req.url || entry && entry.url || "",
    headers: Array.isArray(req.headers) ? req.headers : [],
    body: typeof req.body === "string" ? req.body : ""
  };
}
function errText4(err) {
  return err && err.message ? err.message : String(err);
}
function HistoryPage(props) {
  const rootRef = (0, import_react11.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react11.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react11.useState)("proj_demo01");
  const [entries, setEntries] = (0, import_react11.useState)(MOCK_ENTRIES);
  const [isMock, setIsMock] = (0, import_react11.useState)(true);
  const [error, setError] = (0, import_react11.useState)("");
  const [notice, setNotice] = (0, import_react11.useState)("");
  const [detailId, setDetailId] = (0, import_react11.useState)("");
  const [pendingClear, setPendingClear] = (0, import_react11.useState)(false);
  (0, import_react11.useEffect)(() => applyTheme(rootRef.current), []);
  const load = async (id) => {
    if (!storage || typeof storage.getHistory !== "function") {
      setIsMock(true);
      setEntries(MOCK_ENTRIES);
      return;
    }
    try {
      const res = await storage.getHistory(id);
      const list = res && Array.isArray(res.entries) ? res.entries : [];
      setEntries(list);
      setIsMock(false);
      setError("");
    } catch (err) {
      setError("\u52A0\u8F7D\u5386\u53F2\u5931\u8D25\uFF1A" + errText4(err));
    }
  };
  (0, import_react11.useEffect)(() => {
    const boot = async () => {
      if (storage && typeof storage.listProjects === "function") {
        try {
          const list = await storage.listProjects();
          if (Array.isArray(list) && list.length > 0) {
            setProjects(list);
            setProjectId(list[0].id);
            await load(list[0].id);
            return;
          }
        } catch (err) {
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText4(err));
        }
      }
      setIsMock(true);
    };
    boot();
  }, []);
  const replay = (entry) => {
    try {
      localStorage.setItem(REPLAY_KEY, JSON.stringify(replayPayload(entry)));
      setNotice("\u5DF2\u5199\u5165\u56DE\u653E\u5FEB\u7167\uFF08" + REPLAY_KEY + "\uFF09\uFF0C\u5207\u5230\u8C03\u8BD5\u9875\u540E\u6309\u6B64\u5FEB\u7167\u91CD\u53D1");
    } catch (err) {
      setError("\u5199\u5165\u56DE\u653E\u5FEB\u7167\u5931\u8D25\uFF1A" + errText4(err));
      return;
    }
    window.location.hash = "#/debug";
  };
  const clear = async () => {
    if (!pendingClear) {
      setPendingClear(true);
      setNotice("\u518D\u6B21\u70B9\u51FB\u300C\u786E\u8BA4\u6E05\u7A7A\u300D\u5C06\u5220\u9664\u5F53\u524D\u9879\u76EE\u5168\u90E8\u5386\u53F2");
      return;
    }
    if (!storage || typeof storage.clearHistory !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.clearHistory");
      return;
    }
    setPendingClear(false);
    setError("");
    try {
      const res = await storage.clearHistory(projectId);
      setNotice("\u5DF2\u6E05\u7A7A\u5386\u53F2\uFF1A" + (res && res.cleared || 0) + " \u6761");
      await load(projectId);
    } catch (err) {
      setError("\u6E05\u7A7A\u5386\u53F2\u5931\u8D25\uFF1A" + errText4(err));
    }
  };
  const detail = entries.find((e) => e.id === detailId);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "history", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u8BF7\u6C42\u5386\u53F2"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage.getHistory \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08getHistory / clearHistory\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        load(e.target.value);
      }
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => load(projectId) }, "\u5237\u65B0"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: clear }, pendingClear ? "\u786E\u8BA4\u6E05\u7A7A" : "\u6E05\u7A7A\u5386\u53F2")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "150px" } }, "\u65F6\u95F4"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "80px" } }, "\u65B9\u6CD5"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "URL"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "70px" } }, "\u72B6\u6001"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "80px" } }, "\u8017\u65F6"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "90px" } }, "\u5927\u5C0F"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "130px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, entries.map((e) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: e.id }, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, fmtDateTime(e.at)), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": e.method }, e.method)), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono" }, e.url), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill", "data-tone": statusTone2(e.status) }, e.status)), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, e.timeMs, " ms"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, fmtSize(e.bodySize)), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => setDetailId(detailId === e.id ? "" : e.id) }, "\u8BE6\u60C5"), " ", /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => replay(e) }, "\u56DE\u653E")))), entries.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 7, className: "pp-muted" }, "\u6682\u65E0\u5386\u53F2\u8BB0\u5F55")) : null))), detail ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u8BE6\u60C5 \xB7 ", detail.id), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-muted" }, "\u8BF7\u6C42"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre" }, JSON.stringify(detail.request || {}, null, 2)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-muted", style: { marginTop: "var(--sp-2)" } }, "\u54CD\u5E94"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre" }, JSON.stringify(detail.response || {}, null, 2))) : null);
}

// src/client/pages/test.jsx
var import_react12 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["test", TestPage]);
var OPS = ["eq", "neq", "gt", "lt", "contains", "notContains", "exists", "notExists", "regex"];
var SOURCES = ["status", "body", "header", "time"];
var MOCK_CASES = [
  {
    id: "tc_1001",
    name: "\u8BA2\u5355\u5217\u8868\u8FD4\u56DE 200",
    endpointId: "ep_1001",
    assertions: [{ source: "status", path: "", op: "eq", value: "200", message: "\u72B6\u6001\u7801\u5E94\u4E3A 200" }],
    extractors: [],
    lastResult: null
  },
  {
    id: "tc_1002",
    name: "\u521B\u5EFA\u8BA2\u5355\u8FD4\u56DE orderId",
    endpointId: "ep_1002",
    assertions: [{ source: "body", path: "data.orderId", op: "exists", value: "", message: "body \u5E94\u542B orderId" }],
    extractors: [{ name: "orderId", path: "data.orderId" }],
    lastResult: null
  }
];
var MOCK_SCENARIOS = [
  {
    id: "ts_1001",
    name: "\u4E0B\u5355\u4E3B\u6D41\u7A0B",
    lastRun: null,
    steps: [
      { id: "stp_01", name: "\u521B\u5EFA\u8BA2\u5355", endpointId: "ep_1002", override: {}, extract: [{ name: "orderId", path: "data.orderId" }] },
      { id: "stp_02", name: "\u67E5\u8BE2\u8BA2\u5355", endpointId: "ep_1001", override: {}, extract: [] }
    ]
  }
];
function summarizeResult(res) {
  const results = res && Array.isArray(res.results) ? res.results : [];
  const steps = res && Array.isArray(res.steps) ? res.steps : [];
  const rows = results.length > 0 ? results : steps;
  const passedCount = rows.filter((r) => r && r.passed === true).length;
  return {
    passed: res && res.passed !== void 0 ? res.passed === true : passedCount === rows.length && rows.length > 0,
    total: rows.length,
    passedCount,
    failedCount: rows.length - passedCount,
    durationMs: res && res.durationMs !== void 0 ? res.durationMs : 0,
    error: res && res.error || "",
    rows
  };
}
function normalizeAssertions(list) {
  return (Array.isArray(list) ? list : []).filter((a) => a && typeof a === "object").map((a) => ({
    source: SOURCES.includes(a.source) ? a.source : "status",
    path: String(a.path || ""),
    op: OPS.includes(a.op) ? a.op : "eq",
    value: String(a.value === void 0 || a.value === null ? "" : a.value),
    message: String(a.message || "")
  }));
}
function casesOf(project) {
  const p = project && typeof project === "object" ? project : {};
  const settings = p.settings && typeof p.settings === "object" ? p.settings : {};
  const src = Array.isArray(p.testCases) ? p.testCases : Array.isArray(settings.testCases) ? settings.testCases : [];
  return src.filter((c) => c && typeof c === "object");
}
function scenariosOf(project) {
  const p = project && typeof project === "object" ? project : {};
  const settings = p.settings && typeof p.settings === "object" ? p.settings : {};
  const src = Array.isArray(p.testScenarios) ? p.testScenarios : Array.isArray(settings.testScenarios) ? settings.testScenarios : [];
  return src.filter((s) => s && typeof s === "object");
}
function errText5(err) {
  return err && err.message ? err.message : String(err);
}
function TestPage(props) {
  const rootRef = (0, import_react12.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react12.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react12.useState)("proj_demo01");
  const [project, setProject] = (0, import_react12.useState)({ endpoints: [] });
  const [cases, setCases] = (0, import_react12.useState)(MOCK_CASES);
  const [scenarios, setScenarios] = (0, import_react12.useState)(MOCK_SCENARIOS);
  const [isMock, setIsMock] = (0, import_react12.useState)(true);
  const [error, setError] = (0, import_react12.useState)("");
  const [notice, setNotice] = (0, import_react12.useState)("");
  const [tab, setTab] = (0, import_react12.useState)("cases");
  const [activeCaseId, setActiveCaseId] = (0, import_react12.useState)(MOCK_CASES[0].id);
  const [activeScenarioId, setActiveScenarioId] = (0, import_react12.useState)(MOCK_SCENARIOS[0].id);
  const [result, setResult] = (0, import_react12.useState)(null);
  const [running, setRunning] = (0, import_react12.useState)(false);
  (0, import_react12.useEffect)(() => applyTheme(rootRef.current), []);
  const loadProject = async (id) => {
    if (!storage || typeof storage.getProject !== "function") {
      setIsMock(true);
      return;
    }
    try {
      const loaded = await storage.getProject(id);
      if (loaded) {
        setProject(loaded);
        setCases(casesOf(loaded));
        setScenarios(scenariosOf(loaded));
        setIsMock(false);
      }
    } catch (err) {
      setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText5(err));
    }
  };
  (0, import_react12.useEffect)(() => {
    const boot = async () => {
      if (storage && typeof storage.listProjects === "function") {
        try {
          const list = await storage.listProjects();
          if (Array.isArray(list) && list.length > 0) {
            setProjects(list);
            setProjectId(list[0].id);
            await loadProject(list[0].id);
            return;
          }
        } catch (err) {
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText5(err));
        }
      }
      setIsMock(true);
    };
    boot();
  }, []);
  const endpoints = Array.isArray(project.endpoints) ? project.endpoints : [];
  const activeCase = cases.find((c) => c.id === activeCaseId) || null;
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || null;
  const patchCase = (patch) => {
    setCases(cases.map((c) => c.id === activeCaseId ? { ...c, ...patch } : c));
    setNotice("");
  };
  const patchAssertion = (i, patch) => {
    const next = normalizeAssertions(activeCase && activeCase.assertions);
    next[i] = { ...next[i], ...patch };
    patchCase({ assertions: next });
  };
  const addAssertion = () => patchCase({
    assertions: normalizeAssertions(activeCase && activeCase.assertions).concat([{ source: "status", path: "", op: "eq", value: "", message: "" }])
  });
  const removeAssertion = (i) => patchCase({
    assertions: normalizeAssertions(activeCase && activeCase.assertions).filter((_, idx) => idx !== i)
  });
  const patchScenario = (patch) => {
    setScenarios(scenarios.map((s) => s.id === activeScenarioId ? { ...s, ...patch } : s));
    setNotice("");
  };
  const patchStep = (i, patch) => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).slice();
    steps[i] = { ...steps[i], ...patch };
    patchScenario({ steps });
  };
  const moveStep = (i, dir) => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).slice();
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const tmp = steps[i];
    steps[i] = steps[j];
    steps[j] = tmp;
    patchScenario({ steps });
  };
  const addStep = () => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).concat([
      { id: "stp_" + Date.now().toString(36), name: "\u65B0\u6B65\u9AA4", endpointId: endpoints[0] && endpoints[0].id || "", override: {}, extract: [] }
    ]);
    patchScenario({ steps });
  };
  const removeStep = (i) => {
    const steps = (activeScenario && Array.isArray(activeScenario.steps) ? activeScenario.steps : []).filter((_, idx) => idx !== i);
    patchScenario({ steps });
  };
  const persist = async () => {
    if (!storage || typeof storage.saveProjectSettings !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B\u6301\u4E45\u5316\u5165\u53E3\uFF08saveProjectSettings\uFF09\uFF0C\u7528\u4F8B\u4E0E\u573A\u666F\u4EC5\u505C\u7559\u5728\u9875\u9762\u5185");
      return false;
    }
    setError("");
    try {
      await storage.saveProjectSettings(projectId, {
        ...project.settings || {},
        testCases: cases,
        testScenarios: scenarios
      });
      setNotice("\u5DF2\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\uFF08\u843D\u5728 project.settings.testCases / testScenarios\uFF09");
      return true;
    } catch (err) {
      setError("\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\u5931\u8D25\uFF1A" + errText5(err));
      return false;
    }
  };
  const runCase = async () => {
    if (!activeCase) return;
    if (!api || !api.test || typeof api.test.runCase !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.test.runCase\uFF08\u5951\u7EA6 \xA75 POST /test/runCase\uFF09");
      return;
    }
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await api.test.runCase(projectId, activeCase.id);
      setResult({ kind: "case", name: activeCase.name, ...summarizeResult(res) });
    } catch (err) {
      setError("\u8FD0\u884C\u7528\u4F8B\u5931\u8D25\uFF1A" + errText5(err));
    } finally {
      setRunning(false);
    }
  };
  const runScenario = async () => {
    if (!activeScenario) return;
    if (!api || !api.test || typeof api.test.runScenario !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.test.runScenario\uFF08\u5951\u7EA6 \xA75 POST /test/runScenario\uFF09");
      return;
    }
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await api.test.runScenario(projectId, activeScenario.id);
      setResult({ kind: "scenario", name: activeScenario.name, ...summarizeResult(res) });
    } catch (err) {
      setError("\u8FD0\u884C\u573A\u666F\u5931\u8D25\uFF1A" + errText5(err));
    } finally {
      setRunning(false);
    }
  };
  const caseAssertions = normalizeAssertions(activeCase && activeCase.assertions);
  const resultPanel = (emptyHint) => /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u8FD0\u884C\u7ED3\u679C"), result ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("p", { className: result.passed ? "pp-muted" : "pp-error-text" }, result.passed ? "\u901A\u8FC7" : "\u5931\u8D25", " \xB7 ", result.passedCount, "/", result.total, " \xB7 ", result.durationMs, " ms"), result.error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, result.error) : null, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "70px" } }, "\u7ED3\u679C"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u9519\u8BEF"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, result.rows.map((r, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", null, r.name || r.id || "-"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: r.passed ? "pp-muted" : "pp-error-text" }, r.passed ? "\u901A\u8FC7" : "\u5931\u8D25"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, r.error || "-"))), result.rows.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 3, className: "pp-muted" }, "\u65E0\u65AD\u8A00\u7ED3\u679C")) : null))) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, emptyHint));
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "test", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u81EA\u52A8\u5316\u6D4B\u8BD5"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage.getProject\uFF08\u7528\u4F8B\u4E0E\u573A\u666F\u5B58 project.settings.testCases / testScenarios\uFF09\uFF1B\u8FD0\u884C\u8D70 api.test.runCase / runScenario"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        loadProject(e.target.value);
      }
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: persist }, "\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": tab === "cases" ? "true" : "false", onClick: () => setTab("cases") }, "\u6D4B\u8BD5\u7528\u4F8B"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": tab === "scenarios" ? "true" : "false", onClick: () => setTab("scenarios") }, "\u6D4B\u8BD5\u573A\u666F")), tab === "cases" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u7528\u4F8B\u5217\u8868"), cases.map((c) => /* @__PURE__ */ (0, import_react.createElement)(
    "div",
    {
      key: c.id,
      className: "pp-tree-row",
      "data-active": c.id === activeCaseId ? "true" : "false",
      onClick: () => {
        setActiveCaseId(c.id);
        setResult(null);
        setError("");
      }
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", null, c.name || c.id)
  )), cases.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, "\u6682\u65E0\u7528\u4F8B") : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u7528\u4F8B\u7F16\u8F91"), activeCase ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      value: activeCase.name || "",
      onChange: (e) => patchCase({ name: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      style: { flex: 1 },
      value: activeCase.endpointId || "",
      onChange: (e) => patchCase({ endpointId: e.target.value })
    },
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u672A\u7ED1\u5B9A\uFF09"),
    endpoints.map((ep) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: ep.id, value: ep.id }, ep.method, " ", ep.url))
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u65AD\u8A00"), /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "90px" } }, "\u6765\u6E90"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u8DEF\u5F84"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "110px" } }, "\u64CD\u4F5C"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u671F\u671B\u503C"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u8BF4\u660E"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "70px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, caseAssertions.map((a, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: a.source, onChange: (e) => patchAssertion(i, { source: e.target.value }) }, SOURCES.map((s) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: s, value: s }, s)))), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      value: a.path,
      onChange: (e) => patchAssertion(i, { path: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: a.op, onChange: (e) => patchAssertion(i, { op: e.target.value }) }, OPS.map((o) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: o, value: o }, o)))), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%" },
      value: a.value,
      onChange: (e) => patchAssertion(i, { value: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { width: "100%" },
      value: a.message,
      onChange: (e) => patchAssertion(i, { message: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => removeAssertion(i) }, "\u5220\u9664")))), caseAssertions.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 6, className: "pp-muted" }, "\u6682\u65E0\u65AD\u8A00")) : null)), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: addAssertion }, "\u65B0\u589E\u65AD\u8A00"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runCase, disabled: running }, "\u8FD0\u884C\u7528\u4F8B"))) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, "\u5DE6\u4FA7\u9009\u62E9\u4E00\u4E2A\u7528\u4F8B")), resultPanel("\u5C1A\u672A\u8FD0\u884C")) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u573A\u666F\u5217\u8868"), scenarios.map((s) => /* @__PURE__ */ (0, import_react.createElement)(
    "div",
    {
      key: s.id,
      className: "pp-tree-row",
      "data-active": s.id === activeScenarioId ? "true" : "false",
      onClick: () => {
        setActiveScenarioId(s.id);
        setResult(null);
        setError("");
      }
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", null, s.name || s.id),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted", style: { marginLeft: "auto" } }, (s.steps || []).length)
  )), scenarios.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, "\u6682\u65E0\u573A\u666F") : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u6B65\u9AA4\u7F16\u6392"), activeScenario ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u573A\u666F\u540D"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      value: activeScenario.name || "",
      onChange: (e) => patchScenario({ name: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "40px" } }, "#"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u6B65\u9AA4\u540D"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "140px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, (activeScenario.steps || []).map((s, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: s.id || i }, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, i + 1), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { width: "100%" },
      value: s.name || "",
      onChange: (e) => patchStep(i, { name: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      style: { width: "100%" },
      value: s.endpointId || "",
      onChange: (e) => patchStep(i, { endpointId: e.target.value })
    },
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u672A\u7ED1\u5B9A\uFF09"),
    endpoints.map((ep) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: ep.id, value: ep.id }, ep.method, " ", ep.url))
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => moveStep(i, -1), title: "\u4E0A\u79FB" }, "\u2191"), " ", /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => moveStep(i, 1), title: "\u4E0B\u79FB" }, "\u2193"), " ", /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => removeStep(i), title: "\u5220\u9664" }, "\xD7")))), (activeScenario.steps || []).length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 4, className: "pp-muted" }, "\u6682\u65E0\u6B65\u9AA4")) : null)), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: addStep }, "\u6DFB\u52A0\u6B65\u9AA4"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runScenario, disabled: running }, "\u8FD0\u884C\u573A\u666F"))) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-empty" }, "\u5DE6\u4FA7\u9009\u62E9\u4E00\u4E2A\u573A\u666F")), resultPanel("\u5C1A\u672A\u8FD0\u884C")));
}

// src/client/pages/import.jsx
var import_react13 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["import", ImportPage]);
var IMPORT_KINDS = [
  { id: "openapi", label: "OpenAPI / Swagger", hint: "\u7C98\u8D34 OpenAPI 3 \u6216 Swagger 2 JSON/YAML \u6587\u672C" },
  { id: "postman", label: "Postman", hint: "\u7C98\u8D34 Postman Collection v2.1 JSON \u6587\u672C" },
  { id: "har", label: "HAR", hint: "\u7C98\u8D34\u6D4F\u89C8\u5668\u5BFC\u51FA\u7684 HAR JSON \u6587\u672C" },
  { id: "curl", label: "cURL", hint: "\u7C98\u8D34 cURL \u547D\u4EE4\uFF08\u53EF\u591A\u6761\uFF0C\u9010\u884C\uFF09" }
];
var EXPORT_KINDS = [
  { id: "openapi", label: "OpenAPI 3" },
  { id: "postman", label: "Postman" },
  { id: "har", label: "HAR" },
  { id: "markdown", label: "Markdown" }
];
var LANGS = [
  { id: "curl", label: "cURL" },
  { id: "fetch", label: "JavaScript fetch" },
  { id: "axios", label: "JavaScript axios" },
  { id: "python", label: "Python requests" },
  { id: "go", label: "Go net/http" }
];
var MOCK_CURL = "curl -X GET 'https://api.example.test/api/v1/orders?page=1' -H 'Accept: application/json'";
var MOCK_ENDPOINT = {
  id: "ep_1001",
  name: "\u67E5\u8BE2\u8BA2\u5355\u5217\u8868",
  method: "GET",
  url: "https://api.example.test/api/v1/orders",
  params: [{ key: "page", value: "1", enabled: true }],
  headers: [{ key: "Accept", value: "application/json", enabled: true }],
  body: { type: "none", content: "" }
};
function resultText(value) {
  if (value === void 0 || value === null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function importSummary(res) {
  const data = res && res.data !== void 0 ? res.data : res;
  if (!data || typeof data !== "object") return { endpoints: 0, folders: 0, schemas: 0 };
  const count = (v) => Array.isArray(v) ? v.length : 0;
  return {
    endpoints: count(data.endpoints),
    folders: count(data.folders),
    schemas: count(data.schemas)
  };
}
function errText6(err) {
  return err && err.message ? err.message : String(err);
}
function ImportPage(props) {
  const rootRef = (0, import_react13.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react13.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react13.useState)("proj_demo01");
  const [isMock, setIsMock] = (0, import_react13.useState)(true);
  const [error, setError] = (0, import_react13.useState)("");
  const [notice, setNotice] = (0, import_react13.useState)("");
  const [importKind, setImportKind] = (0, import_react13.useState)("openapi");
  const [importText, setImportText] = (0, import_react13.useState)(MOCK_CURL);
  const [importOut, setImportOut] = (0, import_react13.useState)("");
  const [exportKind, setExportKind] = (0, import_react13.useState)("openapi");
  const [exportOut, setExportOut] = (0, import_react13.useState)("");
  const [lang, setLang] = (0, import_react13.useState)("curl");
  const [codeOut, setCodeOut] = (0, import_react13.useState)("");
  const [busy, setBusy] = (0, import_react13.useState)(false);
  (0, import_react13.useEffect)(() => applyTheme(rootRef.current), []);
  (0, import_react13.useEffect)(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== "function") return;
      try {
        const list = await storage.listProjects();
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list);
          setProjectId(list[0].id);
          setIsMock(false);
        }
      } catch (err) {
        setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText6(err));
      }
    };
    boot();
  }, []);
  const pickImportKind = (id) => {
    setImportKind(id);
    setImportOut("");
    setError("");
  };
  const runImport = async () => {
    const fn = api && api.import && api.import[importKind];
    if (typeof fn !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.import." + importKind + "\uFF08\u5951\u7EA6 \xA75 POST /import/" + importKind + "\uFF09");
      return;
    }
    const raw = String(importText || "");
    if (!raw.trim()) {
      setError("\u5BFC\u5165\u5185\u5BB9\u4E3A\u7A7A");
      return;
    }
    let payload = raw;
    if (importKind !== "curl") {
      try {
        payload = JSON.parse(raw);
      } catch (err) {
        setError("\u5BFC\u5165\u5185\u5BB9\u4E0D\u662F\u5408\u6CD5 JSON\uFF1A" + errText6(err));
        return;
      }
    }
    setBusy(true);
    setError("");
    setImportOut("");
    try {
      const res = await fn(payload);
      const summary = importSummary(res);
      setImportOut(resultText(res));
      setNotice("\u5BFC\u5165\u5B8C\u6210\uFF1A\u63A5\u53E3 " + summary.endpoints + " \u6761 / \u76EE\u5F55 " + summary.folders + " \u4E2A / \u6A21\u578B " + summary.schemas + " \u4E2A\uFF08\u5BFC\u5165\u7ED3\u679C\u9700\u5728\u6587\u6863\u9875\u786E\u8BA4\u540E\u518D\u4FDD\u5B58\uFF09");
    } catch (err) {
      setError("\u5BFC\u5165\u5931\u8D25\uFF1A" + errText6(err));
    } finally {
      setBusy(false);
    }
  };
  const runExport = async (kind) => {
    const id = kind || exportKind;
    const fn = api && api.export && api.export[id];
    if (typeof fn !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.export." + id + "\uFF08\u5951\u7EA6 \xA75 POST /export/" + id + "\uFF09");
      return;
    }
    if (!storage || typeof storage.getProject !== "function") {
      setError("\u5BFC\u51FA\u9700\u8981\u5148\u8BFB\u53D6\u9879\u76EE\uFF1A\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.getProject");
      return;
    }
    setBusy(true);
    setError("");
    setExportOut("");
    try {
      const project = await storage.getProject(projectId);
      const res = await fn(project);
      setExportKind(id);
      setExportOut(resultText(res));
      setNotice("\u5BFC\u51FA\u5B8C\u6210\uFF1A" + id);
    } catch (err) {
      setError("\u5BFC\u51FA\u5931\u8D25\uFF1A" + errText6(err));
    } finally {
      setBusy(false);
    }
  };
  const runCodegen = async () => {
    if (!api || !api.codegen || typeof api.codegen.run !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.codegen.run\uFF08\u5951\u7EA6 \xA75 POST /codegen/run\uFF09");
      return;
    }
    setBusy(true);
    setError("");
    setCodeOut("");
    try {
      const res = await api.codegen.run({ endpoint: MOCK_ENDPOINT, lang });
      setCodeOut(resultText(res));
      setNotice("\u4EE3\u7801\u751F\u6210\u5B8C\u6210\uFF1A" + lang);
    } catch (err) {
      setError("\u4EE3\u7801\u751F\u6210\u5931\u8D25\uFF1A" + errText6(err));
    } finally {
      setBusy(false);
    }
  };
  const copy = async (text, label) => {
    if (!text) {
      setError("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9\uFF08\u5148\u6267\u884C\u4E00\u6B21\uFF09");
      return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setNotice(label + "\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
      } else {
        setError("\u5F53\u524D\u73AF\u5883\u65E0\u526A\u8D34\u677F\u6743\u9650\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u4E0B\u65B9\u6587\u672C\u590D\u5236");
      }
    } catch (err) {
      setError("\u590D\u5236\u5931\u8D25\uFF1A" + errText6(err));
    }
  };
  const currentImport = IMPORT_KINDS.find((k) => k.id === importKind) || IMPORT_KINDS[0];
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "import", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u5BFC\u5165\u5BFC\u51FA\u4E0E\u4EE3\u7801\u751F\u6210"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api \u6865\u4E0D\u53EF\u7528\uFF0C\u64CD\u4F5C\u6309\u94AE\u4F1A\u63D0\u793A\u7F3A\u5931\u7684\u65B9\u6CD5" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.import / api.export / api.codegen"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: projectId, onChange: (e) => setProjectId(e.target.value) }, projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id)))), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title" }, "\u5BFC\u5165"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, IMPORT_KINDS.map((k) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: k.id,
      className: "pp-tab",
      "data-active": importKind === k.id ? "true" : "false",
      onClick: () => pickImportKind(k.id)
    },
    k.label
  ))), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted", style: { marginTop: "var(--sp-2)" } }, currentImport.hint), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%", minHeight: "var(--ctl-h)" },
      rows: 8,
      value: importText,
      onChange: (e) => setImportText(e.target.value)
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runImport, disabled: busy }, "\u5F00\u59CB\u5BFC\u5165"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => copy(importOut, "\u5BFC\u5165\u7ED3\u679C") }, "\u590D\u5236\u7ED3\u679C")), importOut ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre", style: { marginTop: "var(--sp-2)" } }, importOut) : null), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u5BFC\u51FA"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" } }, EXPORT_KINDS.map((k) => /* @__PURE__ */ (0, import_react.createElement)("button", { key: k.id, className: "pp-btn", onClick: () => runExport(k.id), disabled: busy }, k.label)), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => copy(exportOut, "\u5BFC\u51FA\u7ED3\u679C") }, "\u590D\u5236\u7ED3\u679C")), exportOut ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre", style: { marginTop: "var(--sp-2)" } }, exportOut) : null), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u4EE3\u7801\u751F\u6210"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8BED\u8A00"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: lang, onChange: (e) => setLang(e.target.value) }, LANGS.map((l) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: l.id, value: l.id }, l.label))), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runCodegen, disabled: busy }, "\u751F\u6210\u4EE3\u7801"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => copy(codeOut, "\u751F\u6210\u4EE3\u7801") }, "\u590D\u5236\u4EE3\u7801")), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u793A\u4F8B\u63A5\u53E3\uFF1A", MOCK_ENDPOINT.method, " ", MOCK_ENDPOINT.url), codeOut ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre" }, codeOut) : null));
}

// src/client/pages/flow.jsx
var import_react15 = __toESM(require("react"), 1);

// src/client/pages/sequence.jsx
var import_react14 = require("react");
var W = 960;
var MARGIN_X = 64;
var ACTOR_W = 132;
var ACTOR_H = 36;
var TOP_Y = 40;
var LIFELINE_TOP = TOP_Y + ACTOR_H;
var MSG_START = 108;
var MSG_GAP = 32;
var NOTE_GAP = 24;
var ACT_W = 8;
var FRAME_PAD_X = 40;
var FRAME_PAD_TOP = 22;
var FRAME_PAD_BOTTOM = 24;
var BOTTOM_PAD = 28;
var LEGEND_H = 44;
var INK = "var(--fg)";
var MUTED = "var(--fg-secondary)";
var ACCENT = "var(--accent)";
var PAPER = "var(--paper)";
var FONT_SANS = "var(--font-sans)";
var FONT_MONO = "var(--font-mono)";
function collectActors(steps) {
  const actors = [];
  for (const s of steps) {
    for (const name of [s.actor, s.target]) {
      if (name && !actors.includes(name)) actors.push(name);
    }
  }
  return actors;
}
function centerX(i, n) {
  if (n <= 1) return W / 2;
  return MARGIN_X + i * (W - 2 * MARGIN_X) / (n - 1);
}
function layoutSequence(steps) {
  const actors = collectActors(steps);
  const centers = actors.map((_, i) => centerX(i, actors.length));
  const idxOf = (name) => actors.indexOf(name);
  const rows = [];
  let y = MSG_START;
  for (const step of steps) {
    rows.push({ step, y });
    y += step.action === "note" ? NOTE_GAP : MSG_GAP;
    if (step.guard) y += 16;
    if (step.divider) y += 16;
  }
  const contentBottom = rows.length ? rows[rows.length - 1].y + 20 : MSG_START;
  const frames = [];
  let open = null;
  rows.forEach((row, i) => {
    const s = row.step;
    if (s.op === "alt" || s.op === "opt") {
      if (open) frames.push(closeFrame(open, i - 1));
      open = { op: s.op, startIdx: i, guards: [], dividers: [] };
    }
    if (open) {
      if (s.guard) open.guards.push({ text: s.guard, y: row.y - (s.divider ? 32 : 16) });
      if (s.divider) open.dividers.push(row.y - 8);
    }
  });
  if (open) frames.push(closeFrame(open, rows.length - 1));
  function closeFrame(frame, endIdx) {
    const from = rows[frame.startIdx].y;
    const to = rows[endIdx].y;
    const participants = /* @__PURE__ */ new Set();
    for (let i = frame.startIdx; i <= endIdx; i++) {
      const s = rows[i].step;
      if (s.actor) participants.add(s.actor);
      if (s.target) participants.add(s.target);
    }
    const idxs = [...participants].map(idxOf).filter((i) => i >= 0);
    const left = Math.min(...idxs);
    const right = Math.max(...idxs);
    const x = centers[left] - FRAME_PAD_X;
    const w = centers[right] - centers[left] + FRAME_PAD_X * 2;
    return {
      op: frame.op,
      guards: frame.guards,
      dividers: frame.dividers,
      x,
      y: from - FRAME_PAD_TOP,
      w,
      h: to - from + FRAME_PAD_TOP + FRAME_PAD_BOTTOM
    };
  }
  const activations = [];
  rows.forEach((row, i) => {
    const s = row.step;
    if (s.action !== "call" || !s.target) return;
    let endY = rows[rows.length - 1].y;
    for (let j = i + 1; j < rows.length; j++) {
      const r = rows[j].step;
      if (r.action === "return" && r.actor === s.target) {
        endY = rows[j].y;
        break;
      }
    }
    activations.push({ cx: centers[idxOf(s.target)], fromY: row.y, toY: endY });
  });
  const height = contentBottom + BOTTOM_PAD + LEGEND_H;
  return { actors, centers, idxOf, rows, frames, activations, width: W, height, lifelineBottom: contentBottom + 8 };
}
function exportSequenceSvg(svgEl, filename = "flow-sequence.svg") {
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(svgEl) : null;
  const raw = new XMLSerializer().serializeToString(clone);
  const resolved = cs ? raw.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || "#000000") : raw;
  const blob = new Blob([resolved], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function msgLabel(row) {
  const s = row.step;
  if (s.action === "note") return s.message || "";
  return (s.message || "").toUpperCase();
}
function maskWidth(text) {
  return Math.max(24, Math.round(text.length * 5 + 10));
}
function SequenceDiagram({ steps, idPrefix = "flow-seq", title = "\u65F6\u5E8F\u56FE", desc = "\u63A5\u53E3\u8C03\u7528\u65F6\u5E8F", svgRef: externalSvgRef }) {
  const innerRef = (0, import_react14.useRef)(null);
  const svgRef = externalSvgRef || innerRef;
  if (!steps || steps.length === 0) return null;
  const L = layoutSequence(steps);
  const { actors, centers, idxOf, rows, frames, activations, width, height, lifelineBottom } = L;
  const aId = idPrefix + "-title";
  const dId = idPrefix + "-desc";
  const markers = /* @__PURE__ */ (0, import_react.createElement)("defs", null, /* @__PURE__ */ (0, import_react.createElement)("marker", { id: idPrefix + "-arrow", markerWidth: "8", markerHeight: "6", refX: "7", refY: "3", orient: "auto" }, /* @__PURE__ */ (0, import_react.createElement)("polygon", { points: "0 0, 8 3, 0 6", fill: MUTED })), /* @__PURE__ */ (0, import_react.createElement)("marker", { id: idPrefix + "-arrow-accent", markerWidth: "8", markerHeight: "6", refX: "7", refY: "3", orient: "auto" }, /* @__PURE__ */ (0, import_react.createElement)("polygon", { points: "0 0, 8 3, 0 6", fill: ACCENT })));
  const lifelines = actors.map((name, i) => /* @__PURE__ */ (0, import_react.createElement)(
    "line",
    {
      key: "ll-" + name,
      x1: centers[i],
      y1: LIFELINE_TOP,
      x2: centers[i],
      y2: lifelineBottom,
      stroke: INK,
      strokeOpacity: "0.2",
      strokeWidth: "1",
      strokeDasharray: "3,3"
    }
  ));
  const acts = activations.map((a, i) => /* @__PURE__ */ (0, import_react.createElement)(
    "rect",
    {
      key: "act-" + i,
      x: a.cx - ACT_W / 2,
      y: a.fromY,
      width: ACT_W,
      height: Math.max(a.toY - a.fromY, 16),
      fill: INK,
      fillOpacity: "0.06",
      stroke: MUTED,
      strokeWidth: "0.8"
    }
  ));
  const messages = rows.map((row, i) => {
    const s = row.step;
    const y = row.y;
    if (s.action === "note") {
      const cx = centers[idxOf(s.actor)] ?? W / 2;
      return /* @__PURE__ */ (0, import_react.createElement)("g", { key: "m-" + i }, /* @__PURE__ */ (0, import_react.createElement)(
        "rect",
        {
          x: cx - 60,
          y: y - 12,
          width: 120,
          height: 20,
          rx: "4",
          fill: PAPER,
          stroke: INK,
          strokeOpacity: "0.22",
          strokeWidth: "1"
        }
      ), /* @__PURE__ */ (0, import_react.createElement)(
        "text",
        {
          x: cx,
          y: y + 2,
          fill: MUTED,
          fontSize: "8",
          fontFamily: FONT_MONO,
          textAnchor: "middle",
          letterSpacing: "0.04em"
        },
        (s.message || "").toUpperCase()
      ));
    }
    if (s.action === "self") {
      const cx = centers[idxOf(s.actor)] ?? W / 2;
      const label2 = msgLabel(row);
      return /* @__PURE__ */ (0, import_react.createElement)("g", { key: "m-" + i }, /* @__PURE__ */ (0, import_react.createElement)(
        "path",
        {
          d: `M ${cx} ${y} h 28 v 20 h -28`,
          fill: "none",
          stroke: MUTED,
          strokeWidth: "1",
          markerEnd: `url(#${idPrefix}-arrow)`
        }
      ), /* @__PURE__ */ (0, import_react.createElement)("rect", { x: cx + 36, y: y - 6, width: maskWidth(label2), height: 12, rx: "2", fill: PAPER }), /* @__PURE__ */ (0, import_react.createElement)(
        "text",
        {
          x: cx + 36 + maskWidth(label2) / 2,
          y: y + 3,
          fill: MUTED,
          fontSize: "8",
          fontFamily: FONT_MONO,
          textAnchor: "middle",
          letterSpacing: "0.06em"
        },
        label2
      ));
    }
    const from = centers[idxOf(s.actor)];
    const to = centers[idxOf(s.target)];
    if (from == null || to == null || from === to) return null;
    const left = Math.min(from, to);
    const right = Math.max(from, to);
    const x1 = from < to ? from + ACT_W / 2 : from - ACT_W / 2;
    const x2 = from < to ? to - ACT_W / 2 : to + ACT_W / 2;
    const isReturn = s.action === "return";
    const headline = s.headline === true;
    const stroke = headline ? ACCENT : MUTED;
    const marker = headline ? idPrefix + "-arrow-accent" : idPrefix + "-arrow";
    const label = msgLabel(row);
    const mw = maskWidth(label);
    return /* @__PURE__ */ (0, import_react.createElement)("g", { key: "m-" + i }, /* @__PURE__ */ (0, import_react.createElement)(
      "line",
      {
        x1,
        y1: y,
        x2,
        y2: y,
        stroke,
        strokeWidth: "1",
        strokeDasharray: isReturn && !headline ? "5,4" : void 0,
        markerEnd: `url(#${marker})`
      }
    ), /* @__PURE__ */ (0, import_react.createElement)("rect", { x: (left + right) / 2 - mw / 2, y: y - 20, width: mw, height: 12, rx: "2", fill: PAPER }), /* @__PURE__ */ (0, import_react.createElement)(
      "text",
      {
        x: (left + right) / 2,
        y: y - 11,
        fill: MUTED,
        fontSize: "8",
        fontFamily: FONT_MONO,
        textAnchor: "middle",
        letterSpacing: "0.06em"
      },
      label
    ));
  });
  const frameEls = frames.map((f, i) => /* @__PURE__ */ (0, import_react.createElement)("g", { key: "f-" + i }, /* @__PURE__ */ (0, import_react.createElement)(
    "rect",
    {
      x: f.x,
      y: f.y,
      width: f.w,
      height: f.h,
      rx: "4",
      fill: INK,
      fillOpacity: "0.02",
      stroke: INK,
      strokeOpacity: "0.22",
      strokeWidth: "1"
    }
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "rect",
    {
      x: f.x,
      y: f.y,
      width: "40",
      height: "16",
      rx: "2",
      fill: PAPER,
      stroke: INK,
      strokeOpacity: "0.22",
      strokeWidth: "1"
    }
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "text",
    {
      x: f.x + 20,
      y: f.y + 12,
      fill: MUTED,
      fontSize: "8",
      fontFamily: FONT_MONO,
      textAnchor: "middle",
      letterSpacing: "0.12em"
    },
    f.op.toUpperCase()
  ), f.guards.map((g, gi) => /* @__PURE__ */ (0, import_react.createElement)(
    "text",
    {
      key: "g-" + gi,
      x: f.x + 12,
      y: g.y,
      fill: MUTED,
      fontSize: "8",
      fontFamily: FONT_MONO,
      letterSpacing: "0.04em"
    },
    g.text
  )), f.dividers.map((dy, di) => /* @__PURE__ */ (0, import_react.createElement)(
    "line",
    {
      key: "d-" + di,
      x1: f.x + 8,
      y1: dy,
      x2: f.x + f.w - 8,
      y2: dy,
      stroke: INK,
      strokeOpacity: "0.2",
      strokeWidth: "1",
      strokeDasharray: "4,3"
    }
  ))));
  const actorBoxes = actors.map((name, i) => /* @__PURE__ */ (0, import_react.createElement)("g", { key: "a-" + name }, /* @__PURE__ */ (0, import_react.createElement)(
    "rect",
    {
      x: centers[i] - ACTOR_W / 2,
      y: TOP_Y,
      width: ACTOR_W,
      height: ACTOR_H,
      rx: "6",
      fill: PAPER,
      stroke: INK,
      strokeWidth: "1"
    }
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "text",
    {
      x: centers[i],
      y: TOP_Y + 23,
      fill: INK,
      fontSize: "12",
      fontWeight: "600",
      fontFamily: FONT_SANS,
      textAnchor: "middle"
    },
    name
  )));
  const legendY = height - LEGEND_H + 8;
  const legend = /* @__PURE__ */ (0, import_react.createElement)("g", null, /* @__PURE__ */ (0, import_react.createElement)(
    "line",
    {
      x1: MARGIN_X,
      y1: legendY - 8,
      x2: width - MARGIN_X,
      y2: legendY - 8,
      stroke: INK,
      strokeOpacity: "0.1",
      strokeWidth: "0.8"
    }
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "text",
    {
      x: MARGIN_X,
      y: legendY + 8,
      fill: MUTED,
      fontSize: "8",
      fontFamily: FONT_MONO,
      letterSpacing: "0.14em"
    },
    "LEGEND"
  ), /* @__PURE__ */ (0, import_react.createElement)("text", { x: MARGIN_X + 80, y: legendY + 8, fill: MUTED, fontSize: "8", fontFamily: FONT_MONO }, "SOLID = CALL"), /* @__PURE__ */ (0, import_react.createElement)("text", { x: MARGIN_X + 200, y: legendY + 8, fill: MUTED, fontSize: "8", fontFamily: FONT_MONO }, "DASHED = RETURN"), /* @__PURE__ */ (0, import_react.createElement)("text", { x: MARGIN_X + 340, y: legendY + 8, fill: ACCENT, fontSize: "8", fontFamily: FONT_MONO }, "ACCENT = HEADLINE"), /* @__PURE__ */ (0, import_react.createElement)("text", { x: MARGIN_X + 520, y: legendY + 8, fill: MUTED, fontSize: "8", fontFamily: FONT_MONO }, "FRAME = BRANCH"));
  return /* @__PURE__ */ (0, import_react.createElement)(
    "svg",
    {
      ref: svgRef,
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-labelledby": `${aId} ${dId}`,
      style: { width: "100%", height: "auto", display: "block" }
    },
    /* @__PURE__ */ (0, import_react.createElement)("title", { id: aId }, title),
    /* @__PURE__ */ (0, import_react.createElement)("desc", { id: dId }, desc),
    markers,
    frameEls,
    lifelines,
    acts,
    messages,
    actorBoxes,
    legend
  );
}

// src/client/pages/flow.jsx
(window.__postapiQueue = window.__postapiQueue || []).push(["flow", FlowPage]);
var ACTIONS = ["call", "return", "self", "note"];
var DEFAULT_STEPS = [
  { actor: "\u9875\u9762", action: "call", target: "Storage", message: "loadProject", note: "" },
  { actor: "Storage", action: "return", target: "\u9875\u9762", message: "project", note: "" },
  { actor: "\u9875\u9762", action: "call", target: "Request", message: "send", note: "" },
  { actor: "Request", action: "call", target: "Server", message: "GET /users", note: "" },
  { actor: "Server", action: "return", target: "Request", message: "200 OK", note: "", headline: true },
  { actor: "Request", action: "self", target: "", message: "serialize body", note: "" },
  { actor: "Request", action: "return", target: "\u9875\u9762", message: "result", note: "" },
  { actor: "\u9875\u9762", action: "self", target: "", message: "render doc", note: "", op: "alt", guard: "[status 2xx]" },
  { actor: "\u9875\u9762", action: "self", target: "", message: "toast error", note: "", divider: true, guard: "[else]" }
];
var DRAFT_KEY = "postapi.flow.draft";
function normalizeSteps(steps) {
  return (Array.isArray(steps) ? steps : []).filter((s) => s && typeof s === "object").map((s) => {
    const out = {
      actor: String(s.actor || ""),
      action: ACTIONS.includes(s.action) ? s.action : "call",
      target: String(s.target || ""),
      message: String(s.message || ""),
      note: String(s.note || "")
    };
    if (s.op === "alt" || s.op === "opt") out.op = s.op;
    if (s.guard) out.guard = String(s.guard);
    if (s.divider === true) out.divider = true;
    if (s.headline === true) out.headline = true;
    return out;
  });
}
function flowPayload(name, steps) {
  return { name: String(name || ""), steps: normalizeSteps(steps) };
}
function loadDraft() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DRAFT_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? normalizeSteps(parsed) : null;
  } catch {
    return null;
  }
}
function saveDraft(steps) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeSteps(steps)));
  } catch {
  }
}
function errText7(err) {
  return err && err.message ? err.message : String(err);
}
function FlowPage(props) {
  const rootRef = (0, import_react15.useRef)(null);
  const svgRef = (0, import_react15.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react15.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react15.useState)("proj_demo01");
  const [flowName, setFlowName] = (0, import_react15.useState)("\u63A5\u53E3\u8C03\u8BD5\u65F6\u5E8F");
  const [steps, setSteps] = (0, import_react15.useState)(() => loadDraft() || DEFAULT_STEPS);
  const [isMock, setIsMock] = (0, import_react15.useState)(true);
  const [error, setError] = (0, import_react15.useState)("");
  const [notice, setNotice] = (0, import_react15.useState)("");
  (0, import_react15.useEffect)(() => {
    applyTheme(rootRef.current);
    saveDraft(steps);
  }, [steps]);
  (0, import_react15.useEffect)(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== "function") return;
      try {
        const list = await storage.listProjects();
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list);
          setProjectId(list[0].id);
          setIsMock(false);
          if (typeof storage.getProject === "function") {
            const loaded = await storage.getProject(list[0].id);
            const flow = loaded && loaded.flow;
            if (flow && Array.isArray(flow.steps) && flow.steps.length > 0) {
              setSteps(normalizeSteps(flow.steps));
              setFlowName(flow.name || "\u63A5\u53E3\u8C03\u8BD5\u65F6\u5E8F");
            }
          }
        }
      } catch (err) {
        setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText7(err));
      }
    };
    boot();
  }, []);
  const overBudget = steps.length > 9;
  const update = (i, patch) => {
    setSteps(steps.map((s, idx) => idx === i ? { ...s, ...patch } : s));
    setNotice("");
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    setSteps(next);
    setNotice("");
  };
  const remove = (i) => {
    setSteps(steps.filter((_, idx) => idx !== i));
    setNotice("");
  };
  const add = () => {
    setSteps(steps.concat([{ actor: "\u9875\u9762", action: "call", target: "Storage", message: "", note: "" }]));
    setNotice("");
  };
  const reloadProject = async (id) => {
    if (!storage || typeof storage.getProject !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.getProject");
      return;
    }
    setError("");
    try {
      const loaded = await storage.getProject(id);
      const flow = loaded && loaded.flow;
      if (flow && Array.isArray(flow.steps)) {
        setSteps(normalizeSteps(flow.steps));
        setFlowName(flow.name || "\u63A5\u53E3\u8C03\u8BD5\u65F6\u5E8F");
        setNotice("\u5DF2\u8F7D\u5165\u9879\u76EE\u6D41\u7A0B\u56FE\uFF1A" + (flow.name || "\u672A\u547D\u540D"));
      } else {
        setNotice("\u8BE5\u9879\u76EE\u5C1A\u65E0\u6D41\u7A0B\u56FE\uFF0C\u53EF\u7F16\u8F91\u540E\u4FDD\u5B58");
      }
    } catch (err) {
      setError("\u8F7D\u5165\u6D41\u7A0B\u56FE\u5931\u8D25\uFF1A" + errText7(err));
    }
  };
  const persist = async () => {
    if (!storage || typeof storage.saveFlow !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.saveFlow\uFF0C\u7F16\u6392\u7ED3\u679C\u4EC5\u4FDD\u5B58\u5728\u672C\u5730\u8349\u7A3F\uFF08" + DRAFT_KEY + "\uFF09");
      return;
    }
    setError("");
    try {
      const payload = flowPayload(flowName, steps);
      await storage.saveFlow(projectId, payload);
      setNotice("\u5DF2\u4FDD\u5B58\u6D41\u7A0B\u56FE\uFF1A" + (payload.name || "\u672A\u547D\u540D") + "\uFF08" + payload.steps.length + " \u6B65\uFF09");
    } catch (err) {
      setError("\u4FDD\u5B58\u6D41\u7A0B\u56FE\u5931\u8D25\uFF1A" + errText7(err));
    }
  };
  const copyJson = async () => {
    const text = JSON.stringify(flowPayload(flowName, steps), null, 2);
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setNotice("flow JSON \u5DF2\u590D\u5236");
        return;
      } catch (err) {
        setError("\u590D\u5236\u5931\u8D25\uFF1A" + errText7(err));
        return;
      }
    }
    setError("\u5F53\u524D\u73AF\u5883\u65E0\u526A\u8D34\u677F\u6743\u9650\uFF0C\u8BF7\u624B\u52A8\u590D\u5236 JSON");
  };
  const exportSvg = () => exportSequenceSvg(svgRef.current, "flow-sequence.svg");
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "flow", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u6D41\u7A0B\u56FE"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage.saveFlow \u4E0D\u53EF\u7528\uFF0C\u7F16\u6392\u7ED3\u679C\u4EC5\u5B58\u672C\u5730\u8349\u7A3F\uFF08" + DRAFT_KEY + "\uFF09" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08getProject / saveFlow\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, overBudget && /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-split-hint", style: { marginBottom: "var(--sp-3)" } }, "\u5F53\u524D ", steps.length, " \u6B65\uFF0C\u8D85\u8FC7 9 \u6B65\u5BC6\u5EA6\u9884\u7B97\uFF084/10\uFF09\u2014\u2014\u5EFA\u8BAE\u62C6\u5206\u4E3A\u300C\u4E3B\u6D41\u7A0B\u300D\u4E0E\u300C\u5206\u652F/\u5F02\u5E38\u300D\u4E24\u5F20\u56FE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        reloadProject(e.target.value);
      }
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u56FE\u540D"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      value: flowName,
      onChange: (e) => {
        setFlowName(e.target.value);
        setNotice("");
      }
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: persist }, "\u4FDD\u5B58\u5230\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: exportSvg }, "\u5BFC\u51FA SVG"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: copyJson }, "\u590D\u5236 JSON"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-seq-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(
    SequenceDiagram,
    {
      steps,
      svgRef,
      idPrefix: "flow-page-seq",
      title: flowName || "\u63A5\u53E3\u8C03\u8BD5\u65F6\u5E8F",
      desc: "\u9875\u9762\u7ECF Storage \u8F7D\u5165\u9879\u76EE\u3001Request \u53D1\u8D77 HTTP \u8C03\u7528\uFF0C\u5E76\u6309\u54CD\u5E94\u72B6\u6001\u6E32\u67D3\u6216\u63D0\u793A\u9519\u8BEF\u7684\u65F6\u5E8F\u56FE"
    }
  ))), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u6B65\u9AA4\u7F16\u6392"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "40px" } }, "#"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "110px" } }, "\u53D1\u8D77\u65B9"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "110px" } }, "\u52A8\u4F5C"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "110px" } }, "\u63A5\u6536\u65B9"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u6D88\u606F"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "140px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, steps.map((s, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, i + 1), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { width: "100%" },
      value: s.actor,
      onChange: (e) => update(i, { actor: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      style: { width: "100%" },
      value: s.action,
      onChange: (e) => update(i, { action: e.target.value })
    },
    ACTIONS.map((a) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: a, value: a }, a))
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { width: "100%" },
      value: s.target || "",
      onChange: (e) => update(i, { target: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { width: "100%" },
      value: s.message || "",
      onChange: (e) => update(i, { message: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => move(i, -1), title: "\u4E0A\u79FB" }, "\u2191"), " ", /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => move(i, 1), title: "\u4E0B\u79FB" }, "\u2193"), " ", /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => remove(i), title: "\u5220\u9664" }, "\xD7")))))), /* @__PURE__ */ (0, import_react.createElement)("div", { style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: add }, "+ \u6DFB\u52A0\u6B65\u9AA4"))));
}

// src/client/pages/search.jsx
var import_react16 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["search", SearchPage]);
var MOCK_RESULT = {
  endpoints: [{ id: "ep_1001", name: "\u67E5\u8BE2\u8BA2\u5355\u5217\u8868", method: "GET", url: "/api/v1/orders" }],
  schemas: [{ id: "sch_order", name: "Order", description: "\u8BA2\u5355\u5BF9\u8C61" }],
  folders: [{ id: "fld_01", name: "\u8BA2\u5355\u7BA1\u7406" }]
};
var GROUPS = [
  { key: "endpoints", label: "\u63A5\u53E3", target: (id) => "#/doc/" + encodeURIComponent(id) },
  { key: "schemas", label: "\u6570\u636E\u6A21\u578B", target: (id) => "#/schema/" + encodeURIComponent(id) },
  { key: "folders", label: "\u76EE\u5F55", target: (id) => "#/doc/" + encodeURIComponent(id) }
];
function groupResults(res) {
  const data = res && res.data !== void 0 ? res.data : res;
  const out = {};
  for (const g of GROUPS) {
    const list = data && Array.isArray(data[g.key]) ? data[g.key] : [];
    out[g.key] = list.map((item) => ({
      id: item && item.id ? item.id : "",
      title: item && (item.name || item.url) || item && item.id || "(\u672A\u547D\u540D)",
      method: item && item.method ? item.method : "",
      url: item && item.url ? item.url : "",
      description: item && item.description ? item.description : ""
    }));
  }
  return out;
}
function hasKeyword(keyword) {
  return String(keyword || "").trim().length > 0;
}
function errText8(err) {
  return err && err.message ? err.message : String(err);
}
function readQueryKeyword(query) {
  const raw = String(query || "");
  const at = raw.indexOf("q=");
  if (at < 0) return "";
  const value = raw.slice(at + 2).split("&")[0];
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function SearchPage(props) {
  const rootRef = (0, import_react16.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const route = props && props.route || {};
  const [projects, setProjects] = (0, import_react16.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react16.useState)("proj_demo01");
  const [keyword, setKeyword] = (0, import_react16.useState)(() => readQueryKeyword(route.query));
  const [groups, setGroups] = (0, import_react16.useState)(groupResults(MOCK_RESULT));
  const [isMock, setIsMock] = (0, import_react16.useState)(true);
  const [searched, setSearched] = (0, import_react16.useState)(false);
  const [error, setError] = (0, import_react16.useState)("");
  (0, import_react16.useEffect)(() => applyTheme(rootRef.current), []);
  (0, import_react16.useEffect)(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== "function") return;
      try {
        const list = await storage.listProjects();
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list);
          setProjectId(list[0].id);
          setIsMock(false);
        }
      } catch (err) {
        setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText8(err));
      }
    };
    boot();
  }, []);
  const runSearch = async () => {
    if (!hasKeyword(keyword)) {
      setError("\u8BF7\u8F93\u5165\u5173\u952E\u5B57");
      return;
    }
    if (!storage || typeof storage.search !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.search");
      return;
    }
    setError("");
    try {
      const res = await storage.search(projectId, String(keyword).trim());
      setGroups(groupResults(res));
      setSearched(true);
    } catch (err) {
      setError("\u641C\u7D22\u5931\u8D25\uFF1A" + errText8(err));
    }
  };
  const jump = (hash) => {
    window.location.hash = hash;
  };
  const total = GROUPS.reduce((n, g) => n + groups[g.key].length, 0);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "search", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u5168\u5C40\u641C\u7D22"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage.search \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage.search\uFF08\u540D\u79F0 / url / \u63CF\u8FF0\uFF0C\u5927\u5C0F\u5199\u4E0D\u654F\u611F\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: projectId, onChange: (e) => setProjectId(e.target.value) }, projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      placeholder: "\u5173\u952E\u5B57\uFF08\u56DE\u8F66\u641C\u7D22\uFF09",
      value: keyword,
      onChange: (e) => setKeyword(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") runSearch();
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runSearch }, "\u641C\u7D22")), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, searched ? "\u547D\u4E2D " + total + " \u6761" : "\u5C1A\u672A\u641C\u7D22"), GROUPS.map((g) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: g.key, className: "pp-card", style: { marginBottom: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, g.label, "\uFF08", groups[g.key].length, "\uFF09"), /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "90px" } }, "\u65B9\u6CD5"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "URL / \u8BF4\u660E"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, groups[g.key].map((item) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: g.key + "-" + item.id, onClick: () => jump(g.target(item.id)), style: { cursor: "pointer" } }, /* @__PURE__ */ (0, import_react.createElement)("td", null, item.method ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": item.method }, item.method) : /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-muted" }, "-")), /* @__PURE__ */ (0, import_react.createElement)("td", null, item.title), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono pp-muted" }, item.url || item.description || "-"))), groups[g.key].length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 3, className: "pp-muted" }, "\u65E0\u5339\u914D")) : null)))));
}

// src/client/pages/settings.jsx
var import_react17 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["settings", SettingsPage]);
var DEFAULT_STORE_ROOT = "E:/User/\u6587\u6863/api";
var DEFAULT_SETTINGS = { mockPort: 4010, proxyUrl: "", requestTimeoutMs: 3e4, historyLimit: 200 };
function normalizeSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    mockPort: Math.min(65535, Math.max(1, Math.round(num(src.mockPort, DEFAULT_SETTINGS.mockPort)))),
    proxyUrl: String(src.proxyUrl || ""),
    requestTimeoutMs: Math.max(1e3, Math.round(num(src.requestTimeoutMs, DEFAULT_SETTINGS.requestTimeoutMs))),
    historyLimit: Math.max(1, Math.round(num(src.historyLimit, DEFAULT_SETTINGS.historyLimit)))
  };
}
function storeRootOf(injected) {
  if (typeof injected === "string" && injected.trim()) return injected;
  try {
    const draft = typeof localStorage !== "undefined" ? localStorage.getItem("postapi.settings.storeRoot") : null;
    return draft || DEFAULT_STORE_ROOT;
  } catch {
    return DEFAULT_STORE_ROOT;
  }
}
function errText9(err) {
  return err && err.message ? err.message : String(err);
}
function SettingsPage(props) {
  const rootRef = (0, import_react17.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react17.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react17.useState)("proj_demo01");
  const [storeRoot, setStoreRoot] = (0, import_react17.useState)(() => storeRootOf(api && api.storeRoot));
  const [theme, setTheme] = (0, import_react17.useState)(readTheme);
  const [locale, setLocale] = (0, import_react17.useState)(readLocale);
  const [settings, setSettings] = (0, import_react17.useState)(DEFAULT_SETTINGS);
  const [isMock, setIsMock] = (0, import_react17.useState)(true);
  const [error, setError] = (0, import_react17.useState)("");
  const [notice, setNotice] = (0, import_react17.useState)("");
  (0, import_react17.useEffect)(() => {
    applyTheme(rootRef.current);
  }, []);
  (0, import_react17.useEffect)(() => {
    const boot = async () => {
      if (!storage || typeof storage.listProjects !== "function") return;
      try {
        const list = await storage.listProjects();
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list);
          setProjectId(list[0].id);
          setIsMock(false);
          if (typeof storage.getProject === "function") {
            const loaded = await storage.getProject(list[0].id);
            if (loaded && loaded.settings) setSettings(normalizeSettings(loaded.settings));
          }
        }
      } catch (err) {
        setError("\u52A0\u8F7D\u8BBE\u7F6E\u5931\u8D25\uFF1A" + errText9(err));
      }
    };
    boot();
  }, []);
  const patch = (p) => {
    setSettings({ ...settings, ...p });
    setNotice("");
  };
  const applyThemeChoice = (value) => {
    setTheme(value);
    saveTheme(value);
    if (rootRef.current) rootRef.current.setAttribute("data-theme", value);
    setNotice("\u4E3B\u9898\u5DF2\u5207\u6362\uFF1A" + value);
  };
  const applyLocaleChoice = (value) => {
    setLocale(value);
    saveLocale(value);
    setNotice("\u8BED\u8A00\u5DF2\u5207\u6362\uFF1A" + value);
  };
  const persist = async () => {
    if (!storage || typeof storage.saveProjectSettings !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.saveProjectSettings\uFF0C\u8BBE\u7F6E\u4EC5\u4FDD\u5B58\u5728\u9875\u9762\u5185");
      return;
    }
    setError("");
    try {
      const payload = normalizeSettings(settings);
      await storage.saveProjectSettings(projectId, payload);
      setSettings(payload);
      setNotice("\u5DF2\u4FDD\u5B58\u9879\u76EE\u8BBE\u7F6E");
    } catch (err) {
      setError("\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25\uFF1A" + errText9(err));
    }
  };
  const reloadProject = async (id) => {
    if (!storage || typeof storage.getProject !== "function") {
      setError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.getProject");
      return;
    }
    setError("");
    try {
      const loaded = await storage.getProject(id);
      if (loaded) setSettings(normalizeSettings(loaded.settings));
      setNotice("\u5DF2\u8F7D\u5165\u9879\u76EE\u8BBE\u7F6E");
    } catch (err) {
      setError("\u8F7D\u5165\u8BBE\u7F6E\u5931\u8D25\uFF1A" + errText9(err));
    }
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "settings", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-page-title" }, "\u8BBE\u7F6E"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u9879\u76EE\u8BBE\u7F6E\u9879\u4E3A\u6587\u4EF6\u5185\u9ED8\u8BA4\u503C" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08getProject / saveProjectSettings\uFF09"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { maxWidth: "640px" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5B58\u50A8\u8DEF\u5F84"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, readOnly: true, value: storeRoot })), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u5B58\u50A8\u6839\u76EE\u5F55\u7531 host \u6784\u9020\u53C2\u6570\u6CE8\u5165\uFF08createStorageService(basePath)\uFF09\uFF0C\u9875\u9762\u53EA\u8BFB\u5C55\u793A\uFF0C\u4E0D\u53EF\u4FEE\u6539\u3002"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4E3B\u9898"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: theme, onChange: (e) => applyThemeChoice(e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "light" }, "\u6D45\u8272"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "dark" }, "\u6DF1\u8272"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8BED\u8A00"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: locale, onChange: (e) => applyLocaleChoice(e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "zh-CN" }, "\u7B80\u4F53\u4E2D\u6587"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "en" }, "English")))), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u9879\u76EE\u8BBE\u7F6E"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { maxWidth: "640px" } }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        reloadProject(e.target.value);
      }
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Mock \u7AEF\u53E3"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "120px" },
      value: settings.mockPort,
      onChange: (e) => patch({ mockPort: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4EE3\u7406"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { flex: 1 },
      placeholder: "http://127.0.0.1:7890\uFF08\u7559\u7A7A\u4E3A\u76F4\u8FDE\uFF09",
      value: settings.proxyUrl,
      onChange: (e) => patch({ proxyUrl: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8D85\u65F6 (ms)"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "120px" },
      value: settings.requestTimeoutMs,
      onChange: (e) => patch({ requestTimeoutMs: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5386\u53F2\u6761\u6570"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { width: "120px" },
      value: settings.historyLimit,
      onChange: (e) => patch({ historyLimit: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: persist }, "\u4FDD\u5B58\u9879\u76EE\u8BBE\u7F6E")), /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-card-title", style: { marginTop: "var(--sp-6)" } }, "\u534F\u4F5C\uFF08\u89C4\u5212\u4E2D\uFF09"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card", style: { maxWidth: "640px" } }, /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u6210\u5458\u7BA1\u7406\u4E0E\u53D8\u66F4\u5386\u53F2\u4E3A P2 \u5360\u4F4D\uFF1A\u672C\u63D2\u4EF6\u65E0\u670D\u52A1\u7AEF\uFF0C\u4E0D\u505A\u4E91\u7AEF\u8D26\u53F7 / \u56E2\u961F\u540C\u6B65 / \u5BA1\u8BA1\u65E5\u5FD7\u3002")));
}

// src/client/pages-entry.js
ensureGlobals();

// src/client/index.js
var inject = ["slots", "locale", "sidebarRightTabs"];
function ComposerBadge() {
  return (0, import_react18.createElement)("svg", {
    viewBox: "0 0 64 64",
    width: 16,
    height: 16,
    "aria-hidden": true,
    style: { display: "block", pointerEvents: "none" }
  }, (0, import_react18.createElement)("path", { d: "M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z", fill: "#247bbf" }));
}
function apply(ctx) {
  console.info("[dsh-postapi] client apply \u5DF2\u6267\u884C", { hasTabs: !!ctx.sidebarRightTabs, hasSlots: !!ctx.slots, hasLocale: !!ctx.locale });
  ensureGlobals();
  if (!ctx.sidebarRightTabs || !ctx.slots) {
    console.warn("[dsh-postapi] \u5BBF\u4E3B\u672A\u63D0\u4F9B sidebarRightTabs / slots \u670D\u52A1\uFF0C\u53F3\u4FA7\u680F\u9875\u7B7E\u4E0D\u4F1A\u6302\u8F7D");
    return;
  }
  const t = ctx.locale ? ctx.locale.bind(POSTAPI_NS) : (key) => zh[key] ?? key;
  ctx.effect(() => ctx.sidebarRightTabs.register(postapiDefinition(t)), "dsh-postapi: postapi tab type");
  if (ctx.locale) {
    ctx.effect(() => ctx.locale.register(POSTAPI_NS, { zh, en }), "dsh-postapi: dictionaries");
  }
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register(
    { name: "sidebar.right.pane.tab", key: POSTAPI_ID, locale: POSTAPI_NS },
    PostApiBody
  )), "dsh-postapi: tab body");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab.title", () => ctx.slots.register(
    { name: "sidebar.right.pane.tab.title", key: POSTAPI_ID },
    ApiTitle
  )), "dsh-postapi: tab title");
  try {
    ctx.effect(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register(
      { name: "conversation.composer.dock", id: "dsh-postapi", order: 5 },
      ComposerBadge
    )), "dsh-postapi: composer badge");
  } catch (err) {
    console.warn("[dsh-postapi] composer \u5FBD\u7AE0\u672A\u6CE8\u518C\uFF08slot \u63D0\u4F9B\u65B9\u7F3A\u5931\uFF09\uFF1A", err && err.message);
  }
  ctx.effect(() => installApi(), "dsh-postapi: bridge api install");
}

    Object.assign(exports, module.exports);
    return module.exports;
  },
});

