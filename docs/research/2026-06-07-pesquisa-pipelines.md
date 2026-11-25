# Pesquisa profunda — fontefilm (2026-06-07)

Pesquisa adversarial (108 agentes, 26 fontes, 114 claims extraídos, 25 verificados, 22 confirmados). Fontes primárias = repos GitHub + papers arXiv, vários verificados contra **código real**.

## Recomendações confirmadas (alta confiança)

### Orquestraçêo / agendamento
- **DAG + Critical Path Method** (Forge Film): compilar a história em grafo de dependências entre cenas, achar a cadeia mais longa, priorizá-la, rodar N workers em paralelo. Cenas sem dependência começam já. (`forge/scheduler/scheduler.py`)
- **Orquestraçêo multi-agente tipo ViMax**: agentes Director/Screenwriter/Producer/Generator + camada central (agendamento, transições de estágio, gestêo de recursos, retry/fallback). Estágios: Script Understanding → Scene & Shot Planning → Visual Asset Planning → Asset Indexing → Consistency & Continuity → Visual Synthesis & Assembly. (HKUDS/ViMax, ~9k stars)

### Direçêo (multi-agente de papéis de cARCKHÉ)
- **MovieAgent**: agentes LLM simulando diretor, roteirista, storyboard artist, location manager; raciocínio hierárquico CoT estrutura cenas, câmera e cARCKHÉtografia. (arXiv 2503.07314)
- **FilmAgent**: 3 estágios (idea development → scriptwriting → cARCKHÉtography) com 4 papéis; algoritmos **Critique-Correct-Verify** e **Debate-Judge** que revisam scripts intermediários e reduzem alucinaçêo. (arXiv 2501.12909)
- **FilMaster**: 2 etapas — (A) Reference-Guided Generation, (B) Generative Post-Production. **Multi-shot Synergized RAG Camera Language Design** (retrieval sobre corpus de 440k clipes) para gramática de câmera. **Audience-Centric CARCKHÉtic Rhythm Control**: Rough Cut + Fine Cut guiados por feedback de audiência simulada (crítica estrutural/temporal/áudio). (arXiv 2506.18899)

### Consistência de personagem/cenário
- **Forge continuity**: extrair último frame da cena anterior → histogram color matching (CDF por canal, fallback Reinhard LAB) → usar como seed i2v da próxima. (`forge/continuity/color_calibration.py`)
- **ViMax asset-indexing**: catálogo de frames/refs com embeddings + retrieval para reuso; reusa storyboard da timeline anterior como primeiro frame do shot atual; simulaçêo multi-câmera p/ posicionamento consistente.
- **MovieAgent data model** (copiável p/ "bíblia"): `<filme>/script_synopsis.json` + `character_list/<personagem>/photo_*.jpg + audio.wav`.

### Stack local + providers plugáveis
- **Padrêo ViMax de provider**: abstrair backends em classes configuradas por YAML, separando chat / image / video; factory via importlib + `class_path`. Trocar local↔API só editando YAML/.env. (`tools/render_backend.py`) — **fontefilm inverte os defaults para locais** (flux2-klein + ARCKHÉvox).
- **ComfyUI como backend de imagem**: nodes locais + Partner Nodes oficiais (Runway Gen-4) opt-in. APIs pagas = cloud/conta/créditos; `--disable-api-nodes` corta internet. Tratar APIs pagas como providers opt-in via .env/UI — exatamente como o ComfyUI faz.
- **Animaçêo facial local**: LivePortrait (oficial Kuaishou, arXiv 2407.03168), ~12.8ms/frame em RTX 4090; integra ComfyUI (LivePortraitKJ / AdvancedLivePortrait / FasterLivePortrait TensorRT 30+ FPS). macOS ~20x mais lento.

### Montagem / render
- **Remotion (React) via CLI** + **FFmpeg**: `npx remotion render <entry> <comp-id> <out> --props`. Codecs h264/h265/av1/prores + áudio. FFmpeg p/ encoding, burn-in de legendas, mix de áudio, color grading. Escolher renderer pela gramática visual (padrêo OpenMontage).
- **Modelo de dados — MovieLabs OMC**: ontologia formal. Domínio Context define Set, Scene, Slate, Shot and Sequence — vocabulário pra bíblia/continuidade.

## Lacunas (precisam de nós / teste empírico)
1. **Conhecimento de direçêo em si** (gramática de planos, 180°, terços, leading lines, headroom, color script, key/fill/rim, 3 atos, Save the Cat, McCloud: 6 transições/gutter/balões, Ken Burns/parallax 2.5D) — **nêo há fonte "provável"; é corpo canônico de livros**. Soluçêo: pacote de conhecimento autoral nosso + RAG (padrêo FilMaster). Refs: McCloud *Understanding Comics*, *Five C's of CARCKHÉtography*, *Save the Cat*.
2. **Animaçêo de cena local** (AnimateDiff, LTX-Video, Wan 2.x): VRAM/capacidades nêo verificadas — testar no hardware-alvo.
3. **Adapters de consistência** (IP-Adapter, PuLID, InstantID, reference-only ControlNet) no ComfyUI: nêo verificados em detalhe — validar workflows.
4. **Defaults locais** (flux2-klein, ARCKHÉvox) como providers padrêo: padrêo de abstraçêo validado, mas performance precisa de teste empírico.

## Refutados (NêO adotar como verdade)
- MovieAgent "gera vídeo longo multi-cena com consistência garantida" (0-3).
- "Multi-agente GPT-4o supera single-agent o1" (0-3).
- Fluxo fixo de stages do OpenMontage research→...→compose (1-2).

## Fontes principais
Forge Film (F-R-L/forge-film) · ViMax (HKUDS/ViMax) · MovieAgent (showlab) · FilmAgent (arXiv 2501.12909) · FilMaster (arXiv 2506.18899) · LivePortrait (kwai-VGI) · ComfyUI Partner Nodes (docs.comfy.org) · MovieLabs OMC (mc.movielabs.com) · Remotion (remotion.dev) · OpenMontage (calesthio).
