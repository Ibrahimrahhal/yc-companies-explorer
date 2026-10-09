# Contributing to YC Companies Explorer

Thanks for helping make this better. Small, focused PRs are welcome.

## Quick start

```bash
npm install
npm run dev
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the Electron app locally |
| `npm run typecheck` | TypeScript checks |
| `npm run build` | Compile main / preload / renderer |
| `npm run dist` | Build a Windows installer into `release/` |

## Guidelines

1. Keep the feed **local-first** — never require an account.
2. Prefer newer YC batches when ranking companies.
3. Don’t commit secrets, `.env`, or local `state.json` caches.
4. Match the existing Cohere-inspired UI: white canvas, deep green bands, coral chips, restrained type.
5. If you change sync / seen / save behavior, mention the expected UX in the PR.

## Release flow

Releases are automated. Push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions builds Windows / macOS / Linux binaries and attaches them to the GitHub Release.

## Questions

Open an issue with reproduction steps, OS, and what you expected to happen.
