# Apifox 2.8.55 chunk 映射表（工作台页面相关）

> 来源：`.research/apifox/app/dist/renderer/index.4fed96b5fcebc02a.js` 中 `g.u=e=>`（JS 文件名 hash 表，1136 项）与 `g.miniCssF=e=>`（chunk 名表 121 项 + CSS hash 表 163 项）。
> 抽取脚本：`.tmp/apifox-rea-map2.mjs`；产物：`.tmp/apifox-rea-chunk-hashes.json` / `.tmp/apifox-rea-css-names.json` / `.tmp/apifox-rea-css-hashes.json`。
> 文件名规则：JS = `<id>.<hash>.async.js`，CSS = `<name>.<cssHash>.css`。

## 1. 工作台页面主 chunk（本任务拆解对象）

| chunk id | chunk 名 | JS 文件 | CSS 文件 | dsh-postapi 路由 |
|---|---|---|---|---|
| 32636 | `async_project_overview` | `32636.00189f99.async.js` | `async_project_overview.dbd5908b.css` | `#/overview` |
| 51863 | `async_doc` | `51863.a5cf6101.async.js`（薄壳，组件在 39622） | `async_doc.7694005c.css` | `#/doc/:id` |
| 39622 | —（无 chunk 名） | `39622.27ca35fa.async.js` | 复用 `async_doc.7694005c.css` | `#/doc/:id` 组件体 |
| 23168 | `async_panel_api` | `23168.03b4fd45.async.js` | `async_panel_api.014078b9.css` | `#/doc/:id`（右侧面板） |
| 14346 | `async_doc_redirect_rules` | `14346.c857fd64.async.js` | `async_doc_redirect_rules.12c2d91e.css` | `#/doc/:id`（重定向规则） |
| 27733 | `async_http_api_case` | **无独立 JS**（模块内联 `index.4fed96b5fcebc02a.js`） | `async_http_api_case.4459d613.css` | `#/debug` |
| 75562 | —（无 chunk 名） | `75562.c28acf4d.async.js` | `75562.06930afc.css` | `#/debug` 组件体（`.apiCase-CnGjmI`） |
| 79800 | —（无 chunk 名） | — | `79800.4ac1dbcb.css` | `#/mock`（`.mock-*` 规则） |
| 22718 | `async_data_schema_folder` | `22718.09ba70da.async.js` | `async_data_schema_folder.1310deed.css` | `#/schema` |
| 39475 | `async_json_editor` | `39475.47496ff0.async.js` | `async_json_editor.72baf7ed.css` | `#/schema`（JSON 编辑） |
| 57839 | `async_data_schema` | `57839.e2d04390.async.js` | `async_data_schema.e1fe8243.css` | `#/schema`（模型详情） |
| 11113 | `async_global_component` | `11113.77004936.async.js` | `async_global_component.f40f381e.css` | `#/env`（环境管理弹层） |
| 58320 | `async_side_settings` | `58320.3dccae0a.async.js` | `async_side_settings.30c3c6f4.css` | `#/env` / `#/settings` 左菜单 |
| 17888 | `async_http_request_history` | `17888.b25d262e.async.js` | `async_http_request_history.f1b86d50.css` | `#/history` |
| 61133 | `async_request_history_side` | `61133.6b728bee.async.js` | `async_request_history_side.d3b2e640.css` | `#/history`（侧栏） |
| 88598 | `async_request_history_panel` | `88598.c9f4ed5f.async.js` | `async_request_history_panel.de8116f3.css` | `#/history`（面板） |
| 44118 | `async_panel_test` | `44118.a42b8cc4.async.js` | `async_panel_test.ed8d50bd.css` | `#/test` |
| 34914 | `async_test_scenario` | `34914.d4433853.async.js` | `async_test_scenario.99d5f5a6.css` | `#/test` / `#/flow` |
| 25980 | `async_api_test_report_list` | `25980.a3799891.async.js` | `async_api_test_report_list.3e5dcd93.css` | `#/test`（报告列表） |
| 23377 | `async_api_test_report_group` | `23377.a917feb3.async.js` | `async_api_test_report_group.0f8dd867.css` | `#/test`（报告分组） |
| 37914 | `async_test_case_group_run` | `37914.b8733e42.async.js` | `async_test_case_group_run.0f8dd867.css`（与 23377 同 hash） | `#/test`（批量运行） |
| 78203 | —（无 chunk 名） | `78203.9d1d963d.async.js` | `78203.83fd9b69.css` | `#/import` |
| 94743 | —（无 chunk 名） | `94743.ce12794a.async.js` | `94743.17ac1c15.css` | `#/search`（`overview-header-container` 复用） |
| 33943 | `async_panel_settings` | `33943.aff16685.async.js` | `async_panel_settings.b8c96200.css` | `#/settings` |
| 11929 | `p__organization-settings` | `11929.e0eee66d.async.js` | `p__organization-settings.6a729b9d.css` | `#/settings`（组织） |
| 9995 | `settings_content` | `9995.63b772fb.async.js` | `settings_content.10b6da72.css` | `#/settings`（内容区） |

