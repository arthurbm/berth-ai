# Plano da Fase 1.5 — Inferência real on-device + provider HTTP local

## Resumo

Substituir o adapter simulado por uma stack real em duas camadas, sem reescrever a UI: inferência local via @react-native-ai/llama + AI SDK no JavaScript,
e provider HTTP local via módulo nativo Expo no Android, mantendo /v1/responses como contrato canônico e /v1/chat/completions como camada de
compatibilidade. O chat e o endpoint passam a usar a mesma InferenceEngine, e o provider exposto fica oficialmente suportado só no Android nesta etapa; no
iOS, o plano mantém chat local e marca a exposição HTTP como experimental/indisponível.

## Mudanças de implementação

### Runtime real de inferência

- Adotar @react-native-ai/llama e ai no app nativo, com os polyfills exigidos pelo React Native AI carregados cedo no bootstrap do app.
- Encerrar a dependência do streaming fake em apps/native/providers/app-data-provider.tsx e mover a geração para um InferenceEngine real com
  AbortController por sessão.
- Usar llama.languageModel(localPath) + streamText() como caminho padrão de geração de texto; generateText() só para health/testes rápidos e casos não-
  streaming.
- Padronizar a entrada interna como texto/mensagens text-only. Tool calling, multimodal, JSON schema e embeddings ficam explicitamente fora desta etapa e
  devem retornar erro de feature não suportada no provider.
- Aquecer o modelo ativo com prepare() quando o usuário o seleciona ou quando o provider sobe; descarregar o modelo anterior quando trocar o ativo ou após
  desligar o provider.

### Download e ciclo de vida de modelos

- Não usar downloadModel() do React Native AI como fonte principal do catálogo, porque o produto já precisa de progresso, pausa, retomada, cancelamento e
  remoção sob controle do app.
- Baixar GGUF com expo-file-system/legacy DownloadResumable, persistindo resumeData para pausa/retomada, e passar o localPath final para o runtime do
  Llama.
- Atualizar o catálogo curado para conter identificador canônico do artefato e URL real do arquivo GGUF. slug deixa de ser apenas rótulo e passa a mapear
  1:1 para o artefato baixado.
- Manter apenas modelos de texto como instaláveis nesta etapa. O item de embeddings continua visível como futuro, mas não pode ser baixado nem exposto.
- Persistir no SQLite, no mínimo: artifactId, downloadUrl, localPath, resumeData, preparedAt, runtimeStatus, além dos campos já existentes de progresso/
  bytes/erro.

### Provider HTTP local

- Criar um módulo local Expo em apps/native/modules para o ProviderServer.
- Implementação Android: servidor HTTP embarcado via NanoHTTPD, com ciclo de vida controlado pelo app e sem ambição de background service nesta etapa.
- Implementação iOS: stub nativo que expõe a mesma interface TS, mas retorna transportReady=false e impede start real do provider.
- O módulo nativo só cuida de socket, request parsing e escrita de resposta; a roteirização, autenticação, seleção de modelo e adaptação de payload ficam
  no JS em um ProviderRouter, para preservar uma única InferenceEngine.
- Fluxo do bridge: o servidor nativo emite requestReceived(requestId, method, path, headers, body); o JS responde via respond(requestId, status, headers,
  body) ou respondStream(requestId, chunks...).
- Expor estes endpoints:
- GET /health sem autenticação, retornando status, activeModelId, transport, platformSupport e uptime.
- GET /v1/models com bearer obrigatório.
- POST /v1/responses com bearer obrigatório; suporta input texto, stream, temperature, max_output_tokens e model.
- POST /v1/chat/completions com bearer obrigatório; suporta messages, stream, temperature, max_tokens e model.
- Streaming HTTP deve sair como SSE quando stream=true; chamadas sem streaming retornam JSON completo.
- POST /v1/chat/completions deve ser uma adaptação para o contrato canônico interno de Responses, nunca um segundo caminho de inferência.

### Estado, tipos e UX operacional

