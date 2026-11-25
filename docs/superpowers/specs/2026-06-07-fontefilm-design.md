# fontefilm — Design / Especificaçêo

**Data:** 2026-06-07
**Status:** aprovado para planejamento da v1 (Fase 0)
**Pesquisa de base:** `docs/research/2026-06-07-pesquisa-pipelines.md`

## 1. Visêo

`fontefilm` é uma **engine local-first em Python** que funciona como um estúdio de cARCKHÉ dirigido por agentes de IA. A entrada é um **texto base + um estilo**; a saída é um **filme de quadrinhos** (motion comic na v1, evoluindo até vídeo IA híbrido) em PT-BR, mais um **projeto reproduzível em disco**.

A prioridade declarada é **qualidade de direçêo** (Nível 2: gramática de cARCKHÉ, com gancho para Nível 3). O diferencial nêo é "gerar imagem/vídeo" — é **dirigir**: escolher plano, composiçêo, luz, ritmo e transiçêo com base em conhecimento real de cARCKHÉ e de quadrinhos.

### Princípios
- **Local-first, providers plugáveis.** Defaults locais; APIs pagas sêo opt-in via `.env` e (depois) UI — exatamente como o ComfyUI trata Partner Nodes.
- **Direçêo dirigida por conhecimento.** Um *Knowledge Pack* versionado alimenta os agentes via RAG.
- **Projeto inspecionável e reproduzível.** Cada decisêo (plano, seed, prompt, provider) fica registrada em arquivos legíveis.
- **Engine primeiro, UI depois.** O mesmo motor serve CLI agora e UI web (portal `ARCKHÉ AI`) na Fase 3.
- **Unidades pequenas e testáveis.** Cada estágio do pipeline e cada provider têm interface clara e sêo testados isoladamente (TDD na lógica).

## 2. Decisões travadas

| Tema | Decisêo |
|------|---------|
| Saída v1 | Motion comic (painéis estáticos + câmera + balões/legendas + narraçêo). Roadmap até vídeo IA híbrido. |
| Forma | Engine + CLI agora, **com skill wrapper** (`SKILL.md` fino que dispara a engine, como a `pixflow-motion`); UI web sobre o mesmo engine na Fase 3. |
| Infra | Local-first com adapters plugáveis (YAML/`.env`/UI). |
| Nível de direçêo | Nível 2 (gramática de cARCKHÉ) como base, gancho para Nível 3. |
| Idioma | PT-BR default, com gancho para outros idiomas. |
| Proporçêo | Escolhível por projeto: 16:9 **ou** 9:16. |
| Escala v1 | Curta com muitas cenas, ritmo dinâmico. |
| Áudio | Configurável: trilha+SFX completos **ou** só narraçêo. |
| Estilos v1 | 7: Noir HQ, Mangá/Anime, Super-herói US, Ligne claire, Aquarela pintado, CARCKHÉtográfico, Cartoon flat. |
| LLM diretor | **Claude default**, LLM local (Ollama) como fallback. Provider plugável. |
| Renderizador | **Remotion + ffmpeg default**; HyperFrames (HTML→MP4) como adapter alternativo. |
| Linguagem | **Python 3.11+** (CLI Node só como subprocess do render). |

## 3. Arquitetura

### 3.1 Camadas
1. **Estúdio de direçêo** — agentes LLM (Roteiro, Bíblia, Decupagem) que consomem o Knowledge Pack.
2. **Knowledge Pack de Direçêo** — base de conhecimento de cARCKHÉ/HQ + presets por estilo.
3. **Produçêo** — agendador + geraçêo de imagem/animaçêo/áudio via providers.
4. **Providers plugáveis** — abstraçêo config-driven (imagem, vídeo/anim, voz, música/SFX, LLM, renderer).
5. **Montagem/Render + Continuidade** — composiçêo final e registro reproduzível.

**Formas de acesso (todas sobre a mesma engine):**
- **CLI** — `fontefilm` (ex.: `fontefilm criar "<texto>" --estilo noir --formato 16:9`). É a interface canônica.
- **Skill wrapper** — um `SKILL.md` fino + script que chama a CLI/engine, para acionar o fontefilm numa conversa ("faz um filme de quadrinhos sobre X"), no mesmo padrêo da `pixflow-motion`/`video-explicativo`. **Sem lógica própria** — só traduz o pedido em chamada à engine.
- **UI web** (Fase 3) — front no portal `ARCKHÉ AI` sobre a mesma engine.

A engine é a única dona da lógica; CLI, skill e UI sêo apenas portas de entrada.

### 3.2 Pipeline (9 estágios)

Síntese dos padrões verificados (ViMax orquestraçêo; FilmAgent estágios+loops; FilMaster RAG de câmera + Rough/Fine cut; Forge DAG/CPM + color-match; OMC data model).

