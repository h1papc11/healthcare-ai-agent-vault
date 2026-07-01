# AI Health Vault — Internal Repository Audit

> Generated during the production-ready fork initiative.

## Current Architecture (Pre-Fork)

The upstream repository is a **content-driven health archive starter kit**, not a traditional application:

| Layer | Technology | Role |
|-------|------------|------|
| Storage / UI | Obsidian vault (Markdown + CSV) | Local family health archive |
| AI workflows | Markdown prompts + Claude Code skills | Eight health analysis workflows |
| Preprocessing | Python stdlib CLI | Apple Health XML/ZIP → CSV conversion |
| Knowledge base | Markdown field standards | Consistent naming across vault files |

```
User inputs (photos, PDFs, Apple exports)
        ↓
   AI (Claude / ChatGPT / Gemini / local LLM)
        ↓
Structured Markdown + CSV in Obsidian vault
        ↓
Optional: Python preprocessor for large Apple Health XML
```

## Major Weaknesses Identified

1. **No application runtime** — no package manager, build pipeline, or CI.
2. **Python-only preprocessing** — single script with no typed API surface.
3. **No persistence layer** — export job metadata and caching unavailable.
4. **Missing FAQ** — README references `guides/FAQ.md` that does not exist.
5. **No linting or formatting** — only `.editorconfig` present.
6. **Cross-platform test fragility** — tests hardcode `python3` subprocess calls.
7. **No structured logging or error taxonomy** — CLI prints to stderr only.
8. **Misleading `.gitignore`** — anticipates Node tooling that was not wired up.

## Recommended Improvements (Implemented in Fork)

1. **TypeScript application layer** — strict mode, typed services, Vitest tests.
2. **Port Apple Health preprocessor** — streaming SAX parser preserving original behavior.
3. **Redis persistence** — connection manager with retry, graceful shutdown, env config.
4. **Centralized configuration** — Zod-validated environment variables.
5. **Structured logging** — level-based logger for CLI and services.
6. **Typed error hierarchy** — predictable failure modes for operators.
7. **Developer tooling** — ESLint, Prettier, build/lint/test/typecheck scripts.
8. **Documentation overhaul** — modern README with architecture and workflow diagrams.
9. **Repository hygiene** — updated `.gitignore`, `.env.example`, removed legacy Python.

## Preserved Core Functionality

- Obsidian vault templates (`vault/`)
- AI prompt library (`prompts/`)
- Claude Code skills (`.claude/skills/`)
- Setup guides (`guides/`)
- Apple Health export preprocessing (now TypeScript CLI)