- Em apps/native/types/app-state.ts, manter EndpointStatus, mas adicionar:
- LocalModelRecord.runtimeStatus: unloaded | preparing | ready | generating | error
- ProviderRuntimeInfo.platformSupport: full | experimental | unsupported
- ProviderRuntimeInfo.lastError: string | null
- ProviderRuntimeInfo.lastStartedAt: string | null
- ProviderRequestLog.statusCode: number | null
- ProviderRequestLog.clientAddress: string | null
- Trocar o transportMode padrão de simulated para native_llama depois que a stack real estiver funcional; enquanto a plataforma não suportar provider real,
  a UI deve refletir isso sem simular prontidão.
- O runProviderTest() deve usar expo/fetch contra o endpoint real, validando em sequência: /health, auth em /v1/models, e uma chamada mínima a /v1/
  responses.
- O chat deve continuar escrevendo no mesmo banco local, mas agora consumindo deltas reais do runtime em vez de timers artificiais.
- Ao entrar em background, o app deve desligar o provider HTTP e marcar endpointStatus=offline; ao voltar para foreground, religa automaticamente só se
  providerEnabled=true, houver modelo ativo pronto e a plataforma suportar o provider.

## APIs e contratos a introduzir

- InferenceEngine.generate(input, signal): AsyncIterable<InferenceEvent>
- InferenceEngine.prepareModel(modelId): Promise<void>
- InferenceEngine.unloadModel(modelId): Promise<void>
- InferenceEngine.stopGeneration(sessionId): Promise<void>
- ProviderServer.start(config): Promise<ProviderRuntimeInfo>
- ProviderServer.stop(): Promise<void>
- ProviderServer.getStatus(): Promise<EndpointStatus>
- ProviderServer.respond(requestId, response): Promise<void>
- ProviderServer.respondStream(requestId, responseStart, chunks): Promise<void>
- ProviderRouter.handle(request): Promise<ProviderResponse | ProviderStreamResponse>
- GenerationInput deve aceitar apenas texto e mensagens text-only nesta etapa.
- InferenceEvent deve cobrir, no mínimo: response.started, response.output_text.delta, response.completed, response.error.

## Testes e critérios de aceite

- Build nativo de desenvolvimento passa a ser pré-requisito; esta etapa não deve depender de Expo Go.
- Android:
- baixar um GGUF real, pausar, retomar, concluir, remover e reabrir o app sem perder metadados
- selecionar modelo ativo, aquecer runtime e obter resposta real no chat com streaming
- interromper geração no chat e registrar cancelamento real
- ligar provider, validar /health, /v1/models, /v1/responses e /v1/chat/completions
- validar 401 sem bearer ou com token inválido em /v1/*
- validar logs locais com statusCode, latencyMs, clientAddress e responsePreview
- validar desligamento automático do provider ao background
- iOS:
- baixar modelo e gerar no chat com a mesma InferenceEngine
- impedir start real do provider e mostrar estado operacional claro de suporte experimental/indisponível
- Regressão:
- tsc --noEmit no app nativo
- ultracite check apps/native
- smoke test manual em Home, Modelos, Chat, API, Atividade e Ajustes para refletirem estado real e não mais simulado

## Assunções e defaults escolhidos

- Escopo desta etapa: inferência real + provider HTTP real.
- Plataforma oficial do provider exposto: Android primeiro.
- Contrato canônico: /v1/responses; chat/completions é apenas compat layer.
- Provider foreground-only nesta etapa; sem background execution persistente.
- Token obrigatório em /v1/*; /health fica aberto para descoberta local.
- Gambi continua fora de escopo de implementação, mas o provider deve preservar semântica compatível com o fluxo futuro de rooms/proxy.
- Embeddings continuam fora desta entrega.
- O catálogo curado será ajustado para artefatos GGUF reais e compatíveis com o runtime escolhido.

## Referências

- React Native AI docs (https://www.react-native-ai.dev/docs)
- React Native AI Llama model management (https://www.react-native-ai.dev/docs/llama/model-management)
- React Native AI polyfills para Expo (https://www.react-native-ai.dev/docs/polyfills)
- Expo FileSystem SDK 55 (https://docs.expo.dev/versions/v55.0.0/sdk/filesystem/)
- Expo FileSystem legacy resumable downloads (https://docs.expo.dev/versions/v55.0.0/sdk/filesystem-legacy/)
- Expo native modules tutorial (https://docs.expo.dev/modules/native-module-tutorial/)
- Open Responses (https://www.openresponses.org/)
- Gambi llms.txt (https://www.gambi.sh/llms.txt)