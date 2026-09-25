import z from '@deepseek-ai/schemastery'

export const name = 'dsh-custom-prompt'
export const inject = ['systemPrompt']

export const Config = z.object({
  enabled: z.boolean().default(false).volatile(),
  text: z.string().default('').volatile(),
})

const SECTION_NAME = 'custom:prompt'
const SECTION_ORDER = 50
const NOTE_VARIABLE = 'customnote'
const NOTE_TEXT = 'Verify your work before reporting completion.'

export function apply(ctx, config) {
  ctx.systemPrompt.variable(NOTE_VARIABLE, () => NOTE_TEXT)

  let disposeSection

  const refresh = () => {
    if (disposeSection !== undefined) {
      disposeSection()
      disposeSection = undefined
    }
    if (config.enabled.get() !== true) return
    const text = config.text.get()
    if (typeof text !== 'string' || text.trim() === '') return
    disposeSection = ctx.systemPrompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      text: text.trim(),
    })
  }

  refresh()
  ctx.on('loader/volatile-update', () => refresh())

  ctx.effect(() => () => {
    if (disposeSection !== undefined) disposeSection()
  })
}
