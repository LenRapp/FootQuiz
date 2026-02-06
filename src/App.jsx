import { useState } from 'react'
import './App.css'
import Quiz from './Quiz'

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('mix');
  const [gameId, setGameId] = useState(0); // Clé unique pour forcer le reset du Quiz
  const [lastPlayedQuestions, setLastPlayedQuestions] = useState([]); // Questions à éviter au prochain tour

  const startGame = (level) => {
    setDifficulty(level);
    setGameId(prev => prev + 1);
    setLastPlayedQuestions([]); // Nouveau jeu complet = on reset l'exclusion
    setGameStarted(true);
  };

  const replayGame = (questionsPlayed) => {
    // On sauvegarde les titres des questions jouées pour les exclure au prochain round
    if (questionsPlayed) {
      setLastPlayedQuestions(questionsPlayed.map(q => q.question));
    }
    setGameId(prev => prev + 1); // Reset complet du composant Quiz
  };

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
          <p>Choisis ton niveau pour entrer sur le terrain :</p>
          
          <div className="difficulty-grid">
            <button className="diff-btn easy" onClick={() => startGame('easy')}>
              Échauffement
              <span>(Facile)</span>
            </button>
            <button className="diff-btn medium" onClick={() => startGame('medium')}>
              Pro
              <span>(Moyen)</span>
            </button>
            <button className="diff-btn hard" onClick={() => startGame('hard')}>
              Légende
              <span>(Difficile)</span>
            </button>
            <button className="diff-btn mix" onClick={() => startGame('mix')}>
              Match Amical
              <span>(Mix de tout)</span>
            </button>
          </div>
        </div>
      ) : (
        <Quiz 
          key={gameId} // Force le remontage complet du composant quand ça change
          difficulty={difficulty}
          excludeQuestions={lastPlayedQuestions} // On passe la liste noire
          onBackToMenu={() => setGameStarted(false)} 
          onReplay={replayGame}
        />
      )}
    </div>
  )
}

export default App