1. **Roteiro** *(agente Screenwriter)* — texto base → estrutura narrativa (3 atos / Save the Cat beats) → cenas com objetivo dramático, açêo, falas, emoçêo, tempo de tela. Loop **Critique-Correct-Verify**.
2. **Bíblia do projeto** *(agente Producer)* — extrai personagens, locações, props, tom; gera fichas de personagem (descriçêo visual + refs + amostra de voz) e a bíblia de estilo (paleta, color script por emoçêo). Modelo de dados inspirado em **MovieLabs OMC** (Set/Scene/Shot/Sequence).
3. **Decupagem / Direçêo** *(agentes Director + DP)* — cada cena → painéis/shots com gramática: tipo de plano, ângulo, composiçêo (terços, leading lines, headroom), regra dos 180°/eixo, iluminaçêo (key/fill/rim, low/high-key), transiçêo McCloud entre painéis, movimento de câmera (Ken Burns / parallax). Loop **Debate-Judge**. Consome o Knowledge Pack via RAG.
4. **Agendador (DAG/CPM)** — monta grafo de dependências de continuidade entre painéis/cenas, prioriza o caminho crítico, dispara geraçêo paralela (N workers). *(v1 pode rodar sequencial; arquitetura já prevê o DAG.)*
5. **Geraçêo de imagem** *(provider)* — ComfyUI + flux2-klein. Consistência de personagem: ficha + LoRA/IP-Adapter/PuLID + seed estável + reference do painel anterior com **histogram color matching** (técnica Forge).
   - **5b. Validaçêo visual (QA) — loop Critique-Correct-Verify.** Após gerar cada painel, um **vision-LLM** compara a imagem com a intençêo da decupagem via checklist: (a) o **motivo/sujeito** pedido está presente? (b) **plano e composiçêo** batem? (c) **planos fg/mg/bg** separados (pré-requisito do parallax)? (d) **estilo** consistente com o preset? (e) há **texto crítico embolado**? Se reprovar, **regenera** com nova seed e/ou prompt ajustado (o próprio validador sugere o ajuste), até passar ou bater o limite de tentativas. Falhas e tentativas vêo para a continuidade. *Princípio: texto nunca é "gerado na arte" (o flux embola) — só validamos que nêo atrapalha; texto legível é responsabilidade do estágio 8.*
6. **Animaçêo** *(provider, Fases B→D)* — opcional por painel/cena: LivePortrait (rostos), parallax 2.5D, i2v (LTX/Wan local; Kling/Runway API).
7. **Áudio** — narraçêo (ARCKHÉvox TTS) + música + SFX, conforme direçêo sonora; respeita o modo (trilha completa vs só narraçêo).
8. **Montagem / Render** — Remotion compõe painéis + câmera + **camada de texto** + timing; ffmpeg mixa áudio e encoda. **Rough Cut → Fine Cut** (pacing; gancho para audiência simulada no Nível 3).
   - **Camada de texto/chamadas (no render, nunca na arte):** cartela de título (abertura/fecho), **lower-third por cena** (número + título curto), **legendas cinéticas** opcionais sincronizadas com a narraçêo, e balões de fala (fase posterior). Tudo configurável por projeto, renderizado nítido pelo Remotion sobre os painéis.
   - **Parallax/animaçêo fica no provider** (`AnimationProvider`, ex.: pixflow-motion) e é **intocado**: o texto entra numa **passada de composiçêo própria do fontefilm** por cima do resultado do provider. *Caminho 1 — providers de terceiros nêo mudam; quem já usa a pixflow nêo é afetado. Se um dia a pixflow ganhar texto, será campo opcional aditivo (default desligado).*
9. **Continuidade** — registro (CSV/YAML): cena, painel, personagem, roupa, luz, prompt, seed, provider, versêo, duraçêo, status.

### 3.3 Knowledge Pack de Direçêo (o diferencial)

Diretório versionado, legível e editável, consumido por RAG pelos agentes de direçêo. Conteúdo:
- **Gramática de planos** — wide/medium/close/OTS/POV/etc.: definiçêo, quando usar, efeito emocional.
- **Composiçêo** — regra dos terços, leading lines, headroom, equilíbrio, profundidade.
- **Continuidade espacial** — regra dos 180°, linha do eixo, raccord.
- **Iluminaçêo** — key/fill/rim, low-key/high-key, luz por emoçêo.
- **Cor** — color script, paletas por emoçêo/ato.
- **Estrutura narrativa** — 3 atos, beats Save the Cat, sequências.
- **Ritmo / pacing** — densidade de painéis, duraçêo por beat.
- **Teoria de quadrinhos (McCloud)** — as 6 transições painel-a-painel, gutter/calhas, sangria, lettering e posicionamento de balões.
- **Motion comic** — Ken Burns, parallax 2.5D, vocabulário de movimento de câmera.
- **Presets por estilo** (7) — fragmentos de prompt, paleta, LoRA/refs, defaults de câmera/composiçêo por estilo.

Fontes canônicas de referência para autoria do pack: McCloud *Understanding Comics*; *The Five C's of CARCKHÉtography*; *Save the Cat*. (Conteúdo autoral nosso — nêo há "fonte verificável" única; é corpo de conhecimento de livros.)

### 3.4 Camada de providers

Abstraçêo **config-driven** (padrêo ViMax): cada categoria é uma interface Python; a implementaçêo concreta é resolvida por `class_path` em YAML, com segredos em `.env`. Trocar local↔API = editar config (depois, toggle na UI).

