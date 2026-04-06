# berth-ai

Local-first mobile app for running GGUF models on-device, chatting with them locally, and exposing an OpenAI-compatible HTTP provider from the phone.

The product is designed first as a local provider with a mobile app UX. The built-in chat matters, but the main architectural goal is to turn the device into a reusable inference endpoint.

## What exists today

- local download and management of GGUF models
- on-device inference via `llama.rn` and `@react-native-ai/llama`
- local chat with persisted conversations
- local HTTP provider with canonical contract at `/v1/responses`
- secondary compatibility with `/v1/chat/completions`
- healthcheck, local token, endpoint test flow, and recent request logs
- structure prepared for future Gambi integration

## Current status and limitations

- The real HTTP provider is supported on Android.
- On iOS, local chat still works, but the HTTP provider remains experimental and does not start for real.
- The app depends on native modules and does not run in `Expo Go`.
- The current catalog includes an embeddings item as a future capability, but this phase is text-first.
- The `/health` endpoint is open for local discovery; `/v1/*` requires a bearer token.

## Current app navigation

Main tabs:

- `Node`: provider status, URL, token, endpoint test, and recent activity
- `Models`: catalog, downloads, active model selection, and storage
- `Chat`: local conversation with the active model

Secondary screens:

- `Gambi`
- `Settings`

## Running the project

Install dependencies at the repo root:

```bash
pnpm install
```

Because the app uses native modules, the recommended Android flow is:

```bash
pnpm native:android:device
pnpm native:dev-client
```

For the Android emulator:

```bash
pnpm native:android:emulator
```

Detailed native development guide:

- [docs/native-dev.md](./docs/native-dev.md)

## Main scripts

At the repo root:

```bash
pnpm dev
pnpm build
pnpm check-types
pnpm check
pnpm fix
pnpm native:dev-client
pnpm native:android:device
pnpm native:android:emulator
```

## Project structure

```text
berth-ai/
├── apps/native/     # Expo/React Native app with local runtime and HTTP provider
├── packages/env/    # shared workspace env package
├── packages/config/ # shared TypeScript config package
└── docs/            # PRD, implementation plans, and native dev guide
```

## Product documentation

- [docs/PRD.md](./docs/PRD.md)
- [docs/phase-1-implementation-plan.md](./docs/phase-1-implementation-plan.md)
- [docs/phase-1-part-2-implementation-plan.md](./docs/phase-1-part-2-implementation-plan.md)

## Notes for contributors

- `apps/native` is the current center of the product.
- Local persistence uses SQLite with Drizzle.
- The inference runtime and the HTTP provider share the same app state foundation.
- If you change `llama.rn`, `app.json`, or anything under `apps/native/modules`, rebuild the dev client.
