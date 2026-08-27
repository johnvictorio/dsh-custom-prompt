import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

export const name = 'dsh-custom-prompt'
export const inject = ['systemPrompt']

const NAMESPACE = settingsNamespace('custom-prompt')
const SECTION_NAME = 'custom:prompt'
const SECTION_ORDER = 50
const NOTE_VARIABLE = 'customnote'
const NOTE_TEXT = 'Verify your work before reporting completion.'

const CustomPromptSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().default(''),
})

export function apply(ctx) {
  ctx.systemPrompt.variable(NOTE_VARIABLE, () => NOTE_TEXT)

  let disposeSection

  const refresh = (settings) => {
    if (disposeSection !== undefined) {
      disposeSection()
      disposeSection = undefined
    }

    const value = settings.get(NAMESPACE)
    if (!value || typeof value !== 'object') return
    if (value.enabled !== true) return
    if (typeof value.text !== 'string' || value.text.trim() === '') return

    disposeSection = ctx.systemPrompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      text: value.text.trim(),
    })
  }

  const install = (settings) => {
    settings.register(NAMESPACE, CustomPromptSchema)
    refresh(settings)
    ctx.on('settings/updated', (changed) => {
      if (changed === NAMESPACE) refresh(settings)
    })
  }

  const settings = ctx.get('settings')
  if (settings !== undefined) {
    install(settings)
  } else if (typeof ctx.inject === 'function') {
    ctx.inject(['settings'], (sub) => {
      const provider = sub.get('settings')
      if (provider !== undefined) install(provider)
    })
  }
}
