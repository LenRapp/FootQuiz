import { useState, useEffect, useCallback } from 'react';
import questionsData from './questions.json';
import confetti from 'canvas-confetti'; // Import confetti

// Fonction pure pour préparer les questions
const prepareQuestions = (category, difficulty, mode, excludeList = []) => {
  const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());

  let filteredQuestions = questionsData;

  if (category !== 'mix') {
    filteredQuestions = questionsData.filter(q => {
      if (Array.isArray(q.category)) {
        return q.category.some(c => c.toLowerCase() === category.toLowerCase());
      }
      if (typeof q.category === 'string') {
        return q.category.toLowerCase() === category.toLowerCase();
      }
      return false;
    });
  } else {
    if (difficulty !== 'mix') {
      const difficultyMap = {
        'easy': ['facile', 'easy'],
        'medium': ['moyen', 'medium'],
        'hard': ['difficile', 'hard']
      };
      const validTags = difficultyMap[difficulty];
      
      filteredQuestions = questionsData.filter(q => {
        if (q.difficulty) {
          return validTags.includes(q.difficulty.toLowerCase());
        }
        return difficulty === 'medium';
      });
    }
  }

  if (filteredQuestions.length === 0) {
    console.warn(`Aucune question trouvée. Fallback sur toutes les questions.`);
    filteredQuestions = questionsData;
  }

  // En mode Survie ou Marathon, on ne filtre pas les exclusions (on veut tout le contenu)
  if (mode === 'quick' && excludeList.length > 0) {
    const questionsNotPlayedYet = filteredQuestions.filter(q => !excludeList.includes(q.question));
    if (questionsNotPlayedYet.length >= 10) {
      filteredQuestions = questionsNotPlayedYet;
    }
  }

  const shuffled = shuffleArray(filteredQuestions);
  return mode === 'quick' ? shuffled.slice(0, 10) : shuffled;
};

const Quiz = ({ onBackToMenu, category, difficulty, mode, excludeQuestions, onReplay }) => {
  const [questions] = useState(() => prepareQuestions(category, difficulty, mode, excludeQuestions));
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  const [lives, setLives] = useState(3);
  
  const TIME_PER_QUESTION = 15;
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  const [shuffledAnswers, setShuffledAnswers] = useState(() => {
    if (questions.length > 0) {
      const q = questions[0];
      return [...q.incorrectAnswers, q.correctAnswer].sort(() => 0.5 - Math.random());
    }
    return [];
  });

  const nextQuestion = useCallback((nextIndex) => {
    // Vérification Game Over par vies (Mode Survie)
    if (mode === 'survival' && lives <= 0) {
      setGameOver(true);
      return;
    }

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer(null);
      setTimeLeft(TIME_PER_QUESTION);
      const nextQ = questions[nextIndex];
      setShuffledAnswers([...nextQ.incorrectAnswers, nextQ.correctAnswer].sort(() => 0.5 - Math.random()));
    } else {
      setGameOver(true);
    }
  }, [questions, mode, lives]);

  // Gestion Chrono
  useEffect(() => {
    if (gameOver || userAnswer) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          setTimeout(() => {
             // Timeout = Perte de vie en mode survie
             if (mode === 'survival') {
               setLives(prev => prev - 1);
             }
             
             setUserAnswer((prev) => {
                 if (!prev) return { selected: null, isCorrect: false, timeOut: true };
                 return prev;
             });
             
             setTimeout(() => {
               // Vérification manuelle si mort pour l'affichage immédiat
               // On utilise une closure pour capturer la valeur à jour si possible ou on se base sur la logique
               // Ici nextQuestion gérera la fin si lives <= 0
               if (mode === 'survival' && lives - 1 <= 0) {
                 setGameOver(true);
               } else if (currentQuestionIndex < questions.length) { 
                   nextQuestion(currentQuestionIndex + 1);
               }
             }, 2000);
          }, 0);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameOver, userAnswer, currentQuestionIndex, questions.length, nextQuestion, mode, lives]);

  // Confettis en cas de victoire parfaite
  useEffect(() => {
    // Score parfait en mode non-survie OU gros score en survie (ex: > 10)
    const isPerfect = (mode !== 'survival' && score === questions.length);
    const isGoodSurvival = (mode === 'survival' && score > 10); // Exemple de seuil

    if (gameOver && (isPerfect || isGoodSurvival) && questions.length > 0) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [gameOver, score, questions.length, mode]);

  const handleAnswerClick = (answer) => {
    if (userAnswer) return;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.correctAnswer;
    
    setUserAnswer({ selected: answer, isCorrect });

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      if (mode === 'survival') {
        setLives(prev => prev - 1);
      }
    }

    setTimeout(() => {
      // Check immédiat de la mort
      if (mode === 'survival' && !isCorrect && lives - 1 <= 0) {
        setGameOver(true);
      } else {
        nextQuestion(currentQuestionIndex + 1);
      }
    }, 1500);
  };

  const handleSkip = () => {
    if (userAnswer) return;
    // En survie, skipper pourrait être gratuit ou coûter une vie. Ici gratuit.
    nextQuestion(currentQuestionIndex + 1);
  };

  const getTimerColor = () => {
    if (timeLeft > 10) return '#00e676';
    if (timeLeft > 5) return '#ffea00';
    return '#ff1744';
  };

  if (questions.length === 0) return <div>Erreur : Pas de questions trouvées.</div>;

  if (gameOver) {
    return (
      <div className="card game-over">
        <h2>{mode === 'survival' && lives <= 0 ? "Carton Rouge ! 🟥" : "Fin du match ! 🏁"}</h2>
        <div className="score-display">{score} {mode === 'survival' ? 'pts' : `/ ${questions.length}`}</div>
        <p>{mode === 'survival' ? "Tu as tout donné !" : "Bien joué champion !"}</p>
        <div>
          <button onClick={() => onReplay(questions)} className="restart-btn">Rejouer ce thème</button>
          <button onClick={onBackToMenu} className="home-btn">Changer de thème</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="card quiz-container">
      <button className="quit-btn" onClick={onBackToMenu}>✕</button>
      
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="stats-bar">
        {mode === 'survival' ? (
           <span style={{color: '#ff1744'}}>Vies: {"⚽".repeat(Math.max(0, lives))}</span>
        ) : (
           <span>⚽ {currentQuestionIndex + 1}/{questions.length}</span>
        )}
        
        <span style={{ color: getTimerColor(), fontSize: '1.4rem' }}>
          ⏱️ {timeLeft}s
        </span>
        <span>🏆 Score: {score}</span>
      </div>
      
      <h2 className="question-text">{currentQ.question}</h2>

      <div className="answers-grid">
        {shuffledAnswers.map((answer, index) => {
          let className = "answer-btn";
          
          if (userAnswer) {
            if (answer === currentQ.correctAnswer) {
              className += " correct";
            }
            else if (answer === userAnswer.selected) {
              className += " wrong";
            }
          }
          
          return (
            <button 
              key={index} 
              onClick={() => handleAnswerClick(answer)}
              className={className}
              disabled={!!userAnswer}
            >
              {answer}
            </button>
          );
        })}
      </div>
      
      <button 
        className="skip-btn" 
        onClick={handleSkip} 
        disabled={!!userAnswer}
      >
        Passer cette question ⏩
      </button>
    </div>
  );
};

export default Quiz;
