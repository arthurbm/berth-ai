# berth-ai agent notes

## Product

- This repo implements a local-first mobile app that downloads GGUF models, runs on-device inference, and exposes an OpenAI-compatible HTTP provider.
- Local chat exists, but the core product is the local provider.
- The product reference document is `docs/PRD.md`.

## Workspace

- Monorepo using `pnpm` and `turbo`.
- Main app lives in `apps/native`.
- Current shared packages are `packages/env` and `packages/config`.

## Runtime and platform

- `Expo Go` is not supported for this project.
- The correct workflow uses Expo Dev Client.
- `llama.rn`
- `@react-native-ai/llama`
- local Expo module at `apps/native/modules/provider-server`
- The real HTTP provider is Android-first.
- On iOS, `ProviderServer` exists as a stub and does not start a real server.

## HTTP provider

- Canonical contract: `POST /v1/responses`.
- Secondary compatibility layer: `POST /v1/chat/completions`.
- `GET /health`
- `GET /v1/models`
- `POST /v1/responses`
- `POST /v1/chat/completions`
- `/health` does not require auth.
- `/v1/*` requires a bearer token.
- Routing and payload adaptation are handled in TypeScript; the native module handles the socket and bridge layer.

## Models and inference

- The curated catalog currently lives at `apps/native/lib/constants/model-catalog.ts`.
- Installable models in this phase are text GGUF artifacts downloaded from real Hugging Face URLs.
- The embeddings item appears in the catalog as a future capability, but it is not part of the main runtime flow yet.
- Downloads use `expo-file-system/legacy` with pause and resume through `resumeData`.
- The local inference runtime lives at `apps/native/lib/inference/native-runtime.ts`.

## Local persistence

- Local persistence uses SQLite with Drizzle.
- `settings`
- `local_models`
- `conversations`
- `messages`
- `request_logs`
- `gambi_draft`
- The provider token is stored in Secure Store, not SQLite.

## Navigation and state

- Main app state flows through `apps/native/providers/app-data-provider.tsx`.
- The current worktree uses `Node`, `Models`, and `Chat` tabs.
- `Gambi` and `Settings` are secondary screens.
- Older phase 1 plans still mention `Home`, `API`, and `Activity`; use the current worktree shape when documenting or continuing implementation.

## Useful commands

- `pnpm native:android:device`
- `pnpm native:android:emulator`
- `pnpm native:dev-client`
- `pnpm check`
- `pnpm fix`

## Useful discoveries

- If you change anything in `apps/native/modules`, `app.json`, or native dependencies, rebuild the dev client.
- The provider shuts down when the app goes to the background and only restarts on foreground if it is still enabled and the platform supports it.
- The provider `baseUrl` stored in app state includes `/v1`, but the real health route is still `/health`.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues for `arthurbm/berth-ai`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.

## Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

### Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome is the underlying engine for formatting and linting. Most common issues are automatically fixable.

## When Biome Can't Help

Biome can catch formatting and many lint issues, but it does not validate product correctness. Pay extra attention to:

1. **Business logic correctness**: inference flow, provider behavior, auth checks, and request adaptation.
2. **Meaningful naming**: use names that reflect runtime state, provider semantics, and model lifecycle clearly.
3. **Architecture decisions**: keep route files in `app/` and product logic in providers, libs, hooks, and stores.
4. **Edge cases**: background transitions, missing model files, invalid tokens, interrupted downloads, and unsupported platform behavior.
5. **User experience**: operational clarity matters more than flashy UI; the app should make provider state, model state, and failure modes obvious.
6. **Documentation**: keep repo-specific facts in this file and human-facing usage guidance in `README.md`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
