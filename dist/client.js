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
var import_react21 = require("react");

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
  // —— 顶栏（Apifox 工作台骨架 §3）——
  "topbar.search": "\u5168\u5C40\u641C\u7D22",
  "topbar.searchPlaceholder": "\u641C\u7D22\u63A5\u53E3 / \u76EE\u5F55 / \u6A21\u578B",
  "topbar.newEndpoint": "\u65B0\u5EFA\u63A5\u53E3",
  "topbar.env": "\u73AF\u5883",
  "topbar.envDefault": "\u9ED8\u8BA4\u73AF\u5883",
  "topbar.theme": "\u4E3B\u9898",
  "topbar.themeDark": "\u6DF1\u8272",
  "topbar.themeLight": "\u6D45\u8272",
  "topbar.themeHint": "\u5207\u6362\u6D45\u8272 / \u6DF1\u8272\u76AE\u80A4",
  "topbar.settings": "\u8BBE\u7F6E",
  // —— 新建三级菜单（与 Apifox 左侧「+」同构）——
  "topbar.new": "\u65B0\u5EFA",
  "menu.new.api": "\u63A5\u53E3",
  "menu.new.apiHttp": "HTTP \u63A5\u53E3",
  "menu.new.apiHttpBlank": "\u65B0\u5EFA\u7A7A\u767D\u63A5\u53E3",
  "menu.new.apiHttpCopy": "\u4ECE\u5DF2\u6709\u63A5\u53E3\u590D\u5236",
  "menu.new.apiWs": "WebSocket \u63A5\u53E3",
  "menu.new.apiWsBlank": "\u65B0\u5EFA WebSocket \u63A5\u53E3",
  "menu.new.apiWsCopy": "\u4ECE\u5DF2\u6709\u63A5\u53E3\u590D\u5236",
  "menu.new.apiRpc": "RPC \u63A5\u53E3",
  "menu.new.apiGrpc": "gRPC \u63A5\u53E3",
  "menu.new.apiGraphql": "GraphQL \u63A5\u53E3",
  "menu.new.folder": "\u76EE\u5F55",
  "menu.new.folderBlank": "\u65B0\u5EFA\u76EE\u5F55",
  "menu.new.folderSub": "\u65B0\u5EFA\u5B50\u76EE\u5F55",
  "menu.new.folderSubOne": "\u4E00\u7EA7\u5B50\u76EE\u5F55",
  "menu.new.folderSubTwo": "\u4E8C\u7EA7\u5B50\u76EE\u5F55",
  "menu.new.schema": "\u6570\u636E\u6A21\u578B",
  "menu.new.schemaJson": "\u65B0\u5EFA JSON \u6A21\u578B",
  "menu.new.schemaImport": "\u4ECE JSON \u5BFC\u5165",
  "menu.new.quick": "\u5FEB\u6377\u8BF7\u6C42",
  "menu.new.import": "\u5BFC\u5165",
  "menu.new.importDoc": "\u5BFC\u5165\u63A5\u53E3\u6587\u6863",
  "menu.new.importOpenapi": "OpenAPI / Swagger",
  "menu.new.importPostman": "Postman \u96C6\u5408",
  "menu.new.importApifox": "Apifox \u9879\u76EE JSON",
  "menu.new.importYapi": "YApi \u5BFC\u51FA JSON",
  "menu.new.importHar": "HAR \u6293\u5305",
  "menu.new.importCurl": "cURL \u547D\u4EE4",
  "menu.new.importData": "\u5BFC\u5165\u6570\u636E",
  "menu.new.importEnv": "\u73AF\u5883\u53D8\u91CF",
  "menu.new.importSchema": "\u6570\u636E\u6A21\u578B",
  "menu.new.test": "\u6D4B\u8BD5",
  "menu.new.testCase": "\u65B0\u5EFA\u6D4B\u8BD5\u7528\u4F8B",
  "menu.new.testScenario": "\u65B0\u5EFA\u6D4B\u8BD5\u573A\u666F",
  "menu.new.env": "\u73AF\u5883",
  "menu.new.flow": "\u6D41\u7A0B\u56FE",
  // —— 左树 / 右栏 ——
  "group.project": "\u9879\u76EE",
  "group.api": "\u63A5\u53E3",
  "group.data": "\u6570\u636E",
  "group.quality": "\u8D28\u91CF",
  "group.tools": "\u5DE5\u5177",
  "aside.nav": "\u5BFC\u822A",
  "aside.about": "\u5F53\u524D\u9875\u9762",
  "aside.shortcuts": "\u5FEB\u6377\u5165\u53E3",
  "aside.noContext": "\u6682\u65E0\u4E0A\u4E0B\u6587\u4FE1\u606F",
  "aside.page.overview": "\u9879\u76EE\u603B\u89C8\uFF1A\u9879\u76EE\u5361\u7247\u3001\u6700\u8FD1\u63A5\u53E3\u4E0E\u5FEB\u6377\u5165\u53E3\u3002",
  "aside.page.doc": "\u63A5\u53E3\u6587\u6863\uFF1A\u76EE\u5F55\u6811\u3001\u53C2\u6570\u8868\u4E0E\u591A\u54CD\u5E94\u793A\u4F8B\u3002",
  "aside.page.debug": "\u8C03\u8BD5\uFF1A\u7F16\u8F91\u8BF7\u6C42\u5E76\u67E5\u770B\u54CD\u5E94\u4E0E\u8017\u65F6\u3002",
  "aside.page.mock": "Mock\uFF1A\u542F\u52A8\u672C\u5730 Mock \u670D\u52A1\u5E76\u7EF4\u62A4\u671F\u671B\u54CD\u5E94\u3002",
  "aside.page.schema": "\u6570\u636E\u6A21\u578B\uFF1AJSON Schema \u5B9A\u4E49\u4E0E\u793A\u4F8B\u751F\u6210\u3002",
  "aside.page.env": "\u73AF\u5883\uFF1A\u73AF\u5883\u53D8\u91CF\u3001\u5168\u5C40\u53D8\u91CF\u4E0E\u5BC6\u94A5\u3002",
  "aside.page.history": "\u5386\u53F2\uFF1A\u8C03\u8BD5\u8BF7\u6C42\u8BB0\u5F55\u4E0E\u56DE\u653E\u3002",
  "aside.page.test": "\u6D4B\u8BD5\uFF1A\u7528\u4F8B\u3001\u573A\u666F\u4E0E\u65AD\u8A00\u7ED3\u679C\u3002",
  "aside.page.import": "\u5BFC\u5165\u5BFC\u51FA\uFF1AOpenAPI / Postman / HAR / cURL\u3002",
  "aside.page.flow": "\u6D41\u7A0B\u56FE\uFF1A\u63A5\u53E3\u8C03\u7528\u987A\u5E8F\u4E0E\u65F6\u5E8F\u3002",
  "aside.page.search": "\u641C\u7D22\uFF1A\u6309\u5173\u952E\u5B57\u68C0\u7D22\u63A5\u53E3\u3001\u76EE\u5F55\u4E0E\u6A21\u578B\u3002",
  "aside.page.settings": "\u8BBE\u7F6E\uFF1A\u4E3B\u9898\u3001\u8BED\u8A00\u4E0E\u9879\u76EE\u53C2\u6570\u3002",
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
  "topbar.search": "Global search",
  "topbar.searchPlaceholder": "Search endpoints / folders / schemas",
  "topbar.newEndpoint": "New endpoint",
  "topbar.env": "Environment",
  "topbar.envDefault": "Default env",
  "topbar.theme": "Theme",
  "topbar.themeDark": "Dark",
  "topbar.themeLight": "Light",
  "topbar.themeHint": "Toggle light / dark skin",
  "topbar.settings": "Settings",
  // —— New menu (three levels, same shape as Apifox "+") ——
  "topbar.new": "New",
  "menu.new.api": "API",
  "menu.new.apiHttp": "HTTP API",
  "menu.new.apiHttpBlank": "Blank API",
  "menu.new.apiHttpCopy": "Copy from existing",
  "menu.new.apiWs": "WebSocket API",
  "menu.new.apiWsBlank": "New WebSocket API",
  "menu.new.apiWsCopy": "Copy from existing",
  "menu.new.apiRpc": "RPC API",
  "menu.new.apiGrpc": "gRPC API",
  "menu.new.apiGraphql": "GraphQL API",
  "menu.new.folder": "Folder",
  "menu.new.folderBlank": "New folder",
  "menu.new.folderSub": "New subfolder",
  "menu.new.folderSubOne": "First-level subfolder",
  "menu.new.folderSubTwo": "Second-level subfolder",
  "menu.new.schema": "Schema",
  "menu.new.schemaJson": "New JSON schema",
  "menu.new.schemaImport": "Import from JSON",
  "menu.new.quick": "Quick request",
  "menu.new.import": "Import",
  "menu.new.importDoc": "Import API document",
  "menu.new.importOpenapi": "OpenAPI / Swagger",
  "menu.new.importPostman": "Postman collection",
  "menu.new.importApifox": "Apifox project JSON",
  "menu.new.importYapi": "YApi export JSON",
  "menu.new.importHar": "HAR capture",
  "menu.new.importCurl": "cURL command",
  "menu.new.importData": "Import data",
  "menu.new.importEnv": "Environments",
  "menu.new.importSchema": "Schemas",
  "menu.new.test": "Test",
  "menu.new.testCase": "New test case",
  "menu.new.testScenario": "New scenario",
  "menu.new.env": "Environment",
  "menu.new.flow": "Flow diagram",
  "group.project": "Project",
  "group.api": "API",
  "group.data": "Data",
  "group.quality": "Quality",
  "group.tools": "Tools",
  "aside.nav": "Navigation",
  "aside.about": "This page",
  "aside.shortcuts": "Shortcuts",
  "aside.noContext": "No context for this page",
  "aside.page.overview": "Project overview: cards, recent endpoints and shortcuts.",
  "aside.page.doc": "Endpoint doc: tree, parameter tables and response examples.",
  "aside.page.debug": "Debug: edit a request and inspect the response.",
  "aside.page.mock": "Mock: start the local mock server and maintain expectations.",
  "aside.page.schema": "Schemas: JSON Schema definitions and example generation.",
  "aside.page.env": "Environments: env vars, globals and secrets.",
  "aside.page.history": "History: debug request records and replay.",
  "aside.page.test": "Tests: cases, scenarios and assertion results.",
  "aside.page.import": "Import/Export: OpenAPI / Postman / HAR / cURL.",
  "aside.page.flow": "Flow: endpoint call order and timing.",
  "aside.page.search": "Search: keyword lookup across endpoints, folders and schemas.",
  "aside.page.settings": "Settings: theme, language and project options.",
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
    importBundle: (projectId, bundle) => post("importBundle", { projectId, bundle }),
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
      curl: (text) => post("/import/curl", { text }),
      apifox: (json) => post("/import/apifox", { json }),
      yapi: (json) => post("/import/yapi", { json })
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
    },
    ws: {
      open: (opts) => post("/ws/open", opts ?? {}),
      send: (opts) => post("/ws/send", opts ?? {}),
      messages: (opts) => post("/ws/messages", opts ?? {}),
      close: (opts) => post("/ws/close", opts ?? {})
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
    /** 桥不可达时的兜底：与 host importBundle 同形返回（计数 + 空映射），数据不落盘。 */
    importBundle(projectId, bundle) {
      const p = project(projectId);
      const b = bundle && typeof bundle === "object" ? bundle : {};
      const count = (v) => Array.isArray(v) ? v.length : 0;
      const result = { folders: count(b.folders), endpoints: count(b.endpoints), schemas: count(b.schemas), idMap: {} };
      if (p) p.updatedAt = nowIso();
      return result;
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
      let bodyText2;
      if (body && body.type !== "none" && method !== "GET" && method !== "HEAD") {
        if (body.type === "json") {
          bodyText2 = body.content ?? "";
          if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
        } else if (body.type === "form") {
          bodyText2 = body.content ?? "";
          if (!h.has("Content-Type")) h.set("Content-Type", "application/x-www-form-urlencoded");
        } else {
          bodyText2 = body.content ?? "";
        }
      }
      if (auth?.type === "bearer" && auth.token) h.set("Authorization", "Bearer " + auth.token);
      if (auth?.type === "basic" && auth.username !== void 0) {
        h.set("Authorization", "Basic " + btoa(auth.username + ":" + (auth.password ?? "")));
      }
      const res = await fetch(finalUrl.toString(), { method, headers: h, body: bodyText2, signal: controller.signal });
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
      curl: async () => ({ folders: [], endpoints: [], schemas: [], endpoint: null }),
      apifox: async () => ({ folders: [], endpoints: [], schemas: [] }),
      yapi: async () => ({ folders: [], endpoints: [], schemas: [] })
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
      test: async () => ({ ok: false, error: { code: "UNAVAILABLE", message: "\u6570\u636E\u5E93\u64CD\u4F5C\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } }),
      query: async () => ({ ok: false, error: { code: "UNAVAILABLE", message: "\u6570\u636E\u5E93\u64CD\u4F5C\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } }),
      close: async () => ({ ok: false, error: { code: "UNAVAILABLE", message: "\u6570\u636E\u5E93\u64CD\u4F5C\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } })
    },
    ws: {
      open: async () => ({ id: "", url: "", status: "unavailable", messages: [], error: { kind: "unavailable", message: "WebSocket \u8C03\u8BD5\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } }),
      send: async () => ({ ok: false, error: { kind: "unavailable", message: "WebSocket \u8C03\u8BD5\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } }),
      messages: async () => ({ ok: false, lastIndex: 0, messages: [], error: { kind: "unavailable", message: "WebSocket \u8C03\u8BD5\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } }),
      close: async () => ({ ok: false, error: { kind: "unavailable", message: "WebSocket \u8C03\u8BD5\u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09" } })
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
  "importBundle",
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
  import: ["openapi", "postman", "har", "curl", "apifox", "yapi"],
  export: ["openapi", "postman", "har", "markdown"],
  codegen: ["run"],
  test: ["runCase", "runScenario"],
  db: ["test", "query", "close"],
  ws: ["open", "send", "messages", "close"]
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

// src/client/shell/menu.js
var NEW_MENU = [
  {
    id: "api",
    labelKey: "menu.new.api",
    children: [
      {
        id: "api-http",
        labelKey: "menu.new.apiHttp",
        children: [
          { id: "api-http-blank", labelKey: "menu.new.apiHttpBlank", action: { kind: "route", hash: "#/doc", query: "new=1" } },
          { id: "api-http-copy", labelKey: "menu.new.apiHttpCopy", action: { kind: "route", hash: "#/doc", query: "copy=1" } }
        ]
      },
      {
        id: "api-ws",
        labelKey: "menu.new.apiWs",
        children: [
          { id: "api-ws-blank", labelKey: "menu.new.apiWsBlank", action: { kind: "route", hash: "#/doc", query: "protocol=websocket" } },
          { id: "api-ws-copy", labelKey: "menu.new.apiWsCopy", action: { kind: "route", hash: "#/doc", query: "protocol=websocket&copy=1" } }
        ]
      },
      {
        id: "api-rpc",
        labelKey: "menu.new.apiRpc",
        children: [
          { id: "api-rpc-grpc", labelKey: "menu.new.apiGrpc", action: { kind: "route", hash: "#/doc", query: "protocol=grpc" } },
          { id: "api-rpc-graphql", labelKey: "menu.new.apiGraphql", action: { kind: "route", hash: "#/doc", query: "protocol=graphql" } }
        ]
      }
    ]
  },
  {
    id: "folder",
    labelKey: "menu.new.folder",
    children: [
      { id: "folder-blank", labelKey: "menu.new.folderBlank", action: { kind: "route", hash: "#/doc", query: "newFolder=1" } },
      {
        id: "folder-sub",
        labelKey: "menu.new.folderSub",
        children: [
          { id: "folder-sub-one", labelKey: "menu.new.folderSubOne", action: { kind: "route", hash: "#/doc", query: "newFolder=1&depth=2" } },
          { id: "folder-sub-two", labelKey: "menu.new.folderSubTwo", action: { kind: "route", hash: "#/doc", query: "newFolder=1&depth=3" } }
        ]
      }
    ]
  },
  {
    id: "schema",
    labelKey: "menu.new.schema",
    children: [
      { id: "schema-json", labelKey: "menu.new.schemaJson", action: { kind: "route", hash: "#/schema", query: "new=1" } },
      { id: "schema-import", labelKey: "menu.new.schemaImport", action: { kind: "route", hash: "#/schema", query: "import=1" } }
    ]
  },
  {
    id: "quick",
    labelKey: "menu.new.quick",
    action: { kind: "route", hash: "#/debug", query: "quick=1" }
  },
  {
    id: "import",
    labelKey: "menu.new.import",
    children: [
      {
        id: "import-doc",
        labelKey: "menu.new.importDoc",
        children: [
          { id: "import-openapi", labelKey: "menu.new.importOpenapi", action: { kind: "route", hash: "#/import", query: "kind=openapi" } },
          { id: "import-postman", labelKey: "menu.new.importPostman", action: { kind: "route", hash: "#/import", query: "kind=postman" } },
          { id: "import-apifox", labelKey: "menu.new.importApifox", action: { kind: "route", hash: "#/import", query: "kind=apifox" } },
          { id: "import-yapi", labelKey: "menu.new.importYapi", action: { kind: "route", hash: "#/import", query: "kind=yapi" } },
          { id: "import-har", labelKey: "menu.new.importHar", action: { kind: "route", hash: "#/import", query: "kind=har" } },
          { id: "import-curl", labelKey: "menu.new.importCurl", action: { kind: "route", hash: "#/import", query: "kind=curl" } }
        ]
      },
      {
        id: "import-data",
        labelKey: "menu.new.importData",
        children: [
          { id: "import-env", labelKey: "menu.new.importEnv", action: { kind: "route", hash: "#/import", query: "kind=env" } },
          { id: "import-schema", labelKey: "menu.new.importSchema", action: { kind: "route", hash: "#/import", query: "kind=schema" } }
        ]
      }
    ]
  },
  { id: "sep-1", separator: true },
  {
    id: "test",
    labelKey: "menu.new.test",
    children: [
      { id: "test-case", labelKey: "menu.new.testCase", action: { kind: "route", hash: "#/test", query: "new=case" } },
      { id: "test-scenario", labelKey: "menu.new.testScenario", action: { kind: "route", hash: "#/test", query: "new=scenario" } }
    ]
  },
  {
    id: "env",
    labelKey: "menu.new.env",
    action: { kind: "route", hash: "#/env", query: "new=1" }
  },
  {
    id: "flow",
    labelKey: "menu.new.flow",
    action: { kind: "route", hash: "#/flow", query: "new=1" }
  }
];
function actionHash(action) {
  if (!action || action.kind !== "route") return "";
  const q = action.query ? (action.hash.indexOf("?") >= 0 ? "&" : "?") + action.query : "";
  return action.hash + q;
}

// src/client/shell/Body.js
var THEME_KEY = "postapi.settings.theme";
var ENV_KEY = "postapi.settings.env";
var ROUTES = [
  { name: "overview", hash: "#/overview", labelKey: "nav.overview", icon: "grid" },
  { name: "doc", hash: "#/doc", labelKey: "nav.doc", icon: "book" },
  { name: "debug", hash: "#/debug", labelKey: "nav.debug", icon: "send" },
  { name: "mock", hash: "#/mock", labelKey: "nav.mock", icon: "cube" },
  { name: "schema", hash: "#/schema", labelKey: "nav.schema", icon: "db" },
  { name: "env", hash: "#/env", labelKey: "nav.env", icon: "sliders" },
  { name: "history", hash: "#/history", labelKey: "nav.history", icon: "clock" },
  { name: "test", hash: "#/test", labelKey: "nav.test", icon: "check" },
  { name: "import", hash: "#/import", labelKey: "nav.import", icon: "swap" },
  { name: "flow", hash: "#/flow", labelKey: "nav.flow", icon: "flow" },
  { name: "search", hash: "#/search", labelKey: "nav.search", icon: "search" },
  { name: "settings", hash: "#/settings", labelKey: "nav.settings", icon: "gear" }
];
var PARAM_ROUTES = ["doc", "schema"];
var NAV_GROUPS = [
  { id: "project", labelKey: "group.project", icon: "grid", routes: ["overview"] },
  { id: "api", labelKey: "group.api", icon: "layers", routes: ["doc", "debug", "mock"] },
  { id: "data", labelKey: "group.data", icon: "db", routes: ["schema", "env"] },
  { id: "quality", labelKey: "group.quality", icon: "check", routes: ["test", "history", "flow"] },
  { id: "tools", labelKey: "group.tools", icon: "sliders", routes: ["import", "search", "settings"] }
];
var ICON_PATHS = {
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  layers: ["M4 7h16", "M4 12h16", "M4 17h10"],
  db: ["M5 6c0-1.1 3.1-2 7-2s7 .9 7 2-3.1 2-7 2-7-.9-7-2z", "M5 6v12c0 1.1 3.1 2 7 2s7-.9 7-2V6", "M5 12c0 1.1 3.1 2 7 2s7-.9 7-2"],
  check: ["M4 12l5 5L20 6"],
  sliders: ["M4 7h10", "M18 7h2", "M4 17h4", "M12 17h8", "M14 4v6", "M8 14v6"],
  sun: ["M12 4v2", "M12 18v2", "M4 12h2", "M18 12h2", "M6.3 6.3l1.4 1.4", "M16.3 16.3l1.4 1.4", "M6.3 17.7l1.4-1.4", "M16.3 7.7l1.4-1.4"],
  moon: ["M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"],
  gear: ["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"],
  help: ["M12 18h.01", "M9.1 9a3 3 0 1 1 4.2 2.7c-.8.5-1.3 1.1-1.3 2.3", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"],
  plus: ["M12 5v14", "M5 12h14"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  book: ["M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z", "M8 3v18"],
  send: ["M21 3L10 14", "M21 3l-7 18-4-7-7-4z"],
  cube: ["M12 3l8 4.5v9L12 21l-8-4.5v-9z", "M12 12l8-4.5", "M12 12v9", "M12 12L4 7.5"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7v5l3 2"],
  swap: ["M4 8h13l-3-3", "M20 16H7l3 3"],
  flow: ["M5 6h5", "M14 6h5", "M7.5 6v12", "M16.5 6v12", "M5 18h5", "M14 18h5"],
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M20 20l-4.2-4.2"]
};
function Icon({ name, size = 20 }) {
  const paths = ICON_PATHS[name] || ICON_PATHS.grid;
  return (0, import_react3.createElement)("svg", {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    style: { display: "block" }
  }, paths.map((d, i) => (0, import_react3.createElement)("path", { key: i, d })));
}
function MenuTree({ items, openPath, onOpen, onPick, depth = 1, pos }) {
  const openId = openPath.length >= depth ? openPath[depth - 1] : null;
  const openNode = openId ? items.find((n) => n && n.id === openId) : null;
  const style = pos ? { top: pos.top + "px", left: pos.left + "px" } : void 0;
  const itemRef = (0, import_react3.useRef)(null);
  const childPos = (0, import_react3.useMemo)(() => {
    const el = itemRef.current;
    if (!el || typeof el.getBoundingClientRect !== "function") return void 0;
    const r = el.getBoundingClientRect();
    const w = 200;
    const gap = 4;
    const left = r.left - w - gap >= gap ? r.left - w - gap : r.right + gap;
    const maxTop = (typeof window !== "undefined" ? window.innerHeight : 800) - 12 * 32 - 16;
    const top = Math.max(8, Math.min(r.top - 4, maxTop));
    return { top, left };
  }, [openId]);
  return /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-menu", role: "menu", "data-depth": depth, style }, items.map((node) => {
    if (!node || node.separator) return /* @__PURE__ */ (0, import_react3.createElement)("div", { key: node && node.id ? node.id : "sep", className: "pp-menu-sep", role: "separator" });
    const hasKids = Array.isArray(node.children) && node.children.length > 0;
    const isOpen = Boolean(openNode) && openNode.id === node.id;
    if (hasKids) {
      return /* @__PURE__ */ (0, import_react3.createElement)("div", { key: node.id, className: "pp-menu-anchor", "data-index": items.indexOf(node) }, /* @__PURE__ */ (0, import_react3.createElement)(
        "button",
        {
          type: "button",
          className: "pp-menu-item",
          role: "menuitem",
          "data-open": isOpen ? "true" : "false",
          "aria-haspopup": "menu",
          "aria-expanded": isOpen ? "true" : "false",
          ref: (el) => {
            if (el && isOpen) itemRef.current = el;
          },
          onClick: (event) => {
            event.stopPropagation();
            itemRef.current = event.currentTarget;
            onOpen(openPath.slice(0, depth - 1).concat([node.id]));
          }
        },
        /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-menu-label" }, zh[node.labelKey]),
        /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-menu-arrow", "aria-hidden": "true" }, "\u203A")
      ), isOpen ? /* @__PURE__ */ (0, import_react3.createElement)(
        MenuTree,
        {
          items: node.children,
          openPath,
          onOpen,
          onPick,
          depth: depth + 1,
          pos: childPos
        }
      ) : null);
    }
    const hash = actionHash(node.action);
    return /* @__PURE__ */ (0, import_react3.createElement)(
      "a",
      {
        key: node.id,
        className: "pp-menu-item",
        role: "menuitem",
        href: hash || "#",
        onClick: (event) => {
          event.preventDefault();
          onPick(node, hash);
        }
      },
      /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-menu-label" }, zh[node.labelKey])
    );
  }));
}
function parseHash(raw) {
  const source = raw === void 0 ? typeof location !== "undefined" ? location.hash : "" : raw;
  const clean = String(source || "#/overview").replace(/^#\/?/, "");
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
function routeHref(item, route) {
  if (PARAM_ROUTES.indexOf(item.name) >= 0 && route && route.arg) {
    return item.hash + "/" + encodeURIComponent(route.arg);
  }
  return item.hash;
}
function searchHash(keyword) {
  const q = String(keyword === void 0 || keyword === null ? "" : keyword).trim();
  return q === "" ? "#/search" : "#/search?q=" + encodeURIComponent(q);
}
function groupOfRoute(name) {
  const hit = NAV_GROUPS.find((g) => g.routes.indexOf(name) >= 0);
  return hit || NAV_GROUPS[0];
}
function routesOfGroup(group) {
  if (!group || !Array.isArray(group.routes)) return [];
  return group.routes.map((name) => ROUTES.find((r) => r.name === name)).filter(Boolean);
}
function readSetting(key, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const value = localStorage.getItem(key);
    return value === null || value === void 0 || value === "" ? fallback : value;
  } catch {
    return fallback;
  }
}
function writeSetting(key, value) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
  }
}
function nextTheme(theme) {
  return theme === "dark" ? "light" : "dark";
}
function syncTheme(theme) {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  const nodes = document.querySelectorAll(".pp-scope");
  for (const el of nodes) {
    if (el && typeof el.setAttribute === "function") el.setAttribute("data-theme", theme);
  }
}
function useHashRoute() {
  const [route, setRoute] = (0, import_react3.useState)(() => parseHash());
  (0, import_react3.useEffect)(() => {
    const onChange = () => setRoute(parseHash());
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    }
    return void 0;
  }, []);
  return route;
}
function Placeholder({ route }) {
  const title = zh["placeholder.title"] + ": " + route.name + (route.arg ? "/" + route.arg : "");
  return /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-page" }, /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-empty" }, /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-card-title" }, title), /* @__PURE__ */ (0, import_react3.createElement)("div", null, zh["placeholder.body"]), /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-meta" }, zh["placeholder.hint"])));
}
var PAGE_DESC = (name) => zh["aside.page." + name] || zh["aside.noContext"];
function PostApiBody({ useTabInfo }) {
  const route = useHashRoute();
  const [theme, setTheme] = (0, import_react3.useState)(() => readSetting(THEME_KEY, "light"));
  const [env, setEnv] = (0, import_react3.useState)(() => readSetting(ENV_KEY, ""));
  const [keyword, setKeyword] = (0, import_react3.useState)("");
  const [helpOpen, setHelpOpen] = (0, import_react3.useState)(false);
  const [menuOpen, setMenuOpen] = (0, import_react3.useState)(false);
  const [menuPath, setMenuPath] = (0, import_react3.useState)([]);
  const [menuPos, setMenuPos] = (0, import_react3.useState)(null);
  const menuBtnRef = (0, import_react3.useRef)(null);
  const shellRef = (0, import_react3.useRef)(null);
  const Page = pageRegistry.get(route.name);
  const active = ROUTES.find((r) => r.name === route.name) || ROUTES[0];
  const activeGroup = groupOfRoute(route.name);
  const api = typeof window !== "undefined" ? window.__postapiApi : void 0;
  (0, import_react3.useEffect)(() => {
    const onKey = (event) => {
      if (!event) return;
      if (event.key === "Escape") {
        setMenuPath((prev) => prev.length > 0 ? prev.slice(0, -1) : prev);
        setHelpOpen(false);
      }
    };
    const onDown = (event) => {
      const target = event && event.target;
      if (!target || !shellRef.current) return;
      if (typeof shellRef.current.contains === "function" && shellRef.current.contains(target)) {
        if (target.closest && (target.closest(".pp-sider") || target.closest(".pp-help-card") || target.closest(".pp-menu-anchor"))) return;
      }
      setHelpOpen(false);
      setMenuOpen(false);
      setMenuPath([]);
    };
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("keydown", onKey);
      window.addEventListener("mousedown", onDown);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("mousedown", onDown);
      };
    }
    return void 0;
  }, []);
  (0, import_react3.useEffect)(() => {
    setHelpOpen(false);
  }, [route.name, route.arg]);
  const toggleTheme = () => {
    const next = nextTheme(theme);
    writeSetting(THEME_KEY, next);
    syncTheme(next);
    setTheme(next);
  };
  const pickEnv = (event) => {
    const value = event && event.target ? event.target.value : "";
    writeSetting(ENV_KEY, value);
    setEnv(value);
  };
  const goto = (hash) => {
    if (typeof location !== "undefined") location.hash = hash;
  };
  const onSearchKey = (event) => {
    if (!event || event.key !== "Enter") return;
    const q = String(keyword === void 0 || keyword === null ? "" : keyword).trim();
    if (q === "") return;
    goto(searchHash(q));
  };
  const toggleHelp = () => setHelpOpen((prev) => !prev);
  return /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-scope pp-workbench-v2", "data-theme": theme, "data-route": route.name }, /* @__PURE__ */ (0, import_react3.createElement)("header", { className: "pp-topbar" }, /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-topbar-brand" }, /* @__PURE__ */ (0, import_react3.createElement)(Icon, { name: "layers", size: 16 }), /* @__PURE__ */ (0, import_react3.createElement)("span", null, zh["type.label"])), /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-crumb" }, zh[activeGroup.labelKey], /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-crumb-sep" }, "/"), zh[active.labelKey]), /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-topbar-spacer" }), /* @__PURE__ */ (0, import_react3.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-topbar-search",
      type: "search",
      value: keyword,
      placeholder: zh["topbar.searchPlaceholder"],
      "aria-label": zh["topbar.search"],
      onChange: (event) => setKeyword(event.target.value),
      onKeyDown: onSearchKey
    }
  ), /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-menu-anchor" }, /* @__PURE__ */ (0, import_react3.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-primary",
      type: "button",
      ref: menuBtnRef,
      "aria-haspopup": "menu",
      "aria-expanded": menuOpen ? "true" : "false",
      onClick: () => {
        if (!menuOpen && menuBtnRef.current) {
          const r = menuBtnRef.current.getBoundingClientRect();
          const w = 200;
          setMenuPos({ top: Math.round(r.bottom + 4), left: Math.round(Math.max(8, r.right - w)) });
        }
        setMenuOpen((v) => !v);
        setMenuPath([]);
      }
    },
    zh["topbar.new"]
  ), menuOpen ? /* @__PURE__ */ (0, import_react3.createElement)(
    MenuTree,
    {
      items: NEW_MENU,
      openPath: menuPath,
      pos: menuPos,
      onOpen: (path) => setMenuPath(path),
      onPick: (node, hash) => {
        setMenuOpen(false);
        setMenuPath([]);
        if (hash) goto(hash);
      }
    }
  ) : null), /* @__PURE__ */ (0, import_react3.createElement)(
    "select",
    {
      className: "pp-select pp-input-sm",
      value: env,
      onChange: pickEnv,
      title: zh["topbar.env"],
      "aria-label": zh["topbar.env"]
    },
    /* @__PURE__ */ (0, import_react3.createElement)("option", { value: "" }, zh["topbar.envDefault"])
  ), /* @__PURE__ */ (0, import_react3.createElement)(
    "button",
    {
      className: "pp-icon-btn",
      type: "button",
      onClick: toggleTheme,
      title: zh["topbar.themeHint"],
      "aria-label": zh["topbar.themeHint"]
    },
    /* @__PURE__ */ (0, import_react3.createElement)(Icon, { name: theme === "dark" ? "moon" : "sun", size: 18 })
  ), /* @__PURE__ */ (0, import_react3.createElement)(
    "button",
    {
      className: "pp-icon-btn",
      type: "button",
      onClick: () => goto("#/settings"),
      title: zh["topbar.settings"],
      "aria-label": zh["topbar.settings"]
    },
    /* @__PURE__ */ (0, import_react3.createElement)(Icon, { name: "gear", size: 18 })
  ), /* @__PURE__ */ (0, import_react3.createElement)(
    "button",
    {
      className: "pp-icon-btn",
      type: "button",
      onClick: toggleHelp,
      "data-active": helpOpen ? "true" : "false",
      title: zh["aside.about"],
      "aria-label": zh["aside.about"]
    },
    /* @__PURE__ */ (0, import_react3.createElement)(Icon, { name: "help", size: 18 })
  )), /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-shell", ref: shellRef }, /* @__PURE__ */ (0, import_react3.createElement)("nav", { className: "pp-sider", "aria-label": zh["aside.nav"] }, NAV_GROUPS.map((group) => /* @__PURE__ */ (0, import_react3.createElement)("div", { key: group.id }, /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-sider-group" }, zh[group.labelKey]), routesOfGroup(group).map((item) => /* @__PURE__ */ (0, import_react3.createElement)(
    "a",
    {
      key: item.name,
      className: "pp-sider-item",
      href: routeHref(item, route),
      "data-active": route.name === item.name ? "true" : "false"
    },
    /* @__PURE__ */ (0, import_react3.createElement)(Icon, { name: item.icon || group.icon, size: 16 }),
    /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-sider-label" }, zh[item.labelKey])
  ))))), /* @__PURE__ */ (0, import_react3.createElement)("main", { className: "pp-main-v2" }, /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-tabbar", role: "tablist", "aria-label": zh[active.labelKey] }, /* @__PURE__ */ (0, import_react3.createElement)(
    "button",
    {
      type: "button",
      className: "pp-tabbar-item",
      role: "tab",
      "data-active": "true",
      "aria-selected": "true"
    },
    /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-sider-label" }, zh[active.labelKey])
  )), helpOpen ? /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-help-card", role: "dialog", "aria-label": zh["aside.about"] }, /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-help-card-head" }, /* @__PURE__ */ (0, import_react3.createElement)("span", { className: "pp-help-card-title" }, zh["aside.about"]), /* @__PURE__ */ (0, import_react3.createElement)(
    "button",
    {
      type: "button",
      className: "pp-icon-btn",
      onClick: () => setHelpOpen(false),
      "aria-label": zh["aside.shortcuts"]
    },
    /* @__PURE__ */ (0, import_react3.createElement)(Icon, { name: "close", size: 14 })
  )), /* @__PURE__ */ (0, import_react3.createElement)("div", { className: "pp-help" }, PAGE_DESC(route.name))) : null, Page ? /* @__PURE__ */ (0, import_react3.createElement)(Page, { route, api }) : /* @__PURE__ */ (0, import_react3.createElement)(Placeholder, { route }))));
}

// src/client/shell/ApiTitle.js
function ApiTitle({ useTabInfo }) {
  const { tab } = useTabInfo();
  return /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-topbar-title", style: { display: "inline-flex", alignItems: "center", gap: "var(--sp-1)" } }, /* @__PURE__ */ (0, import_react.createElement)(
    "svg",
    {
      viewBox: "0 0 64 64",
      width: 14,
      height: 14,
      "aria-hidden": "true",
      className: "pp-accent",
      style: { display: "block", flexShrink: 0 }
    },
    /* @__PURE__ */ (0, import_react.createElement)("path", { d: "M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z", fill: "currentColor" })
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, tab.title));
}

// src/client/pages/design-tokens.css
var design_tokens_default = '/* ============================================================\n   dsh-postapi \u8BBE\u8BA1 token \u2014 Apifox 2.8.55 \u590D\u523B\n   \u4F9D\u636E docs/apifox-design-spec.md\uFF08165 \u4E2A CSS chunk \u7EDF\u8BA1\uFF09\n   \u5C3A\u5BF8\u7EDF\u4E00\u5728 token \u5C42\uFF1A\u63A7\u4EF6 --ctl-h / \u8868\u884C --row-h / \u80F6\u56CA --pill-h\n   \u9875\u9762\u6837\u5F0F\u6240\u6709\u9AD8\u5EA6\u58F0\u660E\u5FC5\u987B\u5F15\u7528\u4E0A\u8FF0 token\uFF08__tests__/heights.test.js \u9759\u6001\u68C0\u67E5\uFF09\n   \u5BC6\u5EA6\u57FA\u8C03\uFF1AApifox \u5DE5\u4F5C\u53F0\u2014\u20141px \u8FB9\u6846\u5206\u533A\u3001\u5361\u7247\u5316\u3001\u6D6E\u5C42\u624D\u6295\u9634\u5F71\n   ============================================================ */\n\n.pp-scope {\n  /* \u2014\u2014 \u5B57\u4F53\uFF08Apifox: -apple-system,"BlinkMacSystemFont","Segoe UI",roboto,...\uFF09\u2014\u2014 */\n  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;\n  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;\n\n  /* \u2014\u2014 \u5B57\u9636\uFF08\u5BF9\u9F50 Apifox \u5B9E\u6D4B\uFF1A12/14/15/16/17/18/20/22\uFF09\u2014\u2014\n     Apifox \u7684 --ui-font-size-* \u539F\u503C\u89C1 docs/apifox-visual-parity-spec.md \xA72\uFF1B\n     13px \u4FDD\u7559\u662F\u56E0\u4E3A\u65E2\u6709\u9875\u9762\u7528\u5B83\u505A\u8F85\u52A9\u6587\u672C\uFF0C\u4E0D\u65B0\u5F15\u5165\u3002 */\n  --fs-12: 12px;\n  --fs-13: 13px;\n  --fs-14: 14px;\n  --fs-15: 15px;\n  --fs-16: 16px;\n  --fs-17: 17px;\n  --fs-18: 18px;\n  --fs-20: 20px;\n  --fs-22: 22px;\n  --fs-24: 24px;\n  --fw-regular: 400;\n  --fw-medium: 500;\n  --fw-semibold: 600;\n\n  /* \u2014\u2014 \u884C\u9AD8\uFF08Apifox \u56FA\u5B9A\u503C\uFF0C\u4E0D\u7528\u500D\u6570\uFF09\u2014\u2014 */\n  /* \u56FE\u8868\u4E13\u7528\u5B57\u9636\uFF1ASVG \u91CC\u7684\u5C0F\u5B57\uFF08\u56FE\u4F8B/\u6807\u8BB0\uFF09\u6BD4\u6B63\u6587\u66F4\u5C0F\uFF0C\u4F46\u4ECD\u8D70 token \u4E0D\u5199\u5B57\u9762\u91CF */\n  --fs-chart: 10px;\n  --lh-18: 18px;\n  --lh-20: 20px;\n  --lh-22: 22px;\n  --lh-24: 24px;\n\n  /* \u2014\u2014 \u5C3A\u5BF8\u7EDF\u4E00 token\uFF08\u5BF9\u9F50 Apifox \u5B9E\u6D4B\uFF0C\u89C1 docs/apifox-visual-parity-spec.md \xA71/\xA72\uFF09\u2014\u2014 */\n  --ctl-h: 32px;         /* Apifox --ui-height-base */\n  --ctl-h-sm: 24px;      /* Apifox --ui-height-sm */\n  --ctl-h-lg: 40px;      /* Apifox --ui-height-lg */\n  --row-h: 32px;         /* Apifox \u8868\u683C/\u5217\u8868\u884C 32px\uFF08\u539F 36px \u504F\u677E\uFF09 */\n  --tree-row-h: 22px;    /* Apifox --ui-tree-title-height: 22px */\n  --pill-h: 22px;\n  --topbar-h: 48px;      /* Apifox --ui-layout-header-height: 48px */\n  --tabbar-h: 44px;      /* Apifox --app-main-tabs-height: 44px */\n  --sider-w: 240px;      /* Apifox .sider-bxNtfB width: 240px */\n  --sider-pad: 20px;     /* Apifox .sider-bxNtfB padding: 20px */\n  --sider-item-h: 32px;  /* Apifox --ui-menu-item-height: 32px */\n  --sider-group-h: 24px; /* Apifox --ui-menu-item-group-height: 24px */\n  --nav-w: 240px;\n  --toc-w: 240px;\n  /* \u5B9E\u4F53\u6811\u9762\u677F\u4E0E Apifox sider \u540C\u5BBD */\n  --panel-w: 240px;\n  --panel-w-max: 320px;\n  --content-max-w: 1512px; /* Apifox .overview-header-container max-width */\n  --page-pad: 10px;        /* Apifox --app-page-layout-size */\n  --layout-pad: 8px;       /* Apifox --app-layout-padding-right/bottom */\n  --hit: 28px;\n  /* \u2014\u2014 \u5F39\u5C42\u83DC\u5355\uFF08\u5BF9\u9F50 Apifox .ui-dropdown-menu / .ui-menu-item \u5B9E\u6D4B\uFF09\u2014\u2014\n     \u9879\u9AD8 32px\u3001\u9762\u677F\u6700\u5C0F\u5BBD 150px\uFF08Apifox .project-module-menu-popup .ui-menu min-width:150px\uFF09\u3001\n     \u9634\u5F71\u53D6 Apifox .keywordSearchPopover .ui-popover-inner \u539F\u6587\u7684\u4E24\u6BB5\u5F0F\u6295\u5F71\u3002 */\n  --menu-w: 200px;\n  --menu-w-sm: 160px;\n  --menu-item-h: 32px;\n  --menu-pad: var(--sp-1);\n  --shadow-menu: 0 8px 8px -4px rgba(16, 24, 40, 0.03), 0 20px 24px -4px rgba(16, 24, 40, 0.08);\n  --z-menu: 40;\n  --z-flyout: 30;\n  --motion-fast: 120ms;\n  --card-pad: 16px;\n  --popover-w: 400px;\n  --empty-w: 360px;\n  --scrollbar: 6px;\n  --seq-min-w: 620px;     /* \u65F6\u5E8F\u56FE/\u6D41\u7A0B\u56FE\u753B\u5E03\u6700\u5C0F\u53EF\u8BFB\u5BBD\u5EA6\uFF1A\u56DB\u6CF3\u9053\u6587\u5B57 1:1\uFF0C\u518D\u7A84\u7531\u5BB9\u5668\u6A2A\u6EDA */\n\n  /* \u2014\u2014 \u56FE\u6807\u5C3A\u5BF8 \u2014\u2014 */\n  --icon-sm: 14px;\n  --icon: 16px;\n  --icon-lg: 20px;\n  --icon-xl: 24px;\n\n  /* \u2014\u2014 \u95F4\u8DDD\u523B\u5EA6 4/8/12/16/20/24 \u2014\u2014 */\n  --sp-1: 4px;\n  --sp-2: 8px;\n  --sp-3: 12px;\n  --sp-4: 16px;\n  --sp-5: 20px;\n  --sp-6: 24px;\n\n  /* \u2014\u2014 \u5706\u89D2\uFF1A\u5BF9\u9F50 Apifox --ui-border-radius-sm/base/lg = 6/8/10 \u2014\u2014 */\n  --radius-sm: 6px;\n  --radius-ctl: 6px;\n  --radius-card: 8px;\n  --radius-lg: 10px;\n  --radius-pill: 999px;\n\n  /* \u2014\u2014 light \u76AE\u80A4\uFF08Apifox \u9AD8\u9891\u8272\uFF09\u2014\u2014 */\n  --bg-app: #f9fafb;\n  --bg-surface: #ffffff;\n  --bg-subtle: #f2f4f7;\n  --bg-hover: #f2f4f7;\n  --bg-selected: #f4f1fe;\n  --bg-stripe: #f5f5f5;\n  --fg: #344054;\n  --fg-strong: #101828;\n  --fg-secondary: #667085;\n  --fg-tertiary: #98a2b3;\n  --fg-on-accent: #ffffff;\n  --border: #eaecf0;\n  --border-strong: #d0d5dd;\n  --accent: #9373ee;\n  --accent-hover: #8276c9;\n  --accent-tint: rgba(147, 115, 238, 0.10);\n  --link: #6172f3;\n  --info: #2e90fa;\n  --success: #17b26a;\n  --warning: #f79009;\n  --error: #f04438;\n  --shadow-popover: 0 4px 16px rgba(16, 24, 40, 0.08);\n\n  /* \u2014\u2014 \u65B9\u6CD5\u5FBD\u6807\uFF08\u767D\u5B57\u5F69\u5E95\uFF0Cmono 12px \u7C97\u4F53\uFF09\u2014\u2014 */\n  --method-fs: 12px;\n  --method-get: #17b26a;\n  --method-post: #2e90fa;\n  --method-put: #f79009;\n  --method-delete: #f04438;\n  --method-patch: #ee46bc;\n  --method-other: #06aed4;\n}\n\n.pp-scope[data-theme="dark"] {\n  --bg-app: #101828;\n  --bg-surface: #1d2939;\n  --bg-subtle: #1d2939;\n  --bg-hover: #26334a;\n  --bg-selected: #2b2647;\n  --bg-stripe: #232f42;\n  --fg: #f9fafb;\n  --fg-strong: #ffffff;\n  --fg-secondary: #98a2b3;\n  --fg-tertiary: #667085;\n  --border: #344054;\n  --border-strong: #475467;\n  --accent-tint: rgba(147, 115, 238, 0.18);\n  --shadow-popover: 0 4px 16px rgba(0, 0, 0, 0.4);\n}\n\n/* \u2014\u2014 \u57FA\u7840 \u2014\u2014 */\n.pp-scope,\n.pp-scope * {\n  box-sizing: border-box;\n}\n.pp-scope {\n  font-family: var(--font-sans);\n  font-size: var(--fs-14);\n  line-height: var(--lh-22);\n  color: var(--fg);\n  background: var(--bg-app);\n}\n.pp-scope ::-webkit-scrollbar {\n  width: var(--scrollbar);\n  /* \u6EDA\u52A8\u6761\u9AD8\u5EA6\u4E0E\u5BBD\u5EA6\u540C\u6E90\uFF1A\u7528 calc \u5305\u4E00\u5C42\uFF0C\u9AD8\u5EA6\u7EAA\u5F8B\u68C0\u67E5\u53EA\u63A5\u53D7 token \u8868\u8FBE\u5F0F */\n  height: calc(var(--scrollbar) * 1);\n}\n.pp-scope ::-webkit-scrollbar-thumb {\n  background: var(--border-strong);\n  border-radius: var(--radius-pill);\n}\n\n/* \u2014\u2014 \u5DE5\u4F5C\u53F0\u9AA8\u67B6\uFF1A\u9876\u680F + \u4E09\u6BB5\u5F0F \u2014\u2014 */\n.pp-workbench {\n  display: grid;\n  grid-template-rows: var(--topbar-h) minmax(0, 1fr);\n  height: 100%;\n  min-height: 0;\n}\n/* \u9876\u680F\uFF1AApifox --ui-layout-header-height: 48px / --ui-layout-header-padding: 0 50px\u3002\n   50px \u5DE6\u53F3\u5185\u8FB9\u8DDD\u5728\u7A84\u5BB9\u5668\u91CC\u4F1A\u628A\u4E2D\u95F4\u641C\u7D22\u6846\u538B\u6CA1\uFF0C\u6545\u7528\u5BB9\u5668\u67E5\u8BE2\u964D\u5230 0 20px\u3002 */\n.pp-topbar {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  height: var(--topbar-h);\n  padding: 0 50px;\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n}\n@container ppmain (max-width: 900px) {\n  .pp-topbar { padding: 0 var(--sp-5); }\n}\n/* \u9876\u680F\u4EA7\u54C1\u6807\u8BC6\uFF1A\u56FE\u6807 + \u540D\u79F0\uFF08Apifox \u5DE6\u4E0A\u89D2\u662F\u4EA7\u54C1\u540D\uFF0C\u4E0D\u662F\u5F53\u524D\u9875\u540D\uFF09 */\n.pp-topbar-brand {\n  display: inline-flex;\n  align-items: center;\n  gap: var(--sp-2);\n  font-size: var(--fs-14);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  white-space: nowrap;\n  flex: none;\n}\n.pp-topbar-title {\n  font-size: var(--fs-14);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  white-space: nowrap;\n}\n.pp-topbar-spacer {\n  flex: 1;\n}\n.pp-topbar-search {\n  width: var(--nav-w);\n  flex: none;\n}\n.pp-body-3col {\n  display: grid;\n  grid-template-columns: var(--nav-w) minmax(0, 1fr) var(--toc-w);\n  min-height: 0;\n}\n.pp-body-2col {\n  display: grid;\n  grid-template-columns: var(--nav-w) minmax(0, 1fr);\n  min-height: 0;\n}\n.pp-col {\n  min-width: 0;\n  min-height: 0;\n  overflow: auto;\n  background: var(--bg-surface);\n}\n.pp-col-left {\n  border-right: 1px solid var(--border);\n}\n.pp-col-right {\n  border-left: 1px solid var(--border);\n}\n.pp-main {\n  min-width: 0;\n  min-height: 0;\n  overflow: auto;\n  background: var(--bg-surface);\n}\n\n/* \u2014\u2014 \u9875\u9762\u9AA8\u67B6\uFF08\u5BF9\u9F50 Apifox .doc-container + .overview-container\uFF09\u2014\u2014\n   Apifox \u7684\u9875\u9762\u662F\u300C\u9875\u5934\u901A\u680F + \u5185\u5BB9\u533A\u5404\u81EA padding\u300D\u4E24\u6BB5\uFF0C\u4E0D\u662F\u6574\u9875\u7EDF\u4E00 padding\u3002\n   \u6574\u9875 padding \u4F1A\u8BA9\u9875\u5934\u7684\u4E0B\u8FB9\u6846\u7F29\u8FDB\u3001\u8FD8\u8981\u9760\u5185\u8054\u8D1F margin \u62B5\u6D88\uFF0C10 \u4E2A\u9875\u9762\u91CD\u590D 10 \u6B21\u3002\n   \u8FD9\u91CC\u6539\u6210\uFF1A.pp-page \u53EA\u8D1F\u8D23\u7EB5\u5411\u6392\u5E03\uFF0C\u5185\u8FB9\u8DDD\u4EA4\u7ED9 .pp-overview-head \u4E0E .pp-overview-content\u3002 */\n.pp-page {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 100%;\n  padding: 0;\n}\n.pp-page-flush {\n  padding: 0;\n  height: 100%;\n  min-height: 0;\n}\n/* \u5185\u5BB9\u533A\uFF1A\u9875\u5934\u4E0B\u65B9\u7684\u6EDA\u52A8\u4E3B\u4F53\uFF0C\u5185\u8FB9\u8DDD 16px\uFF08Apifox .overview-content padding:16px\uFF09 */\n.pp-overview-content {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-4);\n  min-width: 0;\n  min-height: 0;\n  padding: var(--sp-4);\n}\n.pp-page-title {\n  font-size: var(--fs-20);\n  line-height: var(--lh-24);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  margin: 0 0 var(--sp-3) 0;\n}\n.pp-muted {\n  color: var(--fg-secondary);\n}\n.pp-faint {\n  color: var(--fg-tertiary);\n}\n\n/* \u2014\u2014 \u5361\u7247\uFF1A1px \u8FB9\u6846\u30018px \u5706\u89D2\u300116px \u5185\u8FB9\u8DDD\u3001\u65E0\u9634\u5F71 \u2014\u2014 */\n.pp-card {\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  padding: var(--card-pad);\n}\n.pp-card-title {\n  font-size: var(--fs-14);\n  line-height: var(--lh-22);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  margin: 0 0 var(--sp-2) 0;\n}\n/* \u5361\u5185\u591A\u6BB5\u6807\u9898\uFF08\u5982 Mock \u7684\u300C\u5B57\u6BB5\u89C4\u5219\u300D\u300C\u547D\u4E2D\u5730\u5740\u300D\uFF09\uFF1A\u4E0E\u4E0A\u65B9\u5185\u5BB9\u62C9\u5F00\u4E00\u6863\uFF0C\n   \u7EDF\u4E00\u89C4\u5219\u66FF\u4EE3\u9875\u9762\u91CC\u9010\u4E2A\u624B\u5199\u7684\u5185\u8054 marginTop\uFF1B\u9996\u4E2A\u6807\u9898\u4E0D\u7F29\u8FDB */\n.pp-card > .pp-card-title:not(:first-child) {\n  margin-top: var(--sp-3);\n}\n.pp-card-hover:hover {\n  border-color: var(--accent);\n  box-shadow: var(--shadow-popover);\n}\n/* \u5F53\u524D\u6253\u5F00\u7684\u9879\u76EE\u5361\uFF1A\u4E3B\u8272\u63CF\u8FB9\uFF08data-active \u7531 overview \u9875\u5199\u5165\uFF09 */\n.pp-card[data-active="true"] {\n  border-color: var(--accent);\n  box-shadow: inset 0 0 0 1px var(--accent);\n}\n\n/* \u2014\u2014 \u63A7\u4EF6\uFF1A\u9AD8\u5EA6\u4E00\u5F8B var(--ctl-h) \u2014\u2014 */\n.pp-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: var(--sp-1);\n  height: var(--ctl-h);\n  padding: 0 var(--sp-4);\n  font-family: var(--font-sans);\n  font-size: var(--fs-14);\n  line-height: var(--lh-22);\n  color: var(--fg);\n  background: var(--bg-surface);\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n  white-space: nowrap;\n  /* <a className="pp-btn"> \u590D\u7528\uFF08\u5FEB\u6377\u5165\u53E3\u7B49\uFF09\uFF1A\u6309\u94AE\u5185\u4E0D\u5141\u8BB8\u94FE\u63A5\u4E0B\u5212\u7EBF */\n  text-decoration: none;\n}\n.pp-btn:hover {\n  border-color: var(--accent);\n  color: var(--accent);\n}\n.pp-btn:disabled {\n  color: var(--fg-tertiary);\n  border-color: var(--border);\n  cursor: not-allowed;\n}\n.pp-btn-primary {\n  color: var(--fg-on-accent);\n  background: var(--accent);\n  border-color: var(--accent);\n}\n.pp-btn-primary:hover {\n  color: var(--fg-on-accent);\n  background: var(--accent-hover);\n  border-color: var(--accent-hover);\n}\n.pp-btn-primary:disabled {\n  color: var(--fg-on-accent);\n  background: var(--border-strong);\n  border-color: var(--border-strong);\n}\n.pp-btn-sm {\n  height: var(--ctl-h-sm);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-12);\n}\n.pp-btn-ghost {\n  border-color: transparent;\n  background: transparent;\n}\n.pp-btn-ghost:hover {\n  background: var(--bg-hover);\n  border-color: transparent;\n  color: var(--fg);\n}\n.pp-btn-danger:hover {\n  border-color: var(--error);\n  color: var(--error);\n}\n\n.pp-input,\n.pp-select {\n  height: var(--ctl-h);\n  padding: 0 var(--sp-3);\n  font-family: var(--font-sans);\n  font-size: var(--fs-14);\n  line-height: var(--lh-22);\n  color: var(--fg);\n  background: var(--bg-surface);\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-ctl);\n  min-width: 0;\n}\n.pp-input::placeholder {\n  color: var(--fg-tertiary);\n}\n.pp-input:focus,\n.pp-select:focus,\n.pp-btn:focus-visible {\n  outline: none;\n  border-color: var(--accent);\n  box-shadow: 0 0 0 2px var(--accent-tint);\n}\n.pp-input-mono {\n  font-family: var(--font-mono);\n  font-size: var(--fs-13);\n}\n.pp-input-sm {\n  height: var(--ctl-h-sm);\n  font-size: var(--fs-12);\n  padding: 0 var(--sp-2);\n}\n\n/* \u2014\u2014 \u8868\u683C\uFF1A\u884C\u9AD8\u4E00\u5F8B var(--row-h) \u2014\u2014 */\n.pp-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: var(--fs-14);\n}\n/* \u53C2\u6570\u8868\uFF08ParamTable\uFF09\u4E13\u5C5E\uFF1A\u5217\u5BBD\u5199\u6B7B\u5728 COLUMN_META\uFF0Cfixed \u5E03\u5C40\u4E0B\u7A84\u5BB9\u5668\u7531 .pp-table-wrap\n   \u6574\u4F53\u6A2A\u5411\u6EDA\u52A8\uFF0C\u800C\u4E0D\u662F\u5404\u5217\u6309\u5185\u5BB9\u4E92\u76F8\u6324\u538B\u584C\u9677\u6210 num\u2026/P\u2026\u3002\n   \u7528\u5C5E\u6027\u9009\u62E9\u5668\u800C\u4E0D\u662F\u65B0\u7C7B\u540D\uFF1A.pp-table \u662F\u5176\u5B83 9 \u4E2A\u9875\u9762\u7684\u5171\u7528\u7C7B\uFF0C\u4E0D\u80FD\u5728\u6B64\u6539\u5168\u5C40\u5E03\u5C40\u3002\n   \u6700\u5C0F\u5BBD\u5EA6\u7531\u7EC4\u4EF6\u6309\u5217\u5BBD\u5408\u8BA1\u5185\u8054\u7ED9\u51FA\uFF08\u9ED8\u8BA4\u516D\u5217 + \u64CD\u4F5C\u5217 = 806px\uFF09\uFF0C\u6B64\u5904\u4E0D\u91CD\u590D\u58F0\u660E\u3002 */\n/* \u7C7B\u540D\u522B\u540D\uFF1AParamTable \u540C\u65F6\u6302 .pp-table-params\uFF0C\u4FBF\u4E8E\u6309\u7C7B\u5B9A\u4F4D\uFF08\u5C5E\u6027\u9009\u62E9\u5668\u4FDD\u7559\u517C\u5BB9\uFF09 */\n.pp-table.pp-table-params,\n.pp-table[data-param-table] {\n  table-layout: fixed;\n}\n/* fixed \u5E03\u5C40\u4E0B\u5217\u5BBD\u5DF2\u5B9A\uFF0C\u957F\u6587\u672C\u5FC5\u987B\u88C1\u5728\u81EA\u5DF1\u7684\u683C\u5B50\u91CC\uFF08\u4E0D\u80FD\u9760 max-width:0 \u90A3\u5957\uFF0C\n   \u5B83\u4F1A\u628A\u6574\u4E2A\u8868\u683C\u538B\u584C\uFF09\uFF1B\u88C1\u5207\u53EA\u4F5C\u7528\u4E8E\u53C2\u6570\u8868\uFF0C\u5176\u5B83 .pp-table \u4FDD\u6301\u539F\u884C\u4E3A\u3002 */\n.pp-table[data-param-table] td {\n  overflow: hidden;\n}\n.pp-table th {\n  height: var(--row-h);\n  padding: 0 var(--sp-2);\n  text-align: left;\n  font-weight: var(--fw-medium);\n  font-size: var(--fs-13);\n  color: var(--fg-secondary);\n  background: var(--bg-subtle);\n  border-bottom: 1px solid var(--border);\n  white-space: nowrap;\n}\n.pp-table td {\n  height: var(--row-h);\n  padding: 0 var(--sp-2);\n  border-bottom: 1px solid var(--border);\n  /* Apifox \u8868\u683C\u4E0D\u6298\u884C\uFF1A\u7A84\u5BB9\u5668\u91CC\u9760 .pp-table-wrap \u6A2A\u5411\u6EDA\u52A8\uFF0C\u4E2D\u6587\u9010\u5B57\u65AD\u884C\u4F1A\u628A\u300C\u67E5\u8BE2\u300D\u7AD6\u6392\u3002\n     \u6B64\u5904\u4E0D\u5F97\u518D\u5199 max-width:0 + ellipsis\u2014\u2014\u90A3\u7EC4\u662F\u7A84\u5BB9\u5668\u5217\u584C\u9677\u7684\u5143\u51F6\u3002 */\n  white-space: nowrap;\n}\n/* \u73AF\u5883\u9875\u53D8\u91CF\u8868\uFF08env.jsx varTable\uFF09\uFF1A\u4E94\u5217\u56FA\u5B9A\u5BBD\u5EA6\uFF0C\u503C\u5217\u5403\u5269\u4F59\u5BBD\u5EA6\u3002\n   \u4E0D\u52A0 fixed \u65F6\u4E94\u5217\u6309\u5185\u5BB9\u6491\u5F00\uFF0C\u7A84\u5BB9\u5668\u91CC\u6574\u8868 603px \u9876\u7834 438px \u7684\u5BB9\u5668\u3002 */\n/* \u591A\u5217\u7F16\u8F91\u8868\uFF08flow \u6B65\u9AA4\u7F16\u6392 / test \u65AD\u8A00\u4E0E\u6B65\u9AA4\uFF09\uFF1A\u5217\u5BBD\u5408\u8BA1 510~640px\uFF0C\n   \u7A84\u5BB9\u5668\u91CC\u65E0\u5BBD\u5EA6\u5217\uFF08\u6D88\u606F / \u8DEF\u5F84\uFF09\u4F1A\u88AB\u538B\u5230\u51E0\u50CF\u7D20\uFF0C\u8868\u683C\u6574\u4F53\u4EA4\u7ED9 .pp-table-wrap \u6A2A\u5411\u6EDA\u52A8\u3002 */\n.pp-table.pp-table-wide {\n  min-width: 640px;\n}\n.pp-table.pp-table-vars {\n  table-layout: fixed;\n  /* \u56FA\u5B9A\u5217 52+52+64=168px\uFF0C\u53D8\u91CF\u540D\u5217 30%\u3001\u503C\u5217\u5403\u5269\u4F59\uFF1A360px \u5BB9\u5668\u4E0B\u503C\u5217\u4ECD\u6709 110px\uFF0C\n     \u518D\u7A84\u5C31\u6A2A\u5411\u6EDA\u52A8\u3002\u4E0D\u8BBE 480\u2014\u2014510px \u4E3B\u533A\u91CC\u4F1A\u88AB\u5207\u6389\u300C\u64CD\u4F5C\u300D\u5217\u3002 */\n  min-width: 360px;\n}\n.pp-table.pp-table-vars th:nth-child(1) { width: 30%; }\n.pp-table.pp-table-vars th:nth-child(2) { width: auto; }\n.pp-table.pp-table-vars th:nth-child(3),\n.pp-table.pp-table-vars th:nth-child(4) { width: 52px; }\n.pp-table.pp-table-vars th:nth-child(5) { width: 64px; }\n.pp-table.pp-table-vars td { overflow: hidden; }\n/* \u53F3\u7F16\u8F91\u533A\u53D8\u91CF\u8868\uFF1A\u4E94\u5217\u5728 480px \u4EE5\u4E0A\u90FD\u80FD\u5168\u663E\u793A\uFF0C\u4E0D\u9700\u8981\u6A2A\u5411\u6EDA\u52A8\u3002\n   \u53D8\u91CF\u540D 32% / \u503C\u5217\u5403\u5269\u4F59 / \u542F\u7528\xB7\u5BC6\u94A5\u5404 44px\uFF08\u53EA\u653E\u590D\u9009\u6846\uFF09/ \u64CD\u4F5C 48px\uFF08\u53EA\u653E\u56FE\u6807\u6309\u94AE\uFF09\u3002 */\n.pp-env-main .pp-table.pp-table-vars {\n  min-width: 0;\n  width: 100%;\n}\n.pp-env-main .pp-table.pp-table-vars th:nth-child(1) { width: 32%; }\n.pp-env-main .pp-table.pp-table-vars th:nth-child(3),\n.pp-env-main .pp-table.pp-table-vars th:nth-child(4) { width: 44px; }\n.pp-env-main .pp-table.pp-table-vars th:nth-child(5) { width: 48px; }\n.pp-env-main .pp-table.pp-table-vars td:nth-child(3),\n.pp-env-main .pp-table.pp-table-vars td:nth-child(4),\n.pp-env-main .pp-table.pp-table-vars td:nth-child(5) {\n  text-align: center;\n}\n.pp-env-main .pp-table.pp-table-vars input[type="checkbox"] {\n  margin: 0;\n}\n.pp-table tbody tr:hover {\n  background: var(--bg-hover);\n}\n.pp-table tbody tr[data-active="true"] {\n  background: var(--bg-selected);\n}\n.pp-table-mono {\n  font-family: var(--font-mono);\n  font-size: var(--fs-13);\n}\n/* \u5355\u5143\u683C\u5185\u7F16\u8F91\uFF1A\u65E0\u8FB9\u6846\u8F93\u5165\uFF0C\u805A\u7126\u624D\u663E\u8FB9\u6846\uFF08Apifox \u8868\u683C\u5185\u7F16\u8F91\u89C2\u611F\uFF09 */\n.pp-cell-input {\n  width: 100%;\n  min-width: 0;\n  color: var(--fg);\n  background: transparent;\n  border: 1px solid transparent;\n  border-radius: var(--radius-sm);\n}\n.pp-cell-input:hover {\n  border-color: var(--border);\n}\n.pp-cell-input:focus {\n  outline: none;\n  background: var(--bg-surface);\n  border-color: var(--accent);\n  box-shadow: 0 0 0 2px var(--accent-tint);\n}\n/* \u8868\u5C3E\u300C+ \u6DFB\u52A0\u53C2\u6570\u300D\uFF1A\u5360\u6EE1\u6574\u884C\uFF0C\u5DE6\u5BF9\u9F50 */\n.pp-table-add {\n  width: 100%;\n  justify-content: flex-start;\n  color: var(--accent);\n}\n/* \u8868\u683C\u884C\u5185\u64CD\u4F5C\u6309\u94AE\u7EC4\uFF1A\u95F4\u8DDD\u8D70 gap\uFF0C\u4E0D\u9760 JSX \u6587\u672C\u7A7A\u683C\uFF08history/test \u884C\u5185\u6309\u94AE\u5171\u7528\uFF09 */\n.pp-row-actions {\n  display: inline-flex;\n  align-items: center;\n  gap: var(--sp-1);\n}\n/* \u8868\u5185\u7A7A\u6001\u884C\uFF1A\u5C45\u4E2D\u4E00\u884C\u8BF4\u660E\uFF0C\u4E0E\u5361\u5185\u7A7A\u6001\u540C\u4E00\u6587\u6848\u5C42\u7EA7 */\n.pp-table td.pp-table-empty {\n  height: calc(var(--row-h) * 2);\n  text-align: center;\n  padding: var(--sp-3) var(--sp-2);\n}\n/* \u957F\u6587\u672C\u5355\u5143\u683C\u622A\u65AD\uFF1A\u622A\u5728\u81EA\u5DF1\u7684\u683C\u5B50\u91CC\uFF08fixed \u5E03\u5C40\uFF09\uFF0C\u4E0D\u628A\u64CD\u4F5C\u5217\u9876\u51FA\u9996\u5C4F */\n.pp-table td.pp-cell-clip {\n  max-width: 280px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n/* \u6574\u884C\u53EF\u70B9\u7684\u884C\uFF08history \u5217\u8868\uFF09\uFF1A\u884C\u672C\u8EAB\u662F\u9009\u4E2D\u5165\u53E3 */\n.pp-table tbody tr[data-clickable="true"] {\n  cursor: pointer;\n}\n/* \u603B\u89C8\u300C\u6700\u8FD1\u63A5\u53E3\u300D\u8868\uFF1Afixed \u5217\u5BBD\uFF08\u65B9\u6CD5/URL%/\u65F6\u95F4\uFF09\uFF0C\u7A84\u5BB9\u5668\u7531 .pp-table-wrap \u6A2A\u6EDA */\n.pp-table.pp-table-recent {\n  table-layout: fixed;\n  min-width: 460px;\n}\n.pp-table.pp-table-recent th:nth-child(1) { width: 64px; }\n.pp-table.pp-table-recent th:nth-child(3) { width: 40%; }\n.pp-table.pp-table-recent th:nth-child(4) { width: 128px; }\n/* Mock \u89C4\u5219\u8868\uFF1A\u542F\u7528 52 / \u5B57\u6BB5 28% / \u5339\u914D 96 / \u503C\u5403\u5269\u4F59 / \u64CD\u4F5C 44\uFF0C\n   \u5217\u5BBD\u7BA1\u7406\u5BF9\u9F50 .pp-table-vars\uFF08CSS \u627F\u8F7D\uFF0C\u66FF\u4EE3\u9875\u9762\u5185\u8054 th width\uFF09 */\n.pp-table.pp-table-mock-rules {\n  table-layout: fixed;\n  min-width: 416px;\n}\n.pp-table.pp-table-mock-rules th:nth-child(1) { width: 52px; }\n.pp-table.pp-table-mock-rules th:nth-child(2) { width: 28%; }\n.pp-table.pp-table-mock-rules th:nth-child(3) { width: 96px; }\n.pp-table.pp-table-mock-rules th:nth-child(4) { width: auto; }\n.pp-table.pp-table-mock-rules th:nth-child(5) { width: 44px; }\n.pp-table.pp-table-mock-rules td { overflow: hidden; }\n/* \u8868\u683C\u5185\u590D\u9009\u6846\uFF1A\u7EDF\u4E00 16px \u65B9\u5F62 + \u4E3B\u8272\uFF08\u542F\u7528/\u5FC5\u586B/\u5BC6\u94A5\u5F00\u5173\uFF09\u3002\n   \u4E0D\u58F0\u660E height\u2014\u2014\u9AD8\u5EA6\u7EAA\u5F8B\u9759\u6001\u68C0\u67E5\u53EA\u653E\u884C token\uFF1B\u5BBD\u5EA6\u5373\u89C6\u89C9\u5C3A\u5BF8\uFF0C\u6D4F\u89C8\u5668\u6309\u5BBD\u6E32\u67D3\u65B9\u5F62 */\n.pp-table input[type="checkbox"] {\n  width: var(--sp-4);\n  margin: 0;\n  accent-color: var(--accent);\n  vertical-align: middle;\n}\n/* \u7F16\u8F91\u8868\uFF08.pp-table-wide\uFF1Atest \u65AD\u8A00/\u6B65\u9AA4\u3001flow \u6B65\u9AA4\uFF09\u5185\u6587\u672C\u8F93\u5165\uFF1A\u4E0E .pp-cell-input \u540C\u89C2\u611F\uFF0C\n   \u65E0\u8FB9\u6846\u3001\u805A\u7126\u663E\u6846\uFF1B\u5BBD\u5EA6\u5403\u6EE1\u6240\u5728\u5217\uFF08\u66FF\u4EE3\u9875\u9762\u91CC\u9010\u4E2A\u624B\u5199\u7684 width:100% \u5185\u8054\uFF09 */\n.pp-table-wide .pp-input,\n.pp-table-wide .pp-select {\n  width: 100%;\n  min-width: 0;\n}\n.pp-table-wide .pp-input {\n  border-color: transparent;\n  background: transparent;\n}\n.pp-table-wide .pp-input:hover { border-color: var(--border); }\n.pp-table-wide .pp-input:focus {\n  background: var(--bg-surface);\n  border-color: var(--accent);\n}\n\n/* \u2014\u2014 \u80F6\u56CA / \u65B9\u6CD5\u5FBD\u6807\uFF1A\u9AD8\u5EA6\u4E00\u5F8B var(--pill-h) \u2014\u2014 */\n.pp-pill {\n  display: inline-flex;\n  align-items: center;\n  height: var(--pill-h);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-secondary);\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-pill);\n  white-space: nowrap;\n}\n.pp-pill-ok {\n  color: var(--success);\n  border-color: var(--success);\n}\n.pp-pill-warn {\n  color: var(--warning);\n  border-color: var(--warning);\n}\n.pp-pill-bad {\n  color: var(--error);\n  border-color: var(--error);\n}\n.pp-pill-accent {\n  color: var(--accent);\n  border-color: var(--accent);\n}\n.pp-method {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  height: var(--pill-h);\n  min-width: 44px;\n  padding: 0 var(--sp-2);\n  font-family: var(--font-mono);\n  font-size: var(--method-fs);\n  font-weight: var(--fw-semibold);\n  line-height: var(--lh-18);\n  letter-spacing: 0.02em;\n  text-transform: uppercase;\n  color: var(--fg-on-accent);\n  background: var(--fg-tertiary);\n  border: none;\n  border-radius: var(--radius-sm);\n}\n.pp-method[data-method="GET"] { background: var(--method-get); }\n.pp-method[data-method="POST"] { background: var(--method-post); }\n.pp-method[data-method="PUT"] { background: var(--method-put); }\n.pp-method[data-method="DELETE"] { background: var(--method-delete); }\n.pp-method[data-method="PATCH"] { background: var(--method-patch); }\n.pp-method[data-method="HEAD"],\n.pp-method[data-method="OPTIONS"],\n.pp-method[data-method="TRACE"] { background: var(--method-other); }\n\n/* \u2014\u2014 \u9875\u7B7E\u6761 + \u9875\u7B7E \u2014\u2014 */\n.pp-tabs {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-1);\n  /* \u7A84\u5BB9\u5668\u91CC\u9875\u7B7E\uFF08\u5982 import \u7684\u300COpenAPI / Swagger\u300D\uFF09\u4E00\u884C\u653E\u4E0D\u4E0B\uFF1A\n     \u5141\u8BB8\u6362\u884C\u5E76\u628A\u9AD8\u5EA6\u4EA4\u7ED9\u5185\u5BB9\uFF0C\u5426\u5219\u6807\u7B7E\u6587\u5B57\u4F1A\u88AB\u538B\u6210\u4E24\u884C\u3001\u9875\u7B7E\u6761\u9876\u7834\u5361\u7247\u3002 */\n  flex-wrap: wrap;\n  min-height: var(--ctl-h-lg);\n  padding: 0 var(--sp-3);\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n}\n.pp-tab {\n  display: inline-flex;\n  align-items: center;\n  height: var(--ctl-h);\n  padding: 0 var(--sp-3);\n  /* \u9875\u7B7E\u6587\u5B57\u4E0D\u6298\u884C\uFF1A\u6298\u884C\u4F1A\u628A\u300C\u67E5\u8BE2\u300D\u7AD6\u6392\u6210\u4E24\u884C */\n  white-space: nowrap;\n  font-family: var(--font-sans);\n  font-size: var(--fs-14);\n  color: var(--fg-secondary);\n  background: transparent;\n  border: none;\n  border-bottom: 2px solid transparent;\n  cursor: pointer;\n}\n.pp-tab:hover {\n  color: var(--fg);\n}\n.pp-tab[data-active="true"] {\n  color: var(--accent);\n  font-weight: var(--fw-medium);\n  border-bottom-color: var(--accent);\n}\n\n/* \u2014\u2014 \u5206\u6BB5\u63A7\u4EF6 \u2014\u2014 */\n.pp-seg {\n  display: inline-flex;\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-ctl);\n  overflow: hidden;\n}\n.pp-seg > button {\n  height: var(--ctl-h-sm);\n  padding: 0 var(--sp-3);\n  font-family: var(--font-sans);\n  font-size: var(--fs-13);\n  color: var(--fg-secondary);\n  background: var(--bg-surface);\n  border: none;\n  border-right: 1px solid var(--border);\n  cursor: pointer;\n}\n.pp-seg > button:last-child {\n  border-right: none;\n}\n.pp-seg > button[data-active="true"] {\n  color: var(--accent);\n  background: var(--accent-tint);\n  font-weight: var(--fw-medium);\n}\n\n/* \u2014\u2014 \u5DE6\u6811\uFF08\u5BF9\u9F50 Apifox .tree-bK2pJT / .treeList-ISn2t4 \u5B9E\u6D4B\uFF09\u2014\u2014\n   \u884C\u9AD8 22px\u3001\u5B57\u53F7 12px\u3001\u6587\u5B57\u8272\u53D6 --fg-secondary\u3001\u5DE6\u53F3\u5916\u8FB9\u8DDD 16px\uFF1B\n   hover \u53EA\u628A\u6587\u5B57\u8272\u63D0\u5230 --fg\uFF0C\u4E0D\u6362\u5E95\u2014\u2014\u8FD9\u662F Apifox \u6811\u6700\u5BB9\u6613\u88AB\u8BA4\u9519\u7684\u7279\u5F81\u3002 */\n.pp-tree {\n  padding: var(--sp-1) 0;\n}\n.pp-tree-row {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-1);\n  height: var(--tree-row-h);\n  margin: 0 var(--sp-4);\n  padding: 0 var(--sp-1);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-secondary);\n  /* \u5DE6\u6811\u6761\u76EE\u5728\u9AA8\u67B6\u91CC\u662F <a>\uFF1A\u5FC5\u987B\u663E\u5F0F\u53BB\u6389\u94FE\u63A5\u4E0B\u5212\u7EBF\u4E0E\u7EE7\u627F\u8272\uFF0C\u5426\u5219\u6574\u5217\u90FD\u662F\u5E26\u4E0B\u5212\u7EBF\u7684\u94FE\u63A5 */\n  text-decoration: none;\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: hidden;\n}\n.pp-tree-row:hover {\n  color: var(--fg);\n}\n.pp-tree-row[data-active="true"] {\n  color: var(--fg);\n  background: var(--bg-hover);\n  font-weight: var(--fw-medium);\n}\n/* \u5C55\u5F00\u7BAD\u5934\uFF1A\u5BBD 12px\uFF0C\u5DE6 12px \u53F3 4px\uFF08Apifox .tree-bK2pJT .ui-tree-switcher \u539F\u6587\uFF1A\n   width:12px; margin-left:12px; margin-right:4px\uFF09 */\n.pp-tree-switcher {\n  flex: none;\n  width: var(--sp-3);\n  margin-left: var(--sp-3);\n  margin-right: var(--sp-1);\n  text-align: center;\n  color: var(--fg-tertiary);\n}\n.pp-tree-icon {\n  flex: none;\n  width: var(--icon);\n  height: var(--icon);\n  color: var(--fg-tertiary);\n}\n.pp-tree-row-count {\n  margin-left: auto;\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n}\n.pp-tree-group {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-1);\n  height: var(--tree-row-h);\n  margin: 0 var(--sp-4);\n  padding: 0 var(--sp-1);\n  font-size: var(--fs-12);\n  font-weight: var(--fw-medium);\n  color: var(--fg-tertiary);\n  text-transform: none;\n}\n\n/* \u2014\u2014 \u53F3 TOC \u2014\u2014 */\n.pp-toc {\n  padding: var(--sp-3);\n}\n.pp-toc-item {\n  display: block;\n  height: var(--ctl-h-sm);\n  line-height: var(--ctl-h-sm);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-13);\n  color: var(--fg-secondary);\n  text-decoration: none;\n  border-left: 2px solid transparent;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.pp-toc-item:hover {\n  color: var(--fg);\n}\n.pp-toc-item[data-active="true"] {\n  color: var(--accent);\n  border-left-color: var(--accent);\n}\n\n/* \u2014\u2014 \u6587\u6863\u6B63\u6587\u5206\u533A \u2014\u2014 */\n/* \u5206\u533A\u5185\u90E8\u7EDF\u4E00\u8282\u62CD\uFF1Aflex \u7EB5\u6392 + \u4E00\u6863\u95F4\u8DDD 12px\uFF08--sp-3\uFF09\u2014\u2014\n   \u539F\u5148\u300C\u6807\u9898\u2192\u5185\u5BB9\u300D\u8DDD\u79BB\u968F\u5206\u533A\u7C7B\u578B\u6F02\u79FB\uFF08h2 8px / h3 4px / \u5404\u5904\u5185\u8054 margin \u6DF7\u7528\uFF09\u3002\n   \u5206\u533A\u4E4B\u95F4\uFF1A\u4E0A\u95F4\u8DDD 16px + 1px \u5206\u9694\u7EBF\uFF1B\u9996\u4E2A\u5206\u533A\uFF08\u57FA\u672C\u4FE1\u606F\uFF09\u65E0\u7EBF\u8DDD */\n.pp-doc-section {\n  display: flex;\n  flex-direction: column;\n  align-items: stretch;\n  gap: var(--sp-3);\n  padding-top: var(--sp-4);\n  margin-top: var(--sp-4);\n  border-top: 1px solid var(--border);\n}\n.pp-doc-section:first-child {\n  padding-top: 0;\n  margin-top: 0;\n  border-top: none;\n}\n/* \u6807\u9898\u4E0D\u518D\u81EA\u5E26\u4E0B\u8FB9\u8DDD\uFF0C\u95F4\u8DDD\u5168\u90E8\u4EA4\u7ED9\u5206\u533A\u7684 gap\uFF08Markdown \u91CC\u7684 .pp-doc-h2 \u4E0D\u5728\u5206\u533A\u5185\uFF0C\u4E0D\u53D7\u5F71\u54CD\uFF09 */\n.pp-doc-section > .pp-doc-h1,\n.pp-doc-section > .pp-doc-h2 {\n  margin: 0;\n}\n/* \u5206\u533A\u76F4\u4E0B\u7684\u88F8 <p> \u6E05\u6389 UA \u9ED8\u8BA4\u4E0A\u4E0B\u8FB9\u8DDD\uFF08\u539F\u5148\u9760\u5185\u8054 margin \u6216 UA 1em\uFF0C\u4E24\u79CD\u5E76\u5B58\u5BFC\u81F4\u95F4\u8DDD\u6F02\u79FB\uFF09 */\n.pp-doc-section > p,\n.pp-doc-sec-body > p {\n  margin: 0;\n}\n/* \u54CD\u5E94\u533A/\u54CD\u5E94\u5934\u7B49\u5D4C\u5957\u5757\u6CBF\u7528\u540C\u4E00\u8282\u62CD */\n.pp-doc-sec-body {\n  display: flex;\n  flex-direction: column;\n  align-items: stretch;\n  gap: var(--sp-3);\n  min-width: 0;\n}\n.pp-doc-sec-body > .pp-doc-h2,\n.pp-doc-sec-body > .pp-doc-h3 {\n  margin: 0;\n}\n/* \u5206\u533A\u5185\u7A7A\u6001\uFF1A\u7D27\u51D1\u4E00\u884C\u8BF4\u660E\uFF0C\u4E0D\u518D\u662F\u4E00\u5F20\u865A\u7EBF\u5927\u5361\uFF08\u4E0E\u5DE6\u6811/\u9762\u677F\u7A7A\u6001\u540C\u6863\uFF09 */\n.pp-doc-section .pp-empty {\n  max-width: none;\n  margin: 0;\n  padding: var(--sp-2) 0;\n  border: none;\n  background: transparent;\n  text-align: left;\n}\n.pp-doc-section .pp-empty-icon {\n  display: none;\n}\n/* \u6B63\u6587\u5206\u8282\u5185\u7684\u54CD\u5E94\u9875\u7B7E\uFF1A\u53BB\u6389\u901A\u680F\u9875\u7B7E\u6761\u7684\u5DE6\u53F3 padding\uFF0C\u4E0E\u8282\u6807\u9898\u5DE6\u7F18\u5BF9\u9F50 */\n.pp-doc-section .pp-tabs {\n  padding: 0;\n}\n.pp-doc-h1 {\n  font-size: var(--fs-20);\n  line-height: var(--lh-24);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  margin: 0 0 var(--sp-2) 0;\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n}\n.pp-doc-h2 {\n  font-size: var(--fs-16);\n  line-height: var(--lh-24);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  margin: 0 0 var(--sp-2) 0;\n}\n.pp-doc-h3 {\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-secondary);\n  margin: 0 0 var(--sp-1) 0;\n}\n\n/* \u2014\u2014 \u5DE5\u5177\u6761 \u2014\u2014 */\n.pp-toolbar {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  flex-wrap: wrap;\n  margin-bottom: var(--sp-3);\n}\n.pp-toolbar-inline {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  flex-wrap: wrap;\n}\n.pp-toolbar-spacer {\n  flex: 1;\n}\n\n/* \u2014\u2014 \u53CC\u680F / \u5B57\u6BB5\u884C \u2014\u2014 */\n.pp-cols-2 {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\n  gap: var(--sp-4);\n  align-items: start;\n}\n/* \u7A84\u5BB9\u5668\uFF1A\u4FA7\u8FB9\u680F\u4E3B\u533A\u5B9E\u6D4B 455~840px\uFF0C\u4E24\u5217\u5404\u53EA\u5269 230~420px\uFF0C\n   import \u7684 textarea \u4E0E settings \u7684\u4EE3\u7406\u8F93\u5165\u6846\u4F1A\u88AB\u622A\u65AD\u3002\n   900px = \u4E24\u5217\u5404 440px \u4EE5\u4E0A\u624D\u591F\u653E\u8FD9\u4E24\u7C7B\u63A7\u4EF6\uFF0C\u4F4E\u4E8E\u6B64\u6539\u4E0A\u4E0B\u5806\u53E0\u3002 */\n@container ppmain (max-width: 900px) {\n  .pp-cols-2 {\n    grid-template-columns: minmax(0, 1fr);\n  }\n}\n.pp-field {\n  display: grid;\n  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr) auto auto;\n  gap: var(--sp-2);\n  align-items: center;\n  min-height: var(--ctl-h);\n}\n.pp-field-head {\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n  border-bottom: 1px solid var(--border);\n}\n.pp-form-row {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-3);\n  min-height: var(--ctl-h);\n  margin-bottom: var(--sp-3);\n}\n.pp-form-label {\n  width: 104px;\n  flex: none;\n  font-size: var(--fs-14);\n  color: var(--fg-secondary);\n}\n\n/* \u2014\u2014 \u4EE3\u7801 / \u9884\u89C8\u5757 \u2014\u2014 */\n.pp-pre {\n  margin: 0;\n  padding: var(--sp-3);\n  font-family: var(--font-mono);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--fg);\n  background: var(--bg-subtle);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-ctl);\n  overflow: auto;\n}\n.pp-pre-scroll {\n  max-height: calc(var(--row-h) * 12);\n}\n.pp-json-editor {\n  width: 100%;\n  min-height: calc(var(--row-h) * 6);\n  padding: var(--sp-3);\n  font-family: var(--font-mono);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--fg);\n  background: var(--bg-surface);\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-ctl);\n  resize: vertical;\n}\n.pp-json-editor:focus {\n  outline: none;\n  border-color: var(--accent);\n  box-shadow: 0 0 0 2px var(--accent-tint);\n}\n.pp-textarea {\n  width: 100%;\n  min-height: calc(var(--row-h) * 6);\n  padding: var(--sp-3);\n  font-family: var(--font-mono);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--fg);\n  background: var(--bg-surface);\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-ctl);\n  resize: vertical;\n}\n.pp-textarea:focus {\n  outline: none;\n  border-color: var(--accent);\n  box-shadow: 0 0 0 2px var(--accent-tint);\n}\n\n/* \u2014\u2014 \u63D0\u793A\u6761 \u2014\u2014 */\n.pp-note {\n  display: flex;\n  align-items: flex-start;\n  gap: var(--sp-2);\n  padding: var(--sp-2) var(--sp-3);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--fg);\n  background: var(--bg-subtle);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-ctl);\n}\n.pp-note-bad {\n  color: var(--error);\n  border-color: var(--error);\n  background: var(--bg-surface);\n}\n.pp-note-warn {\n  color: var(--warning);\n  border-color: var(--warning);\n  background: var(--bg-surface);\n}\n.pp-note-ok {\n  color: var(--success);\n  border-color: var(--success);\n  background: var(--bg-surface);\n}\n.pp-error-text {\n  color: var(--error);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  margin: var(--sp-1) 0;\n}\n\n/* \u2014\u2014 \u5217\u8868 / \u7ED3\u679C\u884C \u2014\u2014 */\n.pp-list {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n}\n.pp-list-row {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  min-height: var(--row-h);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-14);\n  color: var(--fg);\n  text-decoration: none;\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n}\n.pp-list-row:hover {\n  background: var(--bg-hover);\n}\n.pp-list-row[data-active="true"] {\n  background: var(--bg-selected);\n  color: var(--accent);\n}\n.pp-result-row {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  min-height: var(--ctl-h);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-13);\n  border-bottom: 1px solid var(--border);\n}\n/* \u7ED3\u679C\u884C\uFF1A\u672B\u679A\u80F6\u56CA\u9760\u53F3\u3001\u9519\u8BEF/\u8BF4\u660E\u6587\u5B57\u5403\u5269\u4F59\u5BBD\uFF08\u66FF\u4EE3\u9010\u884C\u5185\u8054 marginLeft:auto\uFF09 */\n.pp-result-row > .pp-pill:last-of-type {\n  margin-left: auto;\n}\n.pp-result-row > .pp-meta {\n  flex: 1;\n  min-width: 0;\n}\n\n/* \u2014\u2014 \u72B6\u6001\u8272\u6587\u672C \u2014\u2014 */\n.pp-ok { color: var(--success); }\n.pp-warn { color: var(--warning); }\n.pp-bad { color: var(--error); }\n.pp-accent { color: var(--accent); }\n\n/* \u2014\u2014 \u5143\u4FE1\u606F / \u7701\u7565 \u2014\u2014 */\n.pp-meta {\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-tertiary);\n}\n.pp-mono {\n  font-family: var(--font-mono);\n  font-size: var(--fs-13);\n}\n.pp-ellipsis {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  min-width: 0;\n}\n.pp-scroll {\n  overflow: auto;\n  min-height: calc(var(--row-h) * 0);\n}\n/* \u8868\u683C\u5BB9\u5668\uFF1A\u7A84\u680F\u91CC\u6A2A\u5411\u6EDA\u52A8\uFF0C\u4FDD\u6301\u5217\u5BBD\u53EF\u8BFB\u3002\n   \u4E0D\u8981\u518D\u5199 .pp-table-wrap .pp-table{min-width:100%}\uFF1A\u8868\u683C\u6700\u5C0F\u5BBD\u5EA6\u7531 ParamTable\n   \u6309\u5217\u5BBD\u5408\u8BA1\u5185\u8054\u7ED9\u51FA\uFF0C\u8FD9\u6761\u9009\u62E9\u5668\u4F1A\u628A\u5B83\u8986\u76D6\u6210 100%\uFF0C\u5217\u5C31\u53C8\u80FD\u88AB\u538B\u584C\u3002 */\n.pp-table-wrap {\n  overflow-x: auto;\n  overflow-y: hidden;\n  /* flex/grid \u5B50\u9879\u9ED8\u8BA4 min-width:auto\uFF0C\u4F1A\u88AB\u8868\u683C\u5185\u8054 min-width \u9876\u5F00\u5BB9\u5668\uFF0C\n     \u5728 .pp-pane / .pp-debug-tabbody \u91CC\u8868\u73B0\u4E3A\u6574\u9875\u6A2A\u5411\u6EA2\u51FA\u3002\u8FD9\u91CC\u663E\u5F0F\u538B\u5230 0\u3002 */\n  min-width: 0;\n  max-width: 100%;\n}\n.pp-aside-sticky {\n  position: sticky;\n  top: var(--sp-4);\n}\n.pp-md-list {\n  margin: 0 0 var(--sp-2) 0;\n  padding-left: var(--sp-5);\n}\n\n/* \u2014\u2014 \u7EDF\u8BA1\u5757 \u2014\u2014 */\n.pp-stats {\n  display: grid;\n  /* \u4FA7\u8FB9\u680F\u53EF\u7528\u5BBD\u7EA6 500px\uFF1A96px \u8D77\u8DF3\u53EF\u7A33\u5B9A\u6392 4 \u5217\uFF08Apifox \u7EDF\u8BA1\u6761\u662F\u4E00\u884C\u56DB\u5757\uFF09 */\n  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));\n  gap: var(--sp-2);\n}\n/* \u7A84\u5BB9\u5668\uFF1A4 \u5757\u5404\u53EA\u5269 ~110px\uFF0C\u300C2026-11-19 09:41\u300D\u88AB\u622A\u6210\u300C2026-11-1\u2026\u300D\u3002\n   \u4E24\u5217\u8BA9\u6BCF\u5757 240px\uFF0C\u65F6\u95F4\u4E0E\u6570\u5B57\u90FD\u5B8C\u6574\u3002 */\n@container ppmain (max-width: 640px) {\n  .pp-stats {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n.pp-stat {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-1);\n  padding: var(--sp-2) var(--sp-3);\n  min-width: 0;\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n}\n.pp-stat-value {\n  /* \u7EDF\u8BA1\u6570\u5B57\u5728\u7A84\u680F\u91CC\u4E0D\u80FD\u7528 24px\uFF08\u4F1A\u6362\u884C\u628A\u56DB\u5757\u6491\u6210\u4E24\u884C\uFF09\uFF0C18px \u4E0E Apifox \u9762\u677F\u5185\u6570\u503C\u540C\u6863 */\n  font-size: var(--fs-16);\n  line-height: var(--lh-24);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.pp-stat-label {\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-secondary);\n}\n\n/* \u2014\u2014 \u603B\u89C8\uFF1A\u9879\u76EE\u5361\u7247\u7F51\u683C \u2014\u2014 */\n.pp-overview-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: var(--sp-4);\n}\n/* \u7F51\u683C\u91CC\u7684\u7A7A\u6001\uFF1A\u6A2A\u8D2F\u6574\u884C\uFF08auto-fill \u4E0B\u9ED8\u8BA4\u53EA\u5360\u7B2C\u4E00\u6761 280px \u8F68\u9053\uFF09 */\n.pp-overview-grid > .pp-empty {\n  grid-column: 1 / -1;\n}\n\n/* \u2014\u2014 \u8C03\u8BD5\uFF1A\u6574\u9875 padding 10px\uFF08Apifox .apiCase padding:10px\uFF09\u2014\u2014 */\n/* \u8C03\u8BD5\u9875\uFF1AApifox .apiCase \u539F\u6587\uFF08width/height 100%\u3001padding 10px\u3001overflow auto\uFF09\u3002\n   \u5355\u680F\u7ED3\u6784\u2014\u2014\u63A5\u53E3\u6811\u7531\u5DE6\u4FA7\u5168\u5C40\u5BFC\u822A\u627F\u62C5\uFF0C\u9875\u9762\u5185\u4E0D\u518D\u81EA\u5E26\u3002 */\n.pp-debug-page {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-3);\n  /* \u63A5\u4E0A .pp-page-flush \u7684 height:100%\uFF1A\u9875\u9AD8 = \u4E3B\u533A\u89C6\u53E3\u9AD8\uFF0C\n     \u300C\u54CD\u5E94\u533A\u5360\u6EE1\u5269\u4F59\u9AD8\u5EA6\u3001\u53D1\u9001\u6309\u94AE\u5E38\u9A7B\u53EF\u8FBE\u300D\u624D\u771F\u6B63\u751F\u6548\uFF08\u6B64\u524D\u9AD8\u5EA6\u94FE\u65AD\u88C2\u6574\u9875\u6EDA\uFF09 */\n  height: 100%;\n  padding: var(--page-pad);\n  padding-right: calc(var(--page-pad) - var(--sp-1) + var(--layout-pad));\n  min-height: 0;\n}\n/* \u5143\u4FE1\u606F\u884C\uFF1A\u73AF\u5883\u9009\u62E9 + \u5B9E\u9645\u5730\u5740 + \u53D8\u91CF + \u5386\u53F2\u5165\u53E3\uFF0C\u538B\u6210\u4E00\u884C */\n/* \u901A\u7528\u4E24\u680F\uFF08\u5DE6\u5217\u8868 + \u53F3\u8BE6\u60C5\uFF09\uFF1Aschema / test \u4E24\u9875\u5171\u7528\u3002\n   debug \u9875\u4E0D\u7528\u5B83\u2014\u2014\u8C03\u8BD5\u53F0\u662F Apifox \u5355\u680F\u7ED3\u6784\uFF1Bmock/env/flow \u6709\u81EA\u5DF1\u7684\u540C\u6784\u5E03\u5C40\u7C7B\u3002 */\n.pp-debug-layout {\n  display: grid;\n  grid-template-columns: clamp(var(--panel-w), 32%, var(--panel-w-max)) minmax(0, 1fr);\n  gap: var(--sp-3);\n  align-items: start;\n}\n/* \u5806\u53E0\u65AD\u70B9\u7EDF\u4E00 820px\uFF08env/mock/flow \u540C\u503C\uFF09\uFF1A\u4E3B\u533A 400~820px \u65F6\u4E24\u680F\u5E76\u6392\u4F1A\u628A\u53F3\u533A\u538B\u5230\u4E0D\u53EF\u8BFB */\n@container ppmain (max-width: 820px) {\n  .pp-debug-layout {\n    grid-template-columns: minmax(0, 1fr);\n  }\n}\n/* \u5168\u5C40\u641C\u7D22\u9875\uFF1A\u4E00\u6761\u641C\u7D22\u6761 + \u5206\u7EC4\u7ED3\u679C\u3002\n   \u539F\u6765\u300C\u641C\u7D22\u300D\u6309\u94AE\u5728\u9875\u5934\u3001\u8F93\u5165\u6846\u5728\u4E0B\u65B9\u7684\u5361\u7247\u91CC\uFF0C\u4E00\u6B21\u641C\u7D22\u8981\u8DE8\u4E24\u4E2A\u533A\u57DF\uFF1B\n   \u4E09\u7EC4\u7ED3\u679C\u53C8\u90FD\u585E\u8FDB\u4E00\u5F20\u5361\u7247\uFF0C\u7A7A\u7EC4\u4E5F\u5360\u4F4D\uFF0CURL \u88AB margin-left:auto \u7529\u5230\u8FDC\u7AEF\u3002 */\n.pp-search-bar {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  flex-wrap: wrap;\n  padding: var(--sp-3);\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n}\n.pp-search-project {\n  flex: none;\n  width: 120px;\n}\n.pp-search-input {\n  flex: 1;\n  min-width: 160px;\n}\n.pp-search-btn {\n  flex: none;\n  min-width: 72px;\n}\n.pp-search-source {\n  /* \u4E0E\u6765\u6E90\u533A/\u7ED3\u679C\u533A\u7684\u95F4\u8DDD\u4EA4\u7ED9 .pp-overview-content \u7684 gap\uFF0C\u4E0D\u518D\u81EA\u5E26 margin \u53E0\u52A0 */\n  margin: 0;\n}\n.pp-search-hint {\n  display: flex;\n  min-height: calc(var(--row-h) * 6);\n}\n.pp-search-results {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-3);\n}\n.pp-search-group {\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  overflow: hidden;\n}\n/* \u5206\u7EC4\u5934\uFF1A\u53EF\u6298\u53E0\uFF0C\u6574\u884C\u53EF\u70B9 */\n.pp-search-group-head {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  width: 100%;\n  height: var(--ctl-h);\n  padding: 0 var(--sp-3);\n  font-family: var(--font-sans);\n  font-size: var(--fs-13);\n  color: var(--fg-secondary);\n  text-align: left;\n  background: var(--bg-subtle);\n  border: none;\n  border-bottom: 1px solid var(--border);\n  cursor: pointer;\n}\n.pp-search-group-head:hover {\n  color: var(--fg);\n}\n.pp-search-caret {\n  flex: none;\n  width: 12px;\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n}\n.pp-search-group-label {\n  font-weight: var(--fw-medium);\n  color: var(--fg-strong);\n}\n.pp-search-count {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: none;\n  /* \u8BA1\u6570\u5FBD\u6807\u4E0E .pp-method/.pp-pill \u540C\u6863\uFF1A\u5B9A\u9AD8 --pill-h\uFF0C\u4E0D\u518D\u9760 line-height \u6491\u51FA */\n  height: var(--pill-h);\n  min-width: var(--pill-h);\n  padding: 0 var(--sp-1);\n  font-size: var(--fs-12);\n  line-height: 1;\n  color: var(--fg-tertiary);\n  text-align: center;\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-pill);\n}\n.pp-search-list {\n  padding: var(--sp-1) var(--sp-2) var(--sp-2);\n}\n.pp-search-row {\n  gap: var(--sp-2);\n}\n/* \u975E\u63A5\u53E3\u6761\u76EE\uFF08\u6A21\u578B / \u76EE\u5F55\uFF09\u7528\u4E00\u4E2A\u5C0F\u5706\u70B9\u5360\u4F4D\uFF0C\u4FDD\u6301\u4E09\u884C\u7F29\u8FDB\u5BF9\u9F50 */\n/* \u975E\u63A5\u53E3\u6761\u76EE\uFF08\u6A21\u578B / \u76EE\u5F55\uFF09\uFF1A\u7528\u4E00\u4E2A\u4E0E method \u5FBD\u6807\u540C\u5BBD\u7684\u5C0F\u5706\u70B9\u5360\u4F4D\uFF0C\n   \u4FDD\u8BC1\u4E09\u7EC4\u7684\u540D\u79F0\u5217\u5DE6\u8FB9\u7F18\u5BF9\u9F50\u3002method \u5FBD\u6807 min-width 44px\u3002 */\n.pp-search-dot {\n  flex: none;\n  width: 6px;\n  height: 6px;\n  margin: 0 19px;\n  background: var(--fg-tertiary);\n  border-radius: var(--radius-pill);\n}\n.pp-search-name {\n  flex: 0 1 auto;\n  font-size: var(--fs-13);\n}\n.pp-search-sub {\n  /* \u9760\u53F3\u4F46\u4E0D\u5403\u6EE1\uFF1A\u540D\u79F0\u4E0E URL \u4E4B\u95F4\u7559 16px \u8D77\uFF0C\u957F\u540D\u79F0\u65F6 URL \u8BA9\u4F4D */\n  flex: 0 1 auto;\n  margin-left: var(--sp-4);\n  text-align: right;\n}\n/* \u9875\u5934\u7EDF\u8BA1\uFF1A\u4E0D\u53C2\u4E0E\u6536\u7F29\uFF0C\u7A84\u680F\u91CC\u4E5F\u5B8C\u6574\u663E\u793A */\n.pp-search-summary {\n  flex: none;\n  white-space: nowrap;\n}\n.pp-search-mark {\n  padding: 0 1px;\n  color: var(--fg-strong);\n  font-weight: var(--fw-semibold);\n  background: var(--accent-tint);\n  border-radius: 2px;\n}\n/* \u5BFC\u5165\u5BFC\u51FA\u9875\uFF08Apifox\u300C\u5BFC\u5165\u5BFC\u51FA\u6570\u636E\u300D\u540C\u6784\uFF09\uFF1A\u9875\u7B7E\u5206\u533A + \u5DE6\u683C\u5F0F\u5217\u8868 + \u53F3\u5185\u5BB9\u3002\n   \u539F\u6765\u300C\u5BFC\u5165 / \u5BFC\u51FA\u300D\u4E24\u5217\u5E76\u6392\uFF0C\u5404\u53EA\u5269 240px\uFF1Atextarea \u4E0E\u6309\u94AE\u7EC4\u90FD\u6362\u884C\uFF0C\n   \u4EE3\u7801\u751F\u6210\u518D\u5355\u72EC\u5360\u4E00\u6574\u5F20\u5361\uFF0C\u4E09\u5757\u9AD8\u5EA6\u53C2\u5DEE\u3002 */\n.pp-io-layout {\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  overflow: hidden;\n}\n.pp-io-layout > .pp-tabs {\n  border-bottom: 1px solid var(--border);\n}\n.pp-io-body {\n  display: grid;\n  grid-template-columns: 168px minmax(0, 1fr);\n  min-height: 0;\n}\n@container ppmain (max-width: 720px) {\n  .pp-io-body {\n    grid-template-columns: minmax(0, 1fr);\n  }\n  /* \u5806\u53E0\u540E\u683C\u5F0F\u5217\u8868\u6539\u6210\u6A2A\u5411\u53EF\u6EDA\u7684\u4E00\u884C */\n  .pp-io-layout .pp-io-side {\n    flex-direction: row;\n    flex-wrap: nowrap;\n    overflow-x: auto;\n    border-right: none;\n    border-bottom: 1px solid var(--border);\n    padding: var(--sp-2);\n  }\n  .pp-io-layout .pp-io-side-title {\n    display: none;\n  }\n  .pp-io-layout .pp-io-item {\n    flex: none;\n    white-space: nowrap;\n  }\n  /* \u5806\u53E0\u540E\u4E3B\u533A\u72EC\u5360\u6574\u5BBD\uFF0C\u4F46 grid \u5B50\u9879\u9ED8\u8BA4 min-width:auto \u4F1A\u88AB\u5185\u5BB9\u9876\u5F00\uFF0C\n     \u8868\u73B0\u4E3A\u300C\u6E05\u7A7A\u300D\u6309\u94AE\u88AB\u5207\u6389\u4E00\u534A\u3002\u8FD9\u91CC\u663E\u5F0F\u538B\u5230 0\u3002 */\n  .pp-io-layout .pp-io-main {\n    min-width: 0;\n    padding: var(--sp-3);\n    padding-right: calc(var(--sp-3) + var(--sp-1));\n  }\n}\n.pp-io-side {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  padding: var(--sp-2);\n  border-right: 1px solid var(--border);\n  background: var(--bg-app);\n}\n.pp-io-side-title {\n  padding: var(--sp-1) var(--sp-2) var(--sp-2);\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n}\n.pp-io-item {\n  display: flex;\n  align-items: center;\n  height: var(--ctl-h);\n  padding: 0 var(--sp-2);\n  font-family: var(--font-sans);\n  font-size: var(--fs-13);\n  color: var(--fg-secondary);\n  text-align: left;\n  background: transparent;\n  border: none;\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n}\n.pp-io-item:hover {\n  color: var(--fg);\n  background: var(--bg-hover);\n}\n.pp-io-item[data-active="true"] {\n  color: var(--accent);\n  background: var(--accent-tint);\n  font-weight: var(--fw-medium);\n}\n.pp-io-main {\n  min-width: 0;\n  /* \u53F3\u4FA7\u6BD4\u5DE6\u4FA7\u591A\u7559 4px\uFF1A\u5361\u7247\u53F3\u8FB9\u6846 + \u6EDA\u52A8\u6761\u5728\u7A84\u680F\u91CC\u4F1A\u8D34\u4F4F textarea/\u6309\u94AE */\n  padding: var(--sp-4) var(--sp-4) var(--sp-4) var(--sp-4);\n  padding-right: calc(var(--sp-4) + var(--sp-1));\n}\n.pp-io-head {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  flex-wrap: wrap;\n  margin-bottom: var(--sp-2);\n}\n.pp-io-title {\n  font-size: var(--fs-14);\n  font-weight: var(--fw-semibold);\n  color: var(--fg-strong);\n}\n/* head \u662F flex + flex-wrap\uFF1A\u5B50\u9879\u9ED8\u8BA4\u53EF\u6536\u7F29\uFF0C\u7A84\u680F\u91CC\u300C\u6E05\u7A7A\u300D\u4F1A\u88AB\u538B\u5230 42px \u628A\u5B57\u88C1\u6389\u3002\n   \u6807\u9898\u5141\u8BB8\u7701\u7565\uFF0C\u6309\u94AE\u4E00\u5F8B\u4E0D\u6536\u7F29\u3002 */\n.pp-io-head > .pp-io-title {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.pp-io-head > .pp-btn {\n  flex: none;\n  /* \u4E24\u5B57\u6309\u94AE\uFF08\u6E05\u7A7A\uFF09\u5728 42px \u65F6\u8D34\u8FB9\uFF0C\u7ED9\u4E00\u70B9\u4F59\u91CF */\n  min-width: 56px;\n}\n.pp-io-head > .pp-btn:last-child {\n  margin-left: auto;\n}\n.pp-io-input {\n  margin-top: var(--sp-2);\n  /* \u4E0E .pp-pre-scroll\uFF08--row-h \xD7 12\uFF09\u540C\u6863\uFF1A\u7C98\u8D34\u533A\u4E0E\u7ED3\u679C\u533A\u7B49\u9AD8\uFF0C\n     \u66FF\u4EE3 HTML rows \u5C5E\u6027\uFF08rows \u4E0D\u53D7 token \u9AD8\u5EA6\u7EAA\u5F8B\u7EA6\u675F\uFF0C\u66FE\u9020\u51FA 224px vs 384px \u7684\u6863\u4F4D\u5DEE\uFF09 */\n  height: calc(var(--row-h) * 12);\n}\n/* \u52A8\u4F5C\u53CD\u9988\u533A\uFF1Aerror/notice \u6302\u5728\u89E6\u53D1\u6309\u94AE\u6240\u5728\u7684\u4E3B\u533A\u5185\uFF0C\u4E0D\u518D\u8DE8\u6574\u5C4F\u627E\u7ED3\u679C\uFF1B\u7A7A\u65F6\u96F6\u5360\u4F4D */\n.pp-io-status {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-2);\n  margin-top: var(--sp-2);\n}\n.pp-io-status:empty {\n  display: none;\n}\n/* \u5404\u9875\u7B7E\u7684\u5DE5\u5177\u884C\u4E0E\u4E0A\u65B9\u5185\u5BB9\u62C9\u5F00\u4E00\u6863\uFF08\u66FF\u4EE3\u9875\u9762\u91CC\u4E09\u5904\u5185\u8054 marginTop\uFF09 */\n.pp-io-main .pp-toolbar-inline {\n  margin-top: var(--sp-3);\n}\n.pp-io-stats {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  flex-wrap: wrap;\n  margin-top: var(--sp-2);\n}\n.pp-io-pre {\n  margin-top: var(--sp-3);\n}\n.pp-io-sample {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  margin-top: var(--sp-2);\n  min-width: 0;\n}\n/* \u73AF\u5883\u9875\uFF08Apifox\u300C\u73AF\u5883\u7BA1\u7406\u300D\u540C\u6784\uFF09\uFF1A\u5DE6\u73AF\u5883\u5217\u8868 + \u53F3\u7F16\u8F91\u533A\u3002\n   \u5DE6\u5217\u5BBD\u4E0E\u6587\u6863\u9875\u76EE\u5F55\u6811\u5171\u7528 --panel-w\uFF0C\u53F3\u533A\u9876\u4E0A\u662F\u9875\u7B7E\uFF08\u73AF\u5883\u53D8\u91CF / \u5168\u5C40\u53D8\u91CF / \u4F18\u5148\u7EA7\uFF09\u3002\n   \u539F\u6765\u7684\u4E00\u884C\u4E09\u5361\u5728 500px \u4E3B\u533A\u91CC\u6BCF\u5361\u53EA\u5269 250px\uFF0C\u53D8\u91CF\u8868\u8981\u6A2A\u5411\u6EDA\u52A8\u3001\n   \u4F18\u5148\u7EA7\u5361\u8BF4\u660E\u9010\u5B57\u6298\u884C\uFF0C\u64CD\u4F5C\u8DEF\u5F84\u4E5F\u4E0D\u5BF9\u2014\u2014\u5207\u6362\u73AF\u5883\u5728\u5DE6\u3001\u7F16\u8F91\u5728\u53F3\u624D\u5BF9\u5F97\u4E0A Apifox\u3002 */\n.pp-env-layout {\n  display: grid;\n  /* \u5DE6\u8F68\u4E0E doc/test/debug \u540C\u5F8B\uFF1Aclamp \u81EA\u9002\u5E94\uFF08240 \u4E0B\u9650 / 32% / 320 \u4E0A\u9650\uFF09 */\n  grid-template-columns: clamp(var(--panel-w), 32%, var(--panel-w-max)) minmax(0, 1fr);\n  gap: var(--sp-3);\n  align-items: start;\n}\n@container ppmain (max-width: 820px) {\n  .pp-env-layout {\n    grid-template-columns: minmax(0, 1fr);\n    gap: var(--sp-3);\n  }\n  /* \u5806\u53E0\u540E\u5DE6\u5217\u8868\u72EC\u5360\u4E00\u884C\uFF1A\u73AF\u5883\u6761\u76EE\u6539\u6210\u6A2A\u5411\u53EF\u6EDA\u7684\u80F6\u56CA\uFF0C\u4E0D\u518D\u5360\u6389\u6574\u5C4F\u9AD8\u5EA6\u3002\n     .pp-panel \u81EA\u5E26 width:var(--panel-w) \u4E0E overflow:auto\uFF0C\u8FD9\u91CC\u5FC5\u987B\u4E00\u8D77\u8986\u76D6\uFF0C\n     \u5426\u5219\u5DE6\u5217\u4ECD\u662F 240px \u5B9A\u5BBD\u3001\u53F3\u4FA7\u7559\u4E00\u5927\u7247\u7A7A\u767D\u3002 */\n  .pp-env-layout .pp-env-side {\n    width: auto;\n    padding: 0;\n    overflow: visible;\n  }\n  .pp-env-layout .pp-env-tree,\n  .pp-env-layout .pp-tree {\n    display: flex;\n    flex-wrap: nowrap;\n    gap: var(--sp-2);\n    overflow-x: auto;\n    padding: var(--sp-1) var(--sp-3);\n  }\n  .pp-env-layout .pp-tree-row {\n    flex: none;\n    max-width: 200px;\n    margin: 0;\n    padding: 0 var(--sp-3);\n    height: var(--ctl-h);\n    border: 1px solid var(--border);\n    border-radius: var(--radius-pill);\n  }\n  .pp-env-layout .pp-tree-row[data-active="true"] {\n    border-color: var(--accent);\n  }\n}\n.pp-env-side {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  padding: var(--sp-2) 0;\n}\n.pp-env-side-head {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  padding: 0 var(--sp-4) var(--sp-2);\n  border-bottom: 1px solid var(--border);\n  margin-bottom: var(--sp-1);\n}\n.pp-env-side-head .pp-card-title {\n  margin: 0;\n  font-size: var(--fs-13);\n}\n.pp-env-side-head > .pp-btn:last-child {\n  margin-left: auto;\n}\n.pp-btn-accent {\n  color: var(--accent);\n}\n.pp-env-main {\n  min-width: 0;\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  overflow: hidden;\n}\n.pp-env-main > .pp-tabs {\n  border-bottom: 1px solid var(--border);\n}\n.pp-env-pane {\n  padding: var(--sp-4);\n}\n.pp-env-fields {\n  display: grid;\n  /* \u5355\u5217\u5230\u5806\u53E0\u9608\u503C\u4E3A\u6B62\uFF1A\u73AF\u5883\u9875\u53EA\u6709\u540D\u79F0/\u524D\u7F6E URL \u4E24\u4E2A\u5B57\u6BB5\uFF0C\n     auto-fit \u5728 440~520px \u6BB5\u4F1A\u7A81\u8DF3\u6210\u4E24\u5217\u5BFC\u81F4\u5BBD\u5EA6\u8DF3\u53D8\uFF0C\u5355\u5217\u4E0D\u4E8F\u5BC6\u5EA6 */\n  grid-template-columns: minmax(0, 1fr);\n  gap: var(--sp-3);\n  margin-bottom: var(--sp-4);\n}\n.pp-env-pane > .pp-card-title {\n  margin: 0 0 var(--sp-2) 0;\n}\n/* \u53D8\u91CF\u8868\u7A7A\u884C\uFF1A\u5DE6\u5BF9\u9F50\u4E00\u884C\u63D0\u793A\uFF0C\u4E0D\u8981\u5360\u6EE1\u884C\u9AD8\u7684\u5C45\u4E2D\u7559\u767D */\n.pp-env-vars-empty {\n  height: auto;\n  padding: var(--sp-2) var(--sp-1);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-tertiary);\n  white-space: normal;\n}\n.pp-env-field {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-1);\n  margin-bottom: var(--sp-3);\n}\n.pp-env-field .pp-form-label {\n  width: auto;\n}\n.pp-env-field-row {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n}\n.pp-env-field-row .pp-input {\n  flex: 1;\n  min-width: 0;\n}\n.pp-env-check {\n  display: inline-flex;\n  align-items: center;\n  gap: var(--sp-1);\n  flex: none;\n  font-size: var(--fs-12);\n  color: var(--fg-secondary);\n  white-space: nowrap;\n}\n/* \u53D8\u91CF\u4F18\u5148\u7EA7\uFF1A\u7EB5\u5411\u56DB\u7EA7\uFF0C\u6BCF\u7EA7\u4E00\u884C\u300C\u5E8F\u53F7 + \u4F5C\u7528\u57DF\u300D\uFF0C\u8BF4\u660E\u7F29\u8FDB\u5728\u4E0B\u4E00\u884C\u3002\n   199px \u7684\u5361\u91CC\u300C1\uFF08\u6700\u9AD8\uFF09\u300D\u8FD9\u79CD\u957F\u5FBD\u6807\u4F1A\u628A\u4F5C\u7528\u57DF\u6324\u6210\u9010\u5B57\u6362\u884C\uFF0C\u6539\u6210\u5706\u5F62\u5E8F\u53F7\u3002 */\n.pp-priority-list {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-1);\n}\n.pp-priority-item {\n  display: grid;\n  grid-template-columns: 20px minmax(0, 1fr);\n  gap: var(--sp-2);\n  padding: var(--sp-2) 0;\n  border-bottom: 1px solid var(--border);\n}\n.pp-priority-item:last-child {\n  border-bottom: none;\n}\n.pp-priority-level {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--pill-h);\n  height: var(--pill-h);\n  font-size: var(--fs-12);\n  line-height: 1;\n  font-weight: var(--fw-semibold);\n  color: var(--fg-secondary);\n  background: var(--bg-subtle);\n  border-radius: var(--radius-pill);\n}\n.pp-priority-item:first-child .pp-priority-level {\n  color: var(--fg-on-accent);\n  background: var(--accent);\n}\n.pp-priority-body {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n}\n.pp-priority-scope {\n  font-size: var(--fs-13);\n  line-height: var(--lh-18);\n  font-weight: var(--fw-medium);\n  color: var(--fg-strong);\n}\n.pp-priority-note {\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-secondary);\n}\n/* Mock \u9875\uFF1A\u5DE6\u63A5\u53E3\u5217\u8868\uFF08\u4E0E\u6587\u6863\u9875\u76EE\u5F55\u6811\u540C\u8F68\u5BBD\uFF09+ \u53F3\u914D\u7F6E\u7EB5\u5411\u4E24\u5361\u3002\n   \u4E4B\u524D\u662F\u4E24\u5217\u7F51\u683C\u585E\u4E09\u4E2A\u5B50\u9879\uFF0C\u7B2C\u4E09\u5757\u88AB\u6324\u5230\u7B2C\u4E8C\u884C\u5DE6\u4FA7\u3001\u4E0E\u53F3\u4FA7\u5F62\u6210\u9AD8\u5EA6\u5DEE\u3002 */\n.pp-mock-layout {\n  display: grid;\n  grid-template-columns: clamp(var(--panel-w), 32%, var(--panel-w-max)) minmax(0, 1fr);\n  gap: var(--sp-3);\n  align-items: start;\n}\n.pp-mock-side {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-4);\n  min-width: 0;\n}\n@container ppmain (max-width: 820px) {\n  .pp-mock-layout {\n    grid-template-columns: minmax(0, 1fr);\n  }\n  .pp-mock-layout .pp-panel {\n    width: auto;\n    /* \u5806\u53E0\u6001\u5DE6\u5217\u8868\u9650\u9AD8\u4E0E doc/test \u540C\u5F8B\uFF1A--row-h \xD7 14 */\n    max-height: calc(var(--row-h) * 14);\n  }\n}\n/* Schema \u9875\uFF1A\u5DE6\u6A21\u578B\u5217\u8868 + \u53F3\u7F16\u8F91\u7EB5\u6392\uFF08\u7F16\u8F91\u5361 + \u793A\u4F8B\u5361\uFF09\u3002\n   \u4E4B\u524D\u4E09\u5757 pane \u585E\u4E24\u5217 grid\uFF0C\u300C\u793A\u4F8B\u6570\u636E\u300D\u81EA\u52A8\u6362\u884C\u5230\u5DE6\u8F68\u6B63\u4E0B\u65B9\u3001\u53F3\u5217\u6574\u5757\u7559\u767D\n   \uFF08mock \u9875\u4FEE\u8FC7\u4E00\u6A21\u4E00\u6837\u7684\u95EE\u9898\uFF0Cschema \u672A\u540C\u6B65\uFF09\u3002 */\n.pp-schema-layout {\n  display: grid;\n  grid-template-columns: clamp(var(--panel-w), 32%, var(--panel-w-max)) minmax(0, 1fr);\n  gap: var(--sp-3);\n  align-items: start;\n}\n.pp-schema-main {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-4);\n  min-width: 0;\n}\n@container ppmain (max-width: 820px) {\n  .pp-schema-layout {\n    grid-template-columns: minmax(0, 1fr);\n  }\n  .pp-schema-layout .pp-panel {\n    width: auto;\n    max-height: calc(var(--row-h) * 14);\n  }\n}\n/* \u6D4B\u8BD5\u9875\u53F3\u4E3B\u5217\uFF1A\u65AD\u8A00\u9762\u677F + \u8FD0\u884C\u7ED3\u679C\u9762\u677F\u7EB5\u5411\u6210\u7EC4\uFF0C\u5360 grid \u7B2C 2 \u5217\u2014\u2014\n   \u5426\u5219\u7B2C\u4E09\u4E2A pane \u6389\u8FDB .pp-debug-layout \u5DE6\u8F68\uFF08\u5BBD\u7A97\u53E3\u4E0B\u88AB\u5939\u8FDB 240px \u7A84\u5217\uFF09 */\n.pp-test-main {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-4);\n  min-width: 0;\n}\n/* \u6D4B\u8BD5\u9875\u9875\u7B7E\u6761\u5361\u7247\u58F3\uFF1A\u4E0E env \u9875 .pp-env-main \u540C\u6784\uFF0C\u9875\u7B7E\u4E0D\u518D\u60AC\u7A7A */\n.pp-test-tabs {\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  overflow: hidden;\n}\n.pp-test-tabs > .pp-tabs {\n  border-bottom: none;\n}\n/* \u9762\u677F\u5934\uFF1A\u6807\u9898 + \u53F3\u4FA7\u4E3B\u64CD\u4F5C\uFF08test \u5DE6\u5217\u8868\u4E0E flow \u6B65\u9AA4\u5217\u8868\u5171\u7528\uFF0C\n   \u7ED3\u6784\u540C .pp-env-side-head\uFF0Cenv \u9875\u6CBF\u7528\u65E2\u6709\u7C7B\uFF09 */\n.pp-pane-head {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  padding: 0 var(--sp-1) var(--sp-2);\n  border-bottom: 1px solid var(--border);\n  margin-bottom: var(--sp-1);\n}\n.pp-pane-head .pp-card-title {\n  margin: 0;\n  font-size: var(--fs-13);\n}\n.pp-pane-head > .pp-btn:last-child {\n  margin-left: auto;\n}\n.pp-debug-meta {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: var(--sp-2);\n  margin-top: var(--sp-2);\n  font-size: var(--fs-12);\n}\n.pp-debug-meta .pp-select {\n  flex: none;\n  width: auto;\n  min-width: 96px;\n}\n.pp-debug-meta .pp-mono {\n  flex: 1;\n  min-width: 0;\n}\n/* \u9875\u7B7E\u4F53\uFF1A\u4E0E\u9875\u7B7E\u6761\u4E4B\u95F4\u7559 8px\uFF0C\u5185\u5BB9\u533A\u81EA\u5DF1\u6EDA\u52A8 */\n.pp-debug-tabbody {\n  margin-top: var(--sp-2);\n  min-width: 0;\n}\n/* \u2014\u2014 \u8C03\u8BD5\uFF1A\u5BBD\u5BB9\u5668\u4E09\u680F / \u7A84\u5BB9\u5668\u5355\u5217 \u2014\u2014 */\n/* \u4E09\u680F\uFF08\u6811 / \u8BF7\u6C42\u7F16\u8F91 / \u54CD\u5E94\uFF09\u5728 400~700px \u7684\u4E3B\u533A\u91CC\u6BCF\u680F\u53EA\u5269 100 \u591A\u50CF\u7D20\uFF0C\n   \u53C2\u6570\u8868\u88AB\u6324\u6210\u4E00\u6761\uFF0C\u8FD9\u624D\u662F\u300C\u5E03\u5C40\u9519\u4E71\u300D\u7684\u6839\u56E0\u3002\u7A84\u5BB9\u5668\u4E0B\u6539\u4E3A\u5355\u5217\u7EB5\u5411\u5806\u53E0\u3002\n   \u9996\u5217\u4E0E\u6587\u6863\u9875\u5171\u7528 --panel-w\uFF0C\u4E24\u9875\u7684\u63A5\u53E3\u6811\u5BBD\u5EA6\u4FDD\u6301\u4E00\u81F4\u3002 */\n\n.pp-pane {\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  padding: var(--card-pad);\n  min-width: 0;\n}\n/* \u2014\u2014 \u8C03\u8BD5\u53F0 URL \u884C\uFF08\u5BF9\u9F50 Apifox .apiCase .main-input-bar\uFF09\u2014\u2014\n   \u6574\u884C\u9AD8 40px\uFF1Bmethod \u5DE6\u5185\u8FB9\u8DDD 12px \u53F3 8px\uFF1BbaseUrl / path \u662F\u4E24\u4E2A\u80F6\u56CA\n   \uFF08\u5706\u89D2 6px\u3001margin 5px\u3001\u5185\u8FB9\u8DDD 0 10px\u3001\u884C\u9AD8 28px\uFF09\uFF1B\u53D1\u9001\u6309\u94AE\u7EC4 \u4E3B + 25px \u4E0B\u62C9\u3002 */\n.pp-url-row {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: var(--sp-2);\n  min-height: var(--ctl-h-lg);\n}\n.pp-url-row .pp-select {\n  width: 104px;\n  flex: none;\n  padding-left: var(--sp-3);\n}\n.pp-url-row .pp-input {\n  flex: 1;\n  /* \u4E0E\u53D1\u9001\u6309\u94AE\u540C\u6863 32px\uFF1AURL \u884C\u662F\u5168\u9875\u89C6\u89C9\u951A\u70B9\uFF0C\u6838\u5FC3\u8F93\u5165\u6846\u4E0D\u518D\u6BD4\u6B21\u8981\u6309\u94AE\u77EE\u4E00\u6863 */\n  height: var(--ctl-h);\n}\n/* \u7A84\u5BB9\u5668\uFF1AURL \u884C\u6324\u5728\u4E00\u884C\u65F6\u8DEF\u5F84\u8F93\u5165\u6846\u53EA\u5269\u51E0\u5341\u50CF\u7D20\uFF08"\u672A\u914D\u7F6E baseUrl" \u80F6\u56CA\u672C\u8EAB\u5C31\u8981 90px\uFF09\u3002\n   \u8BA9\u8DEF\u5F84\u8F93\u5165\u6846\u72EC\u5360\u7B2C\u4E8C\u884C\uFF0C\u5BBD\u5EA6\u62C9\u6EE1\uFF0C\u53D1\u9001\u7EC4\u4ECD\u7559\u5728\u7B2C\u4E00\u884C\u672B\u5C3E\u3002 */\n@container ppmain (max-width: 640px) {\n  .pp-url-row .pp-input {\n    order: 9;\n    flex-basis: 100%;\n  }\n  .pp-url-row .pp-url-pill {\n    max-width: 32%;\n  }\n}\n.pp-url-method {\n  flex: none;\n  padding: 0 var(--sp-2) 0 var(--sp-3);\n  font-size: var(--fs-14);\n  font-weight: var(--fw-medium);\n  color: var(--fg-strong);\n  line-height: var(--ctl-h-lg);\n}\n/* \u65B9\u6CD5\u4E0B\u62C9\u672C\u8EAB\u627F\u62C5\u65B9\u6CD5\u8272\uFF08\u66FF\u4EE3\u300C\u5FBD\u6807 + \u4E0B\u62C9\u300D\u53CC\u5143\u7D20\u5E76\u6392\uFF1A\u7701 148px \u5BBD\u3001\u53BB\u6389 22/32 \u6DF7\u6863\uFF09 */\n.pp-select.pp-url-method[data-method="GET"]     { color: var(--method-get); border-color: var(--method-get); }\n.pp-select.pp-url-method[data-method="POST"]    { color: var(--method-post); border-color: var(--method-post); }\n.pp-select.pp-url-method[data-method="PUT"]     { color: var(--method-put); border-color: var(--method-put); }\n.pp-select.pp-url-method[data-method="DELETE"]  { color: var(--method-delete); border-color: var(--method-delete); }\n.pp-select.pp-url-method[data-method="PATCH"]   { color: var(--method-patch); border-color: var(--method-patch); }\n.pp-select.pp-url-method[data-method="HEAD"],\n.pp-select.pp-url-method[data-method="OPTIONS"],\n.pp-select.pp-url-method[data-method="TRACE"]   { color: var(--method-other); border-color: var(--method-other); }\n/* baseUrl / path \u80F6\u56CA\uFF1AApifox \u628A\u4E24\u8005\u62C6\u6210\u72EC\u7ACB\u7684\u5706\u89D2\u5757\uFF0C\u89C6\u89C9\u4E0A\u533A\u5206\u300C\u73AF\u5883\u57DF\u300D\u4E0E\u300C\u8DEF\u5F84\u300D */\n.pp-url-pill {\n  display: inline-flex;\n  align-items: center;\n  flex: none;\n  max-width: 40%;\n  height: var(--ctl-h-sm);\n  margin: 0 var(--sp-1);\n  padding: 0 var(--sp-2);\n  font-family: var(--font-mono);\n  font-size: var(--fs-12);\n  line-height: var(--ctl-h-sm);\n  color: var(--fg-secondary);\n  background: var(--bg-subtle);\n  border-radius: var(--radius-ctl);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.pp-url-pill-grow {\n  flex: 1;\n  max-width: none;\n}\n/* \u53D1\u9001\u6309\u94AE\u7EC4\uFF1A\u4E3B\u6309\u94AE\u5403\u6EE1\u5269\u4F59\u5BBD\u5EA6\u3001\u53F3\u7AEF 28px \u4E0B\u62C9\u4F4D\uFF08--hit \u547D\u4E2D\u533A\u6807\u51C6\uFF09\n   \u539F 95px \u5B9A\u5BBD\u5728\u300C\u53D1\u9001\u4E2D\u2026\u300D\u65F6\u5FC5\u7136\u88C1\u5B57\uFF0C\u6539\u4E3A\u968F\u6587\u6848\u81EA\u9002\u5E94 */\n.pp-send-group {\n  display: inline-flex;\n  flex: 0 1 auto;\n  min-width: 0;\n  gap: 0;\n}\n.pp-url-row .pp-send-group {\n  flex: none;\n  width: auto;\n}\n.pp-send-group .pp-btn:first-child {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.pp-send-group .pp-btn:last-child {\n  width: var(--hit);\n  padding: 0;\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n/* \u5206\u7EC4\u6807\u9898\uFF1A\u5DE6\u8FB9 3px \u4E3B\u8272\u7AD6\u7EBF + \u5DE6\u5185\u8FB9\u8DDD 10px + 16px \u5B57\n   \uFF08Apifox .apiDebug .group-title \u539F\u6587\uFF1Aborder-left:3px; margin-left:2px; padding-left:10px; font-size:16px\uFF09 */\n.pp-group-title {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  margin: var(--sp-2) 0 var(--sp-1) var(--sp-1);\n  /* 10px \u4E0D\u5728 4/8/12 \u523B\u5EA6\u4E0A\uFF0C\u4F46\u8FD9\u662F Apifox \u539F\u6587\u503C\uFF0C\u5199 calc \u4FDD\u6301\u53EF\u8FFD\u6EAF */\n  padding-left: calc(var(--sp-2) + var(--sp-1) / 2);\n  font-size: var(--fs-16);\n  line-height: var(--lh-24);\n  font-weight: var(--fw-medium);\n  color: var(--fg-strong);\n  border-left: 3px solid var(--accent);\n}\n\n/* \u2014\u2014 \u6D41\u7A0B\u56FE\u5BB9\u5668 \u2014\u2014 */\n/* \u6D41\u7A0B\u56FE\u9875\uFF08Apifox \u6D4B\u8BD5\u573A\u666F\u540C\u6784\uFF09\uFF1A\u5DE6\u6B65\u9AA4\u5217\u8868 + \u53F3\u753B\u5E03 + \u4E0B\u65B9\u5C5E\u6027\u9762\u677F\u3002\n   \u753B\u5E03\u5E38\u9A7B\uFF0C\u6539\u4EFB\u4E00\u6B65\u5373\u65F6\u91CD\u7ED8\uFF1B\u4E0D\u518D\u7528\u300C\u6574\u5BBD\u753B\u5E03 + \u6574\u5BBD\u8868\u683C\u300D\u4E0A\u4E0B\u5806\u53E0\u2014\u2014\n   \u8868\u683C\u5728 500px \u4E3B\u533A\u91CC\u8981\u6A2A\u5411\u6EDA 640px\uFF0C\u6539\u4E00\u6B65\u5F97\u6765\u56DE\u6EDA\u4E24\u6B21\u3002 */\n.pp-flow-layout {\n  display: grid;\n  /* \u5DE6\u8F68\u4E0E doc/test/debug \u540C\u5F8B\uFF1Aclamp \u81EA\u9002\u5E94\uFF0C\u5BBD\u7A97\u53E3\u4E0B\u6B65\u9AA4\u540D\u4E0D\u518D\u88AB 240px \u622A\u65AD */\n  grid-template-columns: clamp(var(--panel-w), 32%, var(--panel-w-max)) minmax(0, 1fr);\n  gap: var(--sp-3);\n  align-items: start;\n}\n@container ppmain (max-width: 820px) {\n  .pp-flow-layout {\n    grid-template-columns: minmax(0, 1fr);\n    gap: var(--sp-3);\n  }\n  /* \u5806\u53E0\u540E\u6B65\u9AA4\u5217\u8868\u9AD8\u5EA6\u538B\u5230\u7EA6 6 \u884C\uFF08\u884C\u9AD8 = 2\xD7--lh-18 + 2\xD7--sp-1 padding\uFF09\uFF0C\u907F\u514D\u628A\u753B\u5E03\u6324\u5230\u9996\u5C4F\u4E4B\u5916 */\n  .pp-flow-layout .pp-flow-steps {\n    max-height: calc(var(--lh-18) * 2 * 6 + var(--sp-1) * 2 * 6);\n  }\n  .pp-flow-layout .pp-flow-side {\n    width: auto;\n    overflow: visible;\n  }\n}\n.pp-flow-side {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  padding: var(--sp-2) 0;\n}\n.pp-flow-side-head {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  padding: 0 var(--sp-4) var(--sp-2);\n  border-bottom: 1px solid var(--border);\n  margin-bottom: var(--sp-1);\n}\n.pp-flow-side-head .pp-card-title {\n  margin: 0;\n  font-size: var(--fs-13);\n}\n.pp-flow-side-head > .pp-btn:last-child {\n  margin-left: auto;\n}\n.pp-flow-steps {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  /* \u53CC\u884C\u6B65\u9AA4\uFF08\u540D\u79F0 + mono \u6D88\u606F\uFF09\u7EA6 12 \u884C\uFF1A\u884C\u9AD8 = 2\xD7--lh-18 + 2\xD7--sp-1 padding\uFF0C\u5168\u90E8 token \u6D3E\u751F */\n  max-height: calc(var(--lh-18) * 2 * 12 + var(--sp-1) * 2 * 12);\n  overflow: auto;\n}\n.pp-flow-step {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  padding: var(--sp-1) var(--sp-3);\n  margin: 0 var(--sp-2);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-secondary);\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n}\n.pp-flow-step:hover {\n  color: var(--fg);\n}\n.pp-flow-step[data-active="true"] {\n  color: var(--fg);\n  background: var(--bg-hover);\n  font-weight: var(--fw-medium);\n}\n.pp-flow-step-no {\n  flex: none;\n  width: 18px;\n  font-family: var(--font-mono);\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n  text-align: right;\n}\n.pp-flow-step[data-active="true"] .pp-flow-step-no {\n  color: var(--accent);\n}\n.pp-flow-step-body {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  flex: 1;\n}\n.pp-flow-step-name {\n  color: inherit;\n}\n.pp-flow-step-msg {\n  font-family: var(--font-mono);\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n}\n.pp-flow-step-act {\n  flex: none;\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n}\n.pp-flow-main {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-4);\n  min-width: 0;\n}\n.pp-flow-props {\n  padding: var(--sp-4);\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n}\n.pp-flow-prop-grid {\n  display: grid;\n  /* \u6807\u7B7E\u5217\u5BF9\u9F50 .pp-form-label \u7684 104px\uFF1A\u8DE8\u9875\u8868\u5355\u6807\u7B7E\u4E00\u5957\u6807\u51C6 */\n  grid-template-columns: 104px minmax(0, 1fr);\n  gap: var(--sp-2) var(--sp-3);\n  align-items: center;\n}\n.pp-flow-prop-grid .pp-form-label {\n  width: auto;\n  font-size: var(--fs-13);\n}\n.pp-flow-prop-row {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  min-width: 0;\n}\n.pp-flow-prop-row .pp-input {\n  flex: 1;\n  min-width: 0;\n}\n.pp-flow-name {\n  width: 180px;\n}\n.pp-seq-wrap {\n  /* \u753B\u5E03\u5217 flex \u5BB9\u5668\uFF1A\u5E38\u6001\u5B50\u7EA7\u53EA\u6709 svg\uFF08\u7A7A\u6001\u65F6\u5C45\u4E2D\uFF09\uFF0C\u7EB5\u6392\u4E0D\u5F71\u54CD svg \u7684\u5757\u7EA7\u8868\u73B0 */\n  display: flex;\n  flex-direction: column;\n  overflow-x: auto;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  background: var(--bg-surface);\n  padding: var(--sp-4);\n}\n.pp-seq-wrap svg {\n  /* \u4EFB\u4F55\u5BB9\u5668\u5BBD\u5EA6\u4E0B\u90FD\u4FDD\u4F4F\u53EF\u8BFB\u4E0B\u9650\uFF08--seq-min-w\uFF09\uFF1A\u6587\u5B57 1:1\uFF0C\u4E0D\u8DB3\u7531\u672C\u5BB9\u5668\u6A2A\u6EDA\u3002\n     \u5BBD\u5BB9\u5668\u91CC\u5185\u8054 width:100% \u4ECD\u4F1A\u62C9\u6EE1\uFF0Cmin \u53EA\u662F\u4E0B\u9650 */\n  min-width: var(--seq-min-w);\n  display: block;\n}\n/* \u753B\u5E03/\u5C5E\u6027\u9762\u677F\u91CC\u7684\u7A7A\u6001\uFF1A\u4E0D\u8981 360px \u5927\u865A\u7EBF\u5361\u8D34\u9876\uFF0C\u7ED9\u4E00\u5708\u547C\u5438 */\n.pp-seq-wrap > .pp-empty,\n.pp-flow-props > .pp-empty {\n  margin: var(--sp-3) auto;\n  padding: var(--sp-4) var(--sp-3);\n}\n.pp-split-hint {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  padding: var(--sp-2) var(--sp-3);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--warning);\n  border: 1px solid var(--warning);\n  border-radius: var(--radius-ctl);\n  background: var(--bg-surface);\n}\n\n/* \u2014\u2014 \u7A7A\u6001 \u2014\u2014 */\n/* \u7A7A\u6001\uFF1A\u7D27\u51D1\u5C45\u4E2D\u5361\u3002\u6536\u7A84\u5230 --empty-w\uFF08360px\uFF09\u2014\u2014\u4E4B\u524D\u94FA\u6EE1 460px \u5BBD\u53EA\u653E\u4E00\u884C\u5B57\uFF0C\n   \u89C6\u89C9\u4E0A\u50CF\u4E00\u5757\u6CA1\u505A\u5B8C\u7684\u5360\u4F4D\u3002\u56FE\u6807\u7528\u4E09\u7EA7\u8272\uFF0C\u4E3B\u6587\u6848\u7528\u4E8C\u7EA7\u8272\uFF0C\u5C42\u7EA7\u9760\u989C\u8272\u4E0E\u5B57\u53F7\u533A\u5206\u3002 */\n.pp-empty {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: var(--sp-2);\n  width: 100%;\n  max-width: var(--empty-w);\n  /* margin:auto \u5728 flex \u5BB9\u5668\uFF08.pp-page \u662F flex column\uFF09\u91CC\u540C\u65F6\u6C34\u5E73\u4E0E\u5782\u76F4\u5C45\u4E2D\uFF1B\n     \u4E4B\u524D\u5199\u6B7B var(--sp-6) auto \u53EA\u6C34\u5E73\u5C45\u4E2D\uFF0C\u7A7A\u6001\u4F1A\u8D34\u5728\u9876\u90E8\uFF0C\u4E0B\u65B9\u7559\u4E00\u5927\u7247\u7A7A\u767D\u3002 */\n  margin: auto;\n  padding: var(--sp-6) var(--sp-4);\n  text-align: center;\n  font-size: var(--fs-14);\n  line-height: var(--lh-20);\n  color: var(--fg-tertiary);\n  border: 1px dashed var(--border-strong);\n  border-radius: var(--radius-card);\n  background: var(--bg-surface);\n}\n.pp-empty-icon {\n  color: var(--fg-tertiary);\n}\n.pp-empty-text {\n  color: var(--fg-secondary);\n  font-weight: var(--fw-medium);\n}\n.pp-empty-action {\n  margin-top: var(--sp-1);\n}\n/* \u9762\u677F\u5185\u7684\u7A7A\u6001\uFF08\u5DE6\u6811\uFF09\uFF1A\u4E0D\u8981\u865A\u7EBF\u6846\u4E0E\u56FE\u6807\uFF0C\u53EA\u7559\u4E00\u884C\u8BF4\u660E + \u7D27\u51D1\u52A8\u4F5C\u94AE */\n.pp-panel .pp-empty {\n  max-width: none;\n  margin: var(--sp-3) 0;\n  padding: var(--sp-3) var(--sp-2);\n  border: none;\n  background: transparent;\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n}\n.pp-panel .pp-empty-icon {\n  display: none;\n}\n/* \u9762\u677F\u5185\u7A7A\u6001\u5141\u8BB8\u7D27\u51D1\u52A8\u4F5C\u94AE\uFF08\u539F display:none \u8BA9 EmptyState \u7684 action \u80FD\u529B\u5F62\u540C\u865A\u8BBE\uFF09 */\n.pp-panel .pp-empty-action {\n  display: block;\n  margin-top: var(--sp-1);\n}\n/* \u6D4B\u8BD5\u9875\u5DE6\u5217\u8868\uFF08.pp-pane \u5185\u5305 .pp-tree\uFF09\uFF1A\u4E0E .pp-panel \u7A7A\u6001\u540C\u4E00\u7D27\u51D1\u6863 */\n.pp-tree .pp-empty {\n  max-width: none;\n  margin: var(--sp-3) 0;\n  padding: var(--sp-3) var(--sp-2);\n  border: none;\n  background: transparent;\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n}\n.pp-tree .pp-empty-icon {\n  display: none;\n}\n.pp-tree .pp-empty-action {\n  display: block;\n  margin-top: var(--sp-1);\n}\n\n\n/* ============================================================\n/* ============================================================\n   \u5DE5\u4F5C\u53F0\u9AA8\u67B6 v3\uFF1A\u9876\u680F 48px + \u5DE6\u4FA7 240px \u6587\u5B57\u5BFC\u822A + 44px \u9875\u7B7E\u6761\n   \u6570\u503C\u5168\u90E8\u5BF9\u9F50 Apifox 2.8.55 \u5B9E\u6D4B\uFF08docs/apifox-visual-parity-spec.md\uFF09\uFF1A\n     \u9876\u680F --ui-layout-header-height: 48px\uFF0C\u5185\u8FB9\u8DDD 0 50px\n     \u5DE6\u4FA7 .sider-bxNtfB: width 240px / padding 20px / \u83DC\u5355\u9879\u9AD8 32px / \u5206\u7EC4\u9AD8 24px\n     \u9875\u7B7E\u6761 --app-main-tabs-height: 44px\n   \u539F 64px \u56FE\u6807\u8F68 + \u6D6E\u5C42\u4E8C\u7EA7\u83DC\u5355\u5DF2\u5E9F\u5F03\uFF1A\u56FE\u6807\u4E0B\u7684\u5C0F\u5B57\u4ECD\u4E0D\u8DB3\u4EE5\u8BA9\u4EBA\u4E00\u773C\u8BA4\u51FA\u529F\u80FD\uFF0C\n   \u4E14\u4E8C\u7EA7\u85CF\u5728\u6D6E\u5C42\u91CC\u591A\u4E00\u6B21\u70B9\u51FB\uFF1BApifox \u7528 240px \u5E38\u9A7B\u6587\u5B57\u83DC\u5355\uFF0C\u8FD9\u91CC\u7167\u505A\u3002\n   ============================================================ */\n\n/* \u2014\u2014 \u5DE5\u4F5C\u53F0\uFF1A\u9876\u680F + sider/\u4E3B\u533A \u4E24\u884C\u4E24\u5217 \u2014\u2014 */\n.pp-workbench-v2 {\n  display: grid;\n  grid-template-rows: var(--topbar-h) minmax(0, 1fr);\n  height: 100%;\n  min-height: 0;\n}\n.pp-shell {\n  display: grid;\n  grid-template-columns: var(--sider-w) minmax(0, 1fr);\n  min-height: 0;\n  position: relative;\n}\n\n/* \u2014\u2014 \u5DE6\u4FA7\u5BFC\u822A\uFF08Apifox .sider-bxNtfB \u540C\u89C4\u683C\uFF09\u2014\u2014 */\n.pp-sider {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-1);\n  padding: var(--sider-pad);\n  background: var(--bg-surface);\n  border-right: 1px solid var(--border);\n  min-height: 0;\n  overflow: auto;\n}\n/* \u5206\u7EC4\u6807\u9898\uFF1A12px / \u4E09\u7EA7\u8272 / \u9AD8 24px\uFF0C\u7EC4\u95F4\u4E0A\u95F4\u8DDD 12px\uFF08Apifox menu-item-group\uFF09 */\n.pp-sider-group {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  height: var(--sider-group-h);\n  margin-top: var(--sp-3);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-12);\n  font-weight: var(--fw-medium);\n  color: var(--fg-tertiary);\n  white-space: nowrap;\n}\n.pp-sider-group:first-child {\n  margin-top: 0;\n}\n/* \u83DC\u5355\u9879\uFF1A\u9AD8 32px\u3001\u5706\u89D2 6px\u300114px \u5B57\uFF0C\u5DE6\u5185\u8FB9\u8DDD 8px\uFF08Apifox menu-item\uFF09 */\n.pp-sider-item {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  height: var(--sider-item-h);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-14);\n  line-height: var(--lh-20);\n  color: var(--fg-secondary);\n  text-decoration: none;\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: hidden;\n}\n.pp-sider-item:hover {\n  color: var(--fg);\n  background: var(--bg-hover);\n}\n.pp-sider-item:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: -2px;\n}\n/* \u9009\u4E2D\uFF1A\u4E3B\u8272\u6587\u5B57 + \u6DE1\u4E3B\u8272\u5E95\uFF08Apifox \u83DC\u5355\u9009\u4E2D\u6001\uFF09 */\n.pp-sider-item[data-active="true"] {\n  color: var(--accent);\n  background: var(--accent-tint);\n  font-weight: var(--fw-medium);\n}\n.pp-sider-icon {\n  flex: none;\n  width: var(--icon);\n  height: var(--icon);\n  color: inherit;\n}\n.pp-sider-label {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.pp-sider-spacer {\n  flex: 1;\n}\n\n/* \u2014\u2014 \u5F39\u5C42\u83DC\u5355\uFF08\u4E09\u7EA7\uFF0C\u5BF9\u9F50 Apifox .ui-dropdown-menu / .ui-menu-item\uFF09\u2014\u2014\n   \u4E00\u7EA7\u9762\u677F\u6302\u5728\u89E6\u53D1\u6309\u94AE\u4E0B\u65B9\uFF1B\u4E8C\u7EA7\u3001\u4E09\u7EA7\u5411\u53F3/\u5DE6\u6D6E\u51FA\u5E76\u5782\u76F4\u5BF9\u9F50\u5230\u89E6\u53D1\u9879\u3002\n   Apifox \u539F\u6587\uFF1A\u9879\u9AD8 32px\u3001\u5185\u8FB9\u8DDD 0 8px\u3001\u5B50\u83DC\u5355\u7BAD\u5934\u5BBD 10px \u9760\u53F3 16px\u3001\n   \u5206\u7EC4\u6807\u9898 12px/500 \u5185\u8FB9\u8DDD 0 16px\u3001\u9762\u677F\u5706\u89D2 8px + \u4E24\u6BB5\u5F0F\u6295\u5F71\u3002 */\n.pp-menu-anchor {\n  position: relative;\n  display: inline-flex;\n  flex: none;\n}\n/* \u9762\u677F\u5185\u7684\u9879\u951A\u70B9\u5FC5\u987B\u6491\u6EE1\u5BBD\u5EA6\uFF0C\u5426\u5219\u5B50\u9762\u677F\u7684 right:100% \u4F1A\u8D34\u5230\u6587\u5B57\u800C\u4E0D\u662F\u9762\u677F\u8FB9\u7F18 */\n.pp-menu .pp-menu-anchor {\n  display: block;\n  width: 100%;\n}\n.pp-menu {\n  /* \u7528 fixed \u800C\u4E0D\u662F absolute\uFF1A\u5BBF\u4E3B\u4FA7\u8FB9\u680F\u9762\u677F\u662F 720px \u4E14\u5E26 overflow:hidden/clip\uFF0C\n     \u4E09\u7EA7\u7EA7\u8054\uFF08200\xD73\uFF09\u4ECE\u6309\u94AE\u5F80\u5DE6\u5C55\u5F00\u4F1A\u8D8A\u51FA\u5BB9\u5668\u5DE6\u8FB9\u754C\u88AB\u88C1\u6389\u3002\n     fixed \u4E0D\u53D7\u7956\u5148 overflow \u88C1\u526A\uFF0C\u5750\u6807\u7531 JS \u7528 getBoundingClientRect \u7ED9\u51FA\u3002 */\n  position: fixed;\n  z-index: var(--z-menu);\n  min-width: var(--menu-w);\n  padding: var(--menu-pad);\n  overflow: visible;\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  box-shadow: var(--shadow-menu);\n}\n/* \u5185\u5C42\u6EDA\u52A8\u5BB9\u5668\uFF1A\u53EA\u6709\u5B83\u9650\u9AD8\u5E76\u6EDA\u52A8\uFF0C\u4FDD\u8BC1\u7236\u9762\u677F\u4ECD\u53EF overflow: visible */\n.pp-menu-scroll {\n  max-height: calc(var(--menu-item-h) * 12);\n  overflow: auto;\n}\n/* \u4E8C\u7EA7 / \u4E09\u7EA7\u9762\u677F\uFF1A\u76F8\u5BF9\u7236\u9879\u6D6E\u51FA\u3002\u56E0\u4E3A\u89E6\u53D1\u6309\u94AE\u5728\u4E3B\u533A\u53F3\u7F18\uFF0C\n   \u5B50\u9762\u677F\u7EDF\u4E00\u5411\u5DE6\u5F00\uFF08Apifox \u9760\u8FB9\u65F6\u540C\u6837\u7FFB\u8F6C\u65B9\u5411\uFF09\u3002 */\n/* \u5B50\u9762\u677F\u5C42\u7EA7\uFF1A\u9010\u5C42 +1\uFF0C\u907F\u514D\u6D45\u5C42\u76D6\u4F4F\u5DF2\u5C55\u5F00\u7684\u6DF1\u5C42\u5185\u5BB9 */\n.pp-menu[data-depth="2"] { z-index: calc(var(--z-menu) + 1); }\n.pp-menu[data-depth="3"] { z-index: calc(var(--z-menu) + 2); }\n.pp-menu .pp-menu .pp-menu {\n  z-index: calc(var(--z-menu) + 2);\n}\n/* \u5B50\u9762\u677F\u5185\u4E0D\u518D\u9700\u8981\u81EA\u5DF1\u7684\u5185\u5C42\u6EDA\u52A8\u9650\u9AD8 */\n.pp-menu .pp-menu-scroll {\n  max-height: calc(var(--menu-item-h) * 12);\n}\n.pp-menu-item {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  width: 100%;\n  height: var(--menu-item-h);\n  padding: 0 var(--sp-2);\n  font-family: var(--font-sans);\n  font-size: var(--fs-14);\n  line-height: var(--lh-20);\n  color: var(--fg);\n  text-align: left;\n  text-decoration: none;\n  background: transparent;\n  border: none;\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: hidden;\n}\n.pp-menu-item:hover,\n.pp-menu-item[data-open="true"] {\n  background: var(--bg-hover);\n}\n.pp-menu-item:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: -2px;\n}\n.pp-menu-item[data-active="true"] {\n  color: var(--accent);\n  font-weight: var(--fw-medium);\n}\n.pp-menu-item[disabled] {\n  color: var(--fg-tertiary);\n  cursor: not-allowed;\n}\n.pp-menu-label {\n  min-width: 0;\n  flex: 1;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n/* \u5B50\u83DC\u5355\u7BAD\u5934\uFF1A10px \u5BBD\uFF0C\u4E24\u6761 1.5px \u659C\u7EBF\uFF08Apifox .ui-menu-submenu-arrow\uFF09 */\n.pp-menu-arrow {\n  flex: none;\n  width: var(--sp-3);\n  height: var(--icon-sm);\n  color: var(--fg-tertiary);\n  font-size: var(--fs-12);\n  line-height: var(--icon-sm);\n  text-align: center;\n}\n.pp-menu-hint {\n  flex: none;\n  margin-left: auto;\n  font-family: var(--font-mono);\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n}\n.pp-menu-group {\n  height: var(--ctl-h-sm);\n  padding: 0 var(--sp-4);\n  font-size: var(--fs-12);\n  line-height: var(--lh-20);\n  font-weight: var(--fw-medium);\n  color: var(--fg-tertiary);\n  white-space: nowrap;\n}\n.pp-menu-sep {\n  height: 1px;\n  margin: var(--sp-1) calc(var(--sp-2) * -1);\n  background: var(--border);\n}\n\n/* \u2014\u2014 \u9875\u7B7E\u6761\uFF08Apifox .layoutTabBar\uFF0C44px \u5361\u7247\u5F0F\uFF09\u2014\u2014 */\n.pp-tabbar {\n  display: flex;\n  align-items: flex-end;\n  height: var(--tabbar-h);\n  padding: 0 var(--sp-2);\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n  overflow-x: auto;\n  overflow-y: hidden;\n  scrollbar-width: none;\n}\n.pp-tabbar::-webkit-scrollbar {\n  height: calc(var(--scrollbar) * 0);\n}\n.pp-tabbar-item {\n  display: inline-flex;\n  align-items: center;\n  gap: var(--sp-1);\n  height: var(--tabbar-h);\n  padding: 0 var(--sp-4);\n  font-size: var(--fs-14);\n  line-height: var(--lh-20);\n  color: var(--fg-secondary);\n  background: transparent;\n  border: none;\n  border-left: 1px solid var(--border);\n  cursor: pointer;\n  white-space: nowrap;\n  flex: none;\n}\n.pp-tabbar-item:first-child {\n  border-left: none;\n}\n.pp-tabbar-item:hover {\n  color: var(--fg);\n}\n/* \u6FC0\u6D3B\uFF1A\u767D\u5E95 + \u5DE6\u53F3 1px \u8FB9\u6846 + \u6DF1\u8272\u6587\u5B57\uFF08Apifox tabs-tab-active\uFF09 */\n.pp-tabbar-item[data-active="true"] {\n  color: var(--fg-strong);\n  background: var(--bg-surface);\n  border-right: 1px solid var(--border);\n  border-top: 1px solid transparent;\n  font-weight: var(--fw-medium);\n}\n.pp-tabbar-close {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--icon-sm);\n  height: var(--icon-sm);\n  margin-left: var(--sp-1);\n  color: var(--fg-tertiary);\n  background: transparent;\n  border: none;\n  border-radius: var(--radius-sm);\n  cursor: pointer;\n}\n.pp-tabbar-close:hover {\n  color: var(--fg);\n  background: var(--bg-hover);\n}\n\n/* \u2014\u2014 \u4E3B\u533A\uFF08v2\uFF1A\u5360\u6EE1\u5269\u4F59\u5BBD\u5EA6\uFF09\u2014\u2014 */\n/* \u4E3B\u533A\u662F\u5BB9\u5668\u67E5\u8BE2\u7684\u951A\u70B9\uFF1A\u4FA7\u8FB9\u680F\u91CC\u7684\u5BBD\u5EA6\u53EA\u6709 400~700px\uFF0C\u9875\u9762\u5185\u90E8\u5E03\u5C40\u5FC5\u987B\u6309\n   \u300C\u5BB9\u5668\u5BBD\u5EA6\u300D\u800C\u4E0D\u662F\u300C\u89C6\u53E3\u5BBD\u5EA6\u300D\u81EA\u9002\u5E94\u2014\u2014\u7528 @media \u5224\u65AD\u89C6\u53E3\u6C38\u8FDC\u547D\u4E2D\u4E0D\u4E86\u7A84\u6001\u3002 */\n.pp-main-v2 {\n  min-width: 0;\n  min-height: 0;\n  overflow: auto;\n  background: var(--bg-app);\n  container-type: inline-size;\n  container-name: ppmain;\n  /* \u5E2E\u52A9\u6D6E\u5C42\u7684\u5B9A\u4F4D\u53C2\u7167\uFF08.pp-help-card \u7528 absolute \u8D34\u53F3\u4E0A\u89D2\uFF09 */\n  position: relative;\n}\n\n/* \u2014\u2014 \u9875\u5934 \u2014\u2014 */\n/* \u9875\u5934\uFF1A\u5BF9\u9F50 Apifox .overview-header-container\uFF08\u4E0B\u8FB9\u6846 1px / padding 16px 20px 16px 14px / \u6700\u5927\u5BBD 1512px\uFF09 */\n.pp-page-head {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-3);\n  max-width: var(--content-max-w);\n  padding: var(--sp-4) var(--sp-5) var(--sp-4) var(--sp-3);\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n}\n/* \u6982\u89C8\u9875\u5934\uFF1A\u6807\u9898 18px / 700\uFF08Apifox .overview-header__title\uFF09 */\n/* \u9875\u5934\uFF1AApifox .overview-header-container \u539F\u6587\n   \uFF08border-bottom:1px split; max-width:1512px; padding:16px 20px 16px 14px\uFF09\u3002\n   \u7A84\u5BB9\u5668\uFF08\u4FA7\u8FB9\u680F\u91CC\u53EA\u6709 455px\uFF09\u65F6\u52A8\u4F5C\u533A\u5FC5\u987B\u6362\u884C\uFF0C\u5426\u5219\u4F1A\u628A\u9875\u9762\u9876\u51FA 111~693px \u6A2A\u5411\u6EA2\u51FA\u3002 */\n.pp-overview-head {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: var(--sp-2) var(--sp-3);\n  width: 100%;\n  max-width: var(--content-max-w);\n  padding: var(--sp-4) var(--sp-5) var(--sp-4) var(--sp-3);\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n}\n.pp-overview-title {\n  margin-right: auto;\n  font-size: var(--fs-18);\n  line-height: var(--lh-24);\n  font-weight: 700;\n  color: var(--fg-strong);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n/* \u52A8\u4F5C\u533A\uFF1AApifox .overview-header-actions\uFF08inline-flex / \u9AD8 32px\uFF09\u3002\n   \u52A0 flex-wrap \u4E0E min-width:0\uFF1A\u52A8\u4F5C\u533A\u91CC\u585E 4 \u4E2A\u63A7\u4EF6\u65F6\uFF08\u603B\u89C8\u9875\uFF09\u5728 455px \u5BB9\u5668\u91CC\u5FC5\u7136\u6EA2\u51FA\uFF0C\n   \u5141\u8BB8\u6362\u884C\u662F\u552F\u4E00\u4E0D\u6539\u8BED\u4E49\u7684\u89E3\u6CD5\uFF1B\u5B50\u63A7\u4EF6\u7528 flex:0 1 auto \u5141\u8BB8\u6536\u7F29\u3002 */\n.pp-overview-actions {\n  display: inline-flex;\n  align-items: center;\n  justify-content: flex-end;\n  flex-wrap: wrap;\n  gap: var(--sp-2);\n  min-width: 0;\n  margin-left: auto;\n  min-height: var(--ctl-h);\n}\n.pp-overview-actions > .pp-input,\n.pp-overview-actions > .pp-select {\n  flex: 0 1 auto;\n  min-width: 96px;\n}\n/* \u9875\u5934\u52A8\u4F5C\u533A\u91CC\u7684\u884C\u5185\u63D0\u793A\uFF08\u590D\u5236\u6210\u529F\u7B49\uFF09\uFF1A\u538B\u6210\u4E0E\u6309\u94AE\u540C\u57FA\u7EBF\u7684\u8272\u5B57\uFF0C\u4E0D\u6491\u9AD8\u52A8\u4F5C\u533A */\n.pp-overview-actions .pp-note {\n  padding: 0 var(--sp-2);\n  border: none;\n  background: transparent;\n}\n/* \u6587\u6863\u9875\u5934\uFF1A\u4E0E\u6982\u89C8\u540C\u89C4\u683C */\n.pp-doc-head {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: var(--sp-2) var(--sp-3);\n  width: 100%;\n  max-width: var(--content-max-w);\n  padding: var(--sp-4) var(--sp-5) var(--sp-4) var(--sp-3);\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n}\n.pp-doc-title {\n  margin-right: auto;\n  font-size: var(--fs-18);\n  line-height: var(--lh-24);\n  font-weight: 700;\n  color: var(--fg-strong);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n/* \u6A2A\u5411\u8868\u5355\u6805\u683C\uFF1AApifox .gridForm.ui-form-horizontal\uFF08fit-content(360px) 1fr / gap 16px\uFF09 */\n.pp-form-grid {\n  display: grid;\n  grid-template-columns: fit-content(360px) minmax(0, 1fr);\n  /* \u884C\u8DDD 12px\uFF1A\u4E0E .pp-form-row\uFF08min-height 32 + margin-bottom 12 = 44px \u8282\u594F\uFF09\u5BF9\u9F50\uFF0C\u5217\u8DDD\u4FDD\u6301 16px */\n  gap: var(--sp-3) var(--sp-4);\n  align-items: center;\n}\n/* settings\u300C\u4FDD\u5B58\u300D\u884C\uFF1A\u672A\u4FDD\u5B58\u6807\u8BB0 + \u4E3B\u6309\u94AE\u9760\u53F3\uFF08\u4FDD\u5B58\u52A8\u4F5C\u6536\u8FDB\u6240\u5C5E\u9762\u677F\uFF0C\u4E0D\u518D\u6302\u5728\u9875\u5934\uFF09 */\n.pp-form-actions {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: var(--sp-2);\n  margin-top: var(--sp-4);\n  min-height: var(--ctl-h);\n}\n/* .pp-form-row \u91CC\u7684\u8F93\u5165\u6846\u5403\u5269\u4F59\u5BBD\uFF08settings \u5B58\u50A8\u8DEF\u5F84\u53EA\u8BFB\u884C\u7B49\uFF09\uFF0C\u66FF\u4EE3\u5185\u8054 flex:1 */\n.pp-form-row > .pp-input {\n  flex: 1;\n  min-width: 0;\n}\n.pp-page-head-main {\n  min-width: 0;\n  flex: 1;\n}\n.pp-page-head .pp-page-title {\n  margin: 0 0 var(--sp-1) 0;\n}\n.pp-page-desc {\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--fg-secondary);\n  margin: 0;\n}\n.pp-page-actions {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-2);\n  flex: none;\n}\n\n/* \u2014\u2014 \u9762\u677F\u5316\u5B9E\u4F53\u6811\uFF08\u66FF\u4EE3\u901A\u680F .pp-col-left\uFF09\u2014\u2014 */\n.pp-panel {\n  width: var(--panel-w);\n  flex: none;\n  min-height: 0;\n  overflow: auto;\n  padding: var(--sp-2);\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n}\n.pp-split {\n  display: grid;\n  /* \u9762\u677F\u5BBD\u5EA6\u968F\u5BB9\u5668\u81EA\u9002\u5E94\uFF1A\u4E0B\u9650 --panel-w\u3001\u4E0A\u9650 --panel-w-max\u3001\u4E2D\u95F4\u53D6 32%\uFF0C\n     \u5BBD\u7A97\u53E3\u91CC\u76EE\u5F55\u6811\u81EA\u52A8\u53D8\u5BBD\uFF0C\u957F\u63A5\u53E3\u540D\u4E0D\u518D\u88AB\u7701\u7565\u53F7\u622A\u65AD\u3002 */\n  grid-template-columns: clamp(var(--panel-w), 32%, var(--panel-w-max)) minmax(0, 1fr);\n  gap: var(--sp-4);\n  align-items: start;\n  padding: var(--sp-4) var(--sp-5);\n  min-height: 0;\n}\n/* \u5E76\u6392\u65F6\u9762\u677F\u5BBD\u5EA6\u7531 grid \u8F68\u9053\u51B3\u5B9A\uFF0C\u81EA\u8EAB\u4E0D\u518D\u5B9A\u5BBD\uFF08\u5426\u5219\u6BD4\u8F68\u9053\u7A84\u4F1A\u7559\u767D\uFF09\uFF1B\n   \u957F\u6B63\u6587\u6EDA\u52A8\u65F6\u5DE6\u6811 sticky \u5E38\u9A7B\uFF0C\u5207\u63A5\u53E3\u4E0D\u7528\u6EDA\u56DE\u9876\u90E8 */\n.pp-split > .pp-panel {\n  width: auto;\n  position: sticky;\n  top: 0;\n  max-height: calc(100vh - var(--topbar-h) - var(--tabbar-h));\n}\n/* \u5806\u53E0\u65AD\u70B9\u4E0E env/mock/flow \u7EDF\u4E00 820px */\n@container ppmain (max-width: 820px) {\n  .pp-split {\n    grid-template-columns: minmax(0, 1fr);\n  }\n  .pp-split .pp-panel {\n    width: auto;\n    position: static;\n    /* \u5806\u53E0\u65F6\u76EE\u5F55\u6811\u5360\u6EE1\u6574\u5BBD\uFF1B\u9AD8\u5EA6\u7ED9\u5230 14 \u884C\uFF08\u7EA6 500px\uFF09\u2014\u2014\u5217\u8868\u533A\u592A\u77EE\u65F6\u7FFB\u76EE\u5F55\u5F88\u8D39\u52B2 */\n    max-height: calc(var(--row-h) * 14);\n  }\n}\n/* \u6587\u6863\u9875\u4E3B\u5217\uFF1A\u951A\u70B9\u6761 sticky \u5728\u9876\u90E8\uFF0C\u6B63\u6587\u5728\u4E0B\u65B9\u72EC\u7ACB\u6EDA\u52A8 */\n.pp-doc-main {\n  min-width: 0;\n  min-height: 0;\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  overflow: auto;\n}\n/* \u7A7A\u6001\u65F6\u4E3B\u5217\u72EC\u5360\u4E00\u884C\uFF08\u65E0\u5DE6\u6811\uFF09\uFF0C\u9700\u8981\u81EA\u5DF1\u6491\u6EE1\u9AD8\u5EA6\u5E76\u7559\u51FA\u4E0A\u8FB9\u8DDD */\n.pp-page-flush > .pp-doc-main {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  margin: var(--sp-4) var(--sp-5);\n}\n.pp-doc-main .pp-page {\n  padding: var(--sp-5);\n}\n/* \u5361\u5185\u9875\u5934\u4E0E\u5361\u5185\u6B63\u6587\u5DE6\u7F18\u5BF9\u9F50\uFF1A\u6B63\u6587 padding \u662F --sp-5\uFF0C\u901A\u680F\u9875\u5934\u7684 --sp-3 \u5728\u5361\u5185\u4F1A\u9519\u4F4D 8px */\n.pp-doc-main > .pp-doc-head {\n  padding-left: var(--sp-5);\n}\n/* \u951A\u70B9\u6761\u5438\u9876\u65F6\u7ED9\u8DF3\u8F6C\u76EE\u6807\u7559\u51FA\u9AD8\u5EA6\uFF0C\u907F\u514D\u6807\u9898\u88AB\u6761\u6321\u4F4F\uFF08\u515C\u5E95\u951A\u70B9\u6761\u6298\u4E24\u884C\uFF09 */\n.pp-doc-main [id^="sec-"] {\n  scroll-margin-top: calc(var(--ctl-h-lg) * 2 + var(--sp-2));\n}\n.pp-split-wide {\n  grid-template-columns: var(--panel-w) minmax(0, 1.4fr) minmax(0, 1fr);\n}\n\n/* \u2014\u2014 \u9876\u680F v2\uFF1A\u9762\u5305\u5C51 + \u56FE\u6807\u52A8\u4F5C \u2014\u2014 */\n.pp-crumb {\n  display: inline-flex;\n  align-items: center;\n  gap: var(--sp-1);\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n  white-space: nowrap;\n}\n.pp-crumb-sep {\n  color: var(--border-strong);\n}\n.pp-icon-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--hit);\n  height: var(--hit);\n  padding: 0;\n  color: var(--fg-secondary);\n  background: transparent;\n  border: 1px solid transparent;\n  border-radius: var(--radius-ctl);\n  cursor: pointer;\n}\n.pp-icon-btn:hover {\n  color: var(--fg);\n  background: var(--bg-hover);\n}\n.pp-icon-btn:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: -2px;\n}\n.pp-icon-btn[data-active="true"] {\n  color: var(--accent);\n  border-color: var(--accent);\n}\n.pp-help {\n  padding: var(--sp-2);\n  font-size: var(--fs-13);\n  line-height: var(--lh-20);\n  color: var(--fg-secondary);\n}\n/* \u5E2E\u52A9\u5361\u7247\uFF1A\u539F\u6D6E\u5C42\u6539\u6210\u4E3B\u533A\u9876\u90E8\u5185\u5D4C\u5361\uFF08\u4E0D\u518D\u906E\u6321\u5185\u5BB9\uFF09 */\n/* \u5E2E\u52A9\u5361\u7247\uFF1A\u6D6E\u5728\u4E3B\u533A\u53F3\u4E0A\u89D2\uFF0C\u4E0D\u5360\u6587\u6863\u6D41\u3002\n   \u4E4B\u524D\u662F\u6587\u6863\u6D41\u5185\u5D4C\u5361\uFF0C\u63D2\u5728\u9875\u7B7E\u6761\u4E0E\u9875\u5934\u4E4B\u95F4\u4F1A\u628A\u9875\u9762\u6807\u9898\u5F80\u4E0B\u63A8\u4E00\u683C\uFF0C\n   \u89C6\u89C9\u4E0A\u50CF\u591A\u4E86\u4E00\u4E2A\u9875\u7B7E\u3002\u6D6E\u5C42\u5B9A\u4F4D\u540E\u4E0E\u9875\u9762\u5185\u5BB9\u4E92\u4E0D\u5F71\u54CD\u3002 */\n.pp-help-card {\n  position: absolute;\n  top: calc(var(--tabbar-h) + var(--sp-2));\n  right: var(--sp-4);\n  z-index: var(--z-menu);\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-1);\n  width: var(--popover-w);\n  max-width: calc(100% - var(--sp-6));\n  padding: var(--sp-3);\n  background: var(--bg-surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-card);\n  box-shadow: var(--shadow-menu);\n}\n.pp-help-card-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: var(--sp-2);\n}\n.pp-help-card-title {\n  font-size: var(--fs-12);\n  font-weight: var(--fw-medium);\n  color: var(--fg-tertiary);\n}\n\n\n\n/* \u2014\u2014 \u9875\u5185\u951A\u70B9\u6761\uFF08\u539F\u53F3\u680F\u300C\u672C\u9875\u76EE\u5F55\u300D\u7684\u66FF\u4EE3\uFF09\uFF1A\u4E3B\u533A\u9876\u90E8 sticky \u6A2A\u5411 chips \u2014\u2014\n   \u7A84\u5BB9\u5668\u91CC\u53F3\u4FA7\u5E38\u9A7B TOC \u4F1A\u5403\u6389 240px\uFF0C\u628A\u4E3B\u533A\u6324\u5230\u4E0D\u53EF\u8BFB\uFF1B\u6539\u6210\u6A2A\u5411\u6761\u540E\n   \u53EA\u5360\u4E00\u884C\u7EB5\u5411\u9AD8\u5EA6\uFF0C\u4E3B\u533A\u5BBD\u5EA6\u4E0D\u53D7\u5F71\u54CD\uFF0C\u6EDA\u52A8\u65F6\u4ECD\u80FD\u8DF3\u8F6C\u3002 */\n.pp-anchor-bar {\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  gap: var(--sp-1);\n  /* 9 \u4E2A chip \u5728 400~700px \u4E3B\u533A\u5FC5\u7136\u653E\u4E0D\u4E0B\uFF1A\u5141\u8BB8\u6298\u884C\u800C\u4E0D\u662F\u85CF\u6389\u6EDA\u52A8\u6761\u76F2\u6EDA */\n  flex-wrap: wrap;\n  min-height: var(--ctl-h-lg);\n  padding: 0 var(--sp-4);\n  overflow-x: auto;\n  background: var(--bg-surface);\n  border-bottom: 1px solid var(--border);\n  scrollbar-width: none;\n}\n.pp-anchor-bar::-webkit-scrollbar {\n  height: calc(var(--scrollbar) * 0);\n}\n.pp-anchor-chip {\n  display: inline-flex;\n  align-items: center;\n  flex: none;\n  height: var(--ctl-h-sm);\n  padding: 0 var(--sp-2);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg-secondary);\n  text-decoration: none;\n  border: 1px solid transparent;\n  border-radius: var(--radius-pill);\n  cursor: pointer;\n  white-space: nowrap;\n}\n.pp-anchor-chip:hover {\n  color: var(--fg);\n  background: var(--bg-hover);\n}\n.pp-anchor-chip[data-active="true"] {\n  color: var(--accent);\n  background: var(--accent-tint);\n  border-color: var(--accent);\n}\n\n/* \u2014\u2014 \u5206\u7EC4\u6807\u9898\u884C\uFF1A\u6807\u9898\u9760\u5DE6\u3001\u52A8\u4F5C\u9760\u53F3 \u2014\u2014 */\n/* \u8C03\u8BD5\u53F0\u53C2\u6570\u533A\uFF08\u5982 Headers \u7EC4\uFF09\u7528\u5B83\u5728\u5206\u7EC4\u6807\u9898\u53F3\u4FA7\u6302\u300C\u5E38\u7528\u8BF7\u6C42\u5934\u300D\u6309\u94AE\uFF1B\n   .pp-group-title \u81EA\u5E26 3px \u4E3B\u8272\u7AD6\u7EBF\uFF0C\u8FD9\u91CC\u53EA\u8D1F\u8D23\u884C\u5185\u5DE6\u53F3\u5206\u680F\u3002 */\n.pp-group-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: var(--sp-2);\n  min-width: 0;\n}\n.pp-group-head > .pp-group-title {\n  min-width: 0;\n  margin-right: auto;\n}\n\n/* \u2014\u2014 \u884C\u5185\u6587\u5B57\u6309\u94AE\uFF1A\u65E0\u8FB9\u6846\u3001\u4E3B\u8272\u6587\u5B57\uFF0Chover \u53EA\u6362\u4E3B\u8272\u60AC\u505C\u8272 \u2014\u2014 */\n/* \u8868\u683C\u4E0E\u5206\u7EC4\u6807\u9898\u91CC\u7684\u8F7B\u91CF\u52A8\u4F5C\uFF08\u300C\u5E38\u7528\u8BF7\u6C42\u5934\u300D\u300C\u6E05\u7A7A\u300D\u7B49\uFF09\uFF0C\n   \u9AD8\u5EA6\u8D70 --ctl-h-sm \u4E0E .pp-btn-sm \u5BF9\u9F50\uFF0C\u907F\u514D\u4E0E\u8868\u683C\u884C\u9AD8\u6253\u67B6\u3002 */\n.pp-btn-link {\n  display: inline-flex;\n  align-items: center;\n  flex: none;\n  height: var(--ctl-h-sm);\n  padding: 0 var(--sp-1);\n  font-family: var(--font-sans);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--accent);\n  background: transparent;\n  border: 1px solid transparent;\n  border-radius: var(--radius-sm);\n  cursor: pointer;\n  white-space: nowrap;\n}\n.pp-btn-link:hover {\n  color: var(--accent-hover);\n}\n.pp-btn-link:disabled {\n  color: var(--fg-tertiary);\n  cursor: not-allowed;\n}\n\n/* \u2014\u2014 \u8C03\u8BD5\u53F0\u4E0A\u4E0B\u5206\u680F\uFF1A\u8BF7\u6C42\u533A\u5728\u4E0A\u3001\u54CD\u5E94\u533A\u5728\u4E0B \u2014\u2014 */\n/* \u5355\u680F\u7ED3\u6784\uFF08Apifox .apiCase \u6574\u9875\u7EB5\u5411\u6392\u5E03\uFF09\uFF1A\u9AD8\u5EA6\u94FE = .pp-debug-page(height:100%)\n   \u2192 \u672C\u5BB9\u5668(flex column, min-height:0) \u2192 \u8BF7\u6C42\u533A\u53EF\u6536\u7F29 / \u54CD\u5E94\u533A\u5360\u6EE1\u5269\u4F59\u3002\n   \u6CE8\u610F\uFF1A\u672C\u7C7B\u4E0E .pp-debug-page \u5728 debug.jsx \u540C\u5143\u7D20\u53E0\u52A0\uFF08apifox-ui \u6D4B\u8BD5\u9489\u4F4F\uFF09\uFF0C\n   gap \u4E24\u5904\u58F0\u660E\u540C\u503C\uFF0C\u4EE5\u540E\u53EA\u6539\u8FD9\u91CC\u5373\u53EF\u3002 */\n.pp-debug-split {\n  display: flex;\n  flex-direction: column;\n  gap: var(--sp-3);\n  min-height: 0;\n}\n/* \u8BF7\u6C42\u533A\uFF1AURL \u884C/\u9875\u7B7E/\u8BF4\u660E\u5E38\u9A7B\uFF0C\u53EA\u6709\u9875\u7B7E\u4F53\u81EA\u5DF1\u6EDA */\n.pp-debug-request {\n  display: flex;\n  flex-direction: column;\n  flex: 0 1 auto;\n  min-width: 0;\n  min-height: 0;\n}\n.pp-debug-request .pp-debug-tabbody {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow: auto;\n}\n/* \u54CD\u5E94\u533A\uFF1A\u4FDD\u5E95 8 \u884C\u9AD8\u3001\u5360\u6EE1\u5269\u4F59\u9AD8\u5EA6\uFF1B\u72B6\u6001\u6761/\u9875\u7B7E\u6761\u5E38\u9A7B\uFF0C\u9875\u7B7E\u4F53\u5185\u90E8\u6EDA */\n.pp-debug-response {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 0;\n  min-width: 0;\n  min-height: calc(var(--row-h) * 8);\n}\n.pp-debug-response > [data-response-panel] {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  min-height: 0;\n}\n.pp-debug-response > [data-response-panel] > div {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  min-height: 0;\n}\n.pp-debug-response .pp-resp-bar,\n.pp-debug-response .pp-resp-tabs {\n  flex: none;\n}\n.pp-debug-response .pp-debug-tabbody {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow: auto;\n}\n\n/* \u2014\u2014 BodyEditor \u9876\u90E8\u7C7B\u578B\u884C\uFF1A\u7C7B\u578B\u9009\u62E9\u5728\u5DE6\u3001\u52A8\u4F5C\u6309\u94AE\u5728\u53F3\uFF0C\u4E0E\u7F16\u8F91\u5668\u7528\u5206\u9694\u7EBF\u9694\u5F00 \u2014\u2014 */\n.pp-body-head {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: var(--sp-2);\n  padding-bottom: var(--sp-2);\n  border-bottom: 1px solid var(--border);\n}\n/* \u884C\u5185\u53EA\u6709\u300C\u7C7B\u578B\u300D\u4E24\u5B57\uFF1A\u4E0D\u5403 .pp-form-label \u7684 104px \u5B9A\u5BBD */\n.pp-body-head .pp-form-label {\n  width: auto;\n}\n\n/* \u2014\u2014 ScriptPanel \u6BCF\u6BB5\u5BB9\u5668\uFF08\u524D\u7F6E / \u540E\u7F6E\uFF09\uFF1A\u5185\u8FB9\u8DDD + \u6BB5\u95F4\u5E95\u90E8\u95F4\u8DDD \u2014\u2014 */\n.pp-script-block {\n  padding: var(--sp-2) 0;\n  margin-bottom: var(--sp-3);\n  min-width: 0;\n}\n.pp-script-block:last-child {\n  margin-bottom: 0;\n}\n/* \u811A\u672C\u6587\u672C\u57DF\u9650\u9AD8\uFF1A\u4E24\u4E2A\u811A\u672C\u6846\u4E0D\u518D\u628A\u300C\u65AD\u8A00/\u7B49\u5F85\u300D\u6BB5\u9876\u51FA\u9996\u5C4F\uFF08resize:vertical \u4ECD\u53EF\u62C9\u5927\uFF09 */\n.pp-script-block .pp-textarea {\n  max-height: calc(var(--row-h) * 8);\n}\n/* \u54CD\u5E94 Body \u5185\u7684\u4E8C\u7EA7\u89C6\u56FE\u5207\u6362\uFF08\u7F8E\u5316/\u539F\u6587\uFF09\uFF1A\u6BD4\u4E00\u7EA7\u9875\u7B7E\u5C0F\u4E00\u53F7\uFF0C\u533A\u5206\u5C42\u7EA7 */\n.pp-sub-tabs .pp-tab {\n  height: var(--ctl-h-sm);\n  font-size: var(--fs-13);\n}\n\n/* \u2014\u2014 \u54CD\u5E94\u72B6\u6001\u6761\uFF1A\u72B6\u6001\u80F6\u56CA\u5728\u5DE6\u3001\u8017\u65F6\u4E0E\u5927\u5C0F\u5C45\u4E2D\u3001\u590D\u5236\u6309\u94AE\u9760\u53F3 \u2014\u2014 */\n.pp-resp-bar {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: var(--sp-2);\n  min-width: 0;\n}\n.pp-resp-bar > .pp-pill {\n  flex: none;\n}\n/* \u6700\u540E\u4E00\u4E2A\u5B50\u5143\u7D20\uFF08\u590D\u5236\u6309\u94AE\uFF09\u7528\u81EA\u52A8\u5916\u8FB9\u8DDD\u63A8\u5230\u884C\u5C3E\uFF0C\u7A84\u5BB9\u5668\u6362\u884C\u540E\u4ECD\u8D34\u53F3 */\n.pp-resp-bar > :last-child {\n  margin-left: auto;\n}\n\n/* \u2014\u2014 \u54CD\u5E94\u9875\u7B7E\u6761\uFF1A\u89C2\u611F\u540C .pp-tabs\uFF0C\u4F46\u4E0A\u65B9\u6709\u72B6\u6001\u6761\uFF0C\u9700\u8981\u4E00\u6761\u4E0A\u8FB9\u6846\u628A\u4E24\u8005\u5206\u5F00 \u2014\u2014 */\n.pp-resp-tabs {\n  display: flex;\n  align-items: center;\n  gap: var(--sp-1);\n  flex-wrap: wrap;\n  min-height: var(--ctl-h-lg);\n  padding: 0 var(--sp-3);\n  background: var(--bg-surface);\n  border-top: 1px solid var(--border);\n  border-bottom: 1px solid var(--border);\n}\n\n/* \u2014\u2014 \u9875\u7B7E\u8BA1\u6570\uFF1A\u5C0F\u53F7\u3001\u6B21\u8981\u8272\u3001\u4E0D\u6362\u884C \u2014\u2014 */\n.pp-resp-count {\n  flex: none;\n  font-size: var(--fs-12);\n  color: var(--fg-tertiary);\n  white-space: nowrap;\n}\n\n/* \u2014\u2014 \u54CD\u5E94 Body \u7684 JSON \u6811\uFF1A\u7B49\u5BBD\u5B57\u4F53\u3001\u6309\u5C42\u7F29\u8FDB\u3001\u8D85\u9AD8\u81EA\u5DF1\u6EDA\u52A8\uFF0814 \u884C\uFF09\u2014\u2014 */\n.pp-json-tree {\n  margin: 0;\n  padding: var(--sp-2);\n  font-family: var(--font-mono);\n  font-size: var(--fs-12);\n  line-height: var(--lh-18);\n  color: var(--fg);\n  background: var(--bg-subtle);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm);\n  max-height: calc(var(--row-h) * 14);\n  overflow: auto;\n  white-space: pre;\n  tab-size: 2;\n}\n\n\n\n/* \u2014\u2014 \u7A84\u5BB9\u5668 further \u964D\u5BC6\u5EA6 \u2014\u2014 */\n/* \u2264520px\uFF1A\u53C2\u6570\u8868\u300C\u63CF\u8FF0\u300D\u5217\u8BA9\u4F4D\uFF086 \u5217\u8868\u5728\u6B64\u5BBD\u5EA6\u4E0B\u63CF\u8FF0\u5217\u57FA\u672C\u6EDA\u4E0D\u5230\uFF09\uFF0C\u8C03\u8BD5\u53F0\u9875\u7B7E\u4F53\u5185\u751F\u6548 */\n@container ppmain (max-width: 520px) {\n  .pp-debug-tabbody .pp-table[data-param-table] [data-col="description"] {\n    display: none;\n  }\n}\n/* \u2264480px\uFF1A\u9875\u7B7E\u5DE6\u53F3\u5185\u8FB9\u8DDD 12\u21928px\uFF0C6 \u4E2A\u9875\u7B7E\u5728 400px \u6863\u66F4\u5BB9\u6613\u5355\u884C */\n@container ppmain (max-width: 480px) {\n  .pp-tab {\n    padding: 0 var(--sp-2);\n  }\n}\n';

// src/client/pages/overview.jsx
var import_react5 = __toESM(require("react"), 1);

// src/client/pages/theme.js
var THEME_KEY2 = "postapi.settings.theme";
var LOCALE_KEY = "postapi.settings.locale";
function readTheme() {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(THEME_KEY2) || "light" : "light";
  } catch {
    return "light";
  }
}
function saveTheme(value) {
  try {
    localStorage.setItem(THEME_KEY2, value);
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

// src/client/pages/components/EmptyState.jsx
var import_react4 = require("react");
var EMPTY_ICONS = {
  box: ["M4 8.5L12 4l8 4.5v7L12 20l-8-4.5z", "M12 12l8-4.5", "M12 12v8", "M12 12L4 7.5"],
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M20 20l-4.2-4.2"],
  file: ["M6 3h8l4 4v14H6z", "M14 3v4h4"]
};
function EmptyIcon({ name = "box" }) {
  const paths = EMPTY_ICONS[name] || EMPTY_ICONS.box;
  return (0, import_react4.createElement)("svg", {
    viewBox: "0 0 24 24",
    width: 28,
    height: 28,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className: "pp-empty-icon"
  }, paths.map((d, i) => (0, import_react4.createElement)("path", { key: i, d })));
}
function EmptyState({ text = "\u6682\u65E0\u6570\u636E", hint = "", icon = "box", action = null }) {
  const node = action ? action.href ? (0, import_react4.createElement)("a", { className: "pp-btn pp-btn-sm pp-btn-primary", href: action.href }, action.label) : (0, import_react4.createElement)("button", {
    type: "button",
    className: "pp-btn pp-btn-sm pp-btn-primary",
    onClick: action.onClick
  }, action.label) : null;
  return (0, import_react4.createElement)(
    "div",
    { className: "pp-empty" },
    icon ? (0, import_react4.createElement)(EmptyIcon, { name: icon }) : null,
    (0, import_react4.createElement)("div", { className: "pp-empty-text" }, text),
    hint ? (0, import_react4.createElement)("div", { className: "pp-meta" }, hint) : null,
    node ? (0, import_react4.createElement)("div", { className: "pp-empty-action" }, node) : null
  );
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
  environments: [{ id: "env_dev", name: "\u5F00\u53D1\u73AF\u5883" }, { id: "env_prod", name: "\u751F\u4EA7\u73AF\u5883" }],
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
function overviewStats(projects, project) {
  const list = Array.isArray(projects) ? projects : [];
  const endpoints = Array.isArray(project && project.endpoints) ? project.endpoints : [];
  const envs = Array.isArray(project && project.environments) ? project.environments : [];
  let latest = "";
  for (const item of endpoints.concat(list)) {
    const at = item && item.updatedAt ? String(item.updatedAt) : "";
    if (at && at > latest) latest = at;
  }
  return {
    projectCount: list.length,
    endpointCount: endpoints.length,
    envCount: envs.length,
    latestUpdated: latest
  };
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
  const rootRef = (0, import_react5.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react5.useState)(MOCK_PROJECTS);
  const [project, setProject] = (0, import_react5.useState)(MOCK_PROJECT);
  const [currentId, setCurrentId] = (0, import_react5.useState)(MOCK_PROJECT.id);
  const [isMock, setIsMock] = (0, import_react5.useState)(true);
  const [error, setError] = (0, import_react5.useState)("");
  const [notice, setNotice] = (0, import_react5.useState)("");
  const [newName, setNewName] = (0, import_react5.useState)("");
  const [renameName, setRenameName] = (0, import_react5.useState)(MOCK_PROJECT.name);
  const [pendingDelete, setPendingDelete] = (0, import_react5.useState)("");
  const [formOpen, setFormOpen] = (0, import_react5.useState)(false);
  (0, import_react5.useEffect)(() => applyTheme(rootRef.current), []);
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
  (0, import_react5.useEffect)(() => {
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
  const stats = overviewStats(projects, project);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "overview", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u9879\u76EE\u603B\u89C8"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: () => setFormOpen((v) => !v) }, formOpen ? "\u53D6\u6D88" : "\u65B0\u5EFA\u9879\u76EE"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u672A\u6CE8\u5165\u6216\u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08listProjects / getProject\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-stats" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-stat" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-value" }, stats.projectCount), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-label" }, "\u9879\u76EE\u6570")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-stat" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-value" }, stats.endpointCount), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-label" }, "\u63A5\u53E3\u6570")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-stat" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-value" }, stats.envCount), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-label" }, "\u73AF\u5883\u6570")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-stat" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-value" }, fmtTime(stats.latestUpdated)), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-stat-label" }, "\u6700\u8FD1\u66F4\u65B0"))), formOpen ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u65B0\u5EFA / \u91CD\u547D\u540D\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u65B0\u5EFA\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      placeholder: "\u9879\u76EE\u540D",
      value: newName,
      onChange: (e) => {
        setNewName(e.target.value);
        setNotice("");
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: createProject }, "\u65B0\u5EFA")), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u91CD\u547D\u540D\u5F53\u524D\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      placeholder: "\u65B0\u540D\u79F0",
      value: renameName,
      onChange: (e) => {
        setRenameName(e.target.value);
        setNotice("");
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: renameProject }, "\u91CD\u547D\u540D")))) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u5F53\u524D\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-mono pp-ellipsis" }, currentId || "-")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-grid" }, cards.map((p) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: p.id, className: "pp-card pp-card-hover", "data-active": currentId === p.id ? "true" : "false" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title pp-ellipsis" }, p.name), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta" }, p.endpointCount === void 0 ? "\u63A5\u53E3\u6570\u672A\u77E5" : p.endpointCount + " \u4E2A\u63A5\u53E3", " \xB7 \u66F4\u65B0\u4E8E ", fmtTime(p.updatedAt)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => openProject(p.id) }, "\u6253\u5F00"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-danger", onClick: () => deleteProject(p.id) }, pendingDelete === p.id ? "\u786E\u8BA4\u5220\u9664" : "\u5220\u9664")))), cards.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u9879\u76EE", hint: "\u5148\u5728\u4E0A\u65B9\u65B0\u5EFA\u4E00\u4E2A\u9879\u76EE" }) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u6700\u8FD1\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-recent" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u65B9\u6CD5"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "URL"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u66F4\u65B0\u65F6\u95F4"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, recent.map((e) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: e.id, onClick: () => {
    window.location.hash = "#/doc/" + encodeURIComponent(e.id);
  }, "data-clickable": "true" }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": e.method }, e.method)), /* @__PURE__ */ (0, import_react.createElement)("td", null, e.name || "-"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono pp-muted pp-cell-clip", title: e.url || "" }, e.url || "-"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, fmtTime(e.updatedAt)))), recent.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 4, className: "pp-muted pp-table-empty" }, "\u5F53\u524D\u9879\u76EE\u6682\u65E0\u63A5\u53E3")) : null)))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-card-title" }, "\u5FEB\u6377\u5165\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-toolbar-spacer" }), SHORTCUTS.map((s) => /* @__PURE__ */ (0, import_react.createElement)("a", { key: s.hash, className: "pp-btn-link", href: s.hash }, s.label))))));
}

// src/client/pages/doc.jsx
var import_react8 = require("react");

// src/client/pages/components/ParamTable.jsx
var import_react6 = require("react");
var COLUMN_META = {
  enabled: { title: "\u542F\u7528", width: "44px" },
  key: { title: "\u53C2\u6570", width: "150px", mono: true },
  type: { title: "\u7C7B\u578B", width: "96px" },
  required: { title: "\u5FC5\u586B", width: "52px" },
  value: { title: "\u793A\u4F8B\u503C", width: "140px", mono: true },
  description: { title: "\u63CF\u8FF0", width: "auto" }
};
var PARAM_TYPES = ["string", "integer", "number", "boolean", "array", "object"];
var DEFAULT_COLUMNS = ["enabled", "key", "type", "required", "value", "description"];
function blankParamRow() {
  return { key: "", value: "", enabled: true, type: "string", required: false, description: "" };
}
var DESC_MIN_WIDTH = 120;
var OP_WIDTH = 52;
var suggestSeq = 0;
function nextSuggestId() {
  suggestSeq += 1;
  return "pp-param-suggest-" + suggestSeq;
}
function isBlank(v) {
  return v == null || v === "";
}
function collectSuggestions(suggest, query) {
  if (typeof suggest !== "function") return [];
  try {
    const items = suggest(query);
    if (!Array.isArray(items)) return [];
    return items.filter((it) => it && !isBlank(it.key));
  } catch {
    return [];
  }
}
function headStyle(col) {
  const meta = COLUMN_META[col];
  return meta && meta.width && meta.width !== "auto" ? { width: meta.width } : void 0;
}
function tableMinWidth(columns, editable) {
  let total = editable ? OP_WIDTH : 0;
  for (const col of columns) {
    const meta = COLUMN_META[col];
    total += meta && meta.width && meta.width !== "auto" ? parseInt(meta.width, 10) : DESC_MIN_WIDTH;
  }
  return total;
}
function renderCell(col, row, index, editable, patch, ctx) {
  const meta = COLUMN_META[col] || {};
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
    const blank = value == null || value === "";
    const text = blank ? col === "type" ? "string" : "-" : String(value);
    return /* @__PURE__ */ (0, import_react.createElement)("span", { className: meta.mono ? "pp-table-mono" : void 0 }, text);
  }
  if (col === "key" && ctx) {
    return /* @__PURE__ */ (0, import_react.createElement)(
      "input",
      {
        className: "pp-cell-input pp-input-sm" + (meta.mono ? " pp-input-mono" : ""),
        list: ctx.suggestId,
        value: value == null ? "" : String(value),
        onChange: (e) => ctx.onKeyChange(index, e.target.value)
      }
    );
  }
  if (col === "type") {
    return /* @__PURE__ */ (0, import_react.createElement)(
      "select",
      {
        className: "pp-cell-input pp-input-sm",
        value: value || "string",
        onChange: (e) => patch(index, col, e.target.value)
      },
      PARAM_TYPES.map((t) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: t, value: t }, t))
    );
  }
  return /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-cell-input pp-input-sm" + (meta.mono ? " pp-input-mono" : ""),
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
  emptyHint = "",
  addLabel = "+ \u6DFB\u52A0\u53C2\u6570",
  suggest
}) {
  const list = Array.isArray(rows) ? rows : [];
  const editable = !readOnly && typeof onChange === "function";
  const hasSuggest = editable && typeof suggest === "function";
  const [suggestId] = (0, import_react6.useState)(nextSuggestId);
  const patch = (index, field, value) => {
    const next = list.slice();
    const fields = field && typeof field === "object" ? field : { [field]: value };
    next[index] = { ...next[index], ...fields };
    onChange(next);
  };
  const onKeyChange = (index, value) => {
    const row = list[index] || {};
    const hit = collectSuggestions(suggest, value).find((it) => it.key === value);
    if (!hit) {
      patch(index, "key", value);
      return;
    }
    const fill = { key: value };
    if (isBlank(row.value) && !isBlank(hit.value)) fill.value = hit.value;
    if (isBlank(row.description) && !isBlank(hit.description)) fill.description = hit.description;
    patch(index, fill);
  };
  const cellCtx = hasSuggest ? { suggestId, onKeyChange } : void 0;
  const remove = (index) => {
    const next = list.slice();
    next.splice(index, 1);
    onChange(next);
  };
  if (list.length === 0 && !editable) return /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: emptyText, hint: emptyHint });
  const datalist = hasSuggest ? /* @__PURE__ */ (0, import_react.createElement)("datalist", { id: suggestId }, collectSuggestions(suggest, "").map((it, i) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: it.key + "-" + i, value: it.key, label: it.description || void 0 }))) : null;
  return /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-params", "data-param-table": true, style: { minWidth: tableMinWidth(columns, editable) } }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, columns.map((col) => /* @__PURE__ */ (0, import_react.createElement)("th", { key: col, "data-col": col, style: headStyle(col) }, COLUMN_META[col] ? COLUMN_META[col].title : col)), editable ? /* @__PURE__ */ (0, import_react.createElement)("th", { "data-col": "op", style: { width: OP_WIDTH } }, "\u64CD\u4F5C") : null)), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, list.map((row, index) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: index }, columns.map((col) => /* @__PURE__ */ (0, import_react.createElement)("td", { key: col, "data-col": col }, renderCell(col, row, index, editable, patch, cellCtx))), editable ? /* @__PURE__ */ (0, import_react.createElement)("td", { "data-col": "op" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger", onClick: () => remove(index) }, "\u5220\u9664")) : null)), editable ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: columns.length + 1 }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-table-add", onClick: () => onChange(list.concat([blankParamRow()])) }, addLabel))) : null), datalist);
}

// src/client/pages/components/FolderTree.jsx
var INDENT_STEP = "var(--sp-1)";
function indentStyle(depth) {
  if (!depth) return void 0;
  return { paddingLeft: "calc(" + INDENT_STEP + " * " + depth + ")" };
}
function endpointIndentStyle(depth) {
  if (!depth) return void 0;
  return { paddingLeft: "calc(" + INDENT_STEP + " * " + depth + " - " + INDENT_STEP + ")" };
}
function byOrder(a, b) {
  return (Number(a && a.order) || 0) - (Number(b && b.order) || 0);
}
function FolderTree({ project, activeEndpointId, onPick, onToggle, collapsed, readOnly = false }) {
  const folders = (Array.isArray(project && project.folders) ? project.folders : []).filter(Boolean);
  const endpoints = (Array.isArray(project && project.endpoints) ? project.endpoints : []).filter(Boolean);
  const collapsedMap = collapsed && typeof collapsed === "object" ? collapsed : {};
  const folderIds = new Set(folders.map((f) => f.id));
  const pick = (endpointId) => {
    if (readOnly || typeof onPick !== "function") return;
    onPick(endpointId);
  };
  const toggle = (folderId) => {
    if (typeof onToggle !== "function") return;
    onToggle(folderId);
  };
  const renderEndpoint = (ep, depth) => /* @__PURE__ */ (0, import_react.createElement)(
    "div",
    {
      key: ep.id,
      className: "pp-tree-row",
      "data-active": Boolean(activeEndpointId) && ep.id === activeEndpointId,
      onClick: () => pick(ep.id),
      style: endpointIndentStyle(depth)
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": ep.method }, ep.method),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, ep.name || "\u672A\u547D\u540D\u63A5\u53E3")
  );
  const renderFolder = (folder, depth) => {
    const children = folders.filter((f) => f.parentId === folder.id).sort(byOrder);
    const own = endpoints.filter((e) => e.folderId === folder.id).sort(byOrder);
    const isCollapsed = Boolean(collapsedMap[folder.id]);
    return /* @__PURE__ */ (0, import_react.createElement)("div", { key: folder.id }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree-row", style: indentStyle(depth), onClick: () => toggle(folder.id) }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-tree-switcher" }, isCollapsed ? "\u25B8" : "\u25BE"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-tree-icon" }, "\u25A6"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, folder.name || "\u672A\u547D\u540D\u76EE\u5F55"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-tree-row-count" }, own.length)), isCollapsed ? null : /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, children.map((child) => renderFolder(child, depth + 1)), own.map((ep) => renderEndpoint(ep, depth + 1))));
  };
  const topFolders = folders.filter((f) => f.parentId == null || f.parentId === "").sort(byOrder);
  const loose = endpoints.filter((e) => e.folderId == null || e.folderId === "" || !folderIds.has(e.folderId)).sort(byOrder);
  const isEmpty = folders.length === 0 && endpoints.length === 0;
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree-group" }, project && project.name || "\u672A\u547D\u540D\u9879\u76EE"), topFolders.map((folder) => renderFolder(folder, 0)), loose.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree-group" }, "\u672A\u5F52\u7C7B"), loose.map((ep) => renderEndpoint(ep, 0))) : null, isEmpty ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { icon: null, text: "\u6682\u65E0\u76EE\u5F55\u4E0E\u63A5\u53E3" }) : null);
}

// src/client/pages/components/JsonEditor.jsx
var import_react7 = require("react");
function JsonEditor({ value = "", onChange, readOnly = false, rows = 8, placeholder = "{}" }) {
  const [error, setError] = (0, import_react7.useState)("");
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
  return /* @__PURE__ */ (0, import_react.createElement)("div", null, readOnly ? null : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginBottom: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => transform((v) => JSON.stringify(v, null, 2), "\u683C\u5F0F\u5316") }, "\u683C\u5F0F\u5316"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => transform((v) => JSON.stringify(v), "\u538B\u7F29") }, "\u538B\u7F29")), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-json-editor",
      rows,
      readOnly,
      placeholder,
      value: text,
      onChange: (e) => {
        if (typeof onChange === "function") onChange(e.target.value);
      }
    }
  ), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null);
}

// src/client/pages/components/StatusPill.jsx
function statusToneClass(status) {
  const code = Number(status);
  if (!Number.isFinite(code) || code <= 0) return "pp-pill-bad";
  if (code < 300) return "pp-pill-ok";
  if (code < 400) return "pp-pill-warn";
  return "pp-pill-bad";
}
var TONE_ALIAS = { ok: "pp-pill-ok", warn: "pp-pill-warn", bad: "pp-pill-bad", accent: "pp-pill-accent" };
function StatusPill({ status, text = "", tone }) {
  const cls = tone ? TONE_ALIAS[tone] || (String(tone).indexOf("pp-pill") === 0 ? String(tone) : statusToneClass(status)) : statusToneClass(status);
  return /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill " + cls }, status == null || status === "" ? "-" : String(status), text ? " " + text : "");
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
var STATUS_LABEL = { developing: "\u5F00\u53D1\u4E2D", testing: "\u6D4B\u8BD5\u4E2D", done: "\u5DF2\u5B8C\u6210", deprecated: "\u5DF2\u5E9F\u5F03" };
var STATUS_TONE = { developing: "pp-pill-accent", testing: "pp-pill-warn", done: "pp-pill-ok", deprecated: "pp-pill-bad" };
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
    if (token.charAt(0) === "`") nodes.push(/* @__PURE__ */ (0, import_react.createElement)("code", { key, className: "pp-mono" }, token.slice(1, -1)));
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
  if (src.trim() === "") return /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\uFF08\u65E0\u63CF\u8FF0\uFF09");
  const blocks = [];
  let buffer = [];
  let inFence = false;
  let listItems = [];
  const flushFence = (key) => {
    blocks.push(/* @__PURE__ */ (0, import_react.createElement)("pre", { key, className: "pp-pre pp-pre-scroll" }, buffer.join("\n")));
    buffer = [];
  };
  const flushList = (key) => {
    if (listItems.length === 0) return;
    blocks.push(
      /* @__PURE__ */ (0, import_react.createElement)("ul", { key, className: "pp-md-list" }, listItems.map((item, idx) => /* @__PURE__ */ (0, import_react.createElement)("li", { key: idx }, renderInline(item, key + "-li" + idx))))
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
      blocks.push(/* @__PURE__ */ (0, import_react.createElement)("div", { key, className: "pp-doc-h2" }, renderInline(heading[2], key)));
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
  const rootRef = (0, import_react8.useRef)(null);
  (0, import_react8.useEffect)(() => applyTheme(rootRef.current), []);
  const apiRef = resolveApi() || api;
  const [project, setProject] = (0, import_react8.useState)(MOCK_PROJECT2);
  const [isMock, setIsMock] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)("");
  const [selectedId, setSelectedId] = (0, import_react8.useState)(() => route && route.arg || readEndpointIdFromHash());
  const [collapsed, setCollapsed] = (0, import_react8.useState)({});
  const [activeSec, setActiveSec] = (0, import_react8.useState)("sec-info");
  const [responseId, setResponseId] = (0, import_react8.useState)("");
  const [copied, setCopied] = (0, import_react8.useState)("");
  (0, import_react8.useEffect)(() => {
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
  (0, import_react8.useEffect)(() => {
    if (typeof window === "undefined") return void 0;
    const onHash = () => setSelectedId(readEndpointIdFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const endpoints = (0, import_react8.useMemo)(() => Array.isArray(project && project.endpoints) ? project.endpoints : [], [project]);
  const folders = (0, import_react8.useMemo)(() => Array.isArray(project && project.folders) ? project.folders : [], [project]);
  const ep = endpoints.find((e) => e.id === selectedId) || endpoints[0] || null;
  const responses = (0, import_react8.useMemo)(() => {
    const list = Array.isArray(ep && ep.responses) ? ep.responses.filter((r) => r && r.enabled !== false) : [];
    return list;
  }, [ep]);
  const activeResponse = (0, import_react8.useMemo)(() => {
    const found = responses.find((r) => r.id === responseId);
    if (found) return found;
    return responses.find((r) => r.isDefault) || responses[0] || null;
  }, [responses, responseId]);
  const baseUrl = (0, import_react8.useMemo)(() => {
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
  const tree = /* @__PURE__ */ (0, import_react.createElement)(
    FolderTree,
    {
      project,
      activeEndpointId: ep ? ep.id : "",
      collapsed,
      onPick: pick,
      onToggle: (folderId) => setCollapsed((prev) => ({ ...prev, [folderId]: !prev[folderId] }))
    }
  );
  const anchorBar = /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-anchor-bar", role: "navigation", "aria-label": "\u672C\u9875\u76EE\u5F55" }, TOC.map((t) => /* @__PURE__ */ (0, import_react.createElement)(
    "a",
    {
      key: t.id,
      className: "pp-anchor-chip",
      "data-active": activeSec === t.id,
      onClick: (e) => {
        e.preventDefault();
        jump(t.id);
      },
      href: "#/doc/" + encodeURIComponent(ep ? ep.id : "")
    },
    t.label
  )));
  if (!ep) {
    return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page-flush", "data-page": "doc", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-doc-main" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-doc-title" }, "\u63A5\u53E3\u6587\u6863")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-page" }, isMock ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-warn" }, "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock") : null, /* @__PURE__ */ (0, import_react.createElement)(
      EmptyState,
      {
        icon: "file",
        text: "\u8FD8\u6CA1\u6709\u63A5\u53E3\u6587\u6863",
        hint: "\u5728\u603B\u89C8\u9875\u65B0\u5EFA\u9879\u76EE\u540E\uFF0C\u7528\u9876\u680F\u300C\u65B0\u5EFA\u300D\u521B\u5EFA\u7B2C\u4E00\u4E2A\u63A5\u53E3",
        action: { label: "\u53BB\u603B\u89C8\u9875", href: "#/overview" }
      }
    ))));
  }
  const statusLabel = STATUS_LABEL[ep.status] || ep.status || "";
  const docHead = /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-doc-title" }, ep.name), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, copied ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-note " + (copied === "\u5DF2\u590D\u5236" ? "pp-note-ok" : "pp-note-bad") }, copied) : null, statusLabel ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill " + (STATUS_TONE[ep.status] || "pp-pill-accent") }, statusLabel) : null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: copyCurl }, "\u590D\u5236\u4E3A cURL")));
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page-flush", "data-page": "doc", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-split" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-panel", "aria-label": "\u63A5\u53E3\u76EE\u5F55" }, tree), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-doc-main" }, docHead, anchorBar, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-page" }, isMock ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-warn" }, "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock") : null, error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-bad" }, error) : null, /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-info", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h1", { className: "pp-doc-h1" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": ep.method }, ep.method), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, ep.name)), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-mono pp-muted" }, ep.method, " ", ep.url), ep.protocol && ep.protocol === "websocket" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u534F\u8BAE WebSocket\uFF1A\u8C03\u8BD5\u9875\u5DF2\u652F\u6301\u771F\u5B9E\u8FDE\u63A5\uFF08\u8FDE\u63A5 / \u53D1\u9001 / \u6D88\u606F\u65E5\u5FD7 / \u65AD\u8D70\uFF09\uFF0C\u6587\u6863\u4EC5\u5C55\u793A\u5B9A\u4E49\u3002") : null, ep.protocol && ep.protocol !== "http" && ep.protocol !== "websocket" && ep.protocol !== "graphql" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u534F\u8BAE ", ep.protocol, "\uFF1A\u89C4\u5212\u4E2D\uFF08\u4EC5\u4FDD\u7559\u7C7B\u578B\u4F4D\uFF0C\u53D1\u9001\u56DE\u843D HTTP\uFF09") : null, /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)(Markdown, { text: ep.description }))), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-path", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "Path \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.pathParams, readOnly: true, emptyText: "\u65E0 Path \u53C2\u6570", emptyHint: "\u8DEF\u5F84\u91CC\u6CA1\u6709 {var} \u5360\u4F4D\u7B26" }))), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-params", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "Query \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.params, readOnly: true, emptyText: "\u65E0 Query \u53C2\u6570" }))), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-headers", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "\u8BF7\u6C42\u5934"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.headers, readOnly: true, emptyText: "\u65E0\u8BF7\u6C42\u5934" }))), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-cookies", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "Cookies"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: ep.cookies, readOnly: true, emptyText: "\u65E0 Cookies" }))), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-body", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "\u8BF7\u6C42\u4F53\uFF08", ep.body && ep.body.type ? ep.body.type : "none", "\uFF09"), ep.body && ep.body.content ? /* @__PURE__ */ (0, import_react.createElement)(JsonEditor, { value: ep.body.content, readOnly: true, rows: 8 }) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u8BF7\u6C42\u4F53" }), ep.body && ep.body.type && BODY_TYPES.indexOf(ep.body.type) < 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u672A\u77E5 body \u7C7B\u578B\uFF1A", ep.body.type) : null), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-auth", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "\u8BA4\u8BC1"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, AUTH_LABEL[ep.auth && ep.auth.type || "none"] || ep.auth && ep.auth.type), ep.auth && ep.auth.type === "apikey" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-mono" }, (ep.auth.key || "key") + " \u2192 " + (ep.auth.addTo === "query" ? "query" : "header")) : null), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-response", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "\u54CD\u5E94"), responses.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u5C1A\u672A\u5B9A\u4E49\u54CD\u5E94", hint: "\u5728\u8C03\u8BD5\u9875\u53D1\u9001\u540E\u4FDD\u5B58\u4E3A\u63A5\u53E3\uFF0C\u6216\u65B0\u589E\u54CD\u5E94" }) : /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, responses.map((r) => /* @__PURE__ */ (0, import_react.createElement)(
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
  ))), activeResponse ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-doc-sec-body" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)(StatusPill, { status: activeResponse.code, text: activeResponse.name || "" }), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, activeResponse.contentType || "application/json"), activeResponse.isDefault ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill pp-pill-accent" }, "\u9ED8\u8BA4") : null, canSaveResponse ? /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: saveResponse }, "\u4FDD\u5B58\u54CD\u5E94") : /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u53EA\u8BFB\uFF1Astorage.saveResponse \u4E0D\u53EF\u7528")), /* @__PURE__ */ (0, import_react.createElement)(
    JsonEditor,
    {
      value: activeResponse.body,
      rows: 10,
      readOnly: !canSaveResponse,
      onChange: (next) => patchResponse({ body: next })
    }
  ), Array.isArray(activeResponse.headers) && activeResponse.headers.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-doc-sec-body" }, /* @__PURE__ */ (0, import_react.createElement)("h3", { className: "pp-doc-h3" }, "\u54CD\u5E94\u5934"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: activeResponse.headers, readOnly: true, columns: ["key", "value"], emptyText: "\u65E0\u54CD\u5E94\u5934" }))) : null) : null)), /* @__PURE__ */ (0, import_react.createElement)("section", { id: "sec-code", className: "pp-doc-section" }, /* @__PURE__ */ (0, import_react.createElement)("h2", { className: "pp-doc-h2" }, "\u4EE3\u7801\u751F\u6210\uFF08cURL\uFF09"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll" }, buildCurl(ep, baseUrl)))))));
}

// src/client/pages/debug.jsx
var import_react10 = require("react");

// src/client/pages/components/headerPresets.js
var COMMON_HEADERS = [
  { key: "Accept", value: "application/json", description: "\u671F\u671B\u7684\u54CD\u5E94\u5185\u5BB9\u7C7B\u578B" },
  { key: "Accept-Charset", value: "utf-8", description: "\u53EF\u63A5\u53D7\u7684\u5B57\u7B26\u96C6" },
  { key: "Accept-Encoding", value: "gzip, deflate, br", description: "\u53EF\u63A5\u53D7\u7684\u538B\u7F29\u7F16\u7801" },
  { key: "Accept-Language", value: "zh-CN,zh;q=0.9", description: "\u671F\u671B\u7684\u54CD\u5E94\u8BED\u8A00" },
  { key: "Authorization", value: "Bearer {{token}}", description: "\u8BA4\u8BC1\u51ED\u8BC1" },
  { key: "Cache-Control", value: "no-cache", description: "\u7F13\u5B58\u63A7\u5236" },
  { key: "Content-Type", value: "application/json", description: "\u8BF7\u6C42\u4F53\u7684\u5A92\u4F53\u7C7B\u578B" },
  { key: "Cookie", value: "", description: "Cookie \u5B57\u7B26\u4E32" },
  { key: "If-None-Match", value: "", description: "\u6761\u4EF6\u8BF7\u6C42\uFF08ETag\uFF09" },
  { key: "Origin", value: "", description: "\u8BF7\u6C42\u6765\u6E90\u57DF" },
  { key: "Referer", value: "", description: "\u6765\u6E90\u9875\u9762\u5730\u5740" },
  { key: "User-Agent", value: "PostAPI/0.1.0", description: "\u5BA2\u6237\u7AEF\u6807\u8BC6" },
  { key: "X-Api-Key", value: "{{apiKey}}", description: "API Key \u8BA4\u8BC1" },
  { key: "X-Request-Id", value: "{{$uuid}}", description: "\u8BF7\u6C42\u8FFD\u8E2A ID" },
  { key: "X-Forwarded-For", value: "", description: "\u4EE3\u7406\u94FE\u5BA2\u6237\u7AEF IP" }
];
var SUGGEST_LIMIT = 8;
function norm(value) {
  return String(value == null ? "" : value).trim().toLowerCase();
}
function copy(item) {
  return { ...item };
}
function filterHeaders(query) {
  const q = norm(query);
  if (!q) return COMMON_HEADERS.slice(0, SUGGEST_LIMIT).map(copy);
  const prefix = [];
  const contains = [];
  for (const item of COMMON_HEADERS) {
    const key = norm(item.key);
    const at = key.indexOf(q);
    if (at === 0) prefix.push(item);
    else if (at > 0) contains.push(item);
  }
  return prefix.concat(contains).slice(0, SUGGEST_LIMIT).map(copy);
}

// src/client/pages/components/BodyEditor.jsx
var BODY_TYPES2 = [
  { id: "none", label: "none" },
  { id: "form", label: "form-data" },
  { id: "urlencoded", label: "x-www-form-urlencoded" },
  { id: "json", label: "json" },
  { id: "xml", label: "xml" },
  { id: "raw", label: "raw" },
  { id: "graphql", label: "GraphQL" }
];
var BODY_FIELD_COLUMNS = ["enabled", "key", "type", "value", "description"];
var TABLE_TYPES = ["form", "urlencoded"];
var PLACEHOLDER = {
  json: '{\n  "key": "value"\n}',
  xml: "<root>\n  <item>value</item>\n</root>",
  raw: "\u539F\u59CB\u6587\u672C",
  graphql: "query {\n  field\n}"
};
function normalize(value) {
  const src = value && typeof value === "object" ? value : {};
  const type = BODY_TYPES2.some((t) => t.id === src.type) ? src.type : "none";
  return {
    type,
    content: src.content == null ? "" : String(src.content),
    fields: Array.isArray(src.fields) ? src.fields : []
  };
}
function BodyEditor({ value, onChange }) {
  const body = normalize(value);
  const emit = (patch) => {
    if (typeof onChange === "function") onChange({ ...body, ...patch });
  };
  const isTable = TABLE_TYPES.indexOf(body.type) >= 0;
  return /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-body-head" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7C7B\u578B"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: body.type,
      onChange: (e) => emit({ type: e.target.value })
    },
    BODY_TYPES2.map((t) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: t.id, value: t.id }, t.label))
  )), body.type === "none" ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u8BF7\u6C42\u4F53", hint: "Body \u7C7B\u578B\u9009 none \u65F6\u4E0D\u53D1\u9001\u8BF7\u6C42\u4F53" }) : isTable ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(
    ParamTable,
    {
      rows: body.fields,
      columns: BODY_FIELD_COLUMNS,
      onChange: (rows) => emit({ fields: rows }),
      emptyText: "\u65E0\u8868\u5355\u5B57\u6BB5",
      addLabel: "+ \u6DFB\u52A0\u5B57\u6BB5"
    }
  )) : /* @__PURE__ */ (0, import_react.createElement)(
    JsonEditor,
    {
      value: body.content,
      rows: 10,
      placeholder: PLACEHOLDER[body.type] || "",
      onChange: (next) => emit({ content: next })
    }
  ));
}

// src/client/pages/components/AssertTable.jsx
var ASSERT_SOURCES = ["status", "body", "header", "time"];
var ASSERT_OPS = ["eq", "neq", "gt", "lt", "contains", "notContains", "exists", "notExists", "regex"];
var ASSERT_COLUMNS = [
  { field: "source", title: "\u6765\u6E90", width: 88 },
  { field: "path", title: "\u8DEF\u5F84", mono: true, width: "20%" },
  { field: "op", title: "\u64CD\u4F5C\u7B26", width: 96 },
  { field: "value", title: "\u671F\u671B\u503C", mono: true },
  { field: "message", title: "\u8BF4\u660E" }
];
function blankAssertRow() {
  return { source: "status", path: "", op: "eq", value: "", message: "" };
}
function cellInputClass(mono) {
  return "pp-cell-input pp-input-sm" + (mono ? " pp-input-mono" : "");
}
function renderCell2(row, column, index, patch) {
  const value = row ? row[column.field] : void 0;
  const text = value == null ? "" : String(value);
  if (column.field === "source") {
    return /* @__PURE__ */ (0, import_react.createElement)(
      "select",
      {
        className: "pp-cell-input pp-input-sm",
        value: text || ASSERT_SOURCES[0],
        onChange: (e) => patch(index, column.field, e.target.value)
      },
      ASSERT_SOURCES.map((s) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: s, value: s }, s))
    );
  }
  if (column.field === "op") {
    return /* @__PURE__ */ (0, import_react.createElement)(
      "select",
      {
        className: "pp-cell-input pp-input-sm",
        value: text || ASSERT_OPS[0],
        onChange: (e) => patch(index, column.field, e.target.value)
      },
      ASSERT_OPS.map((o) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: o, value: o }, o))
    );
  }
  return /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: cellInputClass(column.mono),
      value: text,
      onChange: (e) => patch(index, column.field, e.target.value)
    }
  );
}
function AssertTable({ rows, onChange }) {
  const list = Array.isArray(rows) ? rows : [];
  const emit = (next) => {
    if (typeof onChange === "function") onChange(next);
  };
  const patch = (index, field, value) => {
    const next = list.slice();
    next[index] = { ...next[index], [field]: value };
    emit(next);
  };
  const remove = (index) => {
    const next = list.slice();
    next.splice(index, 1);
    emit(next);
  };
  const add = () => emit(list.concat([blankAssertRow()]));
  const colSpan = ASSERT_COLUMNS.length + 1;
  return /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-wide" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, ASSERT_COLUMNS.map((column) => /* @__PURE__ */ (0, import_react.createElement)(
    "th",
    {
      key: column.field,
      "data-col": column.field,
      style: column.width ? { width: column.width } : void 0
    },
    column.title
  )), /* @__PURE__ */ (0, import_react.createElement)("th", { "data-col": "op-cell", style: { width: "52px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, list.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta" }, "\u6682\u65E0\u65AD\u8A00"))) : list.map((row, index) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: index }, ASSERT_COLUMNS.map((column) => /* @__PURE__ */ (0, import_react.createElement)("td", { key: column.field, "data-col": column.field }, renderCell2(row, column, index, patch))), /* @__PURE__ */ (0, import_react.createElement)("td", { "data-col": "op-cell" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger", onClick: () => remove(index) }, "\u5220\u9664")))), /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-table-add", onClick: add }, "+ \u6DFB\u52A0\u65AD\u8A00")))));
}

// src/client/pages/components/ScriptPanel.jsx
function normalize2(value) {
  const v = value || {};
  return {
    preScript: v.preScript == null ? "" : String(v.preScript),
    postScript: v.postScript == null ? "" : String(v.postScript),
    assertions: Array.isArray(v.assertions) ? v.assertions : [],
    waitMs: Number.isFinite(v.waitMs) ? v.waitMs : 0
  };
}
function parseWait(text) {
  const digits = String(text == null ? "" : text).replace(/[^0-9]/g, "");
  return digits === "" ? 0 : Number(digits);
}
function ScriptPanel({ value, onChange }) {
  const current = normalize2(value);
  const emit = (next) => {
    if (typeof onChange === "function") onChange({ ...current, ...next });
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-script-block" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u524D\u7F6E\u811A\u672C")), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-textarea pp-input-mono",
      rows: 6,
      placeholder: "// \u8BF7\u6C42\u53D1\u9001\u524D\u6267\u884C",
      value: current.preScript,
      onChange: (e) => emit({ preScript: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u53EF\u7528 pm.request / pm.environment.set / console.log")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-script-block" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u540E\u7F6E\u811A\u672C")), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-textarea pp-input-mono",
      rows: 6,
      placeholder: "// \u54CD\u5E94\u8FD4\u56DE\u540E\u6267\u884C",
      value: current.postScript,
      onChange: (e) => emit({ postScript: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u53EF\u7528 pm.response / pm.test / pm.globals.set")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-script-block" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u65AD\u8A00")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(AssertTable, { rows: current.assertions, onChange: (rows) => emit({ assertions: rows }) }))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-script-block" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u7B49\u5F85\u65F6\u95F4")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label", htmlFor: "pp-wait-ms" }, "\u7B49\u5F85"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      id: "pp-wait-ms",
      className: "pp-input",
      type: "number",
      min: "0",
      step: "100",
      value: String(current.waitMs),
      onChange: (e) => emit({ waitMs: parseWait(e.target.value) })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "ms \xB7 \u53D1\u9001\u524D\u7B49\u5F85"))));
}

// src/client/pages/components/ResponsePanel.jsx
var import_react9 = require("react");
var RESPONSE_TABS = [
  { id: "body", label: "Body" },
  { id: "headers", label: "Headers" },
  { id: "cookies", label: "Cookies" },
  { id: "request", label: "\u5B9E\u9645\u8BF7\u6C42" },
  { id: "tests", label: "\u6D4B\u8BD5\u7ED3\u679C" },
  { id: "logs", label: "\u63A7\u5236\u53F0" }
];
var COUNTED_TABS = ["headers", "tests"];
function tabTitle(tab, counts) {
  const n = counts ? counts[tab.id] : void 0;
  const counted = COUNTED_TABS.indexOf(tab.id) > -1 && typeof n === "number";
  return counted ? tab.label + " (" + n + ")" : tab.label;
}
function textOf(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(textOf).filter((s) => s !== "").join("\n");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
function bodyText(body) {
  return body == null ? "" : textOf(body);
}
function prettyBody(body) {
  const text = bodyText(body);
  if (!text) return "";
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
function headersToRows(headers) {
  if (!headers || typeof headers !== "object") return [];
  const keys = Array.isArray(headers) ? headers.map((_, i) => String(i)) : Object.keys(headers);
  return keys.map((key) => ({ key, value: textOf(headers[key]) }));
}
function parseSetCookies(headers) {
  const raw = [];
  if (headers && typeof headers === "object") {
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() !== "set-cookie") continue;
      const value = headers[key];
      if (Array.isArray(value)) raw.push(...value.map(textOf));
      else if (value != null) raw.push(textOf(value));
    }
  }
  const rows = [];
  for (const item of raw) {
    for (const line of String(item).split("\n")) {
      const seg = line.trim();
      if (!seg) continue;
      const pieces = seg.split(";").map((s) => s.trim()).filter((s) => s !== "");
      const head = pieces.shift() || "";
      const eq = head.indexOf("=");
      rows.push({
        name: eq >= 0 ? head.slice(0, eq).trim() : head,
        value: eq >= 0 ? head.slice(eq + 1).trim() : "",
        attrs: pieces.join("; ")
      });
    }
  }
  return rows;
}
function logsText(logs) {
  if (Array.isArray(logs)) return logs.map(textOf).filter((s) => s !== "").join("\n");
  return logs == null ? "" : textOf(logs);
}
function errText2(err) {
  if (err == null) return "";
  if (typeof err === "object" && err.message) return String(err.message);
  return String(err);
}
var COOKIE_COLS = [
  { title: "\u540D\u79F0", width: "180px" },
  { title: "\u503C", width: "" },
  { title: "\u5C5E\u6027", width: "" }
];
function ResponsePanel({ resp, sending = false, onCancel }) {
  const [tab, setTab] = (0, import_react9.useState)("body");
  const [bodyView, setBodyView] = (0, import_react9.useState)("pretty");
  const [copyError, setCopyError] = (0, import_react9.useState)("");
  const copyBody = () => {
    const clip = typeof navigator === "undefined" || !navigator ? null : navigator.clipboard;
    if (!clip || typeof clip.writeText !== "function") {
      setCopyError("\u590D\u5236\u5931\u8D25\uFF1A\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u526A\u8D34\u677F");
      return;
    }
    try {
      const result = clip.writeText(bodyText(resp ? resp.body : ""));
      if (result && typeof result.then === "function") {
        result.then(() => setCopyError("")).catch((err) => setCopyError("\u590D\u5236\u5931\u8D25\uFF1A" + errText2(err)));
      } else {
        setCopyError("");
      }
    } catch (err) {
      setCopyError("\u590D\u5236\u5931\u8D25\uFF1A" + errText2(err));
    }
  };
  const sendingBar = sending ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-resp-bar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill pp-pill-accent" }, "\u53D1\u9001\u4E2D\u2026"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => {
    if (typeof onCancel === "function") onCancel();
  } }, "\u53D6\u6D88")) : null;
  if (!resp) {
    return /* @__PURE__ */ (0, import_react.createElement)("div", { "data-response-panel": "" }, sendingBar, sending ? null : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u5C1A\u672A\u53D1\u9001\u8BF7\u6C42", hint: "\u586B\u5199 URL \u540E\u70B9\u300C\u53D1\u9001\u300D" }));
  }
  const headerRows = headersToRows(resp.headers);
  const cookieRows = parseSetCookies(resp.headers);
  const testItems = Array.isArray(resp.tests) ? resp.tests : [];
  const logText = logsText(resp.logs);
  const req = resp.request && typeof resp.request === "object" ? resp.request : null;
  const counts = { headers: headerRows.length, tests: testItems.length };
  const errorMsg = resp.error ? errText2(resp.error) : "";
  const statusBar = /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-resp-bar" }, /* @__PURE__ */ (0, import_react.createElement)(StatusPill, { status: resp.status, text: resp.statusText || "" }), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, resp.timeMs == null ? "-" : resp.timeMs, " ms"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, resp.bodySize == null ? "-" : resp.bodySize, " B"), resp.truncated ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill pp-pill-warn" }, "\u5DF2\u622A\u65AD") : null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: copyBody }, "\u590D\u5236"));
  let tabBody = null;
  if (tab === "body") {
    tabBody = /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs pp-sub-tabs" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": bodyView === "pretty", onClick: () => setBodyView("pretty") }, "\u7F8E\u5316"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": bodyView === "raw", onClick: () => setBodyView("raw") }, "\u539F\u6587")), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll", style: { marginTop: "var(--sp-2)" } }, bodyView === "pretty" ? prettyBody(resp.body) : bodyText(resp.body)));
  } else if (tab === "headers") {
    tabBody = /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: headerRows, readOnly: true, columns: ["key", "value"], emptyText: "\u65E0\u54CD\u5E94\u5934" }));
  } else if (tab === "cookies") {
    tabBody = cookieRows.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0 Cookies" }) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, COOKIE_COLS.map((col) => /* @__PURE__ */ (0, import_react.createElement)("th", { key: col.title, style: col.width ? { width: col.width } : void 0 }, col.title)))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, cookieRows.map((row, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono" }, row.name || "-"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono" }, row.value || "-"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-muted" }, row.attrs || "-"))))));
  } else if (tab === "request") {
    tabBody = req ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": String(req.method || "GET").toUpperCase() }, String(req.method || "GET").toUpperCase()), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-mono pp-ellipsis", title: req.url || "" }, req.url || "-")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap", style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: headersToRows(req.headers), readOnly: true, columns: ["key", "value"], emptyText: "\u65E0\u8BF7\u6C42\u5934" })), bodyText(req.body) ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll", style: { marginTop: "var(--sp-2)" } }, bodyText(req.body)) : null) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u8BF7\u6C42\u5FEB\u7167" });
  } else if (tab === "tests") {
    tabBody = testItems.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u65AD\u8A00" }) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-list" }, testItems.map((item, i) => /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-result-row", key: i }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: item && item.passed ? "pp-pill pp-pill-ok" : "pp-pill pp-pill-bad" }, item && item.passed ? "\u901A\u8FC7" : "\u5931\u8D25"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, item && item.name ? String(item.name) : "-"), item && item.error ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, errText2(item.error)) : null)));
  } else {
    tabBody = logText ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll" }, logText) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u65E0\u65E5\u5FD7" });
  }
  return /* @__PURE__ */ (0, import_react.createElement)("div", { "data-response-panel": "" }, sendingBar, statusBar, copyError ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-bad" }, copyError) : null, errorMsg ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-bad" }, errorMsg) : /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-resp-tabs" }, RESPONSE_TABS.map((t) => /* @__PURE__ */ (0, import_react.createElement)("button", { key: t.id, className: "pp-tab", "data-active": tab === t.id, onClick: () => setTab(t.id) }, tabTitle(t, counts)))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-tabbody" }, tabBody)));
}

// src/client/pages/debug.jsx
(window.__postapiQueue = window.__postapiQueue || []).push(["debug", DebugPage]);
var METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
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
  { id: "auth", label: "Auth" },
  { id: "script", label: "\u811A\u672C" },
  { id: "db", label: "\u6570\u636E\u5E93" },
  { id: "settings", label: "\u8BBE\u7F6E" }
];
var WS_TABS = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" }
];
var DB_TYPES = [
  { id: "sqlite", label: "SQLite\uFF08\u5185\u7F6E\u9A71\u52A8\uFF09" },
  { id: "mysql", label: "MySQL\uFF08\u9700\u72EC\u7ACB\u9A71\u52A8\uFF09" },
  { id: "postgresql", label: "PostgreSQL\uFF08\u9700\u72EC\u7ACB\u9A71\u52A8\uFF09" }
];
var REPLAY_KEY = "postapi.debug.replay";
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
    // 协议位（http | websocket | grpc...）：websocket 走调试页 WS 模式，其余仍回落 HTTP
    protocol: ep && ep.protocol || "http",
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
    responses: (ep && Array.isArray(ep.responses) ? ep.responses : []).map((r) => ({ ...r })),
    // 前后置脚本 / 断言 / 发送前等待（Apifox 的「前置操作 / 后置操作」与「等待时间」）
    preScript: ep && ep.preScript || "",
    postScript: ep && ep.postScript || "",
    assertions: (ep && Array.isArray(ep.assertions) ? ep.assertions : []).map((a) => ({ ...a })),
    waitMs: Number.isFinite(ep && ep.waitMs) ? ep.waitMs : 0
  };
}
function readReplay() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(REPLAY_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
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
function appendCommonHeaders(rows, limit = 3) {
  const list = Array.isArray(rows) ? rows.slice() : [];
  const exists = (key) => list.some((r) => String(r && r.key || "").trim().toLowerCase() === String(key).toLowerCase());
  let added = 0;
  for (const h of Array.isArray(COMMON_HEADERS) ? COMMON_HEADERS : []) {
    if (added >= limit) break;
    if (!h || !h.key || exists(h.key)) continue;
    list.push({
      key: h.key,
      value: h.value == null ? "" : h.value,
      enabled: true,
      type: "string",
      required: false,
      description: h.description == null ? "" : h.description
    });
    added += 1;
  }
  return list;
}
function toWsUrl(raw) {
  const url = String(raw || "");
  if (/^wss?:\/\//i.test(url)) return url;
  return url.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
}
function buildWsPayload(draft, finalUrl, variables) {
  return {
    url: toWsUrl(finalUrl),
    params: (Array.isArray(draft.params) ? draft.params : []).filter((p) => p && p.enabled !== false && p.key),
    headers: (Array.isArray(draft.headers) ? draft.headers : []).filter((h) => h && h.enabled !== false && h.key),
    auth: draft.auth || { type: "none" },
    variables
  };
}
var WS_DIR_LABEL = { out: "\u2192", in: "\u2190", system: "\u25CF" };
function wsTime(at) {
  const raw = String(at || "");
  return raw.length >= 19 ? raw.slice(11, 19) : raw;
}
function DebugPage({ route, api }) {
  const rootRef = (0, import_react10.useRef)(null);
  const abortRef = (0, import_react10.useRef)({ cancelled: false });
  (0, import_react10.useEffect)(() => applyTheme(rootRef.current), []);
  const apiRef = resolveApi2() || api;
  const [project, setProject] = (0, import_react10.useState)(MOCK_PROJECT3);
  const [isMock, setIsMock] = (0, import_react10.useState)(true);
  const [error, setError] = (0, import_react10.useState)("");
  const [envId, setEnvId] = (0, import_react10.useState)(() => {
    const envs2 = MOCK_PROJECT3.environments;
    const def = envs2.find((e) => e.isDefault) || envs2[0];
    return def ? def.id : "";
  });
  const [draft, setDraft] = (0, import_react10.useState)(() => emptyDraft(MOCK_PROJECT3.endpoints[0]));
  const [tab, setTab] = (0, import_react10.useState)("params");
  const [resp, setResp] = (0, import_react10.useState)(null);
  const [sending, setSending] = (0, import_react10.useState)(false);
  const [timeoutMs, setTimeoutMs] = (0, import_react10.useState)(3e4);
  const [savedHint, setSavedHint] = (0, import_react10.useState)("");
  const [wsState, setWsState] = (0, import_react10.useState)({ id: "", status: "idle", messages: [], error: null });
  const [wsInput, setWsInput] = (0, import_react10.useState)("");
  const wsIndexRef = (0, import_react10.useRef)(0);
  const wsTimerRef = (0, import_react10.useRef)(null);
  const [dbConfig, setDbConfig] = (0, import_react10.useState)({ type: "sqlite", path: "", host: "", port: "", user: "", password: "", database: "" });
  const [dbSql, setDbSql] = (0, import_react10.useState)("SELECT 1");
  const [dbHint, setDbHint] = (0, import_react10.useState)("");
  const [dbResult, setDbResult] = (0, import_react10.useState)(null);
  const [dbBusy, setDbBusy] = (0, import_react10.useState)(false);
  (0, import_react10.useEffect)(() => {
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
  (0, import_react10.useEffect)(() => {
    const snap = readReplay();
    if (!snap) return;
    setDraft((prev) => ({
      ...prev,
      method: snap.method || prev.method,
      url: snap.url || prev.url,
      headers: Array.isArray(snap.headers) && snap.headers.length ? snap.headers.map((h) => ({ enabled: true, type: "string", required: false, description: "", ...h })) : prev.headers,
      body: typeof snap.body === "string" && snap.body ? { ...prev.body, type: prev.body.type === "none" ? "json" : prev.body.type, content: snap.body } : prev.body
    }));
    try {
      localStorage.removeItem(REPLAY_KEY);
    } catch {
    }
  }, []);
  const envs = (0, import_react10.useMemo)(() => Array.isArray(project && project.environments) ? project.environments : [], [project]);
  const { table, env } = (0, import_react10.useMemo)(() => varTable(project, envId), [project, envId]);
  const varRefs = (0, import_react10.useMemo)(() => collectVarRefs(draft), [draft]);
  const missingVars = (0, import_react10.useMemo)(() => varRefs.filter((k) => !(k in table)), [varRefs, table]);
  const finalUrl = (0, import_react10.useMemo)(() => {
    const raw = String(draft.url || "");
    if (/^wss?:\/\//i.test(raw)) return raw;
    return joinUrl2(env && env.baseUrl, raw);
  }, [env, draft.url]);
  const wsMode = draft.protocol === "websocket";
  const activeTabs = wsMode ? WS_TABS : TABS;
  const dbConnections = (0, import_react10.useMemo)(
    () => project && project.settings && Array.isArray(project.settings.dbConnections) ? project.settings.dbConnections : [],
    [project]
  );
  const pollWsMessages = () => {
    const wsApi = apiRef && apiRef.ws;
    if (!wsApi || typeof wsApi.messages !== "function" || !wsState.id) return;
    wsApi.messages({ id: wsState.id, since: wsIndexRef.current }).then((result) => {
      if (!result || result.ok === false) return;
      if (Array.isArray(result.messages) && result.messages.length) {
        setWsState((prev) => ({ ...prev, messages: [...prev.messages, ...result.messages], status: result.status || prev.status }));
      } else {
        setWsState((prev) => ({ ...prev, status: result.status || prev.status }));
      }
      if (Number.isFinite(result.lastIndex)) wsIndexRef.current = result.lastIndex;
    }).catch(() => {
    });
  };
  (0, import_react10.useEffect)(() => {
    if (wsTimerRef.current) {
      clearInterval(wsTimerRef.current);
      wsTimerRef.current = null;
    }
    if (wsState.status !== "open" || !wsState.id) return void 0;
    wsTimerRef.current = setInterval(pollWsMessages, 1e3);
    return () => {
      if (wsTimerRef.current) {
        clearInterval(wsTimerRef.current);
        wsTimerRef.current = null;
      }
    };
  }, [wsState.status, wsState.id, apiRef]);
  (0, import_react10.useEffect)(() => () => {
    if (wsTimerRef.current) clearInterval(wsTimerRef.current);
  }, []);
  const patch = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));
  const patchAuth = (field, value) => setDraft((prev) => ({ ...prev, auth: { ...prev.auth, [field]: value } }));
  const addCommonHeaders = () => setDraft((prev) => ({ ...prev, headers: appendCommonHeaders(prev.headers, 3) }));
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
      timeoutMs: timeoutMs > 0 ? timeoutMs : 3e4,
      // 前后置脚本与断言：host request.send 已支持这三个字段（bridge 直通 request.js）
      preScript: draft.preScript || void 0,
      postScript: draft.postScript || void 0,
      assertions: Array.isArray(draft.assertions) && draft.assertions.length ? draft.assertions : void 0,
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
    const wait = Number(draft.waitMs) > 0 ? Number(draft.waitMs) : 0;
    Promise.resolve().then(() => wait > 0 ? new Promise((resolve) => setTimeout(resolve, wait)) : void 0).then(() => requestApi.send(payload)).then((result) => {
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
      protocol: wsMode ? "websocket" : "http",
      name: draft.name || (wsMode ? "WS " : draft.method + " ") + draft.url,
      responses: draft.responses.length ? draft.responses : []
    };
    Promise.resolve().then(() => storage.saveEndpoint(project.id, endpoint)).then((saved) => {
      setSavedHint("\u5DF2\u4FDD\u5B58\uFF1A" + (saved && saved.name || endpoint.name));
      setDraft((prev) => ({ ...prev, id: saved && saved.id || prev.id }));
    }).catch((err) => setSavedHint("\u4FDD\u5B58\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err))));
  };
  const wsConnect = () => {
    const wsApi = apiRef && apiRef.ws;
    if (!wsApi || typeof wsApi.open !== "function") {
      setWsState((prev) => ({ ...prev, status: "unavailable", error: { kind: "unavailable", message: "api.ws \u4E0D\u53EF\u7528" } }));
      return;
    }
    const payload = buildWsPayload(draft, finalUrl, {
      globals: project && project.globals ? project.globals.variables || [] : [],
      environment: env && Array.isArray(env.variables) ? env.variables : [],
      local: []
    });
    wsIndexRef.current = 0;
    setWsState({ id: "", status: "connecting", messages: [], error: null });
    wsApi.open({ ...payload, timeoutMs: timeoutMs > 0 ? timeoutMs : 3e4 }).then((result) => {
      const messages = Array.isArray(result && result.messages) ? result.messages : [];
      wsIndexRef.current = messages.length;
      setWsState({
        id: result && result.id || "",
        url: result && result.url || "",
        status: result && result.status || "closed",
        messages,
        error: result && result.error || null
      });
    }).catch((err) => setWsState({ id: "", url: "", status: "error", messages: [], error: { kind: "client", message: err && err.message ? err.message : String(err) } }));
  };
  const wsDisconnect = () => {
    const wsApi = apiRef && apiRef.ws;
    if (!wsApi || typeof wsApi.close !== "function" || !wsState.id) return;
    wsApi.close({ id: wsState.id }).then(() => setWsState((prev) => ({ ...prev, status: "closed" }))).catch(() => setWsState((prev) => ({ ...prev, status: "closed" })));
  };
  const wsSend = () => {
    const wsApi = apiRef && apiRef.ws;
    if (!wsApi || typeof wsApi.send !== "function" || !wsState.id) return;
    const text = String(wsInput);
    wsApi.send({ id: wsState.id, message: text }).then((result) => {
      if (result && result.ok === false) {
        setWsState((prev) => ({ ...prev, error: result.error || { kind: "client", message: "\u53D1\u9001\u5931\u8D25" } }));
        return;
      }
      setWsState((prev) => ({ ...prev, status: result && result.status || prev.status, messages: [...prev.messages, { direction: "out", at: (/* @__PURE__ */ new Date()).toISOString(), data: text, binary: false }] }));
      setWsInput("");
      pollWsMessages();
    }).catch((err) => setWsState((prev) => ({ ...prev, error: { kind: "client", message: err && err.message ? err.message : String(err) } })));
  };
  const dbPatch = (field, value) => setDbConfig((prev) => ({ ...prev, [field]: value }));
  const dbTest = () => {
    const dbApi = apiRef && apiRef.db;
    if (!dbApi || typeof dbApi.test !== "function") {
      setDbHint("api.db \u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09");
      return;
    }
    setDbBusy(true);
    setDbHint("");
    dbApi.test({ connection: dbConfig }).then((result) => {
      if (result && result.ok) setDbHint("\u8FDE\u63A5\u6210\u529F\uFF08" + result.driver + "\uFF09");
      else setDbHint("\u8FDE\u63A5\u5931\u8D25\uFF1A" + (result && result.error && result.error.message || "\u672A\u77E5\u9519\u8BEF"));
    }).catch((err) => setDbHint("\u8FDE\u63A5\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)))).finally(() => setDbBusy(false));
  };
  const dbRun = () => {
    const dbApi = apiRef && apiRef.db;
    if (!dbApi || typeof dbApi.query !== "function") {
      setDbHint("api.db \u4E0D\u53EF\u7528\uFF08\u6865\u964D\u7EA7\uFF09");
      return;
    }
    setDbBusy(true);
    setDbHint("");
    dbApi.query({ connection: dbConfig, sql: dbSql }).then((result) => {
      setDbResult(result);
    }).catch((err) => {
      setDbResult(null);
      setDbHint("\u6267\u884C\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
    }).finally(() => setDbBusy(false));
  };
  const dbSave = () => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.saveProjectSettings !== "function" || !project || !project.id) {
      setDbHint("\u4FDD\u5B58\u5931\u8D25\uFF1Astorage.saveProjectSettings \u4E0D\u53EF\u7528");
      return;
    }
    const name = (dbConfig.type === "sqlite" ? dbConfig.path : dbConfig.host) || dbConfig.type;
    const next = [...dbConnections.filter((c) => c && c.name !== name), { ...dbConfig, name }];
    storage.saveProjectSettings(project.id, { dbConnections: next }).then(() => setProject((prev) => ({ ...prev, settings: { ...prev.settings || {}, dbConnections: next } }))).then(() => setDbHint("\u5DF2\u4FDD\u5B58\u8FDE\u63A5\uFF1A" + name)).catch((err) => setDbHint("\u4FDD\u5B58\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err))));
  };
  const dbLoad = (name) => {
    const hit = dbConnections.find((c) => c && c.name === name);
    if (!hit) return;
    setDbConfig({ type: "sqlite", path: "", host: "", port: "", user: "", password: "", database: "", ...hit });
    setDbHint("\u5DF2\u8F7D\u5165\u8FDE\u63A5\uFF1A" + name);
  };
  const dbDelete = (name) => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.saveProjectSettings !== "function" || !project || !project.id) return;
    const next = dbConnections.filter((c) => c && c.name !== name);
    storage.saveProjectSettings(project.id, { dbConnections: next }).then(() => setProject((prev) => ({ ...prev, settings: { ...prev.settings || {}, dbConnections: next } }))).catch(() => {
    });
  };
  const wsPanel = /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane pp-debug-response", "data-ws": "1" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u6D88\u606F\u65E5\u5FD7"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill " + (wsState.status === "open" ? "pp-pill-ok" : wsState.status === "connecting" ? "pp-pill-warn" : "") }, wsState.status === "idle" ? "\u672A\u8FDE\u63A5" : wsState.status === "connecting" ? "\u8FDE\u63A5\u4E2D" : wsState.status === "open" ? "\u5DF2\u8FDE\u63A5" : wsState.status === "closed" ? "\u5DF2\u65AD\u5F00" : wsState.status), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-link", onClick: pollWsMessages, disabled: !wsState.id }, "\u5237\u65B0")), wsState.error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-bad" }, wsState.error.message) : null, wsState.url ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta pp-ellipsis", title: wsState.url }, wsState.url) : null, wsState.messages.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { title: "\u6682\u65E0\u6D88\u606F", hint: "\u8FDE\u63A5\u5EFA\u7ACB\u540E\uFF0C\u6536\u53D1\u7684\u6D88\u606F\u4F1A\u6309\u65F6\u95F4\u987A\u5E8F\u663E\u793A\u5728\u8FD9\u91CC\u3002" }) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pre", style: { maxHeight: 360, overflowY: "auto" } }, wsState.messages.map((m, i) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: i, className: "pp-form-row", style: { alignItems: "baseline" } }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, wsTime(m.at), " ", WS_DIR_LABEL[m.direction] || "\xB7"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-mono", style: { whiteSpace: "pre-wrap", wordBreak: "break-all" } }, m.event ? String(m.event) + (m.code != null ? ` (${m.code}${m.reason ? " " + m.reason : ""})` : "") : (m.binary ? "[\u4E8C\u8FDB\u5236 base64] " : "") + String(m.data == null ? "" : m.data))))));
  const responsePanel = /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane pp-debug-response" }, /* @__PURE__ */ (0, import_react.createElement)(ResponsePanel, { resp, sending, onCancel: cancel }));
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page-flush", "data-page": "debug", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-page pp-debug-split" }, /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-pane pp-debug-request" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-url-row" }, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-input-sm",
      value: draft.protocol || "http",
      onChange: (e) => {
        patch("protocol", e.target.value);
        setTab((prev) => e.target.value === "websocket" && !WS_TABS.some((t) => t.id === prev) ? "params" : prev);
      },
      "aria-label": "\u534F\u8BAE",
      title: "WebSocket \u8D70 WS \u8C03\u8BD5\u6A21\u5F0F\uFF0C\u5176\u4F59\u534F\u8BAE\u56DE\u843D HTTP"
    },
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "http" }, "HTTP"),
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "websocket" }, "WebSocket")
  ), wsMode ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": "WS", title: "WebSocket \u8FDE\u63A5" }, "WS") : /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": draft.method }, draft.method), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-url-method",
      value: draft.method,
      onChange: (e) => patch("method", e.target.value),
      "aria-label": "\u8BF7\u6C42\u65B9\u6CD5"
    },
    METHODS.map((m) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: m, value: m }, m))
  )), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-url-pill", title: env && env.baseUrl ? env.baseUrl : "\u672A\u914D\u7F6E baseUrl" }, env && env.baseUrl ? env.baseUrl : "\u672A\u914D\u7F6E baseUrl"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      value: draft.url,
      placeholder: wsMode ? "ws://TARGET/path \u6216 /path\uFF08\u62FC baseUrl\uFF09\uFF0C\u652F\u6301 {{var}}" : "/api/v1/... \u6216 https://TARGET/endpoint\uFF0C\u652F\u6301 {{var}}",
      onChange: (e) => patch("url", e.target.value),
      "aria-label": "\u8BF7\u6C42\u8DEF\u5F84"
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-send-group" }, wsMode ? wsState.status === "open" ? /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: wsDisconnect, title: "\u65AD\u5F00 WebSocket \u8FDE\u63A5" }, "\u65AD\u5F00") : /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-primary",
      onClick: wsConnect,
      disabled: wsState.status === "connecting" || !String(draft.url || "").trim(),
      title: String(draft.url || "").trim() ? "" : "\u5148\u586B\u5199\u8FDE\u63A5\u5730\u5740"
    },
    wsState.status === "connecting" ? "\u8FDE\u63A5\u4E2D\u2026" : "\u8FDE\u63A5"
  ) : /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-primary",
      onClick: send,
      disabled: sending || !String(draft.url || "").trim(),
      title: String(draft.url || "").trim() ? "" : "\u5148\u586B\u5199\u8BF7\u6C42\u8DEF\u5F84"
    },
    sending ? "\u53D1\u9001\u4E2D\u2026" : "\u53D1\u9001"
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: cancel, disabled: !sending, title: "\u53D6\u6D88\u672C\u6B21\u53D1\u9001" }, "\u2715")))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-meta" }, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-input-sm",
      value: envId,
      onChange: (e) => setEnvId(e.target.value),
      "aria-label": "\u73AF\u5883"
    },
    envs.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u65E0\u73AF\u5883\uFF09") : null,
    envs.map((e) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: e.id, value: e.id }, e.name))
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-mono pp-meta pp-ellipsis", title: finalUrl || "" }, finalUrl || "\uFF08\u672A\u586B\u5199 URL\uFF09"), varRefs.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u53D8\u91CF ", varRefs.join("\u3001"), missingVars.length > 0 ? "\uFF08\u672A\u5B9A\u4E49\uFF1A" + missingVars.join("\u3001") + "\uFF09" : "\uFF08\u5747\u5DF2\u5B9A\u4E49\uFF09") : null, /* @__PURE__ */ (0, import_react.createElement)("a", { className: "pp-meta", href: "#/history" }, "\u8BF7\u6C42\u5386\u53F2"), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-ghost",
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(buildCurl({
            method: draft.method,
            url: draft.url,
            params: draft.params,
            headers: draft.headers,
            auth: draft.auth,
            body: draft.body
          }, env && env.baseUrl));
          setSavedHint("\u5DF2\u590D\u5236 cURL");
        } catch (err) {
          setSavedHint("\u590D\u5236\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
        }
      }
    },
    "\u590D\u5236 cURL"
  )), !isMock && !String(draft.url || "").trim() ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note" }, "\u5F53\u524D\u9879\u76EE\u8FD8\u6CA1\u6709\u63A5\u53E3\uFF0C\u5148\u5230 ", /* @__PURE__ */ (0, import_react.createElement)("a", { href: "#/doc" }, "\u63A5\u53E3\u6587\u6863"), " \u6216 ", /* @__PURE__ */ (0, import_react.createElement)("a", { href: "#/overview" }, "\u603B\u89C8"), " \u65B0\u5EFA\u4E00\u4E2A\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u5728\u4E0A\u65B9\u586B\u5199\u5B8C\u6574 URL \u8C03\u8BD5\u3002") : null, isMock ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-warn" }, "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u53D1\u9001\u5C06\u8FD4\u56DE mock \u54CD\u5E94") : null, error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-bad" }, error) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, activeTabs.map((t) => /* @__PURE__ */ (0, import_react.createElement)("button", { key: t.id, className: "pp-tab", "data-active": tab === t.id, onClick: () => setTab(t.id) }, t.label))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-tabbody" }, tab === "params" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-title" }, "Path \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.pathParams, onChange: (rows) => patch("pathParams", rows), emptyText: "\u65E0 Path \u53C2\u6570" })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-title" }, "Query \u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.params, onChange: (rows) => patch("params", rows), emptyText: "\u65E0 Query \u53C2\u6570" }))) : null, tab === "headers" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u8BF7\u6C42\u5934"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-link", onClick: addCommonHeaders, title: "\u8FFD\u52A0 3 \u6761\u5E38\u7528\u8BF7\u6C42\u5934" }, "+ \u5E38\u7528\u8BF7\u6C42\u5934")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(
    ParamTable,
    {
      rows: draft.headers,
      onChange: (rows) => patch("headers", rows),
      suggest: filterHeaders,
      emptyText: "\u65E0\u8BF7\u6C42\u5934"
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-title" }, "Cookies"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)(ParamTable, { rows: draft.cookies, onChange: (rows) => patch("cookies", rows), emptyText: "\u65E0 Cookies" }))) : null, tab === "body" ? /* @__PURE__ */ (0, import_react.createElement)(BodyEditor, { value: draft.body, onChange: (next) => patch("body", next) }) : null, tab === "script" ? /* @__PURE__ */ (0, import_react.createElement)(
    ScriptPanel,
    {
      value: { preScript: draft.preScript, postScript: draft.postScript, assertions: draft.assertions, waitMs: draft.waitMs },
      onChange: (next) => setDraft((prev) => ({ ...prev, ...next }))
    }
  ) : null, tab === "settings" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-title" }, "\u53D1\u9001\u8BBE\u7F6E"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8D85\u65F6 (ms)"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1, maxWidth: 160 },
      value: String(timeoutMs),
      onChange: (e) => setTimeoutMs(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7B49\u5F85 (ms)"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1, maxWidth: 160 },
      value: String(draft.waitMs || 0),
      onChange: (e) => patch("waitMs", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-title" }, "\u8BF7\u6C42\u6982\u89C8"), /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("tbody", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, "\u65B9\u6CD5"), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": draft.method }, draft.method))), /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, "\u5B8C\u6574 URL"), /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-mono pp-ellipsis" }, finalUrl || "\uFF08\u672A\u586B\u5199\uFF09")), /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, "\u73AF\u5883"), /* @__PURE__ */ (0, import_react.createElement)("td", null, env ? env.name : "\uFF08\u65E0\u73AF\u5883\uFF09")), /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, "\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("td", null, varRefs.length ? varRefs.join("\u3001") + (missingVars.length ? "\uFF08\u672A\u5B9A\u4E49\uFF1A" + missingVars.join("\u3001") + "\uFF09" : "\uFF08\u5747\u5DF2\u5B9A\u4E49\uFF09") : "\u65E0")), /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, "\u5DF2\u542F\u7528\u53C2\u6570"), /* @__PURE__ */ (0, import_react.createElement)("td", null, draft.params.filter((p) => p && p.enabled !== false && p.key).length, " \u4E2A Query / ", draft.pathParams.filter((p) => p && p.enabled !== false && p.key).length, " \u4E2A Path")), /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, "\u5DF2\u542F\u7528\u8BF7\u6C42\u5934"), /* @__PURE__ */ (0, import_react.createElement)("td", null, draft.headers.filter((h) => h && h.enabled !== false && h.key).length, " \u4E2A"))))) : null, tab === "db" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "\u6570\u636E\u5E93\u8FDE\u63A5"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-link", onClick: dbTest, disabled: dbBusy }, "\u6D4B\u8BD5\u8FDE\u63A5")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9A71\u52A8"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: dbConfig.type, onChange: (e) => dbPatch("type", e.target.value) }, DB_TYPES.map((t) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: t.id, value: t.id }, t.label)))), dbConfig.type === "sqlite" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u6587\u4EF6\u8DEF\u5F84"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { flex: 1 },
      value: dbConfig.path,
      placeholder: "/path/to/data.db \u6216 :memory:",
      onChange: (e) => dbPatch("path", e.target.value)
    }
  )) : /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note" }, "\u5F53\u524D\u4EC5\u5185\u7F6E SQLite \u9A71\u52A8\uFF08node:sqlite\uFF09\uFF1BMySQL / PostgreSQL \u9700\u72EC\u7ACB\u9A71\u52A8\u5305\uFF0C\u6D4B\u8BD5\u8FDE\u63A5\u4F1A\u660E\u786E\u62A5\u9519\u3002"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4E3B\u673A"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: dbConfig.host, onChange: (e) => dbPatch("host", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7AEF\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-sm", style: { flex: 1, maxWidth: 120 }, value: dbConfig.port, onChange: (e) => dbPatch("port", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7528\u6237\u540D"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", style: { flex: 1 }, value: dbConfig.user, onChange: (e) => dbPatch("user", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5BC6\u7801"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", type: "password", style: { flex: 1 }, value: dbConfig.password, onChange: (e) => dbPatch("password", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u6570\u636E\u5E93"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", style: { flex: 1 }, value: dbConfig.database, onChange: (e) => dbPatch("database", e.target.value) }))), dbConnections.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5DF2\u5B58\u8FDE\u63A5"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: "", onChange: (e) => dbLoad(e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\u9009\u62E9\u5DF2\u4FDD\u5B58\u7684\u8FDE\u63A5\u2026"), dbConnections.map((c) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: c.name, value: c.name }, c.name))), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-link", onClick: () => dbSave() }, "\u4FDD\u5B58\u5F53\u524D"), dbConnections.map((c) => /* @__PURE__ */ (0, import_react.createElement)("button", { key: c.name, className: "pp-btn pp-btn-link", onClick: () => dbDelete(c.name), title: "\u5220\u9664\u8BE5\u8FDE\u63A5" }, "\u2715 ", c.name))) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-link", onClick: dbSave }, "\u4FDD\u5B58\u8FDE\u63A5\u5230\u9879\u76EE")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-group-title" }, "SQL \u6267\u884C"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: dbRun, disabled: dbBusy || !String(dbSql || "").trim() }, dbBusy ? "\u6267\u884C\u4E2D\u2026" : "\u6267\u884C")), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-input pp-input-mono",
      style: { width: "100%", minHeight: 72, fontFamily: "var(--font-mono, monospace)" },
      value: dbSql,
      onChange: (e) => setDbSql(e.target.value),
      placeholder: "SELECT * FROM users LIMIT 10"
    }
  ), dbHint ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note " + (dbHint.indexOf("\u8FDE\u63A5\u6210\u529F") === 0 || dbHint.indexOf("\u5DF2\u4FDD\u5B58") === 0 ? "pp-note-ok" : "pp-note-bad") }, dbHint) : null, dbResult && Array.isArray(dbResult.rows) ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-group-title" }, "\u7ED3\u679C\uFF08", dbResult.rowCount, " \u884C", dbResult.truncated ? "\uFF0C\u8D85\u8FC7 1000 \u884C\u5DF2\u622A\u65AD" : "", "\uFF09"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, dbResult.rows.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\uFF08\u65E0\u8FD4\u56DE\u884C\uFF09") : /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, dbResult.columns.map((c) => /* @__PURE__ */ (0, import_react.createElement)("th", { key: c }, c)))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, dbResult.rows.map((row, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, dbResult.columns.map((c) => /* @__PURE__ */ (0, import_react.createElement)("td", { key: c, className: "pp-mono" }, row && row[c] != null ? String(row[c]) : "")))))))) : null, dbResult && dbResult.changes !== void 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, "\u5DF2\u6267\u884C\uFF1A\u5F71\u54CD ", dbResult.changes, " \u884C", dbResult.lastInsertRowid != null ? "\uFF0ClastInsertRowid=" + dbResult.lastInsertRowid : "") : null) : null, tab === "auth" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7C7B\u578B"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: draft.auth.type, onChange: (e) => patchAuth("type", e.target.value) }, AUTH_TYPES.map((t) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: t, value: t }, AUTH_LABEL2[t] || t)))), draft.auth.type === "bearer" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Token"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.token, onChange: (e) => patchAuth("token", e.target.value) })) : null, draft.auth.type === "basic" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7528\u6237\u540D"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.username, onChange: (e) => patchAuth("username", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5BC6\u7801"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.password, onChange: (e) => patchAuth("password", e.target.value) }))) : null, draft.auth.type === "apikey" ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Key"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.key, onChange: (e) => patchAuth("key", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Value"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", style: { flex: 1 }, value: draft.auth.value, onChange: (e) => patchAuth("value", e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4F4D\u7F6E"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: draft.auth.addTo, onChange: (e) => patchAuth("addTo", e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "header" }, "header"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "query" }, "query")))) : null, draft.auth.type === "none" ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u65E0\u8BA4\u8BC1") : null) : null), wsMode ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      style: { flex: 1 },
      placeholder: wsState.status === "open" ? "\u8F93\u5165\u8981\u53D1\u9001\u7684\u6D88\u606F\u2026" : "\u8FDE\u63A5\u5EFA\u7ACB\u540E\u53EF\u53D1\u9001\u6D88\u606F",
      value: wsInput,
      disabled: wsState.status !== "open",
      onChange: (e) => setWsInput(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && wsState.status === "open") wsSend();
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: wsSend, disabled: wsState.status !== "open" || wsInput === "" }, "\u53D1\u9001\u6D88\u606F")) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      style: { flex: 1 },
      placeholder: "\u63A5\u53E3\u540D\u79F0",
      value: draft.name,
      onChange: (e) => patch("name", e.target.value)
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: saveAsEndpoint }, "\u4FDD\u5B58\u4E3A\u63A5\u53E3"), savedHint ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-note " + (savedHint.indexOf("\u5DF2\u4FDD\u5B58") === 0 || savedHint.indexOf("\u5DF2\u590D\u5236") === 0 ? "pp-note-ok" : "pp-note-bad") }, savedHint) : null)), wsMode ? wsPanel : responsePanel));
}

// src/client/pages/mock.jsx
var import_react11 = require("react");
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
  const rootRef = (0, import_react11.useRef)(null);
  (0, import_react11.useEffect)(() => applyTheme(rootRef.current), []);
  const apiRef = resolveApi3() || api;
  const [project, setProject] = (0, import_react11.useState)(MOCK_PROJECT4);
  const [projects, setProjects] = (0, import_react11.useState)([]);
  const [projectId, setProjectId] = (0, import_react11.useState)("");
  const [isMock, setIsMock] = (0, import_react11.useState)(true);
  const [error, setError] = (0, import_react11.useState)("");
  const [notice, setNotice] = (0, import_react11.useState)("");
  const [currentId, setCurrentId] = (0, import_react11.useState)(MOCK_PROJECT4.endpoints[0].id);
  const [delayMs, setDelayMs] = (0, import_react11.useState)(MOCK_PROJECT4.endpoints[0].mock.delayMs);
  const [rules, setRules] = (0, import_react11.useState)(MOCK_PROJECT4.endpoints[0].mock.rules);
  const [mockEnabled, setMockEnabled] = (0, import_react11.useState)(MOCK_PROJECT4.endpoints[0].mock.enabled);
  const [service, setService] = (0, import_react11.useState)({ running: false, port: 4010 });
  const [busy, setBusy] = (0, import_react11.useState)(false);
  const endpoints = (0, import_react11.useMemo)(() => Array.isArray(project && project.endpoints) ? project.endpoints : [], [project]);
  const current = (0, import_react11.useMemo)(() => endpoints.find((e) => e.id === currentId) || endpoints[0] || null, [endpoints, currentId]);
  const port = project && project.settings && project.settings.mockPort || 4010;
  const loadProject = (id) => {
    const storage = apiRef && apiRef.storage;
    if (!storage || typeof storage.getProject !== "function") return Promise.resolve();
    return Promise.resolve().then(() => storage.getProject(id)).then((data) => {
      if (!data) return;
      setProject(data);
      setIsMock(false);
      const list = Array.isArray(data.endpoints) ? data.endpoints : [];
      const first = list[0] || null;
      setCurrentId(first ? first.id : "");
      setRules(first && first.mock && Array.isArray(first.mock.rules) ? first.mock.rules : []);
      setDelayMs(first && first.mock ? first.mock.delayMs || 0 : 0);
      setMockEnabled(Boolean(first && first.mock && first.mock.enabled));
    }).catch((err) => {
      setError("\u8BFB\u53D6\u9879\u76EE\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
    });
  };
  (0, import_react11.useEffect)(() => {
    const storage = apiRef && apiRef.storage;
    let cancelled = false;
    if (storage && typeof storage.listProjects === "function" && typeof storage.getProject === "function") {
      Promise.resolve().then(() => storage.listProjects()).then((list) => {
        if (!cancelled && Array.isArray(list)) setProjects(list);
        const first = Array.isArray(list) && list.length ? list[0] : null;
        if (!cancelled && first) setProjectId(first.id);
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
  const urls = (0, import_react11.useMemo)(() => hitUrls(project && project.id, current, service.port || port), [project, current, service.port, port]);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "mock", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "Mock"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: projectId,
      onChange: (e) => {
        setProjectId(e.target.value);
        loadProject(e.target.value);
      }
    },
    (projects.length ? projects : [{ id: project && project.id || "", name: project && project.name || "\u793A\u4F8B\u9879\u76EE" }]).map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill" }, service.running ? "\u8FD0\u884C\u4E2D" : "\u5DF2\u505C\u6B62"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-primary", onClick: startService, disabled: busy || service.running }, "\u542F\u52A8"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: stopService, disabled: busy || !service.running }, "\u505C\u6B62"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 window.__postapiApi \u672A\u6CE8\u5165\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Apostapi.storage + postapi.mock"), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-mock-layout" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-panel", "aria-label": "\u63A5\u53E3\u5217\u8868" }, /* @__PURE__ */ (0, import_react.createElement)(
    FolderTree,
    {
      project,
      activeEndpointId: currentId,
      collapsed: {},
      onPick: (id) => {
        const ep = endpoints.find((e) => e.id === id);
        if (ep) selectEndpoint(ep);
      }
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-mock-side" }, /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, current ? current.name : "\u672A\u9009\u62E9\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid", style: { marginBottom: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u542F\u7528 Mock"), /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: mockEnabled, onChange: (e) => setMockEnabled(e.target.checked) }), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5EF6\u8FDF (ms)"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      value: String(delayMs),
      onChange: (e) => setDelayMs(e.target.value.replace(/[^0-9]/g, ""))
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u5B57\u6BB5\u89C4\u5219"), rules.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u5C1A\u65E0\u89C4\u5219\uFF1B\u672A\u547D\u4E2D\u89C4\u5219\u65F6\u56DE\u843D\u9ED8\u8BA4\u54CD\u5E94") : null, rules.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-mock-rules" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u542F\u7528"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u5B57\u6BB5"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u89C4\u5219"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u503C"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, rules.map((rule, index) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: index }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: rule.enabled !== false, onChange: (e) => patchRule(index, "enabled", e.target.checked) })), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      value: rule.field || "",
      placeholder: "data.items[0].id",
      onChange: (e) => patchRule(index, "field", e.target.value)
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select pp-input-sm", value: rule.rule || "fixed", onChange: (e) => patchRule(index, "rule", e.target.value) }, RULES.map((r) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: r, value: r }, RULE_LABEL[r] || r)))), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      value: rule.value || "",
      onChange: (e) => patchRule(index, "value", e.target.value)
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-row-actions" }, /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-icon-btn",
      title: "\u5220\u9664\u8BE5\u89C4\u5219",
      "aria-label": "\u5220\u9664\u8BE5\u89C4\u5219",
      onClick: () => setRules(rules.filter((_, i) => i !== index))
    },
    "\u2715"
  )))))))) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-2)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => setRules(rules.concat([blankRule(current && current.id)])) }, "+ \u6DFB\u52A0\u89C4\u5219"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-primary", onClick: persist, disabled: busy }, "\u4FDD\u5B58\u914D\u7F6E"))), /* @__PURE__ */ (0, import_react.createElement)("section", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u672C\u5730 Mock \u670D\u52A1"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u7AEF\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-mono" }, service.port || port)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u547D\u4E2D\u5730\u5740"), urls.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta" }, "\u9009\u62E9\u63A5\u53E3\u540E\u663E\u793A\u547D\u4E2D\u5730\u5740") : urls.map((u) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: u, className: "pp-toolbar-inline", style: { marginBottom: "var(--sp-1)" } }, /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre", style: { margin: 0, flex: 1, minWidth: 0 } }, u), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-ghost",
      title: "\u590D\u5236\u547D\u4E2D\u5730\u5740",
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(u);
          setNotice("\u5DF2\u590D\u5236\u547D\u4E2D\u5730\u5740");
        } catch (err) {
          setError("\u590D\u5236\u5931\u8D25\uFF1A" + (err && err.message ? err.message : String(err)));
        }
      }
    },
    "\u590D\u5236"
  ))), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-meta", style: { marginTop: "var(--sp-2)" } }, "\u89C4\u5219\u4F18\u5148\u7EA7\uFF1A\u5B57\u6BB5\u89C4\u5219 \u2192 \u9ED8\u8BA4\u54CD\u5E94\uFF08isDefault\uFF09\u2192 200 ", "{}"))))));
}

// src/client/pages/schema.jsx
var import_react12 = __toESM(require("react"), 1);
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
function errText3(err) {
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
  const rootRef = (0, import_react12.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const route = props && props.route || {};
  const [projects, setProjects] = (0, import_react12.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react12.useState)("proj_demo01");
  const [schemas, setSchemas] = (0, import_react12.useState)(MOCK_SCHEMAS);
  const [isMock, setIsMock] = (0, import_react12.useState)(true);
  const [error, setError] = (0, import_react12.useState)("");
  const [notice, setNotice] = (0, import_react12.useState)("");
  const [currentId, setCurrentId] = (0, import_react12.useState)("");
  const [name, setName] = (0, import_react12.useState)("");
  const [description, setDescription] = (0, import_react12.useState)("");
  const [text, setText] = (0, import_react12.useState)(toText(MOCK_SCHEMAS[0].jsonSchema));
  const [checkResult, setCheckResult] = (0, import_react12.useState)(null);
  const [example, setExample] = (0, import_react12.useState)("");
  (0, import_react12.useEffect)(() => applyTheme(rootRef.current), []);
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
      setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText3(err));
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
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText3(err));
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
        setError("api.schema.validate \u8C03\u7528\u5931\u8D25\uFF1A" + errText3(err));
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
        setError("api.schema.example \u8C03\u7528\u5931\u8D25\uFF1A" + errText3(err));
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
      setError("\u4FDD\u5B58\u6A21\u578B\u5931\u8D25\uFF1A" + errText3(err));
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
      setError("\u5220\u9664\u6A21\u578B\u5931\u8D25\uFF1A" + errText3(err));
    }
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "schema", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u6570\u636E\u6A21\u578B"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-meta" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
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
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08saveSchema / deleteSchema\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-schema-layout" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-panel", "aria-label": "\u6A21\u578B\u5217\u8868" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-side-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-card-title" }, "\u6A21\u578B")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree" }, schemas.map((s) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: s.id, className: "pp-tree-row", "data-active": s.id === currentId, onClick: () => pick(s) }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, s.name || s.id)))), schemas.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u6A21\u578B", hint: "\u70B9\u4E0B\u65B9\u300C\u65B0\u5EFA\u6A21\u578B\u300D\u521B\u5EFA\u6570\u636E\u6A21\u578B" }) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent", onClick: blank }, "\u65B0\u5EFA\u6A21\u578B"), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent",
      disabled: !currentId,
      title: currentId ? "\u4EE5\u5F53\u524D\u6A21\u578B\u4E3A\u5E95\u7A3F\u65B0\u5EFA" : "\u5148\u9009\u4E2D\u4E00\u4E2A\u6A21\u578B",
      onClick: () => {
        const src = schemas.find((s) => s.id === currentId);
        setName((src && src.name || "\u6A21\u578B") + " \u526F\u672C");
        setText(toText(src && src.jsonSchema));
        setCheckResult(null);
        setNotice("\u5DF2\u590D\u5236\u4E3A\u672A\u4FDD\u5B58\u526F\u672C\uFF1A\u7F16\u8F91\u540D\u79F0\u540E\u70B9\u300C\u4FDD\u5B58\u300D");
      }
    },
    "\u590D\u5236"
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-schema-main" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u7F16\u8F91"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid", style: { marginBottom: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", value: name, onChange: (e) => setName(e.target.value) }), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8BF4\u660E"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input", value: description, onChange: (e) => setDescription(e.target.value) })), /* @__PURE__ */ (0, import_react.createElement)(
    JsonEditor,
    {
      value: text,
      rows: 8,
      placeholder: '{ "type": "object" }',
      onChange: (v) => {
        setText(v);
        setCheckResult(null);
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: validate }, "\u6821\u9A8C"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: makeExample }, "\u751F\u6210\u793A\u4F8B"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-primary", onClick: save }, "\u4FDD\u5B58"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-danger", style: { marginLeft: "auto" }, onClick: remove }, "\u5220\u9664")), checkResult ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: checkResult.ok ? "pp-note pp-note-ok" : "pp-note pp-note-bad", style: { marginTop: "var(--sp-3)" } }, checkResult.ok ? "\u901A\u8FC7\uFF1A" : "\u5931\u8D25\uFF1A", checkResult.message) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u793A\u4F8B\u6570\u636E"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll" }, example || "\uFF08\u70B9\u300C\u751F\u6210\u793A\u4F8B\u300D\u6309\u5F53\u524D JSON Schema \u751F\u6210\uFF09"))))));
}
function safeParse(text) {
  try {
    return JSON.parse(String(text || "{}"));
  } catch {
    return null;
  }
}

// src/client/pages/env.jsx
var import_react13 = __toESM(require("react"), 1);
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
var ENV_TABS = [
  { id: "env", label: "\u73AF\u5883\u53D8\u91CF" },
  { id: "globals", label: "\u5168\u5C40\u53D8\u91CF" },
  { id: "priority", label: "\u4F18\u5148\u7EA7" }
];
var PRIORITY_ROWS = [
  { level: "1\uFF08\u6700\u9AD8\uFF09", scope: "\u63A5\u53E3\u5C40\u90E8\u53D8\u91CF", note: "params / headers / body \u91CC\u5199\u6B7B\u7684\u503C" },
  { level: "2", scope: "\u73AF\u5883\u53D8\u91CF", note: "\u5F53\u524D\u73AF\u5883 enabled \u7684\u53D8\u91CF" },
  { level: "3", scope: "\u5168\u5C40\u53D8\u91CF", note: "\u8DE8\u73AF\u5883\u5171\u7528" },
  { level: "4\uFF08\u6700\u4F4E\uFF09", scope: "\u52A8\u6001\u53D8\u91CF", note: "{{$timestamp}} \u7B49\u5185\u7F6E\u53D8\u91CF" }
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
function errText4(err) {
  return err && err.message ? err.message : String(err);
}
function blankEnv() {
  return { name: "\u65B0\u73AF\u5883", baseUrl: "", isDefault: false, variables: [] };
}
function EnvPage(props) {
  const rootRef = (0, import_react13.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react13.useState)([{ id: MOCK_PROJECT5.id, name: MOCK_PROJECT5.name }]);
  const [projectId, setProjectId] = (0, import_react13.useState)(MOCK_PROJECT5.id);
  const [project, setProject] = (0, import_react13.useState)(MOCK_PROJECT5);
  const [isMock, setIsMock] = (0, import_react13.useState)(true);
  const [error, setError] = (0, import_react13.useState)("");
  const [notice, setNotice] = (0, import_react13.useState)("");
  const [draft, setDraft] = (0, import_react13.useState)(MOCK_PROJECT5.environments[0]);
  const [globals, setGlobals] = (0, import_react13.useState)(normalizeVars(MOCK_PROJECT5.globals.variables));
  const [envTab, setEnvTab] = (0, import_react13.useState)("env");
  (0, import_react13.useEffect)(() => applyTheme(rootRef.current), []);
  const loadProject = async (id, keepId) => {
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
        const prevId = keepId !== void 0 ? keepId : draft && draft.id;
        setDraft(envs2.find((e) => e.id === prevId) || (envs2.length > 0 ? envs2[0] : blankEnv()));
        setGlobals(normalizeVars(loaded.globals && loaded.globals.variables));
        setIsMock(false);
      }
    } catch (err) {
      setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText4(err));
    }
  };
  (0, import_react13.useEffect)(() => {
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
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText4(err));
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
      await loadProject(projectId, payload.id);
    } catch (err) {
      setError("\u4FDD\u5B58\u73AF\u5883\u5931\u8D25\uFF1A" + errText4(err));
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
      setError("\u5220\u9664\u73AF\u5883\u5931\u8D25\uFF1A" + errText4(err));
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
      setError("\u4FDD\u5B58\u5168\u5C40\u53D8\u91CF\u5931\u8D25\uFF1A" + errText4(err));
    }
  };
  const draftVars = normalizeVars(draft.variables);
  const varTable2 = (rows, onChange, onRemove) => /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-vars" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, VAR_COLUMNS.map((c) => /* @__PURE__ */ (0, import_react.createElement)("th", { key: c }, c)))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, rows.map((v, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      style: { width: "100%" },
      value: v.key,
      onChange: (e) => onChange(i, { key: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      style: { width: "100%" },
      type: v.secret ? "password" : "text",
      value: v.value,
      onChange: (e) => onChange(i, { value: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: v.enabled, onChange: (e) => onChange(i, { enabled: e.target.checked }) })), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("input", { type: "checkbox", checked: v.secret, onChange: (e) => onChange(i, { secret: e.target.checked }) })), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger pp-icon-btn", onClick: () => onRemove(i), title: "\u5220\u9664\u8BE5\u53D8\u91CF", "aria-label": "\u5220\u9664\u8BE5\u53D8\u91CF" }, "\xD7")))), rows.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: VAR_COLUMNS.length, className: "pp-env-vars-empty" }, "\u6682\u65E0\u53D8\u91CF\uFF0C\u70B9\u4E0B\u65B9\u300C+ \u53D8\u91CF\u300D\u6DFB\u52A0")) : null));
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "env", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u73AF\u5883\u4E0E\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-meta" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
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
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08saveEnvironment / saveGlobals\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-layout" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-panel pp-env-side", "aria-label": "\u73AF\u5883\u5217\u8868" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-side-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-card-title" }, "\u73AF\u5883"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent", onClick: () => pickEnv(blankEnv()) }, "+ \u65B0\u5EFA"), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent",
      title: "\u4EE5\u5F53\u524D\u73AF\u5883\u4E3A\u5E95\u7A3F\u65B0\u5EFA",
      onClick: () => pickEnv({ ...draft, id: "", name: (draft.name || "\u73AF\u5883") + " \u526F\u672C", isDefault: false })
    },
    "\u590D\u5236"
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree" }, envSummary(envs).map((e) => /* @__PURE__ */ (0, import_react.createElement)(
    "div",
    {
      key: e.id,
      className: "pp-tree-row",
      "data-active": draft && draft.id === e.id ? "true" : "false",
      onClick: () => pickEnv(envs.find((x) => x.id === e.id) || blankEnv())
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, e.name, e.isDefault ? " \xB7 \u9ED8\u8BA4" : ""),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-tree-row-count" }, e.varCount)
  ))), envs.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u73AF\u5883", hint: "\u5728\u53F3\u4FA7\u586B\u5199\u540D\u79F0\u4E0E\u524D\u7F6E URL \u540E\u70B9\u300C\u4FDD\u5B58\u73AF\u5883\u300D" }) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-main" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, ENV_TABS.map((t) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: t.id,
      className: "pp-tab",
      "data-active": envTab === t.id ? "true" : "false",
      onClick: () => setEnvTab(t.id)
    },
    t.label
  ))), envTab === "env" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-fields" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-field" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-field-row" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      value: draft.name || "",
      onChange: (e) => patchDraft({ name: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-env-check" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      type: "checkbox",
      checked: draft.isDefault === true,
      onChange: (e) => patchDraft({ isDefault: e.target.checked })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", null, "\u8BBE\u4E3A\u9ED8\u8BA4")))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-field" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u524D\u7F6E URL"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      value: draft.baseUrl || "",
      placeholder: "https://api.example.com\uFF08\u672B\u5C3E\u4E0D\u52A0\u659C\u6760\uFF09",
      onChange: (e) => patchDraft({ baseUrl: e.target.value })
    }
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u73AF\u5883\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, varTable2(draftVars, setVarAt, removeVar)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: addVar }, "+ \u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-primary", onClick: saveEnv }, "\u4FDD\u5B58\u73AF\u5883"), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-danger",
      style: { marginLeft: "auto" },
      disabled: !draft.id,
      title: draft.id ? "" : "\u8BE5\u73AF\u5883\u5C1A\u672A\u4FDD\u5B58\uFF0C\u65E0\u9700\u5220\u9664",
      onClick: () => {
        if (draft.id) removeEnv(draft.id);
      }
    },
    "\u5220\u9664\u73AF\u5883"
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginTop: "var(--sp-2)" } }, "\u4EC5\u542F\u7528\u7684\u53D8\u91CF\u53C2\u4E0E ", "{{key}}", " \u66FF\u6362\uFF1B\u5BC6\u94A5\u53D8\u91CF\u4EE5\u5BC6\u7801\u663E\u793A")) : null, envTab === "globals" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u5168\u5C40\u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, varTable2(globals, setGlobalAt, removeGlobal)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: addGlobal }, "+ \u53D8\u91CF"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-primary", onClick: saveGlobals }, "\u4FDD\u5B58\u5168\u5C40")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginTop: "var(--sp-2)" } }, "\u8DE8\u73AF\u5883\u5171\u7528\uFF1B\u4E0E\u540C\u540D\u73AF\u5883\u53D8\u91CF\u5E76\u5B58\u65F6\u73AF\u5883\u4F18\u5148")) : null, envTab === "priority" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-env-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u53D8\u91CF\u4F18\u5148\u7EA7"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-priority-list" }, priorityRows().map((r, i) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: r.level, className: "pp-priority-item" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-priority-level" }, i + 1), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-priority-body" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-priority-scope" }, r.scope), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-priority-note" }, r.note))))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginTop: "var(--sp-3)" } }, "\u540C\u540D\u53D8\u91CF\u6309\u6B64\u987A\u5E8F\u53D6\u7B2C\u4E00\u4E2A\u547D\u4E2D\u7684\u503C\uFF1B\u8D8A\u9760\u4E0A\u4F18\u5148\u7EA7\u8D8A\u9AD8")) : null))));
}

// src/client/pages/history.jsx
var import_react14 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["history", HistoryPage]);
var REPLAY_KEY2 = "postapi.debug.replay";
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
function statusTone(status) {
  const s = Number(status);
  if (s >= 200 && s < 300) return "success";
  if (s >= 400 && s < 500) return "warning";
  return "error";
}
function pillClass(tone) {
  if (tone === "success") return "pp-pill pp-pill-ok";
  if (tone === "warning") return "pp-pill pp-pill-warn";
  return "pp-pill pp-pill-bad";
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
function errText5(err) {
  return err && err.message ? err.message : String(err);
}
function HistoryPage(props) {
  const rootRef = (0, import_react14.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react14.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react14.useState)("proj_demo01");
  const [entries, setEntries] = (0, import_react14.useState)(MOCK_ENTRIES);
  const [isMock, setIsMock] = (0, import_react14.useState)(true);
  const [error, setError] = (0, import_react14.useState)("");
  const [notice, setNotice] = (0, import_react14.useState)("");
  const [detailId, setDetailId] = (0, import_react14.useState)("");
  const [pendingClear, setPendingClear] = (0, import_react14.useState)(false);
  const [filterStatus, setFilterStatus] = (0, import_react14.useState)("");
  const [filterMethod, setFilterMethod] = (0, import_react14.useState)("");
  const [filterText, setFilterText] = (0, import_react14.useState)("");
  (0, import_react14.useEffect)(() => applyTheme(rootRef.current), []);
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
      setError("\u52A0\u8F7D\u5386\u53F2\u5931\u8D25\uFF1A" + errText5(err));
    }
  };
  (0, import_react14.useEffect)(() => {
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
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText5(err));
        }
      }
      setIsMock(true);
    };
    boot();
  }, []);
  const replay = (entry) => {
    try {
      localStorage.setItem(REPLAY_KEY2, JSON.stringify(replayPayload(entry)));
      setNotice("\u5DF2\u5199\u5165\u56DE\u653E\u5FEB\u7167\uFF08" + REPLAY_KEY2 + "\uFF09\uFF0C\u5207\u5230\u8C03\u8BD5\u9875\u540E\u6309\u6B64\u5FEB\u7167\u91CD\u53D1");
    } catch (err) {
      setError("\u5199\u5165\u56DE\u653E\u5FEB\u7167\u5931\u8D25\uFF1A" + errText5(err));
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
      setError("\u6E05\u7A7A\u5386\u53F2\u5931\u8D25\uFF1A" + errText5(err));
    }
  };
  const detail = entries.find((e) => e.id === detailId);
  const filtered = entries.filter((e) => {
    if (filterStatus) {
      const seg = String(e.status).charAt(0) + "xx";
      if (seg !== filterStatus) return false;
    }
    if (filterMethod && String(e.method || "").toUpperCase() !== filterMethod) return false;
    if (filterText && String(e.url || "").toLowerCase().indexOf(filterText.toLowerCase()) < 0) return false;
    return true;
  });
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "history", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u8BF7\u6C42\u5386\u53F2"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-meta" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
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
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => load(projectId) }, "\u5237\u65B0"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-danger", onClick: clear }, pendingClear ? "\u786E\u8BA4\u6E05\u7A7A" : "\u6E05\u7A7A\u5386\u53F2"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select pp-input-sm", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), "aria-label": "\u6309\u72B6\u6001\u7B5B\u9009" }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\u5168\u90E8\u72B6\u6001"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "2xx" }, "2xx"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "3xx" }, "3xx"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "4xx" }, "4xx"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "5xx" }, "5xx")), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select pp-input-sm", value: filterMethod, onChange: (e) => setFilterMethod(e.target.value), "aria-label": "\u6309\u65B9\u6CD5\u7B5B\u9009" }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\u5168\u90E8\u65B9\u6CD5"), ["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: m, value: m }, m))), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm",
      style: { width: "180px" },
      placeholder: "\u6309 URL \u8FC7\u6EE4",
      value: filterText,
      onChange: (e) => setFilterText(e.target.value)
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-toolbar-spacer" }), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage.getHistory \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08getHistory / clearHistory\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-wide" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "150px" } }, "\u65F6\u95F4"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "80px" } }, "\u65B9\u6CD5"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "URL"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "70px" } }, "\u72B6\u6001"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "80px" } }, "\u8017\u65F6"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "90px" } }, "\u5927\u5C0F"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "120px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, filtered.map((e) => /* @__PURE__ */ (0, import_react.createElement)(
    "tr",
    {
      key: e.id,
      "data-active": detailId === e.id ? "true" : "false",
      "data-clickable": "true",
      onClick: () => setDetailId(detailId === e.id ? "" : e.id)
    },
    /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, fmtDateTime(e.at)),
    /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": e.method }, e.method)),
    /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-table-mono pp-cell-clip", title: e.url }, e.url),
    /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: pillClass(statusTone(e.status)) }, e.status)),
    /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, e.timeMs, " ms"),
    /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, fmtSize(e.bodySize)),
    /* @__PURE__ */ (0, import_react.createElement)("td", { onClick: (ev) => ev.stopPropagation() }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-row-actions" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => setDetailId(detailId === e.id ? "" : e.id) }, "\u8BE6\u60C5"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => replay(e) }, "\u56DE\u653E")))
  )), filtered.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 7, className: "pp-muted pp-table-empty" }, "\u6682\u65E0\u5386\u53F2\u8BB0\u5F55\uFF0C\u5728\u8C03\u8BD5\u9875\u53D1\u9001\u8BF7\u6C42\u540E\u81EA\u52A8\u8BB0\u5F55")) : null)))), detail ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u8BE6\u60C5 \xB7 ", detail.id), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u72B6\u6001"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: pillClass(statusTone(detail.status)) }, detail.status), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u8017\u65F6 ", detail.timeMs, " ms"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u5927\u5C0F ", fmtSize(detail.bodySize))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginTop: "var(--sp-2)" } }, "\u8BF7\u6C42"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll" }, JSON.stringify(detail.request || {}, null, 2)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginTop: "var(--sp-2)" } }, "\u54CD\u5E94"), /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll" }, JSON.stringify(detail.response || {}, null, 2))) : null));
}

// src/client/pages/test.jsx
var import_react15 = __toESM(require("react"), 1);
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
function errText6(err) {
  return err && err.message ? err.message : String(err);
}
function TestPage(props) {
  const rootRef = (0, import_react15.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react15.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react15.useState)("proj_demo01");
  const [project, setProject] = (0, import_react15.useState)({ endpoints: [] });
  const [cases, setCases] = (0, import_react15.useState)(MOCK_CASES);
  const [scenarios, setScenarios] = (0, import_react15.useState)(MOCK_SCENARIOS);
  const [isMock, setIsMock] = (0, import_react15.useState)(true);
  const [error, setError] = (0, import_react15.useState)("");
  const [notice, setNotice] = (0, import_react15.useState)("");
  const [tab, setTab] = (0, import_react15.useState)("cases");
  const [activeCaseId, setActiveCaseId] = (0, import_react15.useState)(MOCK_CASES[0].id);
  const [activeScenarioId, setActiveScenarioId] = (0, import_react15.useState)(MOCK_SCENARIOS[0].id);
  const [result, setResult] = (0, import_react15.useState)(null);
  const [running, setRunning] = (0, import_react15.useState)(false);
  (0, import_react15.useEffect)(() => applyTheme(rootRef.current), []);
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
      setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText6(err));
    }
  };
  (0, import_react15.useEffect)(() => {
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
          setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText6(err));
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
  const addCase = () => {
    const c = {
      id: "tc_" + Date.now().toString(36),
      name: "\u65B0\u7528\u4F8B",
      endpointId: endpoints[0] && endpoints[0].id || "",
      assertions: [],
      extractors: []
    };
    setCases(cases.concat([c]));
    setActiveCaseId(c.id);
    setResult(null);
    setNotice("\u5DF2\u65B0\u5EFA\u7528\u4F8B\uFF08\u672A\u4FDD\u5B58\uFF09\uFF1A\u70B9\u9875\u5934\u300C\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\u300D\u843D\u76D8");
  };
  const addScenario = () => {
    const s = {
      id: "ts_" + Date.now().toString(36),
      name: "\u65B0\u573A\u666F",
      steps: []
    };
    setScenarios(scenarios.concat([s]));
    setActiveScenarioId(s.id);
    setResult(null);
    setNotice("\u5DF2\u65B0\u5EFA\u573A\u666F\uFF08\u672A\u4FDD\u5B58\uFF09\uFF1A\u70B9\u9875\u5934\u300C\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\u300D\u843D\u76D8");
  };
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
      setError("\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\u5931\u8D25\uFF1A" + errText6(err));
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
      setError("\u8FD0\u884C\u7528\u4F8B\u5931\u8D25\uFF1A" + errText6(err));
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
      setError("\u8FD0\u884C\u573A\u666F\u5931\u8D25\uFF1A" + errText6(err));
    } finally {
      setRunning(false);
    }
  };
  const caseAssertions = normalizeAssertions(activeCase && activeCase.assertions);
  const resultPanel = (emptyHint) => /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u8FD0\u884C\u7ED3\u679C"), result ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: result.passed ? "pp-pill pp-pill-ok" : "pp-pill pp-pill-bad" }, result.passed ? "\u901A\u8FC7" : "\u5931\u8D25"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, result.passedCount, "/", result.total), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, result.durationMs, " ms")), result.error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, result.error) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-list", style: { marginTop: "var(--sp-2)" } }, result.rows.map((r, i) => /* @__PURE__ */ (0, import_react.createElement)("div", { key: i, className: "pp-result-row" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, r.name || r.id || "-"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta pp-ellipsis" }, r.error || "-"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: r.passed ? "pp-pill pp-pill-ok" : "pp-pill pp-pill-bad" }, r.passed ? "\u901A\u8FC7" : "\u5931\u8D25"))), result.rows.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-result-row pp-meta" }, "\u65E0\u65AD\u8A00\u7ED3\u679C") : null)) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: emptyHint }));
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "test", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u81EA\u52A8\u5316\u6D4B\u8BD5"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-meta" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
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
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: persist }, "\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage.getProject\uFF08\u7528\u4F8B\u4E0E\u573A\u666F\u5B58 project.settings.testCases / testScenarios\uFF09\uFF1B\u8FD0\u884C\u8D70 api.test.runCase / runScenario")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-test-tabs" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": tab === "cases" ? "true" : "false", onClick: () => setTab("cases") }, "\u6D4B\u8BD5\u7528\u4F8B"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-tab", "data-active": tab === "scenarios" ? "true" : "false", onClick: () => setTab("scenarios") }, "\u6D4B\u8BD5\u573A\u666F"))), tab === "cases" ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-card-title" }, "\u7528\u4F8B"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent", onClick: addCase }, "+ \u65B0\u5EFA\u7528\u4F8B")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree" }, cases.map((c) => /* @__PURE__ */ (0, import_react.createElement)(
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
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, c.name || c.id)
  ))), cases.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u7528\u4F8B", hint: "\u70B9\u53F3\u4E0A\u300C+ \u65B0\u5EFA\u7528\u4F8B\u300D\uFF0C\u6216\u5728\u8C03\u8BD5\u9875\u4FDD\u5B58\u63A5\u53E3\u540E\u300C\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\u300D" }) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-test-main" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u65AD\u8A00"), activeCase ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid", style: { marginBottom: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u540D\u79F0"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      value: activeCase.name || "",
      onChange: (e) => patchCase({ name: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select",
      value: activeCase.endpointId || "",
      onChange: (e) => patchCase({ endpointId: e.target.value })
    },
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u672A\u7ED1\u5B9A\uFF09"),
    endpoints.map((ep) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: ep.id, value: ep.id }, ep.method, " ", ep.url))
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-wide" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "88px" } }, "\u6765\u6E90"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u8DEF\u5F84"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "96px" } }, "\u64CD\u4F5C\u7B26"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u671F\u671B\u503C"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u8BF4\u660E"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "52px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, caseAssertions.map((a, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: i }, /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select pp-input-sm", value: a.source, onChange: (e) => patchAssertion(i, { source: e.target.value }) }, SOURCES.map((s) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: s, value: s }, s)))), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      value: a.path,
      onChange: (e) => patchAssertion(i, { path: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select pp-input-sm", value: a.op, onChange: (e) => patchAssertion(i, { op: e.target.value }) }, OPS.map((o) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: o, value: o }, o)))), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      value: a.value,
      onChange: (e) => patchAssertion(i, { value: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm",
      value: a.message,
      onChange: (e) => patchAssertion(i, { message: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-row-actions" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-danger", onClick: () => removeAssertion(i) }, "\u5220\u9664"))))), caseAssertions.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 6, className: "pp-muted pp-table-empty" }, "\u6682\u65E0\u65AD\u8A00")) : null))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: addAssertion }, "\u65B0\u589E\u65AD\u8A00"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runCase, disabled: running }, "\u8FD0\u884C\u7528\u4F8B"))) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u9009\u62E9\u4E00\u4E2A\u7528\u4F8B", hint: "\u9009\u4E2D\u540E\u53EF\u7F16\u8F91\u65AD\u8A00\u5E76\u8FD0\u884C" })), resultPanel("\u5C1A\u672A\u8FD0\u884C"))) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-debug-layout" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-card-title" }, "\u573A\u666F"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent", onClick: addScenario }, "+ \u65B0\u5EFA\u573A\u666F")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tree" }, scenarios.map((s) => /* @__PURE__ */ (0, import_react.createElement)(
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
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis" }, s.name || s.id),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-tree-row-count" }, (s.steps || []).length)
  ))), scenarios.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u573A\u666F", hint: "\u70B9\u53F3\u4E0A\u300C+ \u65B0\u5EFA\u573A\u666F\u300D\uFF0C\u6216\u300C\u4FDD\u5B58\u7528\u4F8B\u4E0E\u573A\u666F\u300D\u65B0\u5EFA" }) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-test-main" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u6B65\u9AA4\u7F16\u6392"), activeScenario ? /* @__PURE__ */ (0, import_react.createElement)("div", null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid", style: { marginBottom: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u573A\u666F\u540D"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input",
      value: activeScenario.name || "",
      onChange: (e) => patchScenario({ name: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-table-wrap" }, /* @__PURE__ */ (0, import_react.createElement)("table", { className: "pp-table pp-table-wide" }, /* @__PURE__ */ (0, import_react.createElement)("thead", null, /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "40px" } }, "#"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u6B65\u9AA4\u540D"), /* @__PURE__ */ (0, import_react.createElement)("th", null, "\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("th", { style: { width: "120px" } }, "\u64CD\u4F5C"))), /* @__PURE__ */ (0, import_react.createElement)("tbody", null, (activeScenario.steps || []).map((s, i) => /* @__PURE__ */ (0, import_react.createElement)("tr", { key: s.id || i }, /* @__PURE__ */ (0, import_react.createElement)("td", { className: "pp-meta" }, i + 1), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm",
      value: s.name || "",
      onChange: (e) => patchStep(i, { name: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-input-sm",
      style: { width: "100%" },
      value: s.endpointId || "",
      onChange: (e) => patchStep(i, { endpointId: e.target.value })
    },
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u672A\u7ED1\u5B9A\uFF09"),
    endpoints.map((ep) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: ep.id, value: ep.id }, ep.method, " ", ep.url))
  ), s.endpointId ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": (endpoints.find((ep) => ep.id === s.endpointId) || {}).method || "GET" }, (endpoints.find((ep) => ep.id === s.endpointId) || {}).method || "GET") : null), /* @__PURE__ */ (0, import_react.createElement)("td", null, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-row-actions" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => moveStep(i, -1), title: "\u4E0A\u79FB" }, "\u2191"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => moveStep(i, 1), title: "\u4E0B\u79FB" }, "\u2193"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-danger", onClick: () => removeStep(i), title: "\u5220\u9664" }, "\xD7"))))), (activeScenario.steps || []).length === 0 ? /* @__PURE__ */ (0, import_react.createElement)("tr", null, /* @__PURE__ */ (0, import_react.createElement)("td", { colSpan: 4, className: "pp-muted pp-table-empty" }, "\u6682\u65E0\u6B65\u9AA4")) : null))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: addStep }, "\u6DFB\u52A0\u6B65\u9AA4"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runScenario, disabled: running }, "\u8FD0\u884C\u573A\u666F"))) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u9009\u62E9\u4E00\u4E2A\u573A\u666F", hint: "\u9009\u4E2D\u540E\u53EF\u7F16\u6392\u6B65\u9AA4\u5E76\u8FD0\u884C" })), resultPanel("\u5C1A\u672A\u8FD0\u884C")))));
}

// src/client/pages/import.jsx
var import_react16 = __toESM(require("react"), 1);
(window.__postapiQueue = window.__postapiQueue || []).push(["import", ImportPage]);
var IO_TABS = [
  { id: "import", label: "\u5BFC\u5165" },
  { id: "export", label: "\u5BFC\u51FA" },
  { id: "codegen", label: "\u4EE3\u7801\u751F\u6210" }
];
var PH_OPENAPI = ["{", '  "openapi": "3.0.0",', '  "info": { "title": "\u793A\u4F8B", "version": "1.0.0" },', '  "paths": {}', "}"].join("\n");
var PH_POSTMAN = ["{", '  "info": { "name": "\u793A\u4F8B" },', '  "item": []', "}"].join("\n");
var PH_HAR = ["{", '  "log": { "version": "1.2", "entries": [] }', "}"].join("\n");
var PH_CURL = "curl -X GET 'https://api.example.com/pets' -H 'Accept: application/json'";
var PH_APIFOX = ["{", '  "name": "Apifox \u5BFC\u51FA\u7684\u9879\u76EE",', '  "apiCollection": [ { "type": "folder", "name": "\u76EE\u5F55", "items": [] } ],', '  "models": []', "}"].join("\n");
var PH_YAPI = ["{", '  "name": "YApi \u9879\u76EE",', '  "list": [ { "title": "\u63A5\u53E3", "path": "/api/x", "method": "GET" } ]', "}"].join("\n");
var IMPORT_KINDS = [
  { id: "openapi", label: "OpenAPI / Swagger", hint: "\u7C98\u8D34 OpenAPI 3 \u6216 Swagger 2 JSON/YAML \u6587\u672C", placeholder: PH_OPENAPI },
  { id: "postman", label: "Postman", hint: "\u7C98\u8D34 Postman Collection v2.1 JSON \u6587\u672C", placeholder: PH_POSTMAN },
  { id: "apifox", label: "Apifox JSON", hint: "\u7C98\u8D34 Apifox \u5BFC\u51FA\u7684\u9879\u76EE JSON\uFF08apiCollection / items \u6811\u4E0E models \u6A21\u578B\uFF09", placeholder: PH_APIFOX },
  { id: "yapi", label: "YApi", hint: "\u7C98\u8D34 YApi \u6570\u636E\u7BA1\u7406\u5BFC\u51FA\u7684 JSON\uFF08list \u63A5\u53E3\u6570\u7EC4\uFF09", placeholder: PH_YAPI },
  { id: "har", label: "HAR", hint: "\u7C98\u8D34\u6D4F\u89C8\u5668\u5BFC\u51FA\u7684 HAR JSON \u6587\u672C", placeholder: PH_HAR },
  { id: "curl", label: "cURL", hint: "\u7C98\u8D34 cURL \u547D\u4EE4\uFF08\u53EF\u591A\u6761\uFF0C\u9010\u884C\uFF09", placeholder: PH_CURL }
];
var EXPORT_KINDS = [
  { id: "openapi", label: "OpenAPI 3", hint: "\u6807\u51C6 OpenAPI 3.0 \u6587\u6863" },
  { id: "postman", label: "Postman", hint: "Postman Collection v2.1" },
  { id: "har", label: "HAR", hint: "HTTP Archive 1.2" },
  { id: "markdown", label: "Markdown", hint: "\u53EF\u8BFB\u6587\u6863" }
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
function errText7(err) {
  return err && err.message ? err.message : String(err);
}
function ImportPage(props) {
  const rootRef = (0, import_react16.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react16.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react16.useState)("proj_demo01");
  const [isMock, setIsMock] = (0, import_react16.useState)(true);
  const [error, setError] = (0, import_react16.useState)("");
  const [actionError, setActionError] = (0, import_react16.useState)("");
  const [notice, setNotice] = (0, import_react16.useState)("");
  const [ioTab, setIoTab] = (0, import_react16.useState)("import");
  const [importKind, setImportKind] = (0, import_react16.useState)("openapi");
  const [importText, setImportText] = (0, import_react16.useState)(MOCK_CURL);
  const [importOut, setImportOut] = (0, import_react16.useState)("");
  const [bundle, setBundle] = (0, import_react16.useState)(null);
  const [exportKind, setExportKind] = (0, import_react16.useState)("openapi");
  const [exportOut, setExportOut] = (0, import_react16.useState)("");
  const [lang, setLang] = (0, import_react16.useState)("curl");
  const [codeOut, setCodeOut] = (0, import_react16.useState)("");
  const [busy, setBusy] = (0, import_react16.useState)(false);
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
        setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText7(err));
      }
    };
    boot();
  }, []);
  const pickImportKind = (id) => {
    setImportKind(id);
    setImportOut("");
    setBundle(null);
    setActionError("");
  };
  const runImport = async () => {
    const fn = api && api.import && api.import[importKind];
    if (typeof fn !== "function") {
      setActionError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.import." + importKind + "\uFF08\u5951\u7EA6 \xA75 POST /import/" + importKind + "\uFF09");
      return;
    }
    const raw = String(importText || "");
    if (!raw.trim()) {
      setActionError("\u5BFC\u5165\u5185\u5BB9\u4E3A\u7A7A");
      return;
    }
    let payload = raw;
    if (importKind !== "curl") {
      try {
        payload = JSON.parse(raw);
      } catch (err) {
        setActionError("\u5BFC\u5165\u5185\u5BB9\u4E0D\u662F\u5408\u6CD5 JSON\uFF1A" + errText7(err));
        return;
      }
    }
    setBusy(true);
    setActionError("");
    setImportOut("");
    setBundle(null);
    try {
      const res = await fn(payload);
      const summary = importSummary(res);
      setImportOut(resultText(res));
      setBundle(res && res.data !== void 0 ? res.data : res);
      setNotice("\u89E3\u6790\u5B8C\u6210\uFF1A\u63A5\u53E3 " + summary.endpoints + " \u6761 / \u76EE\u5F55 " + summary.folders + " \u4E2A / \u6A21\u578B " + summary.schemas + " \u4E2A\uFF0C\u70B9\u300C\u4FDD\u5B58\u5230\u9879\u76EE\u300D\u5199\u5165\u5F53\u524D\u9879\u76EE");
    } catch (err) {
      setActionError("\u5BFC\u5165\u5931\u8D25\uFF1A" + errText7(err));
    } finally {
      setBusy(false);
    }
  };
  const saveImport = async () => {
    if (!bundle || typeof bundle !== "object") {
      setNotice("\u8FD8\u6CA1\u6709\u53EF\u4FDD\u5B58\u7684\u5BFC\u5165\u7ED3\u679C\uFF0C\u5148\u70B9\u300C\u5F00\u59CB\u5BFC\u5165\u300D");
      return;
    }
    if (!storage || typeof storage.importBundle !== "function") {
      setActionError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.importBundle\uFF08\u5951\u7EA6 \xA75 POST /storage/importBundle\uFF09");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const res = await storage.importBundle(projectId, bundle);
      const written = res && typeof res === "object" ? res : {};
      const num = (v) => typeof v === "number" ? v : 0;
      setNotice("\u5DF2\u4FDD\u5B58\u5230\u9879\u76EE\uFF1A\u76EE\u5F55 " + num(written.folders) + " \u4E2A / \u63A5\u53E3 " + num(written.endpoints) + " \u4E2A / \u6A21\u578B " + num(written.schemas) + " \u4E2A");
    } catch (err) {
      setActionError("\u4FDD\u5B58\u5931\u8D25\uFF1A" + errText7(err));
    } finally {
      setBusy(false);
    }
  };
  const runExport = async (kind) => {
    const id = kind || exportKind;
    const fn = api && api.export && api.export[id];
    if (typeof fn !== "function") {
      setActionError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.export." + id + "\uFF08\u5951\u7EA6 \xA75 POST /export/" + id + "\uFF09");
      return;
    }
    if (!storage || typeof storage.getProject !== "function") {
      setActionError("\u5BFC\u51FA\u9700\u8981\u5148\u8BFB\u53D6\u9879\u76EE\uFF1A\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.storage.getProject");
      return;
    }
    setBusy(true);
    setActionError("");
    setExportOut("");
    try {
      const project = await storage.getProject(projectId);
      const res = await fn(project);
      setExportKind(id);
      setExportOut(resultText(res));
      setNotice("\u5BFC\u51FA\u5B8C\u6210\uFF1A" + id);
    } catch (err) {
      setActionError("\u5BFC\u51FA\u5931\u8D25\uFF1A" + errText7(err));
    } finally {
      setBusy(false);
    }
  };
  const runCodegen = async () => {
    if (!api || !api.codegen || typeof api.codegen.run !== "function") {
      setActionError("\u5F53\u524D\u6865\u672A\u63D0\u4F9B api.codegen.run\uFF08\u5951\u7EA6 \xA75 POST /codegen/run\uFF09");
      return;
    }
    setBusy(true);
    setActionError("");
    setCodeOut("");
    try {
      const res = await api.codegen.run({ endpoint: MOCK_ENDPOINT, lang });
      setCodeOut(resultText(res));
      setNotice("\u4EE3\u7801\u751F\u6210\u5B8C\u6210\uFF1A" + lang);
    } catch (err) {
      setActionError("\u4EE3\u7801\u751F\u6210\u5931\u8D25\uFF1A" + errText7(err));
    } finally {
      setBusy(false);
    }
  };
  const copy2 = async (text, label) => {
    if (!text) {
      setActionError("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9\uFF08\u5148\u6267\u884C\u4E00\u6B21\uFF09");
      return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setNotice(label + "\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
      } else {
        setActionError("\u5F53\u524D\u73AF\u5883\u65E0\u526A\u8D34\u677F\u6743\u9650\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u4E0B\u65B9\u6587\u672C\u590D\u5236");
      }
    } catch (err) {
      setActionError("\u590D\u5236\u5931\u8D25\uFF1A" + errText7(err));
    }
  };
  const currentImport = IMPORT_KINDS.find((k) => k.id === importKind) || IMPORT_KINDS[0];
  const currentExport = EXPORT_KINDS.find((k) => k.id === exportKind) || EXPORT_KINDS[0];
  const currentLang = LANGS.find((l) => l.id === lang) || LANGS[0];
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "import", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u5BFC\u5165\u5BFC\u51FA\u4E0E\u4EE3\u7801\u751F\u6210"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-meta" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: projectId, onChange: (e) => setProjectId(e.target.value) }, projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api \u6865\u4E0D\u53EF\u7528\uFF0C\u64CD\u4F5C\u6309\u94AE\u4F1A\u63D0\u793A\u7F3A\u5931\u7684\u65B9\u6CD5" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.import / api.export / api.codegen")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-layout" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-tabs" }, IO_TABS.map((t) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: t.id,
      className: "pp-tab",
      "data-active": ioTab === t.id ? "true" : "false",
      onClick: () => setIoTab(t.id)
    },
    t.label
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-body" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-io-side", "aria-label": ioTab === "export" ? "\u5BFC\u51FA\u683C\u5F0F" : ioTab === "codegen" ? "\u76EE\u6807\u8BED\u8A00" : "\u5BFC\u5165\u683C\u5F0F" }, ioTab === "import" ? /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-side-title" }, "\u5BFC\u5165\u6765\u6E90"), IMPORT_KINDS.map((k) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: k.id,
      className: "pp-io-item",
      "data-active": importKind === k.id ? "true" : "false",
      onClick: () => pickImportKind(k.id)
    },
    k.label
  ))) : null, ioTab === "export" ? /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-side-title" }, "\u5BFC\u51FA\u683C\u5F0F"), EXPORT_KINDS.map((k) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: k.id,
      className: "pp-io-item",
      "data-active": exportKind === k.id ? "true" : "false",
      onClick: () => setExportKind(k.id)
    },
    k.label
  ))) : null, ioTab === "codegen" ? /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-side-title" }, "\u76EE\u6807\u8BED\u8A00"), LANGS.map((l) => /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      key: l.id,
      className: "pp-io-item",
      "data-active": lang === l.id ? "true" : "false",
      onClick: () => setLang(l.id)
    },
    l.label
  ))) : null), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-main" }, ioTab === "import" ? /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-io-title" }, currentImport.label), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => setImportText(""), disabled: busy || !importText }, "\u6E05\u7A7A")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-note" }, currentImport.hint), /* @__PURE__ */ (0, import_react.createElement)(
    "textarea",
    {
      className: "pp-textarea pp-io-input",
      value: importText,
      placeholder: currentImport.placeholder,
      onChange: (e) => setImportText(e.target.value)
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runImport, disabled: busy }, "\u5F00\u59CB\u5BFC\u5165"), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn",
      onClick: saveImport,
      disabled: busy || !bundle,
      title: bundle ? "" : "\u5148\u70B9\u300C\u5F00\u59CB\u5BFC\u5165\u300D\u89E3\u6790\u51FA\u7ED3\u679C\u540E\u53EF\u4FDD\u5B58"
    },
    "\u4FDD\u5B58\u5230\u9879\u76EE"
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => copy2(importOut, "\u5BFC\u5165\u7ED3\u679C"), disabled: !importOut }, "\u590D\u5236\u7ED3\u679C")), bundle ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-stats" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill pp-pill-ok" }, "\u5DF2\u89E3\u6790"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u63A5\u53E3 ", importSummary(bundle).endpoints, " \u6761"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u76EE\u5F55 ", importSummary(bundle).folders, " \u4E2A"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u6A21\u578B ", importSummary(bundle).schemas, " \u4E2A")) : null, importOut ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll pp-io-pre" }, importOut) : null) : null, ioTab === "export" ? /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-io-title" }, currentExport.label)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-note" }, currentExport.hint, " \u2014 \u5BFC\u51FA\u8BFB\u53D6\u5F53\u524D\u9879\u76EE\u5BF9\u8C61\u540E\u4EA4\u7ED9 api.export\uFF0C\u7ED3\u679C\u53EF\u76F4\u63A5\u590D\u5236\u6216\u53E6\u5B58\u3002"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: () => runExport(exportKind), disabled: busy }, "\u5BFC\u51FA ", currentExport.label), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => copy2(exportOut, "\u5BFC\u51FA\u7ED3\u679C"), disabled: !exportOut }, "\u590D\u5236\u7ED3\u679C")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginTop: "var(--sp-2)" } }, "\u5F53\u524D\u9879\u76EE\uFF1A", projectId, " \xB7 \u683C\u5F0F\uFF1A", exportKind), exportOut ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll pp-io-pre" }, exportOut) : null) : null, ioTab === "codegen" ? /* @__PURE__ */ (0, import_react.createElement)(import_react.Fragment, null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-io-title" }, currentLang.label)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-note" }, "\u4EE5\u793A\u4F8B\u63A5\u53E3\u751F\u6210\u76EE\u6807\u8BED\u8A00\u4EE3\u7801\uFF0C\u7ED3\u679C\u53EF\u590D\u5236\uFF1B\u53EF\u5148\u5230\u300C\u8C03\u8BD5\u300D\u9875\u9A8C\u8BC1\u63A5\u53E3\u3002"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-sample" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, "\u793A\u4F8B\u63A5\u53E3"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": MOCK_ENDPOINT.method }, MOCK_ENDPOINT.method), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-mono pp-ellipsis" }, MOCK_ENDPOINT.url)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline" }, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: runCodegen, disabled: busy }, "\u751F\u6210\u4EE3\u7801"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn", onClick: () => copy2(codeOut, "\u751F\u6210\u4EE3\u7801"), disabled: !codeOut }, "\u590D\u5236\u4EE3\u7801")), codeOut ? /* @__PURE__ */ (0, import_react.createElement)("pre", { className: "pp-pre pp-pre-scroll pp-io-pre" }, codeOut) : null) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-io-status" }, actionError ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, actionError) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-note pp-note-ok" }, notice) : null))))));
}

// src/client/pages/flow.jsx
var import_react18 = __toESM(require("react"), 1);

// src/client/pages/sequence.jsx
var import_react17 = require("react");
var ACTOR_GAP = 150;
var MIN_W = 480;
var MAX_W = 960;
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
var PAPER = "var(--bg-app)";
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
function sequenceWidth(n) {
  if (n <= 1) return MIN_W;
  return Math.max(MIN_W, Math.min(MAX_W, MARGIN_X * 2 + (n - 1) * ACTOR_GAP));
}
function centerX(i, n, width) {
  if (n <= 1) return width / 2;
  return MARGIN_X + i * (width - 2 * MARGIN_X) / (n - 1);
}
function layoutSequence(steps) {
  const actors = collectActors(steps);
  const width = sequenceWidth(actors.length);
  const centers = actors.map((_, i) => centerX(i, actors.length, width));
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
  return { actors, centers, idxOf, rows, frames, activations, width, height, lifelineBottom: contentBottom + 8 };
}
function exportSequenceSvg(svgEl, filename = "flow-sequence.svg") {
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(svgEl) : null;
  const raw = new XMLSerializer().serializeToString(clone);
  const resolved = cs ? raw.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || "currentColor") : raw;
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
  return Math.max(24, Math.round(text.length * 6 + 12));
}
function SequenceDiagram({ steps, idPrefix = "flow-seq", title = "\u65F6\u5E8F\u56FE", desc = "\u63A5\u53E3\u8C03\u7528\u65F6\u5E8F", svgRef: externalSvgRef, activeIndex = -1, onSelectRow }) {
  const innerRef = (0, import_react17.useRef)(null);
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
  const highlightBands = rows.map((row, i) => {
    if (i !== activeIndex) return null;
    return /* @__PURE__ */ (0, import_react.createElement)("g", { key: "hl-" + i, pointerEvents: "none" }, /* @__PURE__ */ (0, import_react.createElement)(
      "rect",
      {
        x: 8,
        y: row.y - 14,
        width: width - 16,
        height: 28,
        rx: "4",
        fill: ACCENT,
        fillOpacity: "0.08"
      }
    ), /* @__PURE__ */ (0, import_react.createElement)("circle", { cx: MARGIN_X - 32, cy: row.y, r: "8", fill: ACCENT }), /* @__PURE__ */ (0, import_react.createElement)(
      "text",
      {
        x: MARGIN_X - 32,
        y: row.y + 3,
        fill: "var(--fg-on-accent)",
        fontSize: "var(--fs-chart)",
        fontFamily: FONT_MONO,
        textAnchor: "middle"
      },
      i + 1
    ));
  });
  const messages = rows.map((row, i) => {
    const s = row.step;
    const y = row.y;
    const isActive = i === activeIndex;
    if (s.action === "note") {
      const cx = centers[idxOf(s.actor)] ?? width / 2;
      const nw = Math.max(120, maskWidth((s.message || "").toUpperCase()) + 16);
      return /* @__PURE__ */ (0, import_react.createElement)("g", { key: "m-" + i }, /* @__PURE__ */ (0, import_react.createElement)(
        "rect",
        {
          x: cx - nw / 2,
          y: y - 12,
          width: nw,
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
          fontSize: "var(--fs-chart)",
          fontFamily: FONT_MONO,
          textAnchor: "middle",
          letterSpacing: "0.04em"
        },
        (s.message || "").toUpperCase()
      ));
    }
    if (s.action === "self") {
      const cx = centers[idxOf(s.actor)] ?? width / 2;
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
          fontSize: "var(--fs-chart)",
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
    const headline = s.headline === true || isActive;
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
        strokeWidth: isActive ? 2 : 1,
        strokeDasharray: isReturn && !headline ? "5,4" : void 0,
        markerEnd: `url(#${marker})`
      }
    ), /* @__PURE__ */ (0, import_react.createElement)("rect", { x: (left + right) / 2 - mw / 2, y: y - 20, width: mw, height: 12, rx: "2", fill: PAPER }), /* @__PURE__ */ (0, import_react.createElement)(
      "text",
      {
        x: (left + right) / 2,
        y: y - 11,
        fill: isActive ? ACCENT : MUTED,
        fontWeight: isActive ? 600 : void 0,
        fontSize: "var(--fs-chart)",
        fontFamily: FONT_MONO,
        textAnchor: "middle",
        letterSpacing: "0.06em"
      },
      label
    ));
  });
  const hitAreas = onSelectRow ? rows.map((row, i) => /* @__PURE__ */ (0, import_react.createElement)(
    "rect",
    {
      key: "hit-" + i,
      x: MARGIN_X - 48,
      y: row.y - 14,
      width: width - MARGIN_X * 2 + 96,
      height: 28,
      fill: "transparent",
      style: { cursor: "pointer" },
      onClick: () => onSelectRow(i)
    }
  )) : null;
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
      fontSize: "var(--fs-chart)",
      fontFamily: FONT_MONO,
      textAnchor: "middle",
      letterSpacing: "0.12em"
    },
    f.op.toUpperCase()
  ), f.guards.map((g, gi) => /* @__PURE__ */ (0, import_react.createElement)("g", { key: "g-" + gi }, /* @__PURE__ */ (0, import_react.createElement)(
    "rect",
    {
      x: f.x + 8,
      y: g.y - 11,
      width: Math.max(40, g.text.length * 6 + 12),
      height: 14,
      rx: "2",
      fill: PAPER,
      fillOpacity: "0.92"
    }
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "text",
    {
      x: f.x + 12,
      y: g.y,
      fill: MUTED,
      fontSize: "var(--fs-chart)",
      fontFamily: FONT_MONO,
      letterSpacing: "0.04em"
    },
    g.text
  ))), f.dividers.map((dy, di) => /* @__PURE__ */ (0, import_react.createElement)(
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
      fontSize: "var(--fs-12)",
      fontWeight: "600",
      fontFamily: FONT_SANS,
      textAnchor: "middle"
    },
    name
  )));
  const legendY = height - LEGEND_H + 8;
  const legendItems = [
    { text: "SOLID = CALL", fill: MUTED },
    { text: "DASHED = RETURN", fill: MUTED },
    { text: "ACCENT = HEADLINE", fill: ACCENT },
    { text: "FRAME = BRANCH", fill: MUTED }
  ];
  const legendCols = width >= 640 ? 4 : 3;
  const legendStep = Math.round((width - MARGIN_X * 2 - 80) / legendCols);
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
      fontSize: "var(--fs-chart)",
      fontFamily: FONT_MONO,
      letterSpacing: "0.14em"
    },
    "LEGEND"
  ), legendItems.slice(0, legendCols).map((item, i) => /* @__PURE__ */ (0, import_react.createElement)(
    "text",
    {
      key: item.text,
      x: MARGIN_X + 80 + i * legendStep,
      y: legendY + 8,
      fill: item.fill,
      fontSize: "var(--fs-chart)",
      fontFamily: FONT_MONO
    },
    item.text
  )));
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
    highlightBands,
    frameEls,
    lifelines,
    acts,
    messages,
    actorBoxes,
    hitAreas,
    legend
  );
}

// src/client/pages/flow.jsx
(window.__postapiQueue = window.__postapiQueue || []).push(["flow", FlowPage]);
var ACTIONS = ["call", "return", "self", "note"];
var ACTION_LABEL = { call: "\u8C03\u7528", return: "\u8FD4\u56DE", self: "\u81EA\u8C03\u7528", note: "\u5907\u6CE8" };
function collectActors2(steps) {
  const out = [];
  for (const s of Array.isArray(steps) ? steps : []) {
    for (const name of [s.actor, s.target]) {
      if (name && !out.includes(name)) out.push(name);
    }
  }
  return out;
}
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
function errText8(err) {
  return err && err.message ? err.message : String(err);
}
function FlowPage(props) {
  const rootRef = (0, import_react18.useRef)(null);
  const svgRef = (0, import_react18.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react18.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react18.useState)("proj_demo01");
  const [flowName, setFlowName] = (0, import_react18.useState)("\u63A5\u53E3\u8C03\u8BD5\u65F6\u5E8F");
  const [steps, setSteps] = (0, import_react18.useState)(() => loadDraft() || DEFAULT_STEPS);
  const [isMock, setIsMock] = (0, import_react18.useState)(true);
  const [error, setError] = (0, import_react18.useState)("");
  const [notice, setNotice] = (0, import_react18.useState)("");
  const [activeIdx, setActiveIdx] = (0, import_react18.useState)(0);
  const [pendingDel, setPendingDel] = (0, import_react18.useState)(false);
  const pickStep = (idx) => {
    setActiveIdx(idx);
    setPendingDel(false);
  };
  (0, import_react18.useEffect)(() => {
    applyTheme(rootRef.current);
    saveDraft(steps);
  }, [steps]);
  (0, import_react18.useEffect)(() => {
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
        setError("\u52A0\u8F7D\u9879\u76EE\u5931\u8D25\uFF1A" + errText8(err));
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
      setError("\u8F7D\u5165\u6D41\u7A0B\u56FE\u5931\u8D25\uFF1A" + errText8(err));
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
      setError("\u4FDD\u5B58\u6D41\u7A0B\u56FE\u5931\u8D25\uFF1A" + errText8(err));
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
        setError("\u590D\u5236\u5931\u8D25\uFF1A" + errText8(err));
        return;
      }
    }
    setError("\u5F53\u524D\u73AF\u5883\u65E0\u526A\u8D34\u677F\u6743\u9650\uFF0C\u8BF7\u624B\u52A8\u590D\u5236 JSON");
  };
  const exportSvg = () => exportSequenceSvg(svgRef.current, "flow-sequence.svg");
  const active = steps[activeIdx] || null;
  const actors = collectActors2(steps);
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "flow", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u6D41\u7A0B\u56FE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)(
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
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill" }, steps.length, " \u6B65 \xB7 ", actors.length, " \u53C2\u4E0E\u65B9"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: persist }, "\u4FDD\u5B58\u5230\u9879\u76EE"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-flow-name",
      value: flowName,
      placeholder: "\u56FE\u540D",
      onChange: (e) => {
        setFlowName(e.target.value);
        setNotice("");
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-toolbar-spacer" }), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: exportSvg }, "\u5BFC\u51FA SVG"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: copyJson }, "\u590D\u5236 JSON"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage.saveFlow \u4E0D\u53EF\u7528\uFF0C\u7F16\u6392\u7ED3\u679C\u4EC5\u5B58\u672C\u5730\u8349\u7A3F\uFF08" + DRAFT_KEY + "\uFF09" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08getProject / saveFlow\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-note pp-note-ok" }, notice) : null, overBudget && /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-split-hint" }, "\u5F53\u524D ", steps.length, " \u6B65\uFF0C\u8D85\u8FC7 9 \u6B65\u5BC6\u5EA6\u9884\u7B97\uFF084/10\uFF09\u2014\u2014\u5EFA\u8BAE\u62C6\u5206\u4E3A\u300C\u4E3B\u6D41\u7A0B\u300D\u4E0E\u300C\u5206\u652F/\u5F02\u5E38\u300D\u4E24\u5F20\u56FE"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-layout" }, /* @__PURE__ */ (0, import_react.createElement)("nav", { className: "pp-panel pp-flow-side", "aria-label": "\u6B65\u9AA4\u5217\u8868" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-side-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-card-title" }, "\u6B65\u9AA4"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-accent", onClick: add }, "+ \u6DFB\u52A0")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-steps" }, steps.map((s, i) => /* @__PURE__ */ (0, import_react.createElement)(
    "div",
    {
      key: i,
      className: "pp-flow-step",
      "data-active": i === activeIdx ? "true" : "false",
      onClick: () => pickStep(i)
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-flow-step-no" }, i + 1),
    /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-step-body" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis pp-flow-step-name" }, s.actor || "\u2014", " \u2192 ", s.target || "\u2014"), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis pp-flow-step-msg" }, s.message || "\uFF08\u7A7A\u6D88\u606F\uFF09")),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-flow-step-act" }, s.action)
  )), steps.length === 0 ? /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u6B65\u9AA4", hint: "\u70B9\u4E0A\u65B9\u300C+ \u6DFB\u52A0\u300D\u5F00\u59CB\u7F16\u6392" }) : null)), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-main" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-seq-wrap" }, steps.length > 0 ? /* @__PURE__ */ (0, import_react.createElement)(
    SequenceDiagram,
    {
      steps,
      svgRef,
      idPrefix: "flow-page-seq",
      title: flowName || "\u63A5\u53E3\u8C03\u8BD5\u65F6\u5E8F",
      desc: "\u9875\u9762\u7ECF Storage \u8F7D\u5165\u9879\u76EE\u3001Request \u53D1\u8D77 HTTP \u8C03\u7528\uFF0C\u5E76\u6309\u54CD\u5E94\u72B6\u6001\u6E32\u67D3\u6216\u63D0\u793A\u9519\u8BEF\u7684\u65F6\u5E8F\u56FE",
      activeIndex: activeIdx,
      onSelectRow: pickStep
    }
  ) : /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u6682\u65E0\u53EF\u6E32\u67D3\u7684\u65F6\u5E8F", hint: "\u6DFB\u52A0\u6B65\u9AA4\u540E\u81EA\u52A8\u751F\u6210" })), active ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-props" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u6B65\u9AA4 ", activeIdx + 1), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-prop-grid" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u53D1\u8D77\u65B9"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm",
      value: active.actor,
      list: "pp-flow-actors",
      onChange: (e) => update(activeIdx, { actor: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u52A8\u4F5C"), /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-input-sm",
      value: active.action,
      onChange: (e) => update(activeIdx, { action: e.target.value })
    },
    ACTIONS.map((a) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: a, value: a }, ACTION_LABEL[a] || a))
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u63A5\u6536\u65B9"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm",
      value: active.target || "",
      list: "pp-flow-actors",
      onChange: (e) => update(activeIdx, { target: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u6D88\u606F"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      value: active.message || "",
      onChange: (e) => update(activeIdx, { message: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5907\u6CE8"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm",
      value: active.note || "",
      onChange: (e) => update(activeIdx, { note: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5206\u652F"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-prop-row" }, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-input-sm",
      value: active.op || "",
      onChange: (e) => update(activeIdx, { op: e.target.value || void 0 })
    },
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "" }, "\uFF08\u65E0\uFF09"),
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "alt" }, "alt \u6761\u4EF6\u5206\u652F"),
    /* @__PURE__ */ (0, import_react.createElement)("option", { value: "opt" }, "opt \u53EF\u9009\u7247\u6BB5")
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-sm pp-input-mono",
      value: active.guard || "",
      placeholder: "[\u6761\u4EF6]",
      onChange: (e) => update(activeIdx, { guard: e.target.value || void 0 })
    }
  ))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar-inline", style: { marginTop: "var(--sp-3)" } }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-env-check" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      type: "checkbox",
      checked: active.headline === true,
      onChange: (e) => update(activeIdx, { headline: e.target.checked || void 0 })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", null, "\u4E3B\u8272\u9AD8\u4EAE")), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-env-check" }, /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      type: "checkbox",
      checked: active.divider === true,
      onChange: (e) => update(activeIdx, { divider: e.target.checked || void 0 })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("span", null, "\u5206\u9694\u7EBF")), /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-toolbar-spacer" }), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => move(activeIdx, -1), disabled: activeIdx === 0 }, "\u2191 \u4E0A\u79FB"), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-sm", onClick: () => move(activeIdx, 1), disabled: activeIdx === steps.length - 1 }, "\u2193 \u4E0B\u79FB"), /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-btn pp-btn-sm pp-btn-ghost pp-btn-danger",
      title: pendingDel ? "\u518D\u6B21\u70B9\u51FB\u786E\u8BA4\u5220\u9664\u8BE5\u6B65\u9AA4" : "\u5220\u9664\u6B65\u9AA4\uFF08\u672C\u5730\u8349\u7A3F\u81EA\u52A8\u4FDD\u5B58\uFF0C\u8BEF\u5220\u53EF\u64A4\u9500\u7F16\u6392\u540E\u91CD\u5B58\uFF09",
      onClick: () => {
        if (!pendingDel) {
          setPendingDel(true);
          return;
        }
        setPendingDel(false);
        remove(activeIdx);
        setActiveIdx(Math.max(0, activeIdx - 1));
      }
    },
    pendingDel ? "\u786E\u8BA4\u5220\u9664" : "\u5220\u9664"
  )), /* @__PURE__ */ (0, import_react.createElement)("datalist", { id: "pp-flow-actors" }, actors.map((a) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: a, value: a })))) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-flow-props" }, /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { text: "\u672A\u9009\u4E2D\u6B65\u9AA4", hint: "\u70B9\u5DE6\u4FA7\u4EFB\u4E00\u6B65\u9AA4\u7F16\u8F91\u5176\u5C5E\u6027" }))))));
}

// src/client/pages/search.jsx
var import_react19 = __toESM(require("react"), 1);
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
function errText9(err) {
  return err && err.message ? err.message : String(err);
}
function markParts(text, keyword) {
  const h = highlight(text, keyword);
  if (!h.hit) return h.before;
  return [h.before, /* @__PURE__ */ (0, import_react.createElement)("mark", { key: "hit", className: "pp-search-mark" }, h.hit), h.after];
}
function highlight(text, keyword) {
  const raw = String(text || "");
  const kw = String(keyword || "").trim();
  if (!kw) return { before: raw, hit: "", after: "" };
  const at = raw.toLowerCase().indexOf(kw.toLowerCase());
  if (at < 0) return { before: raw, hit: "", after: "" };
  return {
    before: raw.slice(0, at),
    hit: raw.slice(at, at + kw.length),
    after: raw.slice(at + kw.length)
  };
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
  const rootRef = (0, import_react19.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const route = props && props.route || {};
  const [projects, setProjects] = (0, import_react19.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react19.useState)("proj_demo01");
  const [keyword, setKeyword] = (0, import_react19.useState)(() => readQueryKeyword(route.query));
  const [groups, setGroups] = (0, import_react19.useState)(groupResults(MOCK_RESULT));
  const [isMock, setIsMock] = (0, import_react19.useState)(true);
  const [searched, setSearched] = (0, import_react19.useState)(false);
  const [collapsed, setCollapsed] = (0, import_react19.useState)({});
  const [error, setError] = (0, import_react19.useState)("");
  (0, import_react19.useEffect)(() => applyTheme(rootRef.current), []);
  (0, import_react19.useEffect)(() => {
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
        setError("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25\uFF1A" + errText9(err));
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
      setError("\u641C\u7D22\u5931\u8D25\uFF1A" + errText9(err));
    }
  };
  const [autoQuery, setAutoQuery] = (0, import_react19.useState)("");
  (0, import_react19.useEffect)(() => {
    const q = readQueryKeyword(route.query);
    if (!hasKeyword(q)) return;
    setKeyword(q);
    if (!storage || typeof storage.search !== "function") return;
    if (autoQuery === route.query) return;
    setAutoQuery(route.query);
    runSearch();
  }, [route.query, projectId, storage, autoQuery]);
  const total = GROUPS.reduce((n, g) => n + groups[g.key].length, 0);
  const visibleGroups = GROUPS.filter((g) => groups[g.key].length > 0);
  const kw = String(keyword || "").trim();
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "search", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u5168\u5C40\u641C\u7D22"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-actions" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta pp-search-summary" }, searched ? "\u547D\u4E2D " + total + " \u6761 \xB7 " + visibleGroups.length + " \u4E2A\u5206\u7EC4" : "\u5C1A\u672A\u641C\u7D22"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-search-bar" }, /* @__PURE__ */ (0, import_react.createElement)(
    "select",
    {
      className: "pp-select pp-search-project",
      value: projectId,
      onChange: (e) => setProjectId(e.target.value)
    },
    projects.map((p) => /* @__PURE__ */ (0, import_react.createElement)("option", { key: p.id, value: p.id }, p.name || p.id))
  ), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-search-input",
      placeholder: "\u641C\u7D22\u63A5\u53E3\u540D\u79F0 / URL / \u63CF\u8FF0\uFF0C\u56DE\u8F66\u5373\u641C",
      value: keyword,
      onChange: (e) => setKeyword(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") runSearch();
      }
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary pp-search-btn", onClick: runSearch }, "\u641C\u7D22")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage.search \u4E0D\u53EF\u7528\uFF0C\u4EE5\u4E0B\u4E3A\u6587\u4EF6\u5185 mock" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage.search\uFF08\u540D\u79F0 / url / \u63CF\u8FF0\uFF0C\u5927\u5C0F\u5199\u4E0D\u654F\u611F\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, !searched ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-search-hint" }, /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { icon: "search", text: "\u8F93\u5165\u5173\u952E\u5B57\u5F00\u59CB\u641C\u7D22", hint: "\u53EF\u641C\u63A5\u53E3\u540D\u79F0\u3001URL\u3001\u63CF\u8FF0\uFF0C\u4E5F\u53EF\u641C\u6570\u636E\u6A21\u578B\u4E0E\u76EE\u5F55" })) : total === 0 ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-search-hint" }, /* @__PURE__ */ (0, import_react.createElement)(EmptyState, { icon: "search", text: "\u6CA1\u6709\u5339\u914D\u300C" + kw + "\u300D\u7684\u7ED3\u679C", hint: "\u6362\u4E2A\u5173\u952E\u5B57\uFF0C\u6216\u68C0\u67E5\u662F\u5426\u9009\u9519\u4E86\u9879\u76EE" })) : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-search-results" }, visibleGroups.map((g) => /* @__PURE__ */ (0, import_react.createElement)("section", { key: g.key, className: "pp-search-group" }, /* @__PURE__ */ (0, import_react.createElement)(
    "button",
    {
      className: "pp-search-group-head",
      "data-collapsed": collapsed[g.key] ? "true" : "false",
      "aria-expanded": collapsed[g.key] ? "false" : "true",
      onClick: () => setCollapsed({ ...collapsed, [g.key]: !collapsed[g.key] })
    },
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-search-caret" }, collapsed[g.key] ? "\u25B8" : "\u25BE"),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-search-group-label" }, g.label),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-search-count" }, groups[g.key].length)
  ), collapsed[g.key] ? null : /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-list pp-search-list" }, groups[g.key].map((item) => /* @__PURE__ */ (0, import_react.createElement)(
    "a",
    {
      key: g.key + "-" + item.id,
      className: "pp-list-row pp-search-row",
      href: g.target(item.id)
    },
    item.method ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-method", "data-method": item.method }, item.method) : /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-search-dot" }),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-ellipsis pp-search-name" }, markParts(item.title, kw)),
    /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta pp-ellipsis pp-search-sub" }, item.url || item.description || "")
  ))))))));
}

// src/client/pages/settings.jsx
var import_react20 = __toESM(require("react"), 1);
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
function errText10(err) {
  return err && err.message ? err.message : String(err);
}
function SettingsPage(props) {
  const rootRef = (0, import_react20.useRef)(null);
  const api = props && props.api || (typeof window !== "undefined" ? window.__postapiApi : void 0);
  const storage = api && api.storage;
  const [projects, setProjects] = (0, import_react20.useState)([{ id: "proj_demo01", name: "\u8BA2\u5355\u4E2D\u5FC3" }]);
  const [projectId, setProjectId] = (0, import_react20.useState)("proj_demo01");
  const [storeRoot, setStoreRoot] = (0, import_react20.useState)(() => storeRootOf(api && api.storeRoot));
  const [theme, setTheme] = (0, import_react20.useState)(readTheme);
  const [locale, setLocale] = (0, import_react20.useState)(readLocale);
  const [settings, setSettings] = (0, import_react20.useState)(DEFAULT_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = (0, import_react20.useState)(() => JSON.stringify(normalizeSettings(DEFAULT_SETTINGS)));
  const settingsKey = JSON.stringify(normalizeSettings(settings));
  const dirty = settingsKey !== savedSnapshot;
  const [isMock, setIsMock] = (0, import_react20.useState)(true);
  const [error, setError] = (0, import_react20.useState)("");
  const [notice, setNotice] = (0, import_react20.useState)("");
  (0, import_react20.useEffect)(() => {
    applyTheme(rootRef.current);
  }, []);
  (0, import_react20.useEffect)(() => {
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
            if (loaded && loaded.settings) {
              const payload = normalizeSettings(loaded.settings);
              setSettings(payload);
              setSavedSnapshot(JSON.stringify(payload));
            }
          }
        }
      } catch (err) {
        setError("\u52A0\u8F7D\u8BBE\u7F6E\u5931\u8D25\uFF1A" + errText10(err));
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
    setNotice("\u4E3B\u9898\u5DF2\u5207\u6362\uFF1A" + (value === "dark" ? "\u6DF1\u8272" : "\u6D45\u8272"));
  };
  const applyLocaleChoice = (value) => {
    setLocale(value);
    saveLocale(value);
    setNotice("\u8BED\u8A00\u5DF2\u5207\u6362\uFF1A" + (value === "zh-CN" ? "\u7B80\u4F53\u4E2D\u6587" : "English"));
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
      setSavedSnapshot(JSON.stringify(payload));
      setNotice("\u5DF2\u4FDD\u5B58\u9879\u76EE\u8BBE\u7F6E");
    } catch (err) {
      setError("\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25\uFF1A" + errText10(err));
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
      setError("\u8F7D\u5165\u8BBE\u7F6E\u5931\u8D25\uFF1A" + errText10(err));
    }
  };
  return /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-scope pp-page", "data-page": "settings", ref: rootRef }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-head" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-overview-title" }, "\u8BBE\u7F6E")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-overview-content" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-toolbar" }, /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-meta" }, isMock ? "\u793A\u4F8B\u6570\u636E \u2014 api.storage \u4E0D\u53EF\u7528\uFF0C\u9879\u76EE\u8BBE\u7F6E\u9879\u4E3A\u6587\u4EF6\u5185\u9ED8\u8BA4\u503C" : "\u6570\u636E\u6765\u6E90\uFF1Aapi.storage\uFF08getProject / saveProjectSettings\uFF09")), error ? /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-error-text" }, error) : null, notice ? /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-note pp-note-ok" }, notice) : null, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-cols-2" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u5916\u89C2\u4E0E\u5B58\u50A8"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-meta", style: { marginBottom: "var(--sp-3)" } }, "\u4E3B\u9898 / \u8BED\u8A00\u9009\u62E9\u5373\u751F\u6548\uFF1B\u5B58\u50A8\u8DEF\u5F84\u7531 host \u6CE8\u5165\u53EA\u8BFB\u3002\u9879\u76EE\u8BBE\u7F6E\uFF08\u53F3\u4FA7\uFF09\u9700\u4FDD\u5B58\u843D\u76D8\u3002"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-row" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5B58\u50A8\u8DEF\u5F84"), /* @__PURE__ */ (0, import_react.createElement)("input", { className: "pp-input pp-input-mono", readOnly: true, value: storeRoot })), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4E3B\u9898"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: theme, onChange: (e) => applyThemeChoice(e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "light" }, "\u6D45\u8272"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "dark" }, "\u6DF1\u8272")), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8BED\u8A00"), /* @__PURE__ */ (0, import_react.createElement)("select", { className: "pp-select", value: locale, onChange: (e) => applyLocaleChoice(e.target.value) }, /* @__PURE__ */ (0, import_react.createElement)("option", { value: "zh-CN" }, "\u7B80\u4F53\u4E2D\u6587"), /* @__PURE__ */ (0, import_react.createElement)("option", { value: "en" }, "English"))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-note", style: { marginTop: "var(--sp-3)" } }, "\u5B58\u50A8\u6839\u76EE\u5F55\u7531 host \u6784\u9020\u53C2\u6570\u6CE8\u5165\uFF08createStorageService(basePath)\uFF09\uFF0C\u9875\u9762\u53EA\u8BFB\u5C55\u793A\uFF0C\u4E0D\u53EF\u4FEE\u6539\u3002")), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-pane" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u9879\u76EE\u8BBE\u7F6E"), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-grid" }, /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u9879\u76EE"), /* @__PURE__ */ (0, import_react.createElement)(
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
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "Mock \u7AEF\u53E3"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      inputMode: "numeric",
      value: settings.mockPort,
      onBlur: () => patch(normalizeSettings(settings)),
      onChange: (e) => patch({ mockPort: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u4EE3\u7406"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      placeholder: "http://127.0.0.1:7890\uFF08\u7559\u7A7A\u4E3A\u76F4\u8FDE\uFF09",
      value: settings.proxyUrl,
      onChange: (e) => patch({ proxyUrl: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u8D85\u65F6 (ms)"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      inputMode: "numeric",
      value: settings.requestTimeoutMs,
      onBlur: () => patch(normalizeSettings(settings)),
      onChange: (e) => patch({ requestTimeoutMs: e.target.value })
    }
  ), /* @__PURE__ */ (0, import_react.createElement)("label", { className: "pp-form-label" }, "\u5386\u53F2\u6761\u6570"), /* @__PURE__ */ (0, import_react.createElement)(
    "input",
    {
      className: "pp-input pp-input-mono",
      inputMode: "numeric",
      value: settings.historyLimit,
      onBlur: () => patch(normalizeSettings(settings)),
      onChange: (e) => patch({ historyLimit: e.target.value })
    }
  )), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-form-actions" }, dirty ? /* @__PURE__ */ (0, import_react.createElement)("span", { className: "pp-pill pp-pill-warn" }, "\u672A\u4FDD\u5B58") : null, /* @__PURE__ */ (0, import_react.createElement)("button", { className: "pp-btn pp-btn-primary", onClick: persist, disabled: !dirty }, "\u4FDD\u5B58\u9879\u76EE\u8BBE\u7F6E")))), /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card" }, /* @__PURE__ */ (0, import_react.createElement)("div", { className: "pp-card-title" }, "\u534F\u4F5C\uFF08\u89C4\u5212\u4E2D\uFF09"), /* @__PURE__ */ (0, import_react.createElement)("p", { className: "pp-muted" }, "\u6210\u5458\u7BA1\u7406\u4E0E\u53D8\u66F4\u5386\u53F2\u4E3A P2 \u5360\u4F4D\uFF1A\u672C\u63D2\u4EF6\u65E0\u670D\u52A1\u7AEF\uFF0C\u4E0D\u505A\u4E91\u7AEF\u8D26\u53F7 / \u56E2\u961F\u540C\u6B65 / \u5BA1\u8BA1\u65E5\u5FD7\u3002"))));
}

// src/client/pages-entry.js
ensureGlobals();

// src/client/index.js
function installStyles() {
  if (typeof document === "undefined") return () => {
  };
  const existing = document.querySelector('style[data-plugin="dsh-postapi"]');
  if (existing) return () => {
    existing.remove();
  };
  const el = document.createElement("style");
  el.setAttribute("data-plugin", "dsh-postapi");
  el.setAttribute("data-plugin-css", "design-tokens");
  el.textContent = design_tokens_default;
  document.head.append(el);
  return () => {
    el.remove();
  };
}
var inject = ["slots", "locale", "sidebarRightTabs"];
function safeEffect(ctx, label, body) {
  ctx.effect(() => {
    const result = body();
    if (result === void 0 || result === null) return void 0;
    if (typeof result === "function") return result;
    if (typeof result.then === "function" || typeof result[Symbol.iterator] === "function" || typeof result[Symbol.asyncIterator] === "function") return result;
    console.warn("[dsh-postapi] " + label + " \u8FD4\u56DE\u4E86\u975E disposer \u503C\uFF08\u5DF2\u5FFD\u7565\uFF09\uFF1A", typeof result);
    return void 0;
  }, label);
}
function ComposerBadge() {
  return (0, import_react21.createElement)("svg", {
    viewBox: "0 0 64 64",
    width: 16,
    height: 16,
    "aria-hidden": true,
    style: { display: "block", pointerEvents: "none" }
  }, (0, import_react21.createElement)("path", { d: "M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z", fill: "currentColor" }));
}
function apply(ctx) {
  console.info("[dsh-postapi] client apply \u5DF2\u6267\u884C", { hasTabs: !!ctx.sidebarRightTabs, hasSlots: !!ctx.slots, hasLocale: !!ctx.locale });
  ensureGlobals();
  if (!ctx.sidebarRightTabs || !ctx.slots) {
    console.warn("[dsh-postapi] \u5BBF\u4E3B\u672A\u63D0\u4F9B sidebarRightTabs / slots \u670D\u52A1\uFF0C\u53F3\u4FA7\u680F\u9875\u7B7E\u4E0D\u4F1A\u6302\u8F7D");
    return;
  }
  const t = ctx.locale ? ctx.locale.bind(POSTAPI_NS) : (key) => zh[key] ?? key;
  safeEffect(ctx, "dsh-postapi: design tokens", () => installStyles());
  safeEffect(ctx, "dsh-postapi: postapi tab type", () => ctx.sidebarRightTabs.register(postapiDefinition(t)));
  if (ctx.locale) {
    safeEffect(ctx, "dsh-postapi: dictionaries", () => ctx.locale.register(POSTAPI_NS, { zh, en }));
  }
  safeEffect(ctx, "dsh-postapi: tab body", () => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register(
    { name: "sidebar.right.pane.tab", key: POSTAPI_ID, locale: POSTAPI_NS },
    PostApiBody
  )));
  safeEffect(ctx, "dsh-postapi: tab title", () => ctx.slots.inject("sidebar.right.pane.tab.title", () => ctx.slots.register(
    { name: "sidebar.right.pane.tab.title", key: POSTAPI_ID },
    ApiTitle
  )));
  try {
    safeEffect(ctx, "dsh-postapi: composer badge", () => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register(
      { name: "conversation.composer.dock", id: "dsh-postapi", order: 5 },
      ComposerBadge
    )));
  } catch (err) {
    console.warn("[dsh-postapi] composer \u5FBD\u7AE0\u672A\u6CE8\u518C\uFF08slot \u63D0\u4F9B\u65B9\u7F3A\u5931\uFF09\uFF1A", err && err.message);
  }
  safeEffect(ctx, "dsh-postapi: bridge api install", () => {
    installApi();
    return () => {
      if (typeof window !== "undefined" && window.__postapiApi) delete window.__postapiApi;
    };
  });
}

    Object.assign(exports, module.exports);
    return module.exports;
  },
});

