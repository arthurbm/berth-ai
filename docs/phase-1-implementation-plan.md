# Plano completo de implementação do MVP Fase 1 em Expo Router + HeroUI Native

## Resumo

Construir a Fase 1 como um app mobile local-first que funciona primeiro como provider local de IA e secundariamente como chat embutido, usando o template
atual de Expo + Expo Router + HeroUI Native sem lutar contra a convenção do router.

O plano abaixo corrige o mapeamento para Expo Router:

- o app/ conterá apenas rotas e layouts
- a navegação principal será Tabs
- o Drawer será uma camada acima das tabs para expor áreas secundárias sem quebrar o fluxo principal
- cada tab principal terá seu próprio Stack interno para header, histórico e telas filhas
- componentes, hooks, repositórios, tipos e utilitários ficam fora de app/

Também vou adotar suas regras de frontend como restrição de produto visual desde o início:

- UI de app, não landing page
- sem mosaico de cards como linguagem padrão
- hierarquia calma, densa e operacional
- cópia utilitária
- uma superfície dominante por tela
- motion intencional, curto e funcional
- no máximo um acento cromático dominante

## Arquitetura de rotas com Expo Router

### Estrutura proposta de arquivos

A estrutura abaixo é a forma canônica para o produto dentro de Expo Router, preservando tabs como navegação primária e stacks por tab:

apps/native/app/
  _layout.tsx
  +not-found.tsx

  (app)/
    _layout.tsx                    # Drawer root
    gambi.tsx                      # Secundário no drawer
    settings.tsx                   # Secundário no drawer

    (tabs)/
      _layout.tsx                  # Tabs root, sem header

      (home)/
        _layout.tsx                # Stack do Home
        index.tsx

      (models)/
        _layout.tsx                # Stack de Modelos
        index.tsx
        [modelId].tsx              # Detalhe do modelo
        storage.tsx                # Visão de armazenamento/cache

      (chat)/
        _layout.tsx                # Stack do Chat
        index.tsx                  # Lista de conversas / conversa atual
        [conversationId].tsx       # Conversa específica

      (api)/
        _layout.tsx                # Stack da API
        index.tsx
        test.tsx                   # Teste do endpoint
        requests.tsx               # Requests recentes

      (activity)/
        _layout.tsx                # Stack da atividade
        index.tsx
        [requestId].tsx            # Detalhe de request/log

### Regras de navegação

- app/_layout.tsx mantém providers globais e um Stack raiz sem header visual de produto.
- app/(app)/_layout.tsx define o Drawer com:
    - item principal "(tabs)"
    - itens secundários gambi e settings
- app/(app)/(tabs)/_layout.tsx define as Tabs com:
    - home
    - models
    - chat
    - api
    - activity
- cada grupo de tab terá _layout.tsx próprio com Stack
- títulos, ações de header e telas filhas vivem nesses stacks internos, não no tab root
- nenhuma rota carrega componentes utilitários ao lado; app/ fica estritamente dedicado a rotas/layouts

### Racional do mapeamento

Esse shape evita três problemas comuns com Expo Router:

1. colocar header demais no root e perder controle de navegação por tab
2. misturar tabs com screens detalhadas no mesmo nível e quebrar histórico por área
3. usar o drawer como navegação principal de produto, quando o PRD pede superfícies centrais recorrentes e orientadas a operação

## Arquitetura de produto e UX por área

### 1. Home

Responsabilidade:

- orientar o usuário imediatamente para o estado atual do provider local

Composição:

- topo forte com nome do produto e estado operacional
- bloco principal de status do modelo ativo, endpoint e segurança
- sequência curta de ações prioritárias

Conteúdo:

- modelo ativo ou estado “nenhum modelo pronto”
- status do provider: offline, starting, online, error
- estado do token: protegido, pendente, inválido
- modo atual: chat local apenas ou provider ativo
- ações:
    - baixar primeiro modelo
    - abrir chat
    - abrir API
    - ativar exposição

Direção visual:

- sem hero de marketing
- primeira viewport funciona como painel operacional de alta legibilidade
- um único bloco dominante de status, não uma grade de cards

### 2. Modelos

Responsabilidade:

- gerenciar o catálogo e o ciclo de vida local dos modelos

Subsuperfícies:

- catálogo curado
- baixados no device
- armazenamento

Conteúdo:

- catálogo inicial curado em código
- cada modelo mostra:
    - nome
    - família
    - tamanho
    - capacidades
    - recomendação
    - compatibilidade aproximada
    - estado do download
- ações:
    - iniciar download
    - pausar/cancelar
    - remover
    - definir como ativo
    - abrir detalhe
