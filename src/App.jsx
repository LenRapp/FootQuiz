import { useState } from 'react'
import './App.css'
import Quiz from './Quiz'

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="app-container">
      {/* Background Balls */}
      <div className="background-balls">
        <span>⚽</span><span>⚽</span><span>⚽</span><span>⚽</span><span>⚽</span>
        <span>⚽</span><span>⚽</span><span>⚽</span><span>⚽</span><span>⚽</span>
      </div>

      {!gameStarted ? (
        <div className="card home-card">
          <h1>Foot<span>Quiz</span> ⚽</h1>
          <p>Teste tes connaissances sur le football !</p>
          <div style={{ margin: '2rem 0' }}>
            <p>🌍 Questions internationales</p>
            <p>🇫🇷 Traduites en français</p>
            <p>⏱️ Mode rapide</p>
          </div>
          <button className="start-btn" onClick={() => setGameStarted(true)}>
            Coup d'envoi
          </button>
        </div>
      ) : (
        <Quiz onBackToMenu={() => setGameStarted(false)} />
      )}
    </div>
  )
}

export default App
