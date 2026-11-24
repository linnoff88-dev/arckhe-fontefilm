# fontefilm

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="48" />
  <p><strong>Arckhé AI</strong></p>
</div>


**Um diretor de cARCKHÉ de IA que transforma texto em filme de quadrinhos â€” rodando na sua mÃ¡quina.**

ðŸŒ **Site / guia de uso:** https://linnoff88-dev.github.io/

VocÃª escreve um **texto base** (a histÃ³ria ou o assunto), escolhe um **estilo visual**, e o fontefilm faz o resto: roteiro â†’ cenas â†’ personagens â†’ imagens â†’ narraÃ§Ã£o â†’ montagem â†’ **vÃ­deo final**.

A maioria das ferramentas sÃ³ *gera* imagem ou vÃ­deo. O fontefilm tenta **dirigir** de verdade â€” como um diretor: que plano usar (close, geral, over-the-shoulder), composiÃ§Ã£o, luz, ritmo, transiÃ§Ãµes entre quadros (teoria do Scott McCloud) e estrutura de histÃ³ria (3 atos). Esse "cÃ©rebro de direÃ§Ã£o" Ã© o diferencial.

## O caminho

```
texto + estilo
  â†’ roteiro (3 atos)
  â†’ bÃ­blia (personagens / locaÃ§Ãµes / paleta)
  â†’ decupagem (plano + cÃ¢mera de cada painel)
  â†’ painÃ©is de quadrinho (imagem)
  â†’ movimento (parallax 2.5D / Ken Burns)
  â†’ narraÃ§Ã£o + som
  â†’ montagem
  â†’ ðŸŽ¥ filme.mp4
```

## PrincÃ­pios

- **Local-first.** Roda na sua mÃ¡quina com modelos locais (flux2-klein para imagem, ARCKHÉvox para voz). APIs pagas (Kling, Runway, Nano Banana) sÃ£o **opcionais**, ligadas por `.env` / UI.
- **DireÃ§Ã£o dirigida por conhecimento.** Um *Knowledge Pack* versionado (gramÃ¡tica de cARCKHÉ + teoria de HQ) alimenta os agentes de direÃ§Ã£o via RAG.
- **Uma engine, vÃ¡rias portas.** A lÃ³gica vive numa engine Python; vocÃª aciona por **CLI**, por uma **skill** conversacional (wrapper fino, no padrÃ£o `pixflow-motion`) e, na Fase 3, por **UI web** no portal `ARCKHÉ AI`.
- **Projeto reproduzÃ­vel.** Cada decisÃ£o (plano, seed, prompt, provider) fica em arquivos legÃ­veis em disco.

## Fases

| Fase | Entrega |
|------|---------|
| **v1 (Fase 0)** | Motion comic completo: painÃ©is estÃ¡ticos + cÃ¢mera + narraÃ§Ã£o. CLI. PT-BR, 16:9 ou 9:16. |
| Fase 1 | AnimaÃ§Ã£o leve (LivePortrait / parallax), mÃºsica/SFX, consistÃªncia avanÃ§ada de personagem. |
| Fase 2 | VÃ­deo IA hÃ­brido (LTX/Wan local; Kling/Runway API), agendador paralelo (DAG/CPM). |
| Fase 3 | UI web no portal `ARCKHÉ AI` sobre o mesmo engine. |

## Estado atual

> **Em design/prototipagem.** A engine ainda nÃ£o estÃ¡ construÃ­da â€” o que existe Ã© a fundaÃ§Ã£o.

- âœ… **Pesquisa profunda** â€” padrÃµes a copiar de pipelines open-source (Forge Film, ViMax, FilmAgent, FilMaster, LivePortrait, MovieLabs OMC). Ver [`docs/research/`](docs/research/).
- âœ… **Spec/design aprovado** â€” [`docs/superpowers/specs/2026-06-07-fontefilm-design.md`](docs/superpowers/specs/2026-06-07-fontefilm-design.md).
- âœ… **Teste real ponta a ponta** â€” *"12 Leis do Crescimento"* (dicas do Alex Hormozi): o pipeline rodado "na mÃ£o" para provar o conceito. Saiu um motion comic 1080p narrado e sincronizado (106s). Receita reproduzÃ­vel em [`projetos/hormozi12/`](projetos/hormozi12/).

## Stack

Python 3.11 (engine/CLI) Â· ComfyUI + flux2-klein (imagem) Â· ARCKHÉvox (voz) Â· pixflow-motion para parallax 2.5D (Depth-Anything-V2 â†’ WebGL â†’ Remotion â†’ FFmpeg) Â· Claude como LLM diretor (default), modelo local como fallback.

## Estrutura do repo

```
docs/research/      # pesquisa de pipelines de referÃªncia
docs/superpowers/   # spec/design da v1
projetos/<nome>/    # projetos de filme (entrada + assets + saÃ­da)
```

> Pesquisa / educaÃ§Ã£o / testes. Assets pesados (imagens, Ã¡udio, MP4) ficam fora do git.

---

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="32" />
  <p><strong>Arckhé AI</strong></p>
</div>