# Frequently Asked Questions

## What is AI Health Vault?

A local-first family health archive combining Obsidian templates, AI prompt workflows, and an Apple Health export preprocessor. Your data stays on your machine.

## Do I need Redis?

No. Redis is optional and enables export job metadata caching when preprocessing large Apple Health exports repeatedly. The CLI works without Redis.

## Which AI tools are supported?

Any model that accepts text prompts: Claude, ChatGPT, Gemini, or local models (Ollama, LM Studio). Copy prompts from `prompts/` or use Claude Code skills from `.claude/skills/`.

## How do I import Apple Health data?

1. Export from the Health app on iPhone (Settings → Health → Export All Health Data).
2. Run the preprocessor CLI to split the XML/ZIP into CSV files.
3. Attach the CSV summaries to your AI workflow or paste into Obsidian.

## Is my health data sent to the cloud?

Only if you choose to paste it into a cloud AI service. The vault itself is local Markdown and CSV files in Obsidian.

## What Node.js version is required?

Node.js 20 or later.

## How do I run tests?

```bash
npm run validate
```

This runs type checking, linting, tests, and a production build.

## Where are field naming standards documented?

See `vault/知识库/推荐字段标准.md` for recommended field names across Markdown and CSV files.

## Can I use this without Obsidian?

Yes. The prompts, skills, and CSV outputs work with any editor. Obsidian provides the best experience for linked health notes.

## How do I report security issues?

See [SECURITY.md](../SECURITY.md) for responsible disclosure guidelines.
