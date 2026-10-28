# app

Código-fonte da aplicação web: React + Three.js, empacotada com Vite e publicada no GitHub Pages (`base: '/ar-ceramic-designer/'` em `vite.config.ts`).

## Estrutura

| Pasta / arquivo | Conteúdo |
| :--- | :--- |
| `src/main.tsx`, `src/App.tsx` | Ponto de entrada e componente raiz: estado do modelo selecionado, tema, materiais personalizados e modo de comparação. |
| `src/components/` | Componentes React da interface: visualizador (`Viewer`), lista de modelos, controles de material, comparação lado a lado (`CompareView`) e ícones de status da RA. |
| `src/viewers/` | Cena Three.js independente do React (`CeramicViewer`): renderização, luzes, câmera, controles de órbita, enquadramento do modelo e sincronização de câmeras na comparação. |
| `src/ar/` | Realidade aumentada via WebXR: verificação de suporte do navegador, sessão `immersive-ar` com `hit-test` para posicionar a peça em superfícies e mensagens de status exibidas durante a sessão. |
| `src/geometry/` | Geração das peças por torno (lathe): suaviza o perfil externo e cria a parede com espessura. |
| `src/materials/` | Predefinições de acabamento (fosco, brilhante, vitrificado) e materiais iniciais das variantes A/B da comparação. |
| `src/data/` | Catálogo de modelos de cerâmica e suas dimensões. |
| `src/hooks/` | Hooks React: suporte a RA e media queries. |
| `src/types/` | Tipos compartilhados (modelos, materiais, perfis). |
| `src/utils/` | Conversão de unidades: as medidas são registradas em milímetros, e Three.js/WebXR usam metros. |
| `public/` | Ícones do site e pastas reservadas para modelos e texturas. |

Os arquivos `*.test.ts` ficam ao lado do código que testam.

## Comandos

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run build      # checagem de tipos + build de produção
npm test           # testes (Vitest)
npm run lint       # análise estática (Oxlint)
npm run format     # formatação (Prettier)
```

A realidade aumentada só funciona em HTTPS. Para testar no celular, acesse o servidor de desenvolvimento por uma conexão segura ou use a versão publicada.
