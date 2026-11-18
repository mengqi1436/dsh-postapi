window.__ModuleLoader__.load({
  id: 'dsh-postapi',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** 初始骨架的最小可见能力：输入框底栏一枚纸飞机徽章，用于验证插件挂载链路。 */
    function ComposerBadge() {
      return h('svg', {
        viewBox: '0 0 64 64', width: 16, height: 16,
        'aria-hidden': true,
        style: { display: 'block', pointerEvents: 'none' },
      }, h('path', {
        d: 'M6 50 L54 26 L6 8 L6 24 L36 26 L6 28 Z',
        fill: '#247bbf',
      }));
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock', id: 'dsh-postapi', order: 5,
        }, ComposerBadge));
      },
    };
  },
});
