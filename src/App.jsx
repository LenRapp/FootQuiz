import { useState, useMemo } from 'react'
import './App.css'
import './Duel.css'
import Quiz from './Quiz'
import DuelQuiz from './DuelQuiz'
import questionsData from './questions.json'

function App() {
  // Navigation States
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu', 'theme', 'difficulty', 'quantity', 'game'
  const [gameMode, setGameMode] = useState('solo'); // 'solo' ou 'duel'

  // Game Config States
  const [category, setCategory] = useState('mix');
  const [difficulty, setDifficulty] = useState('mix');
  const [matchType, setMatchType] = useState('quick'); // 'quick', 'all', 'survival'
  const [gameId, setGameId] = useState(0);
  const [lastPlayedQuestions, setLastPlayedQuestions] = useState([]);

  // Extraire toutes les catégories
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

  // --- ACTIONS NAVIGATION ---

  const selectGameMode = (mode) => {
    setGameMode(mode);
    setCurrentScreen('theme');
  };

  const selectTheme = (cat, count) => {
    setCategory(cat);

    // Si DUEL -> On lance direct (ou on pourrait demander la quantité, mais restons simple : 10 questions)
    if (gameMode === 'duel') {
      launchGame();
      return;
    }

    // Si SOLO
    if (cat === 'mix') {
      setCurrentScreen('difficulty');
    } else {
      // Si moins de 10 questions, on lance tout direct
      if (count < 10) {
        setDifficulty('mix');
        setMatchType('all');
        launchGame();
      } else {
        setDifficulty('mix');
        setCurrentScreen('quantity');
      }
    }
  };

  const selectDifficulty = (diff) => {
    setDifficulty(diff);
    setCurrentScreen('quantity');
  };

  const selectQuantity = (type) => {
    setMatchType(type);
    launchGame();
  };

  const launchGame = () => {
    setGameId(prev => prev + 1);
    setLastPlayedQuestions([]);
    setCurrentScreen('game');
  };

  const replayGame = (questionsPlayed) => {
    if (gameMode === 'solo' && matchType === 'quick' && questionsPlayed) {
      setLastPlayedQuestions(questionsPlayed.map(q => q.question));
    }
    setGameId(prev => prev + 1);
  };

  const backToMenu = () => {
    setCurrentScreen('menu');
    setCategory('mix');
    setDifficulty('mix');
  };

  const backStep = () => {
    if (currentScreen === 'quantity' && category === 'mix') setCurrentScreen('difficulty');
    else if (currentScreen === 'quantity') setCurrentScreen('theme');
    else if (currentScreen === 'difficulty') setCurrentScreen('theme');
    else if (currentScreen === 'theme') setCurrentScreen('menu');
    else backToMenu();
  };

  return (
    <div className="app-container">

      {currentScreen !== 'game' ? (
        <div className="card home-card">
          <h1>FOOT<span>QUIZ</span></h1>

          {/* ECRAN 1 : MENU PRINCIPAL (CHOIX DU MODE) */}
          {currentScreen === 'menu' && (
            <>
              <p>Choisis ton mode de jeu :</p>
              <div className="difficulty-grid">
                <button className="diff-btn" style={{ borderBottomColor: '#00e676' }} onClick={() => selectGameMode('solo')}>
                  👤 SOLO
                  <span>(Carrière)</span>
                </button>
                <button className="diff-btn" style={{ borderBottomColor: '#ff1744' }} onClick={() => selectGameMode('duel')}>
                  ⚔️ DUEL 1v1
                  <span>(Même écran)</span>
                </button>
              </div>
            </>
          )}

          {/* ECRAN 2 : CHOIX DU THÈME */}
          {currentScreen === 'theme' && (
            <>
              <p>Choisis le thème du match :</p>
              <div className="difficulty-grid categories-scroll">
                <button className="diff-btn mix" onClick={() => selectTheme('mix', 500)}>
                  🌍 Tout Mélangé
                  <span>(Général)</span>
                </button>
                {categoryStats.map(cat => (
                  <button
                    key={cat.name}
                    className="diff-btn"
                    style={{ borderBottomColor: getCategoryColor(cat.name) }}
                    onClick={() => selectTheme(cat.name, cat.count)}
                  >
                    {cat.name}
                    <span>({cat.count})</span>
                  </button>
                ))}
              </div>
              <button className="skip-btn" onClick={backStep}>Retour</button>
            </>
          )}

          {/* ECRAN 3 : DIFFICULTÉ (Solo Mix seulement) */}
          {currentScreen === 'difficulty' && (
            <>
              <p>Quel niveau pour ce match ?</p>
              <div className="difficulty-grid">
                <button className="diff-btn easy" onClick={() => selectDifficulty('easy')}>
                  Échauffement <span>(Facile)</span>
                </button>
                <button className="diff-btn medium" onClick={() => selectDifficulty('medium')}>
                  Pro <span>(Moyen)</span>
                </button>
                <button className="diff-btn hard" onClick={() => selectDifficulty('hard')}>
                  Légende <span>(Difficile)</span>
                </button>
                <button className="diff-btn mix" onClick={() => selectDifficulty('mix')}>
                  Match Amical <span>(Aléatoire)</span>
                </button>
              </div>
              <button className="skip-btn" onClick={backStep}>Retour</button>
            </>
          )}

          {/* ECRAN 4 : QUANTITÉ / TYPE (Solo seulement) */}
          {currentScreen === 'quantity' && (
            <>
              <p>Type de match ?</p>
              <div className="difficulty-grid">
                <button className="diff-btn" style={{ borderBottomColor: '#00e676' }} onClick={() => selectQuantity('quick')}>
                  ⚡ Match Rapide
                  <span>(10 questions)</span>
                </button>
                <button className="diff-btn" style={{ borderBottomColor: '#ffea00' }} onClick={() => selectQuantity('all')}>
                  🏃 Marathon
                  <span>(Toutes les questions)</span>
                </button>
                <button className="diff-btn" style={{ borderBottomColor: '#ff1744', gridColumn: 'span 2' }} onClick={() => selectQuantity('survival')}>
                  💀 Mort Subite
                  <span>(3 vies, survie max)</span>
                </button>
              </div>
              <button className="skip-btn" onClick={backStep}>Retour</button>
            </>
          )}

        </div>
      ) : (
        /* JEU */
        gameMode === 'duel' ? (
          <DuelQuiz
            key={gameId}
            category={category}
            onBackToMenu={backToMenu}
            onReplay={() => selectGameMode('duel')} // Replay Duel simple
          />
        ) : (
          <Quiz
            key={gameId}
            category={category}
            difficulty={difficulty}
            mode={matchType}
            excludeQuestions={lastPlayedQuestions}
            onBackToMenu={backToMenu}
            onReplay={replayGame}
          />
        )
      )}
    </div>
  )
}

export default App