- detalhe do modelo:
    - metadados completos
    - uso local
    - última execução
    - erros recentes
- armazenamento:
    - espaço total usado
    - espaço por modelo
    - limpeza de cache

Direção visual:

- listas com boa escaneabilidade
- ações inline e progressos claros
- cards só quando forem a unidade de interação principal, por exemplo item de catálogo pressionável

### 3. Chat

Responsabilidade:

- conversar localmente com o modelo ativo usando a mesma camada de inferência do provider

Subsuperfícies:

- lista de conversas
- thread atual
- estado do modelo

Conteúdo:

- nova conversa
- conversas anteriores
- composer com envio
- resposta incremental/streaming
- botão de interrupção
- limpar conversa
- indicador do modelo ativo em uso
- estados vazios claros:
    - sem modelo ativo
    - sem conversa
    - erro de geração

Fluxo:

- se não houver modelo pronto, o chat redireciona a ação para Modelos
- se houver modelo pronto mas nenhum ativo, o chat pede seleção
- cada mensagem e geração escreve no mesmo repositório que servirá de base para auditabilidade local

Direção visual:

- superfície de trabalho contínua
- pouco chrome
- foco na legibilidade da thread
- composer fixado no rodapé seguro
- sem balões decorativos pesados

### 4. API

Responsabilidade:

- controlar, entender e validar a exposição do provider local

Subsuperfícies:

- controle
- credenciais
- descoberta
- teste local
- compatibilidade

Conteúdo:

- toggle de exposição com confirmação
- endpoint status
- base URL
- host/IP e porta
- token
- copiar URL
- regenerar token
- health
- modelo ativo
- capacidades ativas
- botão de “testar endpoint”
- resumo da semântica suportada:
    - Responses
    - chat/completions
    - embeddings quando suportado de verdade

Estados:

- desligado por padrão
- confirmação antes de expor
- avisos explícitos para LAN/exposição externa
- mensagens claras de falha na subida do servidor local

Direção visual:

- uma superfície principal de controle com ações de alto peso
- detalhes técnicos abaixo em listas simples e copiáveis
- nada de “settings graveyard” com dezenas de toggles iguais

### 5. Atividade

Responsabilidade:

- mostrar o que entrou no provider e o que aconteceu

Conteúdo:

- requests recentes
- origem
- horário
- endpoint utilizado
- duração
- status
- modelo
- erros
- acesso ao detalhe por request

Escopo do MVP:

- histórico simples e local
- filtros básicos por status e endpoint
- sem observabilidade avançada ou analytics externo

Direção visual:

- lista operacional compacta
- números alinhados
- ícones só quando melhorarem scanning

### 6. Gambi

Responsabilidade:

- preparar a Fase 2 sem fingir integração pronta

Conteúdo:

- tela com posicionamento claro: “integração futura”
- draft de configuração local:
    - sala
    - credencial
    - modelo a publicar
    - preferência de visibilidade
- persistência local desses campos
- status: não configurado, rascunho salvo, pronto para integrar

O que não entra:

- conexão real
- presença em sala
- publicação remota
- sincronização remota

### 7. Ajustes

Responsabilidade:

- concentrar preferências de app e manutenção local

Conteúdo:

- tema
- preferências de logs
- limpeza de cache
- reset de token
- reset do estado local
- informações de build/runtime experimental

## Direção visual e sistema de frontend

### Tese visual

Um workspace técnico local-first, contido, confiável e preciso, com aparência de ferramenta séria de operação on-device, não de showcase de IA.

### Plano de conteúdo por tela

Cada tela terá uma função dominante:

- Home: orientar o estado global
- Modelos: operar o ciclo de vida dos modelos
- Chat: trabalhar a conversa
- API: controlar a exposição
- Atividade: inspecionar o uso
- Gambi: preparar o próximo modo
- Ajustes: manter o sistema

### Tese de interação

Movimentos obrigatórios do MVP:

1. transições de estado do provider com animação curta de presença
2. expansão/recolhimento suave de áreas de detalhe técnico
3. streaming visível no chat, com feedback incremental claro
4. progresso de download com animação funcional e legível
5. transições de entrada discretas entre empty state, erro e estado operacional

### Regras de composição

Aplicar estas restrições em todas as telas:

- nada de dashboard com mosaico de cards
- sem gradientes decorativos por trás de produto operacional
- hierarquia por spacing, peso tipográfico e blocos funcionais
- uma cor de acento principal para ação/estado
- tipografia forte para títulos, mas utilitária
- copy curta e operacional
- imagens não são necessárias no core app; se usadas, só quando agregarem narrativa real
- motion perceptível, mas contido
- sombras decorativas mínimas; a interface deve continuar premium sem depender delas

