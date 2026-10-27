import { useState } from 'react'
import { ModelList } from './components/ModelList'
import { Viewer } from './components/Viewer'
import { catalog, defaultModelId, getModelById } from './data/catalog'

function App() {
  const [selectedId, setSelectedId] = useState(defaultModelId)
  const selectedModel = getModelById(selectedId)

  return (
    <div className="app">
      <header className="app-header">
        <img className="app-logo" src="/favicon.svg" alt="" aria-hidden="true" />
        <h1>AR Ceramic Designer</h1>
      </header>

      <main className="viewport" aria-label="Visualizador 3D">
        {selectedModel ? (
          <Viewer model={selectedModel} />
        ) : (
          <p className="viewport-placeholder">Nenhum modelo selecionado</p>
        )}
      </main>

      <aside className="controls" aria-label="Controles">
        <h2>Modelos</h2>
        <ModelList
          models={catalog}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>
    </div>
  )
}

export default App
