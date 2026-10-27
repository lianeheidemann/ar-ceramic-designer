function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>AR Ceramic Designer</h1>
      </header>

      <main className="viewport" aria-label="Visualizador 3D">
        {/* O canvas Three.js será montado aqui na Etapa 4. */}
        <p className="viewport-placeholder">Visualizador 3D</p>
      </main>

      <aside className="controls" aria-label="Controles">
        <h2>Controles</h2>
        <p>Seleção de modelo e acabamentos virão nas próximas etapas.</p>
      </aside>
    </div>
  )
}

export default App
