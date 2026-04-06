# Native App

## Resumo

Este app roda com Expo Dev Client e módulos nativos. `Expo Go` não funciona aqui.

Guia completo:

- [../../docs/native-dev.md](../../docs/native-dev.md)

## Fluxo rápido

Primeira instalação no Android físico:

```bash
pnpm android:device
```

Depois disso, no ciclo normal:

```bash
pnpm dev:client
```

Se quiser emulador:

```bash
pnpm android:emulator
```

## O que cada comando faz

- `pnpm android:device`: compila e instala o binário nativo no device Android conectado
- `pnpm android:emulator`: compila e instala no emulador Android
- `pnpm dev:client`: sobe o Metro para um dev client já instalado

## Quando rebuildar

### Só precisa subir o Metro

Se a mudança foi só em TS/JS:

```bash
pnpm dev:client
```

Exemplos:

- telas
- componentes
- estado
- hooks
- textos
- lógica React

### Precisa rebuildar o app

Se a mudança foi nativa:

```bash
pnpm android:device
```

ou:

```bash
pnpm android:emulator
```

Exemplos:

- mudança em `app.json`
- dependência nativa nova
- mudança em `modules/`
- mudança no `provider-server`
- mudança no `llama.rn`

## Troubleshooting

### `Expo Go` abriu, mas o app não funciona

Esse app não é compatível com Expo Go. Use Expo Dev Client.

### `expo run:android` abriu o emulador sem eu querer

Use:

```bash
pnpm android:device
```

O `--device` força a escolha de um aparelho físico conectado.

### O celular não aparece

Cheque:

```bash
adb devices
```

Se aparecer `unauthorized`, aceite o prompt de depuração USB no celular.

### Mudei dependência nativa, plugin ou módulo Expo local

Rode novamente:

```bash
pnpm android:device
```

ou:

```bash
pnpm android:emulator
```

Se a mudança foi só em TS/JS, normalmente basta:

```bash
pnpm dev:client
```

### O build Android existe no diretório, mas eu uso CNG

`apps/native/android` é artefato derivado de `expo prebuild` e pode ser recriado quando necessário para validação ou build local.
