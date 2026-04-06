# PRD — App mobile local-first para inferência on-device com API OpenAI-compatible

## 1. Resumo do produto

O produto é um aplicativo mobile que permite ao usuário **baixar, gerenciar, executar e conversar com modelos locais no próprio dispositivo**, e principalmente **expor esse modelo para outros clientes por meio de uma API OpenAI-compatible**, com **preferência por compatibilidade com a Responses API** e compatibilidade secundária com `chat/completions` e `embeddings`. Em uma fase posterior, o mesmo app poderá **publicar esse provider local em uma sala do Gambi**, para que o modelo fique disponível em uma rede privada ou pública por meio da infraestrutura e da semântica do Gambi. ([Gambi][1])

O produto será construído sobre um template já iniciado em React Native/Expo, com HeroUI Native e utilitários/skills já presentes no projeto. O PRD abaixo foca em **produto, comportamento, requisitos e fases**, não em fixar detalhes de implementação.

## 2. Contexto

O Gambi se posiciona como um hub local-first para compartilhar LLMs em rede, agrupando endpoints como Ollama, LM Studio, LocalAI, vLLM e qualquer endpoint OpenAI-compatible, com uso por salas e um proxy HTTP único. A própria documentação também destaca compatibilidade com Vercel AI SDK workflows e com endpoints que exponham `OpenResponses` ou `chat/completions`. Isso cria um encaixe natural para um app mobile que funcione primeiro como **provider local OpenAI-compatible** e, depois, como **participant/provider em uma sala do Gambi**. ([Gambi][1])

Do lado do runtime/app, o React Native AI se posiciona como uma coleção de primitivas de AI on-device com suporte de primeira classe ao Vercel AI SDK. Ele hoje oferece provider baseado em `llama.rn` para rodar qualquer modelo GGUF do Hugging Face localmente, com download e cache de modelos, além de suporte a embeddings e reranking no ecossistema Llama. ([react-native-ai.dev][2])

O AI SDK da Vercel, por sua vez, se posiciona como uma camada unificada para geração de texto, objetos estruturados, tool calling e UI generativa, com quickstart oficial para Expo. A documentação do ecossistema também trata a **Responses API** como a alternativa moderna à antiga Chat Completions API. ([AI SDK][3])

## 3. Problema

Hoje, rodar modelo local no celular e conversar com ele já é possível, mas **transformar o celular em um provider reutilizável por outros clientes e outras aplicações ainda é difícil**. As opções existentes são boas para uso individual, mas menos boas para:

* baixar e gerenciar modelos locais no device
* manter uma camada padronizada de API
* expor esse modelo para outros clientes na LAN ou na internet
* conectar esse provider a uma rede maior, como uma sala do Gambi

O produto resolve esse espaço: **um app que não é só “um chat local”, mas um provider local de IA com UX de app mobile**.

## 4. Visão

Transformar o celular em um **nó local de inferência** que qualquer pessoa consiga usar de forma simples, segura e padronizada.

## 5. Objetivos do produto

### Objetivos principais

1. Permitir que o usuário **baixe e gerencie modelos locais** no próprio device.
2. Permitir que o usuário **converse com o modelo localmente**, com experiência de chat confiável.
3. Permitir que o app **exponha o modelo por uma API OpenAI-compatible**, com preferência por **Responses API**.
4. Permitir que o usuário **controle quando e como o endpoint fica acessível**.
5. Preparar o produto para que, em uma fase posterior, esse provider local possa ser **publicado em uma sala do Gambi**. ([Gambi][1])

### Objetivos secundários

1. Manter o produto local-first e offline-friendly.
2. Permitir evolução posterior para capacidades de GenAI além de texto, como imagem, áudio, embeddings e reranking.
3. Reaproveitar o máximo possível do ecossistema de AI SDK e React Native AI para reduzir atrito de produto. ([react-native-ai.dev][2])

## 6. Não objetivos

Na primeira versão, o produto **não precisa**:

