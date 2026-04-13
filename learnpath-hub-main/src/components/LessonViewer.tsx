import { useState } from "react";
import type { Lesson } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface LessonViewerProps {
  lesson: Lesson;
  onComplete: () => void;
}

export function LessonViewer({ lesson, onComplete }: LessonViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = lesson.content.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="mx-auto max-w-2xl animate-slide-up">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-card-foreground">{lesson.title}</h2>

        <div className="min-h-[120px] animate-slide-up" key={currentStep}>
          <p className="text-lg leading-relaxed text-card-foreground">
            {lesson.content[currentStep]}
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          {isLastStep ? (
            <Button onClick={onComplete} size="lg" className="gap-2 rounded-xl text-base font-bold">
              <CheckCircle2 className="h-5 w-5" />
              Complete
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(s => s + 1)} size="lg" className="gap-2 rounded-xl text-base font-bold">
              Next
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
