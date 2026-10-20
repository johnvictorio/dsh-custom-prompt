window.__ModuleLoader__.load({
  id: 'dsh-custom-prompt',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const NAMESPACE = 'custom-prompt'
    const LOCALE_NS = 'settings.customPrompt'

    const en = {
      nav: 'Custom Prompt',
      heading: 'Custom Prompt',
      intro: 'Adds one section to the system prompt of every agent in this process, on every agent preset. Disabled by default.',
      enabled: 'Enabled',
      text: 'Prompt text',
      textHint: 'Avoid {{braces}} other than {{customnote}}; unknown references make prompt rendering fail.',
      placeholder: 'Add your prompt text here, then enable this section.',
      save: 'Save',
      reset: 'Reset',
      saving: 'Saving...',
      saved: 'Saved',
      rejected: 'The host rejected the write; it reverted to the stored value.',
      failed: 'Save failed: ',
      loading: 'Loading settings...',
      readonly: 'This browser cannot write settings.',
    }

    const zh = {
      nav: '自定义提示词',
      heading: '自定义提示词',
      intro: '向本进程中每个 Agent 的系统提示词添加一个段落，适用于所有 Agent 预设。默认关闭。',
      enabled: '启用',
      text: '提示词内容',
      textHint: '除 {{customnote}} 外，请勿使用其他 {{花括号}}；未知引用会导致提示词渲染失败。',
      placeholder: '在此输入提示词，然后启用此段落。',
      save: '保存',
      reset: '重置',
      saving: '保存中...',
      saved: '已保存',
      rejected: '主机拒绝了写入，已恢复为已存储的值。',
      failed: '保存失败：',
      loading: '正在加载设置...',
      readonly: '此浏览器无法写入设置。',
    }

    const row = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }
    const hint = { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' }
    const button = {
      padding: '6px 14px',
      borderRadius: '6px',
      fontSize: '13px',
      cursor: 'pointer',
      border: '1px solid var(--dsw-alias-border, #444)',
      background: 'transparent',
      color: 'var(--dsw-alias-text-primary, #ddd)',
    }
    const primary = Object.assign({}, button, {
      border: 'none',
      background: 'var(--dsw-alias-accent, #4a9eff)',
      color: '#fff',
    })

    function messageStyle(kind) {
      if (kind === 'saved') return Object.assign({}, hint, { color: 'var(--dsw-alias-state-success-primary)' })
      if (kind === 'error') return Object.assign({}, hint, { color: 'var(--dsw-alias-state-error-primary)' })
      return hint
    }

    function statusText(t, status) {
      if (!status.key) return ''
      return t(status.key) + (status.detail || '')
    }

    function PromptForm({ scope, t }) {
      const [snap, setSnap] = React.useState(scope.getSnapshot())
      const [draft, setDraft] = React.useState(null)
      const [status, setStatus] = React.useState({ kind: 'idle', key: null, detail: '' })

      React.useEffect(() => scope.subscribe(() => {
        setSnap(scope.getSnapshot())
        setDraft(null)
      }), [])

      if (snap.status === 'loading') {
        return React.createElement('div', { style: hint }, t('loading'))
      }

      const stored = snap.value && typeof snap.value === 'object' ? snap.value : null
      const baseEnabled = !!stored && stored.enabled === true
      const baseText = stored && typeof stored.text === 'string' ? stored.text : ''
      const enabled = draft !== null ? draft.enabled : baseEnabled
      const text = draft !== null ? draft.text : baseText
      const writable = snap.writable === true

      const save = async () => {
        setStatus({ kind: 'busy', key: 'saving', detail: '' })
        try {
          await scope.set('enabled', enabled === true)
          await scope.set('text', typeof text === 'string' ? text : '')
        } catch (error) {
          setStatus({ kind: 'error', key: 'failed', detail: String((error && error.message) || error) })
          return
        }
        const after = scope.getSnapshot()
        const next = after.value && typeof after.value === 'object' ? after.value : {}
        const landed = next.enabled === (enabled === true) && next.text === (typeof text === 'string' ? text : '')
        setStatus(landed
          ? { kind: 'saved', key: 'saved', detail: '' }
          : { kind: 'error', key: 'rejected', detail: '' })
      }

      const reset = async () => {
        setStatus({ kind: 'busy', key: 'saving', detail: '' })
        try {
          await scope.unset('enabled')
          await scope.unset('text')
          setStatus({ kind: 'saved', key: 'saved', detail: '' })
        } catch (error) {
          setStatus({ kind: 'error', key: 'failed', detail: String((error && error.message) || error) })
        }
      }

      return React.createElement('div', {
        style: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
      },
        React.createElement('h3', { style: { margin: '0', fontSize: '15px' } }, t('heading')),
        React.createElement('div', { style: hint }, t('intro')),
        React.createElement('label', { style: row },
          React.createElement('input', {
            type: 'checkbox',
            checked: enabled,
            disabled: !writable,
            onChange: (event) => {
              setDraft({ enabled: event.target.checked, text })
              setStatus({ kind: 'idle', key: null, detail: '' })
            },
          }),
          t('enabled'),
        ),
        React.createElement('label', { style: { fontSize: '14px' } }, t('text')),
        React.createElement('textarea', {
          value: text,
          disabled: !writable,
          rows: 12,
          placeholder: t('placeholder'),
          style: {
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            padding: '8px',
            borderRadius: '6px',
            background: 'var(--dsw-alias-surface-input, #1e1e1e)',
            color: 'var(--dsw-alias-text-primary, #ddd)',
            border: '1px solid var(--dsw-alias-border, #444)',
          },
          onChange: (event) => {
            setDraft({ enabled, text: event.target.value })
            setStatus({ kind: 'idle', key: null, detail: '' })
          },
        }),
        React.createElement('div', { style: hint }, t('textHint')),
        React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
          React.createElement('button', {
            style: primary,
            disabled: !writable || status.kind === 'busy',
            onClick: () => void save(),
          }, t('save')),
          React.createElement('button', {
            style: button,
            disabled: !writable || status.kind === 'busy',
            onClick: () => void reset(),
          }, t('reset')),
          status.key
            ? React.createElement('span', { style: messageStyle(status.kind) }, statusText(t, status))
            : null,
          !writable ? React.createElement('span', { style: hint }, t('readonly')) : null,
        ),
      )
    }

    function apply(ctx) {
      const slots = ctx.get('slots')
      const locale = ctx.get('locale')
      if (!React || !slots || !locale) return

      const t = locale.bind(LOCALE_NS)
      ctx.effect(() => locale.register(LOCALE_NS, { en, zh }), 'custom-prompt: dictionaries')

      const scope = ctx.configForms.get(NAMESPACE)

      slots.inject('settings.section', () => slots.register({
        name: 'settings.section',
        id: 'custom-prompt',
        order: 60,
        label: () => t('nav'),
        locale: LOCALE_NS,
      }, (props) => React.createElement(PromptForm, { scope, t: (props && props.t) || t })))
    }

    const inject = ['slots', 'configForms', 'locale']

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
