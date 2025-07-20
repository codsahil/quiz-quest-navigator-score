import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Question, allQuestions, categories } from '@/data/questions';
import { Clock, Trophy, Target, RotateCcw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameState = 'menu' | 'playing' | 'finished';

interface QuizSettings {
  category: string;
  questionCount: number;
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

interface GameStats {
  score: number;
  timeElapsed: number;
  correctAnswers: number;
  totalQuestions: number;
}

export const QuizApp = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    category: 'All Categories',
    questionCount: 10,
    difficulty: 'all'
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Load high scores from localStorage
  const getHighScores = (): GameStats[] => {
    const stored = localStorage.getItem('quiz-high-scores');
    return stored ? JSON.parse(stored) : [];
  };

  // Save high score to localStorage
  const saveHighScore = (stats: GameStats) => {
    const highScores = getHighScores();
    highScores.push(stats);
    highScores.sort((a, b) => b.score - a.score);
    const topScores = highScores.slice(0, 10); // Keep top 10
    localStorage.setItem('quiz-high-scores', JSON.stringify(topScores));
  };

  const startQuiz = () => {
    let filteredQuestions = [...allQuestions];
    
    // Filter by category
    if (quizSettings.category !== 'All Categories') {
      filteredQuestions = filteredQuestions.filter(q => q.category === quizSettings.category);
    }
    
    // Filter by difficulty
    if (quizSettings.difficulty !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === quizSettings.difficulty);
    }
    
    // Shuffle and select questions
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, quizSettings.questionCount);
    
    setQuestions(selectedQuestions);
    setUserAnswers(new Array(selectedQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setTimeElapsed(0);
    setScore(0);
    setShowAnswer(false);
    setGameState('playing');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 10);
    }
    
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1]);
      setShowAnswer(true);
    }
  };

  const finishQuiz = () => {
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    
    const finalStats: GameStats = {
      score,
      timeElapsed,
      correctAnswers,
      totalQuestions: questions.length
    };
    
    saveHighScore(finalStats);
    setGameState('finished');
  };

  const resetQuiz = () => {
    setGameState('menu');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuestions([]);
    setUserAnswers([]);
    setTimeElapsed(0);
    setScore(0);
    setShowAnswer(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                Quiz Quest
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Test your knowledge across 1000+ questions!
            </p>
          </div>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center">Customize Your Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  value={quizSettings.category}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 rounded-md bg-background border border-border"
                >
                  <option value="All Categories">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Questions</label>
                <select 
                  value={quizSettings.questionCount}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                  className="w-full p-2 rounded-md bg-background border border-border"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select 
                  value={quizSettings.difficulty}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full p-2 rounded-md bg-background border border-border"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <Button onClick={startQuiz} className="w-full" size="lg">
                Start Quiz
              </Button>
            </CardContent>
          </Card>

          {/* High Scores */}
          <Card className="bg-gradient-to-br from-secondary to-secondary/50">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center space-x-2">
                <Trophy className="h-5 w-5 text-warning" />
                <span>High Scores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getHighScores().slice(0, 5).map((score, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">#{index + 1}</span>
                    <span className="text-sm font-medium">{score.score} points</span>
                    <span className="text-xs text-muted-foreground">
                      {score.correctAnswers}/{score.totalQuestions} in {formatTime(score.timeElapsed)}
                    </span>
                  </div>
                ))}
                {getHighScores().length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">No high scores yet!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    const percentage = Math.round((correctAnswers / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6 animate-fade-in">
          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Trophy className="h-8 w-8 text-warning" />
                <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-primary">{score}</div>
                  <div className="text-sm text-muted-foreground">Final Score</div>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-success">{percentage}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-warning">{correctAnswers}/{questions.length}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-muted-foreground">Time</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={startQuiz} className="flex-1" variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
                <Button onClick={resetQuiz} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Main Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Playing state
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={resetQuiz}>
              <Home className="h-4 w-4" />
            </Button>
            <Badge variant="outline">{currentQuestion.category}</Badge>
            <Badge variant={
              currentQuestion.difficulty === 'easy' ? 'default' :
              currentQuestion.difficulty === 'medium' ? 'secondary' : 'destructive'
            }>
              {currentQuestion.difficulty}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>{score} pts</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar 
          value={currentQuestionIndex + 1} 
          max={questions.length} 
          showLabel 
          className="animate-fade-in"
        />

        {/* Question */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    "justify-start text-left h-auto p-4 transition-all duration-200",
                    selectedAnswer === index && !showAnswer && "ring-2 ring-primary bg-primary/10",
                    showAnswer && index === currentQuestion.correctAnswer && "bg-success/20 border-success text-success-foreground",
                    showAnswer && selectedAnswer === index && index !== currentQuestion.correctAnswer && "bg-destructive/20 border-destructive text-destructive-foreground animate-shake"
                  )}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showAnswer}
                >
                  <span className="font-medium mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {!showAnswer ? (
                <Button 
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button 
                  onClick={nextQuestion}
                  className="bg-gradient-to-r from-success to-green-500 hover:from-success/90 hover:to-green-500/90"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};