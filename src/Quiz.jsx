import { useState, useEffect, useCallback } from 'react';
import questionsData from './questions.json';

const Quiz = ({ onBackToMenu }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);

  // Fonction utilitaire pour mélanger un tableau
  const shuffleArray = (array) => {
    return [...array].sort(() => 0.5 - Math.random());
  };

  // Charger les questions et mélanger les réponses de la première
  const loadQuestions = useCallback(() => {
    setLoading(true);
    setGameOver(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer(null);

    // Mélanger toutes les questions disponibles et en prendre 10
    const shuffledQuestions = shuffleArray(questionsData).slice(0, 10);
    setQuestions(shuffledQuestions);

    // Préparer les réponses pour la première question
    if (shuffledQuestions.length > 0) {
      const firstQ = shuffledQuestions[0];
      const answers = shuffleArray([...firstQ.incorrectAnswers, firstQ.correctAnswer]);
      setShuffledAnswers(answers);
    }

    setLoading(false);
  }, []);

  // Initialisation du jeu
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Mettre à jour les réponses mélangées quand on change de question
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQ = questions[currentQuestionIndex];
      const answers = shuffleArray([...currentQ.incorrectAnswers, currentQ.correctAnswer]);
      setShuffledAnswers(answers);
    }
  }, [currentQuestionIndex, questions]);

  const handleAnswerClick = (answer) => {
    if (userAnswer) return;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.correctAnswer;
    
    setUserAnswer({ selected: answer, isCorrect });

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer(null);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const handleSkip = () => {
    if (userAnswer) return; 

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer(null);
    } else {
      setGameOver(true);
    }
  };

  if (loading) return <div className="loading">Préparation du match... ⚽</div>;
  
  if (gameOver) {
    return (
      <div className="card game-over">
        <h2>Fin du match ! 🏁</h2>
        <div className="score-display">{score} / {questions.length}</div>
        <p>Bien joué champion !</p>
        <div>
          <button onClick={loadQuestions} className="restart-btn">Rejouer</button>
          <button onClick={onBackToMenu} className="home-btn">Menu Principal</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div>Erreur de chargement.</div>;

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
