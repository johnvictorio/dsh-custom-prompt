window.__ModuleLoader__.load({
  id: 'dsh-custom-prompt',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const NAMESPACE = 'custom-prompt'

    const LABELS = {
      nav: 'Custom Prompt',
      heading: 'Custom Prompt',
      intro: 'Adds one section to the system prompt of every agent in this process, on every agent preset. Disabled by default.',
      enabled: 'Enabled',
      text: 'Prompt text',
      textHint: 'Avoid {{braces}} other than {{customnote}}; unknown references make prompt rendering fail.',
      save: 'Save',
      reset: 'Reset',
      saving: 'Saving...',
      saved: 'Saved',
      rejected: 'The host rejected the write; it reverted to the stored value.',
      failed: 'Save failed: ',
      loading: 'Loading settings...',
      readonly: 'This browser cannot write settings.',
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

    function PromptForm({ scope }) {
      const [snap, setSnap] = React.useState(scope.getSnapshot())
      const [draft, setDraft] = React.useState(null)
      const [status, setStatus] = React.useState({ kind: 'idle', message: '' })

      React.useEffect(() => scope.subscribe(() => {
        setSnap(scope.getSnapshot())
        setDraft(null)
      }), [])

      if (snap.status === 'loading') {
        return React.createElement('div', { style: hint }, LABELS.loading)
      }

      const stored = snap.value && typeof snap.value === 'object' ? snap.value : null
      const baseEnabled = !!stored && stored.enabled === true
      const baseText = stored && typeof stored.text === 'string' ? stored.text : ''
      const enabled = draft !== null ? draft.enabled : baseEnabled
      const text = draft !== null ? draft.text : baseText
      const writable = snap.writable === true

      const save = async () => {
        setStatus({ kind: 'busy', message: LABELS.saving })
        try {
          await scope.set('enabled', enabled === true)
          await scope.set('text', typeof text === 'string' ? text : '')
        } catch (error) {
          setStatus({ kind: 'error', message: LABELS.failed + String((error && error.message) || error) })
          return
        }
        const after = scope.getSnapshot()
        const next = after.value && typeof after.value === 'object' ? after.value : {}
        const landed = next.enabled === (enabled === true) && next.text === (typeof text === 'string' ? text : '')
        setStatus(landed
          ? { kind: 'saved', message: LABELS.saved }
          : { kind: 'error', message: LABELS.rejected })
      }

      const reset = async () => {
        setStatus({ kind: 'busy', message: LABELS.saving })
        try {
          await scope.unset('enabled')
          await scope.unset('text')
          setStatus({ kind: 'saved', message: LABELS.saved })
        } catch (error) {
          setStatus({ kind: 'error', message: LABELS.failed + String((error && error.message) || error) })
        }
      }

      return React.createElement('div', {
        style: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
      },
        React.createElement('h3', { style: { margin: '0', fontSize: '15px' } }, LABELS.heading),
        React.createElement('div', { style: hint }, LABELS.intro),
        React.createElement('label', { style: row },
          React.createElement('input', {
            type: 'checkbox',
            checked: enabled,
            disabled: !writable,
            onChange: (event) => {
              setDraft({ enabled: event.target.checked, text })
              setStatus({ kind: 'idle', message: '' })
            },
          }),
          LABELS.enabled,
        ),
        React.createElement('label', { style: { fontSize: '14px' } }, LABELS.text),
        React.createElement('textarea', {
          value: text,
          disabled: !writable,
          rows: 12,
          placeholder: 'Add your prompt text here, then enable this section.',
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
            setStatus({ kind: 'idle', message: '' })
          },
        }),
        React.createElement('div', { style: hint }, LABELS.textHint),
        React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
          React.createElement('button', {
            style: primary,
            disabled: !writable || status.kind === 'busy',
            onClick: () => void save(),
          }, LABELS.save),
          React.createElement('button', {
            style: button,
            disabled: !writable || status.kind === 'busy',
            onClick: () => void reset(),
          }, LABELS.reset),
          status.message
            ? React.createElement('span', { style: messageStyle(status.kind) }, status.message)
            : null,
          !writable ? React.createElement('span', { style: hint }, LABELS.readonly) : null,
        ),
      )
    }

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (!React || !slots) return

      const scope = ctx.configForms.get(NAMESPACE)

      slots.inject('settings.section', () => slots.register({
        name: 'settings.section',
        id: 'custom-prompt',
        order: 60,
        label: () => LABELS.nav,
      }, () => React.createElement(PromptForm, { scope })))
    }

    const inject = ['slots', 'configForms']

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
