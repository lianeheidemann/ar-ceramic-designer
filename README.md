<h1 align="center">AR Ceramic Designer</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-111111?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/WebXR-005A9C?style=for-the-badge&logo=webxr&logoColor=white" alt="WebXR" />
</p>

<p align="center">
  <a href="https://lianeheidemann.github.io/ar-ceramic-designer/">
    <img src="https://img.shields.io/badge/GitHub%20Pages-View%20App-222222?style=for-the-badge&logo=github&logoColor=white" alt="View on GitHub Pages" />
  </a>
</p>

Aplicação web para visualizar e personalizar objetos de cerâmica em 3D e posicioná-los em realidade aumentada (WebXR) em dispositivos Android compatíveis.

Stack: TypeScript, React, Vite e Three.js.

## Requisitos

- Node.js LTS (testado com Node 22) e npm.

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
