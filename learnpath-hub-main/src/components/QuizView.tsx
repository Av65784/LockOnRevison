import { useState } from "react";
import type { QuizQuestion } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";

interface QuizViewProps {
  questions: QuizQuestion[];
  onComplete: (score: number, passed: boolean) => void;
}

export function QuizView({ questions, onComplete }: QuizViewProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowResult(true);
    if (index === question.correctIndex) {
      setCorrect(c => c + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      const score = Math.round(((correct + (selected === question.correctIndex ? 0 : 0)) / questions.length) * 100);
      // recalculate to be safe
      const finalCorrect = correct;
      const finalScore = Math.round((finalCorrect / questions.length) * 100);
      onComplete(finalScore, finalScore >= 70);
    }
  };

  if (finished) {
    const finalScore = Math.round((correct / questions.length) * 100);
    const passed = finalScore >= 70;
    return (
      <div className="mx-auto max-w-md animate-bounce-in text-center">
        <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${passed ? "gradient-primary" : "bg-destructive"}`}>
          {passed ? <Trophy className="h-12 w-12 text-primary-foreground" /> : <XCircle className="h-12 w-12 text-destructive-foreground" />}
        </div>
        <h2 className="mb-2 text-3xl font-bold text-foreground">{passed ? "Awesome! 🎉" : "Keep trying! 💪"}</h2>
        <p className="mb-2 text-lg text-muted-foreground">You scored {finalScore}%</p>
        <p className="mb-6 text-muted-foreground">{correct}/{questions.length} correct</p>
        {passed && (
          <div className="mb-4 animate-pop rounded-xl bg-secondary p-4">
            <p className="font-bold text-primary">+50 XP earned! ⭐</p>
          </div>
        )}
        <Button onClick={() => window.history.back()} size="lg" className="gap-2 rounded-xl">
          {passed ? "Continue" : <><RotateCcw className="h-4 w-4" /> Retry</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-slide-up">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="mb-8 text-xl font-bold text-card-foreground">{question.question}</h2>

        <div className="flex flex-col gap-3">
          {question.options.map((option, i) => {
            let classes = "w-full rounded-xl border-2 p-4 text-left text-base font-medium transition-all ";
            if (showResult) {
              if (i === question.correctIndex) {
                classes += "border-success bg-success/10 text-foreground";
              } else if (i === selected) {
                classes += "border-destructive bg-destructive/10 text-foreground animate-shake";
              } else {
                classes += "border-border bg-card text-muted-foreground opacity-50";
              }
            } else {
              classes += "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5 cursor-pointer";
            }

            return (
              <button key={i} onClick={() => handleSelect(i)} className={classes} disabled={selected !== null}>
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {showResult && i === question.correctIndex && <CheckCircle2 className="ml-auto h-5 w-5 text-success" />}
                  {showResult && i === selected && i !== question.correctIndex && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                </span>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 flex justify-end animate-slide-up">
            <Button onClick={handleNext} size="lg" className="rounded-xl font-bold">
              {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
