import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, Alert, Badge } from 'reactstrap';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { getQuestionById, executeMongoQuery, getAnswerById } from '../Utils/MongoQuestions.jsx';
import { useNavigate } from 'react-router-dom';

export default function Game() {
  const navigate = useNavigate();

  const [questionsIdList, setQuestionIdList] = useState(() => [
    ...Array.from({ length: 5 }, () => Math.floor(Math.random() * 15)),
    ...Array.from({ length: 3 }, () => Math.floor(Math.random() * 10) + 15),
    ...Array.from({ length: 5 }, () => Math.floor(Math.random() * 5) + 25)
  ]);

  const [numQuestion, setNumQuestion] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [selectedQueryResult, setSelectedQueryResult] = useState(null);
  const [correctQueryResult, setCorrectQueryResult] = useState(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState(null);

  const loadQuestion = async () => {
    setIsLoading(true);
    const id = questionsIdList[numQuestion];
    const question = await getQuestionById(id);
    setCurrentQuestion(question);
    setIsLoading(false);
    setShowResult(false);
    setTimerKey(prev => prev + 1);
  };

  useEffect(() => {
    if (numQuestion < questionsIdList.length) {
      loadQuestion();
    } else {
      setGameFinished(true);
    }
  }, [numQuestion]);

  const handleAnswer = async (index) => {
    if (!currentQuestion || index < 0) return;
    setIsAnswering(true);
    setIsExecutingQuery(true);
    setError(null);

    try {
      const selectedQuery = currentQuestion.options[index];

      const answer = await getAnswerById(currentQuestion.id);
      const correctIndex = answer.correctAnswer;
      const correctQueryResult = await executeMongoQuery(currentQuestion.options[correctIndex]);
      setCorrectQueryResult(() => correctQueryResult)
    console.log(index)
    console.log(correctIndex)
    console.log(correctQueryResult)
      const isCorrect = index == correctIndex
      if (isCorrect) {
        setScore(s => s + 1);
      }

      setLastResult({
        isCorrect,
        selectedAnswer: index,
        correctAnswer: correctIndex,
        explanation: answer.explanation
      });

      setShowResult(true);

    } catch (e) {
      setError(`Query execution failed: ${e.message}`);
    } finally {
      setIsExecutingQuery(false);
      setIsAnswering(false);
    }
  };

  const handleTimerStop = () => {
    if (!showResult && !isAnswering) {
      handleAnswer(-1);
    }
  };

  const nextQuestion = () => {
    setNumQuestion(prev => prev + 1);
    setSelectedQueryResult(null);
    setCorrectQueryResult(null);
    setLastResult(null);
    setShowResult(false);
  };

  const restartGame = () => {
    setNumQuestion(0);
    setScore(0);
    setGameFinished(false);
    setQuestionIdList([
      ...Array.from({ length: 5 }, () => Math.floor(Math.random() * 15)),
      ...Array.from({ length: 3 }, () => Math.floor(Math.random() * 10) + 15),
      ...Array.from({ length: 5 }, () => Math.floor(Math.random() * 5) + 25)
    ]);
  };

  if (isLoading) return <div>Chargement...</div>;
  if (gameFinished) return (
    <div>
      <h1>Partie Terminée</h1>
      <p>Score: {score}/{questionsIdList.length}</p>
      <Button onClick={restartGame}>Rejouer</Button>
      <Button onClick={() => navigate('/')}>Lobby</Button>
    </div>
  );

  return (
    <div className='d-flex flex-column align-items-center gap-3'>
      <h2>Question {numQuestion + 1}/{questionsIdList.length}</h2>
      <Card>
        <CardBody>
          <h3>{currentQuestion.question}</h3>
          <Badge color="info">{currentQuestion.difficulty}</Badge>
        </CardBody>
      </Card>

      <CountdownCircleTimer
        key={timerKey}
        size={80}
        isPlaying={!showResult && !isExecutingQuery}
        duration={15}
        colors={['#004777', '#F7B801', '#A30000', '#A30000']}
        colorsTime={[15, 10, 5, 0]}
        onComplete={handleTimerStop}
      >
        {({ remainingTime }) => remainingTime}
      </CountdownCircleTimer>

      {error && <Alert color="danger">{error}</Alert>}
      {isExecutingQuery && <Alert color="info">Exécution en cours...</Alert>}

      {currentQuestion.options.map((option, i) => {
        let color = 'outline-primary';
        if (showResult) {
          if (i === lastResult.correctAnswer) color = 'success';
          else if (i === lastResult.selectedAnswer && !lastResult.isCorrect) color = 'danger';
          else color = 'outline-secondary';
        }

        return (
          <Button
            key={i}
            color={color}
            onClick={() => handleAnswer(i)}
            disabled={showResult || isExecutingQuery || isAnswering}
          >
            {String.fromCharCode(65 + i)}. {option}
          </Button>
        );
      })}

      {showResult && lastResult && (
        <div className='w-100'>
          <Alert color={lastResult.isCorrect ? 'success' : 'danger'}>
            {lastResult.isCorrect ? 'Bonne réponse!' : 'Mauvaise réponse!'}
            <br />
            <small>{lastResult.explanation}</small> <br/>
            <b>Résultat de la Commande : </b><br/>
            {JSON.stringify(correctQueryResult, null, 2)}
          </Alert>
          <Button color='primary' onClick={nextQuestion}>Question suivante</Button>
        </div>
      )}
    </div>
  );
} 
