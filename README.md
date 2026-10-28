<p align="center">
  <img src="assets/icon-ar-ceramic-designer.png" alt="AR Ceramic Designer icon" width="110" />
</p>

<h1 align="center">AR Ceramic Designer</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Three.js-111111?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/WebXR-005A9C?style=flat-square&logo=webxr&logoColor=white" alt="WebXR" />
<br>
  <a href="https://github.com/lianeheidemann/ar-ceramic-designer/actions/workflows/ci.yml?query=branch%3Adevelop"><img src="https://img.shields.io/github/actions/workflow/status/lianeheidemann/ar-ceramic-designer/ci.yml?branch=develop&style=flat-square&logo=githubactions&logoColor=white&label=CI" alt="CI status — develop" /></a>
  <a href="https://github.com/lianeheidemann/ar-ceramic-designer/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/lianeheidemann/ar-ceramic-designer/deploy.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=Deploy" alt="Deploy status — main" /></a>
  <a href="https://lianeheidemann.github.io/ar-ceramic-designer/"><img src="https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-238636?style=flat-square&logo=githubpages&logoColor=white&labelColor=22272e" alt="Open GitHub Pages" /></a>
</p>

Aplicação web para visualizar e personalizar objetos de cerâmica em 3D e posicioná-los em realidade aumentada (WebXR) em dispositivos Android compatíveis.

## Tecnologias

### Aplicação

| Tecnologia | Utilização |
| :--- | :--- |
| [TypeScript](https://www.typescriptlang.org/) | Linguagem principal, com tipagem estática. |
| [React](https://react.dev/) | Interface, componentes e gerenciamento de estado. |
| [Three.js](https://threejs.org/) | Renderização e interação com os modelos 3D. |
| [Vite](https://vite.dev/) | Ambiente de desenvolvimento e build. |

### Ferramentas de desenvolvimento

| Ferramenta | Utilização |
| :--- | :--- |
| [Vitest](https://vitest.dev/) | Testes automatizados. |
| [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Análise estática do código. |
| [Prettier](https://prettier.io/) | Formatação de código. |
| [GitHub Actions](https://github.com/features/actions) | Workflows de integração e deploy. |

> **WebXR:** tecnologia prevista para realidade aumentada; não representa uma funcionalidade já concluída.

## Requisitos

- Node.js LTS (testado com Node 22) e npm.

### Realidade aumentada

- Android com Chrome atualizado e o app **Google Play Services para RA** (ARCore) instalado.
- Abrir o app por HTTPS (ex.: GitHub Pages) e permitir o uso da câmera.
- Em navegadores sem WebXR (desktop, iPhone), o visualizador 3D continua disponível e o app explica por que o AR não está disponível.

## Estrutura

```text
app/    # código da aplicação (Vite + React + Three.js)
docs/   # documentação e planejamento
```

## Comandos

Rode os comandos dentro da pasta `app/`:

```bash
cd app
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento
npm run build        # checagem de tipos + build de produção em dist/
npm run preview      # servir o build de produção localmente
npm run lint         # lint (oxlint)
npm test             # testes unitários (Vitest)
npm run format       # formatar com Prettier
```


## Documentação

- [Guia passo a passo](docs/step-by-step.md)
- [Plano de desenvolvimento](docs/development-plan.md)
- [Referências](docs/references.md)
