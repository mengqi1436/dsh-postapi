window.__ModuleLoader__.load({
  id: 'dsh-postapi',
  factory(require) {
    var module = { exports: {} };
    var exports = module.exports;
    console.info('[dsh-postapi] MINIMAL PROBE LOADED — 宿主已加载本插件的 client 模块')
    exports.inject = ['slots', 'locale', 'sidebarRightTabs']
    exports.apply = function apply(ctx) {
      console.info('[dsh-postapi] MINIMAL PROBE APPLY — 服务探测', {
        hasTabs: !!ctx.sidebarRightTabs,
        hasSlots: !!ctx.slots,
        hasLocale: !!ctx.locale,
      })
      try {
        ctx.effect(function () {
          return ctx.sidebarRightTabs.register({
            id: 'postapi',
            kind: 'postapi',
            keepMounted: true,
            title: function () { return 'PostAPI' },
            guide: [{ id: 'postapi', order: 10, title: function () { return 'PostAPI' }, description: function () { return 'API 调试' } }],
          })
        }, 'postapi-minimal-probe')
        console.info('[dsh-postapi] MINIMAL PROBE REGISTERED')
      } catch (e) {
        console.error('[dsh-postapi] MINIMAL PROBE REGISTER FAILED:', e && e.message)
      }
    }
    return module.exports;
  },
});
