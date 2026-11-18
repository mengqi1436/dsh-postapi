/** Host 侧入口：正式实现见 src/host/index.js（storage/request 服务 + /dsh-postapi/api 桥）。
 *  inject 必须一并 re-export：cordis 只从包入口读取 apply/inject，漏掉 inject 会导致
 *  ctx.webServer 访问抛 cannot get property without inject。
 */
export { apply, inject } from './src/host/index.js'
