# Skills de terceros

`react-best-practices` y `web-design-guidelines` son copias de [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) en el commit `5a37a6329fbad3666c3207392a6a7c0110e92efb` (2026-11-20). Licencia MIT, de Vercel.

- De `react-best-practices` se omite `AGENTS.md`, que es la compilación de `rules/` y no añade contenido.
- `web-design-guidelines/references/command.md` coincide con el SHA-256 que declara su `SKILL.md` (con saltos de línea LF).
- Se revisaron enteras antes de copiarlas. Al actualizarlas, vuelve a leerlas: es contenido externo que los agentes siguen como instrucciones.

Las usan `.claude/agents/nextjs-reviewer.md` y `.claude/agents/ui-ux-reviewer.md`. Si una regla choca con `AGENTS.md`, manda `AGENTS.md`.
