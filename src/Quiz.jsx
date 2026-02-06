import { useState } from 'react';
import questionsData from './questions.json';

// Fonction pure pour préparer les questions (hors du composant)
const prepareQuestions = (difficulty, excludeList = []) => {
  const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());

  const difficultyMap = {
    'easy': ['facile', 'easy'],
    'medium': ['moyen', 'medium'],
    'hard': ['difficile', 'hard']
  };

  let filteredQuestions = questionsData;

  // 1. Filtrage par difficulté
  if (difficulty !== 'mix') {
    const validTags = difficultyMap[difficulty];
    filteredQuestions = questionsData.filter(q => {
      if (q.difficulty) {
        return validTags.includes(q.difficulty.toLowerCase());
      }
      return difficulty === 'medium';
    });

    if (filteredQuestions.length < 5) {
      filteredQuestions = questionsData;
    }
  }

  // 2. Exclusion des questions précédentes (si possible)
  if (excludeList.length > 0) {
    const questionsNotPlayedYet = filteredQuestions.filter(q => !excludeList.includes(q.question));
    
    // On n'applique l'exclusion que si il reste assez de questions (au moins 10)
    // Sinon, on remet tout le monde dans le paquet pour ne pas bloquer le jeu
    if (questionsNotPlayedYet.length >= 10) {
      filteredQuestions = questionsNotPlayedYet;
    }
  }

  // 3. Mélange final
  return shuffleArray(filteredQuestions).slice(0, 10);
};

const Quiz = ({ onBackToMenu, difficulty, excludeQuestions, onReplay }) => {
  // Initialisation lazy avec prise en compte de l'exclusion
  const [questions] = useState(() => prepareQuestions(difficulty, excludeQuestions));
  
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
          <button onClick={() => onReplay(questions)} className="restart-btn">Rejouer ce niveau</button>
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