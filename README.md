# fontefilm

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="48" />
  <p><strong>Arckhé AI</strong></p>
</div>


**Um diretor de cARCKHê de IA que transforma texto em filme de quadrinhos ê¢â¬â rodando na sua mêÂ¡quina.**

ê°Å¸ÅÂ **Site / guia de uso:** https://linnoff88-dev.github.io/

VocêÂª escreve um **texto base** (a histêÂ³ria ou o assunto), escolhe um **estilo visual**, e o fontefilm faz o resto: roteiro ê¢â â cenas ê¢â â personagens ê¢â â imagens ê¢â â narraêÂ§êÂ£o ê¢â â montagem ê¢â â **vêÂ­deo final**.

A maioria das ferramentas sêÂ³ *gera* imagem ou vêÂ­deo. O fontefilm tenta **dirigir** de verdade ê¢â¬â como um diretor: que plano usar (close, geral, over-the-shoulder), composiêÂ§êÂ£o, luz, ritmo, transiêÂ§êÂµes entre quadros (teoria do Scott McCloud) e estrutura de histêÂ³ria (3 atos). Esse "cêÂ©rebro de direêÂ§êÂ£o" êÂ© o diferencial.

## O caminho

```
texto + estilo
  ê¢â â roteiro (3 atos)
  ê¢â â bêÂ­blia (personagens / locaêÂ§êÂµes / paleta)
  ê¢â â decupagem (plano + cêÂ¢mera de cada painel)
  ê¢â â painêÂ©is de quadrinho (imagem)
  ê¢â â movimento (parallax 2.5D / Ken Burns)
  ê¢â â narraêÂ§êÂ£o + som
  ê¢â â montagem
  ê¢â â ê°Å¸Å½Â¥ filme.mp4
```

## PrincêÂ­pios

- **Local-first.** Roda na sua mêÂ¡quina com modelos locais (flux2-klein para imagem, ARCKHêvox para voz). APIs pagas (Kling, Runway, Nano Banana) sêÂ£o **opcionais**, ligadas por `.env` / UI.
- **DireêÂ§êÂ£o dirigida por conhecimento.** Um *Knowledge Pack* versionado (gramêÂ¡tica de cARCKHê + teoria de HQ) alimenta os agentes de direêÂ§êÂ£o via RAG.
- **Uma engine, vêÂ¡rias portas.** A lêÂ³gica vive numa engine Python; vocêÂª aciona por **CLI**, por uma **skill** conversacional (wrapper fino, no padrêÂ£o `pixflow-motion`) e, na Fase 3, por **UI web** no portal `ARCKHê AI`.
- **Projeto reproduzêÂ­vel.** Cada decisêÂ£o (plano, seed, prompt, provider) fica em arquivos legêÂ­veis em disco.

## Fases

| Fase | Entrega |
|------|---------|
| **v1 (Fase 0)** | Motion comic completo: painêÂ©is estêÂ¡ticos + cêÂ¢mera + narraêÂ§êÂ£o. CLI. PT-BR, 16:9 ou 9:16. |
| Fase 1 | AnimaêÂ§êÂ£o leve (LivePortrait / parallax), mêÂºsica/SFX, consistêÂªncia avanêÂ§ada de personagem. |
| Fase 2 | VêÂ­deo IA hêÂ­brido (LTX/Wan local; Kling/Runway API), agendador paralelo (DAG/CPM). |
| Fase 3 | UI web no portal `ARCKHê AI` sobre o mesmo engine. |

## Estado atual

> **Em design/prototipagem.** A engine ainda nêÂ£o estêÂ¡ construêÂ­da ê¢â¬â o que existe êÂ© a fundaêÂ§êÂ£o.

- ê¢Åâ¦ **Pesquisa profunda** ê¢â¬â padrêÂµes a copiar de pipelines open-source (Forge Film, ViMax, FilmAgent, FilMaster, LivePortrait, MovieLabs OMC). Ver [`docs/research/`](docs/research/).
- ê¢Åâ¦ **Spec/design aprovado** ê¢â¬â [`docs/superpowers/specs/2026-06-07-fontefilm-design.md`](docs/superpowers/specs/2026-06-07-fontefilm-design.md).
- ê¢Åâ¦ **Teste real ponta a ponta** ê¢â¬â *"12 Leis do Crescimento"* (dicas do Alex Hormozi): o pipeline rodado "na mêÂ£o" para provar o conceito. Saiu um motion comic 1080p narrado e sincronizado (106s). Receita reproduzêÂ­vel em [`projetos/hormozi12/`](projetos/hormozi12/).

## Stack

Python 3.11 (engine/CLI) êÂ· ComfyUI + flux2-klein (imagem) êÂ· ARCKHêvox (voz) êÂ· pixflow-motion para parallax 2.5D (Depth-Anything-V2 ê¢â â WebGL ê¢â â Remotion ê¢â â FFmpeg) êÂ· Claude como LLM diretor (default), modelo local como fallback.

## Estrutura do repo

```
docs/research/      # pesquisa de pipelines de referêÂªncia
docs/superpowers/   # spec/design da v1
projetos/<nome>/    # projetos de filme (entrada + assets + saêÂ­da)
```

> Pesquisa / educaêÂ§êÂ£o / testes. Assets pesados (imagens, êÂ¡udio, MP4) ficam fora do git.

---

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="32" />
  <p><strong>Arckhé AI</strong></p>
</div>