import { useState, useEffect } from 'react';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);

  // Fonction de traduction simple via MyMemory API (Gratuite et sans clé)
  const translateText = async (text) => {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
      const data = await response.json();
      return data.responseData.translatedText;
    } catch (error) {
      console.error("Erreur traduction:", error);
      return text;
    }
  };

  const fetchAndTranslateQuestions = async () => {
    setLoading(true);
    setGameOver(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer(null);

    try {
      const response = await fetch('https://the-trivia-api.com/api/questions?categories=sport_and_leisure&limit=5&tags=soccer');
      const data = await response.json();
      
      // Traduction uniquement des questions
      const translatedData = await Promise.all(data.map(async (q) => {
        const translatedQuestion = await translateText(q.question);
        
        return {
          ...q,
          question: translatedQuestion
        };
      }));

      setQuestions(translatedData);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndTranslateQuestions();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQ = questions[currentQuestionIndex];
      const answers = [...currentQ.incorrectAnswers, currentQ.correctAnswer];
      setShuffledAnswers(answers.sort(() => Math.random() - 0.5));
    }
  }, [questions, currentQuestionIndex]);

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

  if (loading) return <div className="loading">Traduction du match en cours... ⚽🌍</div>;
  
  if (gameOver) {
    return (
      <div className="game-over">
        <h2>Fin du match ! 🏁</h2>
        <p>Ton score : {score} / {questions.length}</p>
        <button onClick={fetchAndTranslateQuestions} className="restart-btn">Rejouer le match</button>
      </div>
    );
  }

  if (questions.length === 0) return <div>Erreur de chargement.</div>;

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <div className="stats-bar">
        <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
        <span>Score: {score}</span>
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
    </div>
  );
};

export default Quiz;