### Uso de HeroUI Native

HeroUI entra como biblioteca de primitives e semântica visual, não como desculpa para transformar tudo em card.

Usos prováveis:

- Button
- Card apenas onde o card é a unidade de toque
- Dialog
- Input/TextField
- Chip
- Separator
- Spinner
- Surface

Regra:

- preferir layout, listas, seções e divisores antes de empilhar Surface/Card em tudo

## Camadas internas e organização de código

### Estrutura fora de app/

apps/native/
  components/
    app-shell/
    navigation/
    status/
    models/
    chat/
    provider/
    activity/
    settings/

  features/
    home/
    models/
    chat/
    provider/
    activity/
    gambi/
    settings/

  lib/
    runtime/
    provider/
    storage/
    network/
    utils/
    constants/

  hooks/
  types/

### Domínios principais

- features/models
    - catálogo curado
    - estados de download
    - seleção do modelo ativo
    - armazenamento
- features/chat
    - conversas
    - mensagens
    - sessões de geração
- features/provider
    - configuração do endpoint
    - start/stop do servidor
    - token
    - healthcheck
    - teste do endpoint
- features/activity
    - leitura e gravação de logs locais
- features/gambi
    - configuração local futura
- features/home
    - agregação do estado global operacional

## Persistência local

### Armazenamento

Persistir localmente com separação por sensibilidade:

- SQLite:
    - catálogo resolvido e estado local dos modelos
    - downloads
    - conversas
    - mensagens
    - logs de requests
    - configurações do endpoint
    - preferências
    - rascunho de Gambi
- SecureStore:
    - token do provider
    - eventuais segredos futuros

### Entidades mínimas

- ModelCatalogEntry
- LocalModelRecord
- ModelDownloadJob
- Conversation
- ConversationMessage
- ProviderSettings
- ProviderExposureState
- ProviderRequestLog
- UserPreference
- GambiDraftConfig

### Regras de persistência

- o estado precisa sobreviver a restart
- o modelo ativo é único
- o provider não religa automaticamente sem regra explícita definida depois
- logs têm retenção local simples com limite de volume
- mensagens em geração interrompida ficam marcadas como incompletas, não apagadas

## Runtime on-device e adapters

### Objetivo

Chat e API devem usar a mesma fonte de verdade de inferência, não duas implementações paralelas.

### Adapters internos

- InferenceEngine
- ModelCatalogRepository
- LocalModelRepository
- ConversationRepository
- ProviderServer
- ProviderTester
- ActivityLogRepository

### Contratos mínimos

type ProviderCapability = "responses" | "chat_completions" | "embeddings";

type EndpointStatus = "offline" | "starting" | "online" | "error";

interface InferenceEngine {
  listInstalledModels(): Promise<LocalModelRecord[]>;
  getActiveModel(): Promise<LocalModelRecord | null>;
  setActiveModel(modelId: string): Promise<void>;
  generate(input: GenerationInput): AsyncIterable<GenerationEvent>;
  stopGeneration(sessionId: string): Promise<void>;
  getCapabilities(modelId: string): Promise<ProviderCapability[]>;
}

interface ProviderServer {
  start(settings: ProviderSettings): Promise<ProviderRuntimeInfo>;
  stop(): Promise<void>;
  getStatus(): Promise<EndpointStatus>;
}

interface ProviderTester {
  run(input: ProviderTestInput): Promise<ProviderTestResult>;
}

### Regra arquitetural importante

A forma canônica da geração nasce orientada a Responses e não a chat/completions.

Isso significa:

- o runtime gera uma representação canônica de itens/eventos
- o endpoint POST /v1/responses expõe isso quase diretamente
- o endpoint POST /v1/chat/completions adapta essa forma para compatibilidade
- a UI do chat consome a mesma sessão canônica, convertendo para thread renderizável

## Provider HTTP local e compatibilidade de API

### Prioridade de contrato

Seguir o PRD e o direcionamento de Open Responses:

1. Responses
2. chat/completions
3. embeddings quando houver suporte real

Referências:

- https://www.openresponses.org/
- https://www.openresponses.org/specification

### Endpoints do MVP

- GET /health
- GET /v1/models
- POST /v1/responses
- POST /v1/chat/completions

embeddings:

- não entra como endpoint ativo por padrão
- só é exposto quando o runtime suportar de fato
- a UI mostra a capacidade como indisponível até lá

### Regras de segurança