* ser o melhor benchmark de performance mobile da categoria
* suportar todos os tipos de modelo multimodal desde o dia 1
* otimizar para todos os cenários de background execution complexa
* substituir o Gambi como hub/orquestrador
* resolver billing, uso multi-tenant avançado ou observabilidade enterprise

## 7. Público-alvo

### Público primário

Pessoas técnicas, builders, devs e entusiastas que querem:

* rodar IA local no próprio celular
* testar modelos sem depender de cloud
* disponibilizar esse modelo para outros apps, devices ou fluxos locais
* integrar isso depois a um hub compartilhado

### Público secundário

Times pequenos, grupos de estudo, hackathons e labs que querem usar o celular como mais um ponto de inferência dentro de uma rede local ou compartilhada, alinhado ao tipo de caso de uso que o próprio Gambi destaca em dev teams, hackathons, research labs, home labs e educação. ([Gambi][4])

## 8. Jobs to be done

* “Quero baixar um modelo local no meu celular e conversar com ele imediatamente.”
* “Quero expor esse modelo para a minha rede local de forma simples.”
* “Quero que outro cliente fale com esse modelo como se estivesse falando com um endpoint OpenAI-compatible.”
* “Quero ligar e desligar a exposição do meu modelo sem complicação.”
* “Quero, depois, conectar esse provider local a uma sala do Gambi.”

## 9. Proposta de valor

**Seu modelo local no bolso, acessível como API.**

Ou, de forma mais expandida:

* roda no seu device
* conversa localmente
* expõe um endpoint padronizado
* depois entra em uma sala do Gambi

## 10. Princípios de produto

1. **Local-first por padrão**
   O estado principal do app e a inferência devem fazer sentido sem nuvem.

2. **API-first, não só chat-first**
   O chat é importante, mas o centro do produto é o provider local.

3. **Compatibilidade antes de sofisticação**
   Melhor ser claramente OpenAI-compatible do que inventar um protocolo proprietário cedo demais.

4. **Controle explícito de exposição**
   O usuário precisa entender quando o modelo está disponível na rede e para quem.

5. **Pronto para plugar no Gambi**
   O produto deve nascer com isso em mente, mesmo que a integração chegue depois.

## 11. Escopo por fase

## Fase 1 — Provider local mobile

Entregar um app que:

* baixa e gerencia modelos locais
* roda o modelo localmente
* oferece chat local
* expõe API OpenAI-compatible na rede
* registra uso, estado e configurações localmente

## Fase 2 — Conexão com Gambi

Adicionar:

* entrada em sala do Gambi
* publicação do endpoint local em uma sala
* modo de operação “participante de sala”
* controles de visibilidade e disponibilidade no contexto da sala

## Fase 3 — Expansão GenAI

Adicionar gradualmente:

* embeddings expostos como endpoint
* reranking
* entradas multimodais
* áudio e imagem, quando fizer sentido de produto

## 12. Requisitos funcionais — Fase 1

### 12.1 Biblioteca de modelos

O app deve permitir que o usuário:

* visualizar modelos disponíveis para baixar
* visualizar modelos já baixados
* iniciar download
* pausar/cancelar download
* remover modelo local
* visualizar status do modelo: não baixado, baixando, pronto, em uso, com erro

### 12.2 Gestão de armazenamento

O app deve:

* informar uso de armazenamento por modelo
* informar espaço ocupado total
* permitir limpeza de cache quando aplicável
* persistir metadados localmente, podendo usar SQLite quando necessário

### 12.3 Conversa local com o modelo

O app deve permitir:

* iniciar nova conversa
* listar conversas anteriores
* enviar prompt
* receber resposta em streaming ou incremental
* interromper geração
* reutilizar contexto de conversa
* limpar conversa

### 12.4 Exposição do modelo por API

O app deve permitir que o usuário:

* habilite ou desabilite a exposição do modelo
* visualize o status do endpoint
* visualize endereço base e portas/forma de acesso disponíveis
* selecione qual modelo está sendo exposto
* visualize quais capacidades estão habilitadas no endpoint

