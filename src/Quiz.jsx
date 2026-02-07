import { useState, useEffect, useCallback } from 'react';
import questionsData from './questions.json';

// Fonction pure pour préparer les questions (hors du composant)
const prepareQuestions = (category, difficulty, mode, excludeList = []) => {
  const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());

  let filteredQuestions = questionsData;

  // 1. Filtrage Principal
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

  // 2. Exclusion
  if (mode === 'quick' && excludeList.length > 0) {
    const questionsNotPlayedYet = filteredQuestions.filter(q => !excludeList.includes(q.question));
    if (questionsNotPlayedYet.length >= 10) {
      filteredQuestions = questionsNotPlayedYet;
    }
  }

  // 3. Mélange et Coupe
  const shuffled = shuffleArray(filteredQuestions);
  return mode === 'quick' ? shuffled.slice(0, 10) : shuffled;
};

const Quiz = ({ onBackToMenu, category, difficulty, mode, excludeQuestions, onReplay }) => {
  const [questions] = useState(() => prepareQuestions(category, difficulty, mode, excludeQuestions));
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  
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
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer(null);
      setTimeLeft(TIME_PER_QUESTION);
      const nextQ = questions[nextIndex];
      setShuffledAnswers([...nextQ.incorrectAnswers, nextQ.correctAnswer].sort(() => 0.5 - Math.random()));
    } else {
      setGameOver(true);
    }
  }, [questions]);

  // Gestion unique du Chrono et du Timeout
  useEffect(() => {
    if (gameOver || userAnswer) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          // On déclenche le timeout ici, mais on doit s'assurer de ne pas créer de boucle
          // Pour éviter les soucis, on utilise un setTimeout externe pour sortir du cycle de rendu actuel
          setTimeout(() => {
             setUserAnswer((prev) => {
                 if (!prev) { // Seulement si pas déjà répondu
                     return { selected: null, isCorrect: false, timeOut: true };
                 }
                 return prev;
             });
             setTimeout(() => {
               // On utilise une fonction de mise à jour pour nextQuestion ou on l'appelle directement
               // car on est dans un timeout, donc safe
               if (currentQuestionIndex < questions.length) { // Check safe
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
  }, [gameOver, userAnswer, currentQuestionIndex, questions.length, nextQuestion]); // Dépendances mises à jour

  const handleAnswerClick = (answer) => {
    if (userAnswer) return;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.correctAnswer;
    
    setUserAnswer({ selected: answer, isCorrect });

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      nextQuestion(currentQuestionIndex + 1);
    }, 1500);
  };

  const handleSkip = () => {
    if (userAnswer) return;
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
        <h2>Fin du match ! 🏁</h2>
        <div className="score-display">{score} / {questions.length}</div>
        <p>Bien joué champion !</p>
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
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="stats-bar">
        <span>⚽ Question {currentQuestionIndex + 1}/{questions.length}</span>
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