- provider desligado por padrão
- confirmação explícita ao ativar
- token obrigatório
- distinção visual entre:
    - local somente
    - LAN
    - externo/experimental
- logs locais básicos de acesso
- cópia explícita do risco ao expor

### Regras de disponibilidade

- Android é prioridade para a exposição real do provider
- iOS pode ficar marcado como experimental para exposição LAN se a camada nativa não sustentar o mesmo nível
- chat local, gestão de modelos e persistência continuam cross-platform

### Base URL e descoberta

A tela de API precisa mostrar:

- base URL completa
- IP/host local
- porta
- endpoint de health
- modelo ativo
- recursos ativos
- token
- ação de copiar
- ação de testar

### Teste interno do endpoint

O app executa um teste local com a própria configuração persistida:

- valida health
- valida autenticação
- valida modelo ativo
- faz uma chamada simples de responses
- registra sucesso/falha na atividade

## Catálogo de modelos

### Fonte do catálogo

Catálogo inicial curado no app.

### Conteúdo por item

Cada modelo do catálogo deve trazer:

- id
- slug
- displayName
- runtimeFamily
- source
- downloadUrl ou identificador de origem
- sizeLabel
- approxBytes
- capabilities
- recommended
- summary
- minDeviceHint

### Comportamentos

- listar disponíveis para download
- listar baixados
- ver estado:
    - not_downloaded
    - queued
    - downloading
    - paused
    - ready
    - in_use
    - error
- cancelar download
- remover modelo
- selecionar modelo ativo

### Tratamento de capacidade do device

O MVP não bloqueia com benchmark sofisticado, mas informa claramente:

- modelo recomendado
- modelo pesado
- risco de desempenho/memória
- falha de compatibilidade quando ocorrer

## Fluxos principais do MVP

### Fluxo A: primeiro uso

1. usuário entra no Home
2. entende imediatamente que o app roda e expõe modelo local
3. toca em baixar modelo
4. vai para Modelos
5. baixa um modelo recomendado
6. define o modelo como ativo
7. abre Chat e faz a primeira conversa
8. abre API
9. ativa o provider
10. copia URL/token
11. testa o endpoint no próprio app

### Fluxo B: uso recorrente

1. usuário entra
2. Home mostra modelo ativo e status do provider
3. vai para Chat ou API diretamente
4. ativa/desativa o endpoint conforme necessidade
5. consulta Atividade para requests recentes

### Fluxo C: preparação de Gambi

1. usuário abre Gambi pelo drawer
2. preenche rascunho local de sala/credencial/modelo
3. salva
4. vê status “pronto para integrar”
5. nada remoto é acionado

## Estados vazios, erros e edge cases

### Estados vazios obrigatórios

- nenhum modelo instalado
- nenhum modelo ativo
- nenhuma conversa
- nenhuma atividade
- provider nunca ativado
- gambi ainda não configurado

### Erros obrigatórios

- download falhou
- armazenamento insuficiente
- runtime não carregou modelo
- geração falhou
- servidor local não subiu
- token inválido
- teste do endpoint falhou
- feature experimental indisponível na plataforma

### Recuperação

- ações de retry explícitas
- mensagens curtas e operacionais
- status persistido de forma coerente após restart
- nunca perder contexto do usuário por trocar de aba

## Plano técnico por etapas de implementação

### Etapa 1: fundação de navegação e shell

- remover boilerplate atual de tabs/home/modal que não serve ao produto
- reestruturar app/ no shape descrito acima
- criar shells de tela com títulos corretos por stack
- montar tab bar e drawer finais
- criar componentes base de status, seção e listas operacionais
- normalizar tema e tokens visuais

### Etapa 2: domínio local e persistência

- criar tipos centrais
- criar repositórios locais
- definir schema SQLite
- integrar SecureStore para token
- montar hooks de leitura/escrita por feature
- preencher dados iniciais do catálogo curado

### Etapa 3: gestão de modelos

- construir a lista de catálogo
- construir a lista de baixados
- construir detalhe do modelo
- conectar ações de download/pausa/cancelamento/remoção
- manter seleção de modelo ativo persistida

### Etapa 4: chat local

- implementar lista de conversas
- implementar thread
- implementar composer
- plugar streaming incremental
- implementar stop generation
- persistir conversas e mensagens

### Etapa 5: provider HTTP local

- integrar adapter de servidor local compatível com build nativo
- start/stop do provider
- health
- models
- responses
- compat layer de chat completions
- token obrigatório
- teste local interno
- registro de activity

### Etapa 6: atividade e inspeção

- lista de requests recentes
- detalhe do request
- filtros básicos
- persistência com retenção simples

