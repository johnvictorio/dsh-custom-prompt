# dsh-custom-prompt

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) plugin that adds one editable section to the system prompt of every agent in the process, and gives you a Settings page to customize it.

Off by default. Enable it in **Settings > Custom Prompt**, write whatever you want the model to always follow, and save.

## What it does

- Registers a durable `custom-prompt` settings namespace: `{ enabled, text }`.
- When enabled, registers `text` as a system-prompt section at order 50, which places it after the persona and before tool guidance.
- Re-registers the section live whenever the setting changes. No restart needed to apply prompt edits.
- Adds a **Custom Prompt** page to the Settings panel: an enable toggle, a multiline text field, Save and Reset.

The section is registered in the **global** prompt layer, so it applies to every agent preset (standard, code, minimal, cordis, and any custom preset), not just one mode.

## Install

Build a tarball and add it to your profile:

```sh
npm pack
dsh plugin --profile web add file:/absolute/path/to/dsh-custom-prompt-1.0.0.tgz
```

Then add the bundle to the profile manifest in `~/.dsh/profiles/web/package.json`:

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-custom-prompt"
      ]
    }
  }
}
```

Restart the profile so the host loads the new row:

```sh
dsh web
```

The plugin carries its own `cordis.patch.yml`, which inserts the `custom-prompt` row once the bundle is listed.

## Usage

1. Open **Settings**, then **Custom Prompt**.
2. Check **Enabled**.
3. Write your prompt text, for example a short list of working rules.
4. **Save**. The change applies to subsequent model steps in every session.

**Reset** clears both stored fields and returns to the shipped defaults (disabled, empty).

Your text is stored in the `custom-prompt` section of `~/.dsh/settings.yaml`, so it survives restarts.

## Prompt variables

The plugin registers one variable, usable anywhere in the section text:

- `{{customnote}}` expands to a fixed reminder line.

DSH renders prompt variables strictly. Any other `{{reference}}` you write is unknown and makes prompt assembly throw, which fails the next model turn. Keep braces out of your text unless you register a matching variable.

## Requirements

- A DSH web profile with a settings document provider (`@deepseek-ai/dsh-settings-file`, included in the default web profile).
- The browser must connect over loopback. DSH settings writes are loopback-only, so from a remote browser the page reports that settings are unavailable and stays process-local.

## Notes and limits

- The plugin needs the `systemPrompt` service and is composed on the host plane. It publishes no services, so it does not need an `isolate` realm.
- Code changes require a profile restart. Prompt text edits do not.
- An empty `text`, or `enabled: false`, registers no section at all.

## Layout

| File | Purpose |
| --- | --- |
| `index.js` | Host half: settings namespace, prompt section registration, live re-registration |
| `client.js` | Browser half: the Settings page |
| `cordis.patch.yml` | Bundle patch that inserts the plugin row |
| `package.json` | Package manifest, `dsh.bundle.patch`, and `dsh.client` declarations |

## License

MIT
