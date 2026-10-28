# app

Código-fonte da aplicação web: React + Three.js, empacotada com Vite e publicada no GitHub Pages (`base: '/ar-ceramic-designer/'` em `vite.config.ts`).

## Arquitetura

```
app/
├── index.html                 # página HTML que carrega src/main.tsx
├── vite.config.ts             # configuração do Vite (base do GitHub Pages)
├── package.json               # dependências e scripts
├── public/
│   ├── icons/                 # ícones do site
│   ├── models/                # reservado para modelos .glb
│   └── textures/              # reservado para texturas
└── src/
    ├── main.tsx               # ponto de entrada do React
    ├── App.tsx                # componente raiz e estado da aplicação
    ├── index.css              # estilos globais
    ├── components/            # interface (React)
    │   ├── Viewer.tsx         # canvas 3D e botão de RA
    │   ├── CompareView.tsx    # comparação lado a lado (variantes A/B)
    │   ├── ModelList.tsx      # lista de modelos do catálogo
    │   ├── MaterialControls.tsx # cor, rugosidade, metalicidade e acabamentos
    │   └── ArStatusIcon.tsx   # ícones das mensagens de RA
    ├── viewers/               # cena 3D (Three.js, sem React)
    │   ├── CeramicViewer.ts   # renderer, luzes, câmera e carregamento das peças
    │   ├── CameraSync.ts      # sincroniza as câmeras na comparação
    │   └── framing.ts         # enquadramento da peça na tela
    ├── ar/                    # realidade aumentada (WebXR)
    │   ├── support.ts         # verifica suporte a immersive-ar
    │   ├── arSession.ts       # sessão de RA com hit-test
    │   └── arStatus.ts        # mensagens exibidas durante a sessão
    ├── geometry/
    │   └── lathe.ts           # gera a peça a partir do perfil de torno
    ├── materials/
    │   ├── presets.ts         # acabamentos: fosco, brilhante, vitrificado
    │   └── variants.ts        # materiais iniciais das variantes A/B
    ├── data/
    │   └── catalog.ts         # catálogo de modelos e dimensões
    ├── hooks/
    │   ├── useArSupport.ts    # suporte a RA no navegador
    │   └── useMediaQuery.ts   # layout responsivo
    ├── types/
    │   └── ceramic.ts         # tipos compartilhados
    └── utils/
        └── units.ts           # conversão mm ↔ m
```

`App` guarda todo o estado e repassa aos componentes. Cada `Viewer` cria um `CeramicViewer`, que monta a cena: as peças do catálogo são geradas a partir de um perfil de torno (`geometry/lathe`) ou carregadas de um arquivo `.glb`. Ao entrar em RA, o `CeramicViewer` abre a sessão WebXR (`ar/arSession`), que usa o `hit-test` para posicionar a peça em uma superfície real.

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