### Etapa 7: Gambi e ajustes

- tela Gambi com draft persistido
- ajustes e ações de manutenção
- reset controlado de cache/token/logs
- marcar capacidades futuras sem simular integração pronta

### Etapa 8: refinamento visual e motion

- revisar densidade e ritmo de spacing
- remover cardização excessiva
- ajustar headings e copy
- adicionar motion intencional final
- ajustar empty states e erros para consistência visual

## Testes e cenários de aceitação

### Navegação

- todas as tabs abrem corretamente
- cada tab mantém seu próprio histórico interno
- drawer abre Gambi e Ajustes sem quebrar stacks
- rota / sempre resolve para a entrada principal da app

### Modelos

- catálogo carrega
- download inicia
- pausa/cancelamento funcionam
- remoção funciona
- seleção de modelo ativo persiste
- estados sobrevivem ao restart

### Chat

- nova conversa funciona
- envio de prompt funciona
- streaming incremental aparece
- interrupção funciona
- conversa persiste
- erro de geração é exibido e logado

### API

- provider inicia e para
- health responde
- models responde
- responses responde
- chat/completions responde
- token é exigido
- copiar URL/token funciona
- teste interno acusa sucesso e falha corretamente

### Atividade

- requests são registradas
- filtros básicos funcionam
- detalhe mostra origem, duração, status e erro
- retenção simples evita crescimento infinito

### Persistência

- restart mantém:
    - modelo ativo
    - conversas
    - token
    - preferências
    - logs dentro da política de retenção

### Plataforma

- Android é validado como alvo principal do provider exposto
- iOS mantém comportamento íntegro no restante do app
- se exposição real no iOS não estiver madura, a UI mostra isso explicitamente como experimental

## Mudanças de interface e contratos públicos internos

### Tipos centrais

- ModelCatalogEntry
- LocalModelRecord
- ModelDownloadState
- ProviderCapability
- ProviderSettings
- ProviderRuntimeInfo
- ProviderRequestLog
- ProviderTestInput
- ProviderTestResult
- Conversation
- ConversationMessage
- GenerationInput
- GenerationEvent
- GambiDraftConfig

### Contratos canônicos

- InferenceEngine.generate(input): AsyncIterable<GenerationEvent>
- InferenceEngine.stopGeneration(sessionId): Promise<void>
- ProviderServer.start(settings): Promise<ProviderRuntimeInfo>
- ProviderServer.stop(): Promise<void>
- ProviderServer.getStatus(): Promise<EndpointStatus>
- ProviderTester.run(input): Promise<ProviderTestResult>

### Forma canônica de geração

A forma canônica deve permitir:

- texto incremental
- término
- erro
- metadados de uso
- tool/event slots futuros

Isso preserva espaço para Open Responses sem obrigar refactor profundo quando multimodal ou tool calling entrarem depois.

## Assumptions e defaults escolhidos

- idioma inicial: PT-BR
- build nativo é aceitável e pode ser necessário
- Expo Go não é restrição do MVP
- catálogo inicial é curado no app
- token é obrigatório quando o provider é exposto
- Android é a prioridade para exposição LAN real
- Gambi fica preparado, sem integração funcional nesta entrega
- foco do MVP é texto
- embeddings só entra se houver suporte real sem degradar o plano
- a UI segue linguagem de app operacional, não de marketing
- o uso de HeroUI Native será controlado para evitar visual genérico de surfaces/cards
- o app/ do Expo Router conterá apenas rotas/layouts; toda a lógica de domínio fica fora dele

## Riscos e contenções já incorporados ao plano

### 1. Expo Router mal estruturado

Contenção:

- árvore de rotas explícita com tabs e stacks internos por área
- drawer acima das tabs e não como navegação primária de trabalho
- zero co-location de lógica em app/

### 2. Provider HTTP local em mobile

Contenção:

- adapter isolado em ProviderServer
- Android como prioridade
- feature flag visual para limitações por plataforma
- restante do MVP independe do sucesso total dessa camada em iOS

### 3. App parecer “só chat”

Contenção:

- Home e API são estruturados para colocar o provider no centro
- status operacional aparece antes da thread de chat
- linguagem do produto reforça o papel de endpoint local

### 4. Frontend cair em boilerplate genérico

Contenção:

- no cards by default
- one-surface-per-screen
- utility copy
- layout-led composition
- motion funcional
- revisão visual prevista como etapa própria

## Referências externas usadas para travar o plano

- Open Responses overview: https://www.openresponses.org/
- Open Responses specification: https://www.openresponses.org/specification
- React Native AI docs: https://www.react-native-ai.dev/docs