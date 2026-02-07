import { useState, useMemo } from 'react'
import './App.css'
import Quiz from './Quiz'
import questionsData from './questions.json'

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [showQuantitySelect, setShowQuantitySelect] = useState(false);
  
  const [category, setCategory] = useState('mix');
  const [difficulty, setDifficulty] = useState('mix');
  const [gameMode, setGameMode] = useState('quick'); // 'quick' (10) ou 'all'
  const [gameId, setGameId] = useState(0); 
  const [lastPlayedQuestions, setLastPlayedQuestions] = useState([]);

  // Extraire toutes les catégories et compter les questions
  const categoryStats = useMemo(() => {
    const counts = {};
    questionsData.forEach(q => {
      const categories = Array.isArray(q.category) ? q.category : [q.category];
      categories.forEach(cat => {
        if (cat) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
    });
    return Object.keys(counts).sort().map(name => ({
      name,
      count: counts[name]
    }));
  }, []);

  const getCategoryColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 60%)`; 
  };

  // Étape 1 : Choix de la catégorie
  const chooseCategory = (cat, count) => {
    setCategory(cat);
    
    if (cat === 'mix') {
      setShowDifficultySelect(true);
    } else {
      // Si la catégorie a moins de 10 questions, on force le mode 'all' et on lance
      if (count < 10) {
        launchGame('mix', 'all');
      } else {
        // Sinon on demande la quantité, avec difficulté 'mix' par défaut
        setDifficulty('mix');
        setShowQuantitySelect(true);
      }
    }
  };

  // Étape 2 : Choix de la difficulté (seulement pour Mix)
  const chooseDifficulty = (diff) => {
    setDifficulty(diff);
    setShowDifficultySelect(false);
    setShowQuantitySelect(true);
  };

  // Étape 3 (Finale) : Choix de la quantité et Lancement
  const launchGame = (diff, mode) => {
    if (diff) setDifficulty(diff); // Sécurité
    setGameMode(mode);
    setGameId(prev => prev + 1);
    setLastPlayedQuestions([]);
    
    setShowDifficultySelect(false);
    setShowQuantitySelect(false);
    setGameStarted(true);
  };

  const replayGame = (questionsPlayed) => {
    if (questionsPlayed && gameMode === 'quick') {
      setLastPlayedQuestions(questionsPlayed.map(q => q.question));
    }
    setGameId(prev => prev + 1);
  };

  const backToMenu = () => {
    setGameStarted(false);
    setShowDifficultySelect(false);
    setShowQuantitySelect(false);
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
          
          {/* ÉCRAN 1 : CHOIX DU THÈME */}
          {!showDifficultySelect && !showQuantitySelect && (
            <>
              <p>Choisis ton thème de prédilection :</p>
              <div className="difficulty-grid categories-scroll">
                <button className="diff-btn mix" onClick={() => chooseCategory('mix', 500)}>
                  🌍 Tout Mélangé
                  <span>(Général)</span>
                </button>
                {categoryStats.map(cat => (
                  <button 
                    key={cat.name} 
                    className="diff-btn" 
                    style={{ borderBottomColor: getCategoryColor(cat.name) }}
                    onClick={() => chooseCategory(cat.name, cat.count)}
                  >
                    {cat.name}
                    <span>({cat.count})</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ÉCRAN 2 : CHOIX DIFFICULTÉ (Seulement pour Mix) */}
          {showDifficultySelect && (
            <>
              <p>Quel niveau pour ce match ?</p>
              <div className="difficulty-grid">
                <button className="diff-btn easy" onClick={() => chooseDifficulty('easy')}>
                  Échauffement <span>(Facile)</span>
                </button>
                <button className="diff-btn medium" onClick={() => chooseDifficulty('medium')}>
                  Pro <span>(Moyen)</span>
                </button>
                <button className="diff-btn hard" onClick={() => chooseDifficulty('hard')}>
                  Légende <span>(Difficile)</span>
                </button>
                <button className="diff-btn mix" onClick={() => chooseDifficulty('mix')}>
                  Match Amical <span>(Aléatoire)</span>
                </button>
              </div>
              <button className="skip-btn" onClick={backToMenu}>Retour</button>
            </>
          )}

          {/* ÉCRAN 3 : CHOIX QUANTITÉ */}
          {showQuantitySelect && (
            <>
              <p>Durée du match ?</p>
              <div className="difficulty-grid">
                <button className="diff-btn" style={{borderBottomColor: '#00e676'}} onClick={() => launchGame(null, 'quick')}>
                  ⚡ Match Rapide
                  <span>(10 questions)</span>
                </button>
                <button className="diff-btn" style={{borderBottomColor: '#ffea00'}} onClick={() => launchGame(null, 'all')}>
                  🏃 Marathon
                  <span>(Toutes les questions)</span>
                </button>
              </div>
              <button className="skip-btn" onClick={backToMenu}>Retour</button>
            </>
          )}

        </div>
      ) : (
        <Quiz 
          key={gameId} 
          category={category}
          difficulty={difficulty}
          mode={gameMode}
          excludeQuestions={lastPlayedQuestions} 
          onBackToMenu={backToMenu} 
          onReplay={replayGame}
        />
      )}
    </div>
  )
}

export default App