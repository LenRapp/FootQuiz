import { useState, useMemo } from 'react'
import './App.css'
import Quiz from './Quiz'
import questionsData from './questions.json'

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [category, setCategory] = useState('mix');
  const [difficulty, setDifficulty] = useState('mix'); 
  const [gameId, setGameId] = useState(0); 
  const [lastPlayedQuestions, setLastPlayedQuestions] = useState([]);

  // Extraire toutes les catégories uniques dynamiquement
  const allCategories = useMemo(() => {
    const cats = new Set();
    questionsData.forEach(q => {
      if (Array.isArray(q.category)) {
        q.category.forEach(c => cats.add(c));
      } else if (q.category) {
        cats.add(q.category);
      }
    });
    return Array.from(cats).sort();
  }, []);

  // Générer une couleur stable basée sur le nom de la catégorie
  const getCategoryColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 60%)`; // Couleur vive mais équilibrée
  };

  // Étape 1 : Choix de la catégorie
  const chooseCategory = (cat) => {
    setCategory(cat);
    if (cat === 'mix') {
      setShowDifficultySelect(true);
    } else {
      launchGame('mix'); 
    }
  };

  // Étape 2 (Optionnelle) ou Lancement direct : Choix difficulté et Start
  const launchGame = (diff) => {
    setDifficulty(diff);
    setGameId(prev => prev + 1);
    setLastPlayedQuestions([]);
    setGameStarted(true);
    setShowDifficultySelect(false);
  };

  const replayGame = (questionsPlayed) => {
    if (questionsPlayed) {
      setLastPlayedQuestions(questionsPlayed.map(q => q.question));
    }
    setGameId(prev => prev + 1);
  };

  const backToMenu = () => {
    setGameStarted(false);
    setShowDifficultySelect(false);
    setCategory('mix');
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
          
          {!showDifficultySelect ? (
            <>
              <p>Choisis ton thème de prédilection :</p>
              <div className="difficulty-grid categories-scroll">
                <button className="diff-btn mix" onClick={() => chooseCategory('mix')}>
                  🌍 Tout Mélangé
                  <span>(Général)</span>
                </button>
                {allCategories.map(cat => (
                  <button 
                    key={cat} 
                    className="diff-btn" 
                    style={{ borderBottomColor: getCategoryColor(cat) }}
                    onClick={() => chooseCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>Quel niveau pour ce match ?</p>
              <div className="difficulty-grid">
                <button className="diff-btn easy" onClick={() => launchGame('easy')}>
                  Échauffement
                  <span>(Facile)</span>
                </button>
                <button className="diff-btn medium" onClick={() => launchGame('medium')}>
                  Pro
                  <span>(Moyen)</span>
                </button>
                <button className="diff-btn hard" onClick={() => launchGame('hard')}>
                  Légende
                  <span>(Difficile)</span>
                </button>
                <button className="diff-btn mix" onClick={() => launchGame('mix')}>
                  Match Amical
                  <span>(Aléatoire)</span>
                </button>
              </div>
              <button className="skip-btn" onClick={() => setShowDifficultySelect(false)}>Retour aux thèmes</button>
            </>
          )}
        </div>
      ) : (
        <Quiz 
          key={gameId} 
          category={category}
          difficulty={difficulty}
          excludeQuestions={lastPlayedQuestions} 
          onBackToMenu={backToMenu} 
          onReplay={replayGame}
        />
      )}
    </div>
  )
}

export default App