### 12.5 Compatibilidade de API

O produto deve expor uma API **OpenAI-compatible** como requisito central.

A prioridade do contrato deve ser:

1. **Responses API**
2. **chat/completions** como compatibilidade secundária
3. **embeddings** quando suportado pelo motor e pela fase do produto

Essa prioridade existe porque a Responses API é tratada pela documentação da Vercel como a alternativa moderna à Chat Completions API, e porque o Gambi já se posiciona como compatível com `OpenResponses` e `chat/completions`. ([Vercel][5])

### 12.6 Descoberta e teste do endpoint

O app deve permitir:

* copiar base URL
* copiar token/chave local quando houver
* testar endpoint no próprio app
* visualizar health do endpoint
* visualizar modelo ativo
* visualizar histórico simples de requests recentes

### 12.7 Segurança de acesso

O produto deve incluir requisitos de segurança de produto para exposição do endpoint:

* endpoint desligado por padrão
* confirmação explícita para exposição em rede
* controle mínimo de autenticação/chave
* indicação clara se o endpoint está restrito à LAN ou exposto externamente
* logs locais básicos de acesso

### 12.8 Persistência local

O produto deve persistir localmente, preferencialmente com SQLite quando necessário:

* catálogo de modelos baixados
* metadados de download
* configurações do endpoint
* histórico de conversas
* histórico básico de requests
* preferências do usuário
* configuração futura de integração com Gambi

### 12.9 UX e visibilidade operacional

O usuário deve entender com clareza:

* qual modelo está pronto
* se o endpoint está online
* se o endpoint está autenticado
* se o modelo está em uso
* se o app está apenas em modo chat ou também em modo provider

## 13. Requisitos funcionais — Fase 2 (integração com Gambi)

A fase 2 deve permitir que o app:

* conecte-se a uma sala do Gambi
* publique seu provider local como participante
* disponibilize o modelo exposto como recurso da sala
* exiba status de conexão com a sala
* permita entrar e sair da sala
* permita escolher qual modelo/provider local será anunciado na sala
* registre localmente a última sala usada e preferências relacionadas

Essa fase deve respeitar o papel do Gambi como hub de pooling de endpoints OpenAI-compatible via salas e HTTP proxy, e não tentar substituir essa função. ([Gambi][1])

## 14. Requisitos não funcionais

### 14.1 Performance

* O app deve ser utilizável em dispositivos mobile modernos sem exigir performance topo de linha.
* O foco inicial é confiabilidade de uso, não benchmark máximo.
* O produto deve evitar travamentos perceptíveis durante chat, download e troca de estado do endpoint.

### 14.2 Confiabilidade

* O estado dos modelos e do endpoint deve sobreviver a reinício do app.
* Falhas de download e inferência devem ser comunicadas claramente.
* O usuário deve conseguir retomar um estado coerente após interrupção.

### 14.3 Privacidade

* O produto deve assumir local-first como padrão.
* O usuário deve entender quando dados permanecem no device e quando o endpoint está acessível a outros clientes.
* Conversas e logs locais devem ser tratáveis como dados privados do usuário.

### 14.4 Compatibilidade

* O produto deve ser desenhado para iOS e Android.
* O app deve funcionar com o fluxo de React Native/Expo adotado pelo template.
* O produto deve preservar espaço para uso com AI SDK/React Native AI, já que esse stack tem suporte oficial tanto a Expo quanto a runtimes on-device via providers. ([react-native-ai.dev][2])

## 15. Fluxos principais

### Fluxo A — Primeiro uso

1. Usuário abre o app.
2. Entende a proposta: rodar e expor um modelo local.
3. Escolhe um modelo.
4. Baixa o modelo.
5. Faz um teste via chat.
6. Ativa “expor como API”.
7. Copia a URL e testa o endpoint.

### Fluxo B — Uso recorrente

1. Usuário abre o app.
2. Seleciona um modelo já baixado.
3. Conversa com ele localmente.
4. Ativa ou desativa o endpoint conforme necessidade.

