import { useState } from 'react';
import questionsData from './questions.json';

// Fonction pure pour préparer les questions (hors du composant)
const prepareQuestions = (difficulty) => {
  const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());

  const categorizeQuestion = (q) => {
    const text = (q.question + q.correctAnswer).toLowerCase();
    if (text.match(/messi|ronaldo|mbappé|neymar|zidane|psg|om|marseille|france|2018|2022|barcelone|real madrid/)) return 'easy';
    if (text.match(/1930|1934|1938|1950|1954|1958|1962|1966|1970|hongrie|tchécoslovaquie|urss|lev yachine|puskas|garrincha|just fontaine|record|date|combien/)) return 'hard';
    return 'medium';
  };

  const categorizedQuestions = questionsData.map(q => ({
    ...q,
    difficultyTag: categorizeQuestion(q)
  }));

  let filteredQuestions = categorizedQuestions;
  if (difficulty !== 'mix') {
    filteredQuestions = categorizedQuestions.filter(q => q.difficultyTag === difficulty);
    if (filteredQuestions.length < 5) filteredQuestions = categorizedQuestions;
  }

  // On retourne 10 questions mélangées
  return shuffleArray(filteredQuestions).slice(0, 10);
};

const Quiz = ({ onBackToMenu, difficulty, onReplay }) => {
  // Initialisation lazy : on prépare les questions une seule fois au montage
  const [questions] = useState(() => prepareQuestions(difficulty));
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  
  // On initialise les réponses mélangées directement avec la première question
  const [shuffledAnswers, setShuffledAnswers] = useState(() => {
    if (questions.length > 0) {
      const q = questions[0];
      return [...q.incorrectAnswers, q.correctAnswer].sort(() => 0.5 - Math.random());
    }
    return [];
  });

  const nextQuestion = (nextIndex) => {
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer(null);
      // Mélanger les réponses de la nouvelle question
      const nextQ = questions[nextIndex];
      setShuffledAnswers([...nextQ.incorrectAnswers, nextQ.correctAnswer].sort(() => 0.5 - Math.random()));
    } else {
      setGameOver(true);
    }
  };

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

  if (questions.length === 0) return <div>Erreur : Pas de questions trouvées.</div>;

  if (gameOver) {
    return (
      <div className="card game-over">
        <h2>Fin du match ! 🏁</h2>
        <div className="score-display">{score} / {questions.length}</div>
        <p>Bien joué champion !</p>
        <div>
          <button onClick={onReplay} className="restart-btn">Rejouer ce niveau</button>
          <button onClick={onBackToMenu} className="home-btn">Changer difficulté</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="card quiz-container">
      <div className="stats-bar">
        <span>Question <strong>{currentQuestionIndex + 1}/{questions.length}</strong></span>
        <span>Score: <strong>{score}</strong></span>
      </div>
      
      <h2 className="question-text">{currentQ.question}</h2>

      <div className="answers-grid">
        {shuffledAnswers.map((answer, index) => {
          let className = "answer-btn";
          if (userAnswer) {
            if (answer === currentQ.correctAnswer) className += " correct";
            else if (answer === userAnswer.selected) className += " wrong";
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