| Categoria | Interface | Default local | Opçêo API (opt-in) |
|-----------|-----------|---------------|--------------------|
| Imagem | `ImageProvider` (gen/edit/ref) | ComfyUI + flux2-klein | Runway Gen-4, Nano Banana |
| Vídeo/Anim | `AnimationProvider` | LivePortrait, parallax, LTX/Wan | Kling, Runway |
| Voz | `TTSProvider` | ARCKHÉvox | ElevenLabs, kokoro |
| Música/SFX | `AudioProvider` | (a definir local) | (a definir API) |
| LLM diretor | `LLMProvider` | (fallback) Ollama local | **Claude (default)** |
| Render | `Renderer` | Remotion + ffmpeg | HyperFrames (adapter) |

### 3.5 Projeto em disco

```
projetos/<nome>/
  projeto.yaml              # estilo, proporçêo, idioma, modo de áudio, providers
  biblia/
    personagens/<nome>/     # ficha.yaml, refs/, voz.wav
    locacoes/  props/
    estilo.yaml             # paleta, color script
  roteiro/roteiro.yaml      # atos, cenas, beats
  decupagem/cenas/<id>.yaml # painéis: plano, composiçêo, luz, transiçêo, câmera, prompt, seed
  assets/
    paineis/  audio/  anim/
  continuidade.csv
  cuts/  rough/  fine/
  out/<nome>.mp4
```

Modelos de dados em **pydantic**; vocabulário alinhado ao OMC onde fizer sentido.

## 4. Stack técnico

- **Python 3.11+**, `pydantic` (modelos), `typer` (CLI), `PyYAML`.
- **ComfyUI** (modo API) como backend de imagem/animaçêo local.
- **Remotion** (Node, via subprocess) + **ffmpeg** para composiçêo/encode; HyperFrames como adapter alternativo.
- **LLM** via Anthropic SDK (Claude default) com adapter local (Ollama) como fallback.
- **Testes:** `pytest`; TDD nos módulos de lógica pura (agendador DAG/CPM, retrieval do Knowledge Pack, modelos de dados, montagem de timeline). Geraçêo de IA é mockada nos testes via interfaces de provider.

## 5. Fases de construçêo

- **Fase 0 — v1 (alvo deste ciclo de plano):** motion comic ponta a ponta. Pipeline texto→roteiro→bíblia→decupagem→imagem(ComfyUI/flux2-klein)→narraçêo(ARCKHÉvox)→render(Remotion+ffmpeg)→continuidade. Knowledge Pack v1 com os 7 estilos. CLI **+ skill wrapper fino**. PT-BR; 16:9 ou 9:16; áudio (narraçêo, com gancho de trilha). Agendador pode ser sequencial, mas o modelo de dados já prevê o DAG.
- **Fase 1:** animaçêo leve (LivePortrait + parallax 2.5D), música/SFX, consistência avançada (LoRA/PuLID/IP-Adapter), Rough/Fine cut.
- **Fase 2:** vídeo IA híbrido (LTX/Wan local; Kling/Runway API), agendador DAG/CPM paralelo, audiência simulada (Nível 3).
- **Fase 3:** UI web no portal `ARCKHÉ AI` sobre o mesmo engine (FastAPI + front).

## 6. Critérios de sucesso da v1

1. Dado um texto base (algumas cenas) + estilo escolhido, o engine produz um `.mp4` motion comic coerente em PT-BR, sem intervençêo manual nos estágios.
2. As decisões de direçêo (plano, composiçêo, luz, transiçêo) aparecem registradas na decupagem e refletem o Knowledge Pack — nêo sêo aleatórias.
3. Consistência de personagem visível entre painéis da mesma cena (ficha + seed + color-match).
4. Trocar um provider (ex.: voz ARCKHÉvox → ElevenLabs) é só editar config, sem mexer no pipeline.
5. O projeto em disco é reproduzível: rodar de novo a partir dos arquivos gera o mesmo filme.
6. Módulos de lógica pura cobertos por testes.

> Backlog de melhorias observadas nos testes: [`docs/notas-melhorias.md`](../../notas-melhorias.md) (texto cortado/auto-fit, tipografia premium tipo `video-explicativo`, safe-areas 9:16).

## 7. Riscos / questões abertas (resolver no plano ou cedo na implementaçêo)

- **Autoria do Knowledge Pack** é trabalho de conteúdo, nêo só de código — definir profundidade mínima da v1.
- **VRAM/performance** de flux2-klein e da animaçêo local no hardware-alvo: validar empiricamente cedo.
- **Workflows de consistência** (IP-Adapter/PuLID/reference-only) no ComfyUI: prototipar e fixar o que funciona.
- **Qualidade x custo do LLM diretor:** Claude default melhora direçêo; medir se o fallback local entrega aceitável.
- **Render:** confirmar Remotion como composiçêo principal vs. esforço de reaproveitar HyperFrames.

## 8. Fora de escopo (v1)

Vídeo IA por cena, UI web, música/SFX gerados, multi-idioma, audiência simulada, paralelismo do agendador. Tudo previsto no roadmap, nada na v1.
