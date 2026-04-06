# berth-ai

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React Native, Expo, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm run dev
```

## Native App

The mobile app in `apps/native` now depends on native modules and does not run in Expo Go.

Recommended Android flow:

```bash
pnpm native:android:device
pnpm native:dev-client
```

For the full native development guide, see [docs/native-dev.md](./docs/native-dev.md).

## Git Hooks and Formatting

- Format and lint fix: `pnpm run check`

## Project Structure

```
berth-ai/
├── apps/
│   ├── native/      # Mobile application (React Native, Expo)
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run dev:native`: Start the React Native/Expo development server
- `pnpm run native:dev-client`: Start Metro for the Expo dev client
- `pnpm run native:android:device`: Build and install the native app on a connected Android device
- `pnpm run native:android:emulator`: Build and install the native app on the Android emulator
- `pnpm run check`: Run Biome formatting and linting
