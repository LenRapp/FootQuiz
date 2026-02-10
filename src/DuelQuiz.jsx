import { useState, useEffect, useCallback } from 'react';
import questionsData from './questions.json';
import confetti from 'canvas-confetti';

const prepareDuelQuestions = (category) => {
  const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());
  let filtered = questionsData;
  if (category !== 'mix') {
    filtered = questionsData.filter(q => {
      if (Array.isArray(q.category)) return q.category.some(c => c.toLowerCase() === category.toLowerCase());
      if (typeof q.category === 'string') return q.category.toLowerCase() === category.toLowerCase();
      return false;
    });
  }
  if (filtered.length < 10) filtered = questionsData;
  return shuffleArray(filtered).slice(0, 10);
};

const DuelQuiz = ({ onBackToMenu, category, onReplay }) => {
  const [questions] = useState(() => prepareDuelQuestions(category));
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [userAnswer, setUserAnswer] = useState(null);
  
  // Initialisation des réponses mélangées
  const [shuffledAnswers, setShuffledAnswers] = useState(() => {
    if (questions.length > 0) {
      const q = questions[0];
      return [...q.incorrectAnswers, q.correctAnswer].sort(() => 0.5 - Math.random());
    }
    return [];
  });

  const TIME_PER_QUESTION = 15;
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  const isGameOver = currentQIndex >= questions.length;

  const nextTurn = useCallback((nextIndex) => {
    if (nextIndex < questions.length) {
      setCurrentPlayer(p => p === 1 ? 2 : 1);
      setCurrentQIndex(nextIndex);
      setUserAnswer(null);
      setTimeLeft(TIME_PER_QUESTION);
      // Mélange des réponses ici
      const nextQ = questions[nextIndex];
      setShuffledAnswers([...nextQ.incorrectAnswers, nextQ.correctAnswer].sort(() => 0.5 - Math.random()));
    } else {
      setCurrentQIndex(nextIndex); // Game Over
    }
  }, [questions]);

  // Gestion Chrono + Timeout
  useEffect(() => {
    if (isGameOver || userAnswer) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          setTimeout(() => {
             // Timeout = Raté
             setUserAnswer({ selected: null, isCorrect: false, timeOut: true });
             setTimeout(() => {
               nextTurn(currentQIndex + 1);
             }, 1500);
          }, 0);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isGameOver, userAnswer, currentQIndex, nextTurn]);

  const handleAnswer = (answer) => {
    if (userAnswer) return;

    const currentQ = questions[currentQIndex];
    const isCorrect = answer === currentQ.correctAnswer;
    
    setUserAnswer({ selected: answer, isCorrect });

    if (isCorrect) {
      if (currentPlayer === 1) setScoreP1(s => s + 1);
      else setScoreP2(s => s + 1);
    }

    setTimeout(() => {
      nextTurn(currentQIndex + 1);
    }, 1500);
  };

  useEffect(() => {
    if (isGameOver) {
      if (scoreP1 !== scoreP2) {
        confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 });
      }
    }
  }, [isGameOver, scoreP1, scoreP2]);

  if (isGameOver) {
    let winnerText = "Match Nul ! 🤝";
    if (scoreP1 > scoreP2) winnerText = "🏆 Joueur 1 Gagne !";
    if (scoreP2 > scoreP1) winnerText = "🏆 Joueur 2 Gagne !";

    return (
      <div className="card game-over">
        <h2>FIN DU MATCH ! 🏁</h2>
        <div className="duel-final-score">
          <div className="p-score p1">
            <span>J1</span>
            <strong>{scoreP1}</strong>
          </div>
          <div className="vs">vs</div>
          <div className="p-score p2">
            <span>J2</span>
            <strong>{scoreP2}</strong>
          </div>
        </div>
        <h3 className="winner-text">{winnerText}</h3>
        <div>
          <button onClick={() => onReplay(category)} className="restart-btn">Revanche</button>
          <button onClick={onBackToMenu} className="home-btn">Menu Principal</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className={`card quiz-container duel-turn-mode player-${currentPlayer}`}>
      <button className="quit-btn" onClick={onBackToMenu}>✕</button>

      <div className="duel-header">
        <div className={`badge p1 ${currentPlayer === 1 ? 'active' : ''}`}>J1: {scoreP1}</div>
        <div className="turn-indicator">
            À TOI <strong>JOUEUR {currentPlayer}</strong>
        </div>
        <div className={`badge p2 ${currentPlayer === 2 ? 'active' : ''}`}>J2: {scoreP2}</div>
      </div>

      <div className="round-info">
        Question {currentQIndex + 1}/10 • <span style={{color: timeLeft < 6 ? '#ff1744' : 'inherit'}}>⏱️ {timeLeft}s</span>
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
              onClick={() => handleAnswer(answer)}
              className={className}
              disabled={!!userAnswer}
            >
              {answer}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DuelQuiz;