## 2. 骨架 chunk

| chunk id | chunk 名 | JS 文件 | CSS 文件 | 作用 |
|---|---|---|---|---|
| 93666 | `layouts__AppLayout` | `93666.f6e73c19.async.js` | `layouts__AppLayout.82e9bb98.css` | 应用外壳（`.header-l81YB_` 36px） |
| 49423 | `layouts__BasicLayout` | `49423.eca94e91.async.js` | `layouts__BasicLayout.bea2f0dc.css` | 工作台布局（`.specNavTreeHeader-a4zDz_` 44px） |
| 53957 | `p__entry__Main` | `53957.919f0ef6.async.js` | `p__entry__Main.3e1827b9.css` | 入口页（`.all-projects-container-CKLyvV`） |
| 80115 | —（无 chunk 名） | `80115.fd615613.async.js` | `50278.0c151859.css` | 侧栏 + 页签组件（`.layoutTabBar-DNEkZr`） |
| 22260 | —（无 chunk 名） | `22260.*.async.js` | `22260.490ca644.css` | `.sider-bxNtfB` 240/20px |
| index | — | `index.4fed96b5fcebc02a.js`（675 KB） | `index.efe6d7b0.css` | Umi 路由表 + 全局 token（`--ui-layout-header-height:48px`、`--ui-layout-header-padding:0 50px`） |

## 3. 相关但未展开的 chunk（同一工作台的其他面板）

| chunk id | chunk 名 | 说明 |
|---|---|---|
| 4691 | `async_side_apidoc` | 文档站侧栏（`.card-IQe6U6` / `.card-rjS4zx`） |
| 53073 | `async_side_test` | 测试侧栏（`.treeListTopBar` / `.filter-drawer-*` / `.dateRangeSelector`） |
| 12142 | `async_spec_overview` | OpenAPI 概览编辑（`.versionInput-_rX0JS` / `.doc-editor-modal`） |
| 36052 | `async_http_folder` | 目录设置（`.form-block-title` / `.multiple-flows-container`） |
| 37071 | `async_http_response` | 响应组件（`.mainTabs-YhWFQk` / `.oasModuleEditTab`） |
| 42893 | `async_side_specs` | 规范侧栏 |
| 67626 | `async_test_suite` | 测试套件 |
| 76522 | `async_api_test_endpoint` | 测试接口 |
| 82962 | `async_endpoint_test_case` | 接口用例（含 `.main-input-bar` 另一套实现） |
| 90670 | `async_http_api` | 接口详情（`.mainTabs-YhWFQk` / `.mainOASModuleTabs-fJyyQH`） |
| 78920 | `async_panel_apidoc` | 文档面板 |
| 4687 | `async_doc-editor-app` | 文档编辑器应用壳 |
| 71040 | `async_global_modal` | 全局弹层 |
| 96328 | —（无 chunk 名） | 处理器树（`.import-processor-tree-node` / `.processorsCollapsePanel-addBtn`） |
| 25879 / 78203 | — | 搜索框与导入预览（`.list-search-SgG7HF` / `.searchInput-gINsGW`） |

## 4. chunk 名 → id 反查（121 项中的工作台相关 38 项）

