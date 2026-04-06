# Desenvolvimento nativo do app mobile

## Resumo

O app nativo em `apps/native` não roda mais no Expo Go. Agora ele depende de módulos nativos, incluindo `llama.rn` e o módulo local `provider-server`, então o fluxo correto é via Expo Dev Client.

## Quando usar cada comando

### Primeira instalação no Android físico

Use este comando para compilar o app nativo e instalar o dev client no celular conectado:

```bash
pnpm native:android:device
```

Ou, dentro do app nativo:

```bash
pnpm --filter native exec expo run:android --device
```

Esse passo é necessário quando:

- o dev client ainda não está instalado no device
- houve mudança nativa em dependências, config plugins ou módulo Expo local
- você limpou a instalação anterior do app

### Ciclo normal de desenvolvimento com dev client

Depois que o dev client já estiver instalado, o fluxo normal é só subir o bundler:

```bash
pnpm native:dev-client
```

Ou:

```bash
pnpm --filter native exec expo start --dev-client
```

Depois disso, abra o dev client no celular e conecte ao Metro.

### Emulador Android

Se você quiser usar emulador, use:

```bash
pnpm native:android:emulator
```

Ou:

```bash
pnpm --filter native exec expo run:android
```

Esse fluxo pode abrir um emulador automaticamente, dependendo da configuração do Android SDK e dos dispositivos disponíveis.

## Android físico

### Pré-requisitos

- celular Android com `Depuração USB` ativada
- `adb` disponível no sistema
- device autorizado via USB

### Verificar se o device está visível

```bash
adb devices
```

Você deve ver o aparelho listado como `device`.

Se aparecer `unauthorized`, confirme o prompt de autorização no celular.

## Regras práticas

- `Expo Go`: não funciona para este app
- `expo run:android --device`: compila e instala o binário nativo no celular
- `expo start --dev-client`: sobe o Metro para um dev client já instalado
- se houver mudança nativa, rode novamente `android:device` ou `android:emulator`
- se a mudança for só JavaScript/TypeScript, normalmente basta `dev:client`

## Quando precisa rebuildar

### Não precisa rebuildar

Se a mudança foi só em código JavaScript/TypeScript, normalmente basta:

```bash
pnpm native:dev-client
```

Exemplos:

- telas e navegação
- componentes visuais
- estado com Zustand
- lógica React Query
- textos e copy
- lógica de chat em TS
- rotas Expo Router

### Precisa rebuildar

Se a mudança afetou a camada nativa, você precisa compilar e reinstalar o app:

```bash
pnpm native:android:device
```

Exemplos:

- dependência nativa nova em `apps/native/package.json`
- mudança em `app.json`
- mudança de config plugin
- código em `apps/native/modules/...`
- mudança no módulo `provider-server`
- mudança no setup do `llama.rn`
- qualquer alteração que exija `expo prebuild` ou recompilação Android/iOS

## Scripts úteis

### Na raiz do monorepo

```bash
pnpm native:dev-client
pnpm native:android:device
pnpm native:android:emulator
```

### Dentro de `apps/native`

```bash
pnpm dev:client
pnpm android:device
pnpm android:emulator
```
