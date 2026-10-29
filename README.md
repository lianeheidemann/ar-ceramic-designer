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

Interface web interativa, publicada no GitHub Pages, para explorar modelos de cerâmica em 3D, personalizar materiais e comparar acabamentos. Em dispositivos compatíveis, permite visualizar as peças em realidade aumentada.

> AR on supported Android browsers; verify compatibility on device

<p align="center">
  <img width="50%" src="assets/interface/interface-ar-ceramic-designer-v3.webp">
</p>

## Funcionalidades

- Visualizador 3D com vaso, tigela e prato (girar, aproximar, reiniciar vista).
- Personalização do material: acabamentos (fosco, brilhante, vitrificado), cor, rugosidade e metalicidade.
- Comparação lado a lado de duas variantes (A/B).
- Realidade aumentada (WebXR) em Android compatível.
- Exportar e importar a configuração em `.json` e salvar uma imagem PNG da vista 3D.

## Requisitos

- **Visualizador 3D:** navegador com suporte a WebGL 2 — Chrome 56+, Edge 79+, Firefox 51+ ou Safari 15+ (iOS/macOS), no computador ou no celular.
- **Realidade aumentada:** celular com Android 7.0 ou superior que esteja na [lista de dispositivos compatíveis com ARCore](https://developers.google.com/ar/devices), com o app Google Play Services para RA instalado, usando o Chrome 81 ou superior. O navegador precisa suportar WebXR com detecção de superfícies (`immersive-ar` e `hit-test`), a página deve ser acessada por HTTPS e é necessário autorizar o uso da câmera.
- **iPhone/iPad:** o Safari no iOS ainda não oferece WebXR, então apenas o visualizador 3D fica disponível.

## Tecnologias

| Tecnologia | Utilização |
| :--- | :--- |
| [TypeScript](https://www.typescriptlang.org/) | Linguagem principal, com tipagem estática. |
| [React](https://react.dev/) | Interface, componentes e gerenciamento de estado. |
| [Three.js](https://threejs.org/) | Renderização e interação com os modelos 3D. |
| [Vite](https://vite.dev/) | Ambiente de desenvolvimento e build. |
| [Vitest](https://vitest.dev/) | Testes automatizados. |
| [Playwright](https://playwright.dev/) | Testes de ponta a ponta do AR com WebXR simulado. |
| [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Análise estática do código. |
| [GitHub Actions](https://github.com/features/actions) | Workflows de integração e deploy. |
| [WebXR](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) | Recursos de realidade aumentada no navegador. |

## Documentação

- [Guia passo a passo](docs/step-by-step.md)
- [Plano de desenvolvimento](docs/development-plan.md)
- [Referências](docs/references.md)

## Demo

[🔗 Acessar a aplicação](https://lianeheidemann.github.io/ar-ceramic-designer/)