```
1549  p__user__password-confirm        4691  async_side_apidoc
3330  async_contact-us                51863 async_doc
4687  async_doc-editor-app            53073 async_side_test
5584  layouts__TeamLayout             53864 async_api_test_data_facade
9995  settings_content                53957 p__entry__Main
11113 async_global_component          57145 code-generator
11929 p__organization-settings        57839 async_data_schema
12142 async_spec_overview             58320 async_side_settings
12199 async_merge_request             59063 async_add_choice_panel
14346 async_doc_redirect_rules         59498 async_outer_parameter
17888 async_http_request_history       61077 async_path_input
21275 async_template_previewer        61133 async_request_history_side
22718 async_data_schema_folder         61567 async_graphql_body
23168 async_panel_api                  62064 async_http_api_view
23377 async_api_test_report_group      62907 async_cookie-manage
23718 async_result-chart-pie           66593 async_api_test_endpoint_folder
25980 async_api_test_report_list        67096 async_socket_service
27733 async_http_api_case              67626 async_test_suite
29924 async_socket_io_api              68456 async_test_schedule_task_root
30807 async_tarslib__json-schema-viewer 68531 async_json_schema_editor_delicate
30965 async_rpc_module                  68588 async_spec_endpoint
31640 p__user__login__components__LdapLogin 69933 async_spec_json_schema
32636 async_project_overview            71040 async_global_modal
32933 async_mcp_client_request_result   72699 async_template_text_area_modal
33943 async_panel_settings              75839 async_http_request_result
34914 async_test_scenario               75919 async_step_detail
35383 async_web_socket_api_simple_mode  76522 async_api_test_endpoint
36052 async_http_folder                 77623 p__user__login__components__SamlSsoOrgSelector
37071 async_http_response               77913 async_test_scenario_folder
37914 async_test_case_group_run         78420 p__organization-teams
39300 async_request_agent_content       78920 async_panel_apidoc
39475 async_json_editor                 79644 async_processors
39674 p__organization-plans            81449 layouts__UserLayout
41275 p__organization-coming-soon       81619 async_http_request
42177 async_api_test_data_editable_table 81660 p__organization-api-hub
42893 async_side_specs                  81761 request-code-generator
43484 p__user__login                   82275 async_ai_generate_endpoint_test_case
44118 async_panel_test                  82361 async_rpc_method_simple_mode_create_entry
46345 async_security_scheme             82689 p__invite
48014 p__account__settings             82962 async_endpoint_test_case
48759 async_performance_test_report_detail 83229 p__user__login__components__LoginOrClone
49410 async_account-settings            83302 async_recycle_modal
49423 layouts__BasicLayout             83470 p__organization-saml-groups
52221 p__link__EmailPreference         84041 async_json_schema_example_viewer
53221 p__organization-audit-logs       84495 layouts__BlankLayout
54740 wrappers                         85766 p__organization-self-hosted-runners
56760 async_socket_request_result       86198 async_add_branch_choice_panel
86987 async_project_branch_merge_button 93666 layouts__AppLayout
87206 p__organization-enterprise-policies 94374 async_rpc_service
88598 async_request_history_panel       94954 p__user__reset-password
90387 async_main_tree_list_refactor     95019 p__organization
90670 async_http_api                    95187 async_mcp_client
90671 async_markdown_preview            96408 async_glide_editable_table
91377 async_http_api_simple_mode        96537 async_markdown_viewer
92122 p__user__saml-sso-overwrite       97496 p__user__register
92539 p__organization-secret-scanner    98772 async_panel_specs
92685 async_parameters                  99788 async_req_sample_code
```

## 5. 复现命令

```bash
# 1) 抽 chunk 名表与 CSS hash 表（产物写 .tmp/）
node .tmp/apifox-rea-map2.mjs

# 2) 抽各页 CSS Modules 语义对 + i18n 键序列（产物 .tmp/apifox-rea-sem-*.json）
node .tmp/apifox-rea-sem.mjs

# 3) 抽各页 own 规则（含数值）+ 后代选择器边（产物 .tmp/apifox-rea-page-*.json）
node .tmp/apifox-rea-pages.mjs

# 4) locale 中文键值对齐（产物 .tmp/apifox-rea-i18n-zh.json）
node .tmp/apifox-rea-l2.mjs
```

> 所有脚本只读 `.research/apifox/app/dist/renderer/`，不运行 Apifox，不写 `.research/` 内任何文件。
