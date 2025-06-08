import React from 'react';
import { Button, Card, CardBody } from 'reactstrap';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { getQuestionById, getAnswerById } from '../Utils/MongoQuestions';
import { useNavigate } from 'react-router-dom';

export default function Game(params) {
    const navigate = useNavigate();
    
    // Generate random question IDs based on difficulty
    const questionsIdList = [
        ...Array.from({length: 5}, () => Math.floor(Math.random() * 15)), // Easy (0-14)
        ...Array.from({length: 3}, () => Math.floor(Math.random() * 10) + 15), // Medium (15-24) 
        ...Array.from({length: 5}, () => Math.floor(Math.random() * 5) + 25)  // Hard (25-29)
    ];
    
    const [numQuestion, setNumQuestion] = React.useState(0);
    const [currentQuestion, setCurrentQuestion] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [gameFinished, setGameFinished] = React.useState(false);
    const [score, setScore] = React.useState(0);
    const [showResult, setShowResult] = React.useState(false);
    const [lastResult, setLastResult] = React.useState(null);
    const [timerKey, setTimerKey] = React.useState(0);

    // Load current question
    React.useEffect(() => {
        const loadQuestion = async () => {
            if (numQuestion < questionsIdList.length) {
                setIsLoading(true);
                const questionData = await getQuestionById(questionsIdList[numQuestion]);
                if (questionData) {
                    setCurrentQuestion(questionData);
                }
                setIsLoading(false);
                setShowResult(false);
                setTimerKey(prev => prev + 1); // Reset timer
            } else {
                setGameFinished(true);
            }
        };

        loadQuestion();
    }, [numQuestion]);

    const handleTimerStop = () => {
        if (!showResult) {
            handleAnswer(-1); // -1 indicates timeout (no answer selected)
        }
    };

    const handleAnswer = async (selectedAnswerIndex) => {
        if (showResult || !currentQuestion) return;

        const result = await getAnswerById(questionsIdList[numQuestion], selectedAnswerIndex);
        
        if (result) {
            setLastResult(result);
            setShowResult(true);
            
            if (result.isCorrect) {
                setScore(prev => prev + 1);
            }

            // Auto-advance to next question after 3 seconds
            setTimeout(() => {
                setNumQuestion(prev => prev + 1);
            }, 3000);
        }
    };

    const restartGame = () => {
        setNumQuestion(0);
        setScore(0);
        setGameFinished(false);
        setShowResult(false);
        setLastResult(null);
    };

    const goToLobby = () => {
        navigate('/');
    };

    // Loading state
    if (isLoading && !gameFinished) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
                <div className="h3">Chargement de la question...</div>
            </div>
        );
    }

    // Game finished state
    if (gameFinished) {
        return (
            <div className="d-flex flex-column gap-4 text-center">
                <div className="h1">Partie Terminée!</div>
                <div className="h2">Score Final: {score}/{questionsIdList.length}</div>
                <div className="h4">
                    {score / questionsIdList.length >= 0.8 ? '🏆 Excellent!' :
                     score / questionsIdList.length >= 0.6 ? '👍 Bien joué!' :
                     score / questionsIdList.length >= 0.4 ? '👌 Pas mal!' :
                     'Réessaye la prochaine fois !'}
                </div>
                <div className="d-flex gap-3 justify-content-center">
                    <Button color="primary" onClick={restartGame}>
                        Rejouer
                    </Button>
                    <Button color="secondary" onClick={goToLobby}>
                        Retourner au lobby
                    </Button>
                </div>
            </div>
        );
    }

    // Game state
    return (
        <div className="d-flex flex-column gap-4">
            {/* Header with question number and score */}
            <div className="d-flex justify-content-between align-items-center">
                <div className="h4">Question {numQuestion + 1}/{questionsIdList.length}</div>
                <div className="h4">Score: {score}</div>
            </div>

            {/* Question */}
            <Card>
                <CardBody>
                    <div className="h3 text-center">
                        {currentQuestion ? currentQuestion.question : 'Chargement...'}
                    </div>
                    {currentQuestion && (
                        <div className="text-center text-muted">
                            Difficulté: {currentQuestion.difficulty}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Timer */}
            <div className="d-flex justify-content-center">
                <CountdownCircleTimer
                    key={timerKey}
                    size={80}
                    isPlaying={!showResult}
                    duration={15}
                    colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                    colorsTime={[15, 10, 5, 0]}
                    onComplete={handleTimerStop}
                >
                    {({ remainingTime }) => remainingTime}
                </CountdownCircleTimer>
            </div>

            {/* Answer options */}
            <div className="d-flex flex-column gap-2">
                {currentQuestion && currentQuestion.options.map((option, index) => {
                    let buttonColor = "outline-primary";
                    let disabled = false;

                    if (showResult && lastResult) {
                        disabled = true;
                        if (index === lastResult.correctAnswer) {
                            buttonColor = "success"; // Correct answer in green
                        } else if (index === lastResult.selectedAnswer && !lastResult.isCorrect) {
                            buttonColor = "danger"; // Wrong selected answer in red
                        } else {
                            buttonColor = "outline-secondary";
                        }
                    }

                    return (
                        <Button 
                            key={index} 
                            color={buttonColor}
                            disabled={disabled || showResult}
                            onClick={() => handleAnswer(index)}
                            className="text-start p-3"
                        >
                            <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                        </Button>
                    );
                })}
            </div>

            {/* Result feedback */}
            {showResult && lastResult && (
                <Card className={lastResult.isCorrect ? "border-success" : "border-danger"}>
                    <CardBody>
                        <div className={`text-center h4 ${lastResult.isCorrect ? "text-success" : "text-danger"}`}>
                            {lastResult.isCorrect ? "✅ Correct!" : "❌ Incorrect!"}
                        </div>
                        {lastResult.explanation && (
                            <div className="text-center text-muted">
                                {lastResult.explanation}
                            </div>
                        )}
                        <div className="text-center text-muted mt-2">
                            Prochaine question dans 3 secondes...
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
