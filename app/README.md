# app

Aplicação web em React + Three.js, com build pelo Vite e deploy no GitHub Pages.

## Estrutura

```
app/
├── index.html
├── vite.config.ts           # base do GitHub Pages
├── public/                  # ícones, modelos (.glb) e texturas
├── e2e/                     # testes Playwright (visualizador e AR com WebXR simulado)
└── src/
    ├── main.tsx             # ponto de entrada
    ├── App.tsx              # componente raiz e estado da aplicação
    ├── components/          # interface React (visualizador, controles, comparação)
    ├── viewers/             # cena Three.js, câmera e enquadramento
    ├── ar/                  # sessão WebXR (immersive-ar + hit-test)
    ├── geometry/            # geração das peças por perfil de torno
    ├── materials/           # acabamentos e variantes A/B
    ├── data/                # catálogo de modelos
    ├── hooks/               # suporte a RA e media queries
    ├── types/               # tipos compartilhados
    └── utils/               # mm ↔ m, configuração JSON e downloads
```

Os testes (`*.test.ts`) ficam ao lado do código que testam.

## Comandos

```bash
npm install
npm run dev       # desenvolvimento
npm run build     # typecheck + build
npm test          # Vitest
npm run test:e2e  # Playwright (antes: npx playwright install chromium)
npm run lint      # Oxlint
npm run format    # Prettier
```

A realidade aumentada exige HTTPS.

## Parâmetros de teste

Para testar no celular, acrescente à URL:

| Parâmetro            | Efeito                                                                                                     |
| :------------------- | :--------------------------------------------------------------------------------------------------------- |
| `?debug=1`           | Painel com quadros por segundo, draw calls, memória da GPU (visualizador 3D) e diagnóstico da sessão (AR). |
| `?cubo=1`            | Cubo de teste no AR, 50 cm à frente da posição inicial.                                                    |
| `?camada=projection` | Usa a camada de projeção do WebXR Layers, para reproduzir o problema do S23 Ultra.                         |