### Fluxo C — Integração futura com Gambi

1. Usuário abre aba de integração.
2. Informa sala/código/credencial.
3. Vincula um modelo local ao modo sala.
4. Ativa publicação no Gambi.
5. Monitora presença e estado.

## 16. Estrutura de informação sugerida

* Home
* Modelos
* Chat
* API
* Atividade
* Gambi
* Ajustes

## 17. Métricas de sucesso

### Métricas de adoção

* taxa de usuários que concluem o primeiro download
* taxa de usuários que enviam a primeira mensagem
* taxa de usuários que ativam o endpoint

### Métricas de uso de produto

* sessões de chat por usuário
* tempo médio até primeira resposta
* quantidade de requests recebidas pelo endpoint
* quantidade de modelos ativos por usuário

### Métricas de produto orientadas à proposta central

* percentual de usuários que usam o app como provider, não só como chat
* percentual de usuários que testam a API a partir de outro cliente
* percentual de usuários que conectam o provider a uma sala do Gambi na fase 2

## 18. Riscos principais

1. **Atrito de exposição de rede em mobile**
   O produto pode ser excelente como chat local e ainda assim ser mais difícil como provider exposto, dependendo de limitações do ambiente móvel.

2. **Confusão de posicionamento**
   Usuário pode achar que o produto é “só um chat local” e não entender que o valor principal é a API.

3. **Complexidade de segurança**
   Expor endpoint local exige UX muito clara para evitar exposição involuntária.

4. **Fragmentação de device capability**
   Nem todo modelo ou experiência vai ser boa em todo dispositivo.

## 19. Decisões em aberto

* Como o catálogo inicial de modelos será curado
* Quais capacidades entram no v1 além de texto
* Qual será o nível de observabilidade local do endpoint
* Qual o nível de autenticação exigido por padrão
* Como o modo de exposição externa será apresentado na UX
* Em que momento embeddings entram como recurso oficialmente exposto

## 20. Requisitos de alinhamento com o stack escolhido

Sem entrar em implementação, o produto deve assumir como restrições/possibilidades do stack:

* uso de React Native/Expo como base do app
* uso de React Native AI como camada de primitives on-device e integração com Vercel AI SDK
* uso de Llama engine para modelos GGUF locais, com gerenciamento de modelos e inferência local
* aproveitamento do AI SDK como forma prática de manter semântica de produto alinhada a fluxos modernos de geração e, futuramente, Responses API-oriented UX. ([react-native-ai.dev][2])

## 21. Posicionamento sugerido

**Um app mobile para rodar modelos locais e expô-los como API.**
Depois, quando fizer sentido, esse provider também entra em uma sala do Gambi.

## 22. Resumo executivo

O produto não deve nascer como “um chat local com algo a mais”.
Ele deve nascer como **um provider local mobile com chat embutido**.

Esse enquadramento é o que melhor conversa com:

* tua prioridade de **API OpenAI-compatible**
* a referência do **Gambi**, que já organiza endpoints e salas em torno dessa semântica ([Gambi][1])
* o stack de **React Native AI + AI SDK**, que já foi desenhado para on-device AI com integração de primeira classe ao ecossistema do Vercel AI SDK e suporte a Expo ([react-native-ai.dev][2])

Se tu quiser, no próximo passo eu posso transformar isso em uma versão mais “pronta para colar no repositório”, por exemplo com seções tipo **Problem, Goals, Requirements, Milestones, Risks, Open Questions** em formato bem enxuto de README/PRD.

[1]: https://www.gambi.sh/llms.txt "www.gambi.sh"
[2]: https://www.react-native-ai.dev/docs "Introduction - React Native AI"
[3]: https://ai-sdk.dev/docs/introduction "AI SDK by Vercel"
[4]: https://gambi.sh/ "Gambi | Gambi"
[5]: https://vercel.com/docs/ai-gateway/sdks-and-apis/responses?utm_source=chatgpt.com "OpenAI Responses API"
