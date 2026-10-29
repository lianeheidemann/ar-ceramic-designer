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

> Realidade aumentada testada no Galaxy S23 Ultra (Chrome, Android 16). Em outros aparelhos, verifique a compatibilidade.

<p align="center">
  <img width="100%" src="assets/interface/interface-ar-ceramic-designer-v6.webp">
</p>

## Funcionalidades

- Visualizador 3D com vaso, tigela e prato (girar, aproximar, reiniciar vista).
- Importar um modelo 3D próprio (`.glb`) pelo botão **Importar**: ele entra na lista de modelos, com as medidas lidas do arquivo, e funciona no visualizador, na comparação A/B e no AR. O **×** ao lado do modelo importado tira ele da lista. Exemplo para baixar e testar: [xícara de porcelana com pires](https://lianeheidemann.github.io/ar-ceramic-designer/models/xicara-porcelana.glb).
- Personalização do material: acabamentos (fosco, brilhante, vitrificado), cor, rugosidade e metalicidade.
- Comparação lado a lado de duas variantes (A/B).
- Realidade aumentada (WebXR) em Android compatível: um anel mostra a superfície detectada e um toque posiciona a peça em tamanho real; outro toque permite movê-la.
- Exportar e importar a configuração em `.json` e salvar uma imagem PNG da vista 3D.
- Acessibilidade: controle da câmera pelo teclado (setas giram, `+`/`−` aproximam, Home reinicia), foco visível e respeito à preferência por menos movimento.
- Desempenho: a cena só é redesenhada quando algo muda, e o visualizador se recupera se o sistema interromper o WebGL.

## Requisitos

- **Visualizador 3D:** navegador com suporte a WebGL 2 — Chrome 56+, Edge 79+, Firefox 51+ ou Safari 15+ (iOS/macOS), no computador ou no celular.
- **Realidade aumentada:** celular com Android 7.0 ou superior que esteja na [lista de dispositivos compatíveis com ARCore](https://developers.google.com/ar/devices), com o app Google Play Services para RA instalado, usando o Chrome 81 ou superior. O navegador precisa suportar WebXR com detecção de superfícies (`immersive-ar` e `hit-test`), a página deve ser acessada por HTTPS e é necessário autorizar o uso da câmera.
- **iPhone/iPad:** o Safari no iOS ainda não oferece WebXR, então apenas o visualizador 3D fica disponível.

## Limitações conhecidas

- **WebXR Layers no Chrome:** o AR sempre desenha numa `XRWebGLLayer` clássica, porque no AR do Chrome (S23 Ultra) nada desenhado numa camada de projeção aparecia sobre a câmera.
- **Modelos importados (`.glb`):** ficam só até recarregar a página e não são enviados a nenhum servidor. O arquivo precisa estar em metros (padrão do glTF); o app avisa se o tamanho parecer fora de escala e apoia a base da peça na superfície do AR. Só arquivo único `.glb`, com ou sem compressão Meshopt (a usada pelo gltfpack e por geradores como a Tripo). Não são aceitos `.gltf` com arquivos separados, `.obj`, compressão Draco e texturas KTX2; nesses casos o app diz qual recurso falta.
- **Material de modelos importados:** cor, rugosidade e metalicidade multiplicam os valores do próprio arquivo, então a cor tinge as texturas, e o acabamento vitrificado não muda o brilho.
- **Configuração de modelo importado:** o `.json` exportado só volta a abrir depois de importar o mesmo `.glb` de novo.
- **Captura no AR:** a imagem PNG é só da vista 3D; a câmera do AR não entra na captura.
- **Desempenho:** ainda não foi medido no aparelho. Para medir, abra a aplicação com `?debug=1`.

## Licenças dos modelos

| Modelo | Origem | Licença |
| :--- | :--- | :--- |
| Vaso, tigela e prato | Gerados por código neste projeto | MIT |
| Xícara com pires, exemplo para importar (`app/public/models/xicara-porcelana.glb`) | [Poly Haven](https://polyhaven.com/) e Eric Chadwick, via [glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DiffuseTransmissionTeacup) (Khronos); texturas reduzidas para 1024 px em WebP | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

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
