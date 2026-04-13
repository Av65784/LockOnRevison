import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LessonViewer } from "@/components/LessonViewer";
import { QuizView } from "@/components/QuizView";
import { RewardPopup } from "@/components/RewardPopup";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { ArrowLeft, BookOpen, Brain } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { QuizQuestion } from "@/lib/mock-data";

export const Route = createFileRoute("/unit/$subjectId/$unitId")({
  component: UnitPage,
  head: () => ({
    meta: [
      { title: "Unit — LockOnRevision" },
      { name: "description", content: "Complete lessons and quizzes to earn XP." },
    ],
  }),
});

function UnitPage() {
  const { subjectId, unitId } = Route.useParams();
  const { user } = useAuth();
  const { addXp, updateStreak } = useProfile();

  const [subject, setSubject] = useState<Tables<"subjects"> | null>(null);
  const [unit, setUnit] = useState<Tables<"units"> | null>(null);
  const [lessons, setLessons] = useState<Tables<"lessons">[]>([]);
  const [quiz, setQuiz] = useState<Tables<"quizzes"> | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reward, setReward] = useState<{ xp: number; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: s }, { data: u }, { data: l }, { data: q }] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", subjectId).single(),
        supabase.from("units").select("*").eq("id", unitId).single(),
        supabase.from("lessons").select("*").eq("unit_id", unitId).order("sort_order"),
        supabase.from("quizzes").select("*").eq("unit_id", unitId).single(),
      ]);
      setSubject(s);
      setUnit(u);
      setLessons(l || []);
      setQuiz(q);
      setLoading(false);
    };
    fetchData();
  }, [user, subjectId, unitId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!subject || !unit) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Unit not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const currentLesson = lessons.find(l => l.id === activeLesson);
  const quizQuestions: QuizQuestion[] = quiz ? (quiz.questions as any[]).map((q: any, i: number) => ({
    id: `q${i}`,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
  })) : [];

  const handleLessonComplete = async () => {
    if (!currentLesson || !user) return;
    await supabase.from("lessons").update({ completed: true }).eq("id", currentLesson.id);
    await addXp(20);
    await updateStreak();
    setLessons(prev => prev.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l));
    setReward({ xp: 20, message: "Lesson Complete!" });
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (!quiz || !user) return;
    await supabase.from("quizzes").update({ score, passed }).eq("id", quiz.id);
    setQuiz(prev => prev ? { ...prev, score, passed } : null);
    if (passed) {
      await addXp(50);
      await updateStreak();
      // Check if all lessons done + quiz passed → mark unit complete
      const allLessonsDone = lessons.every(l => l.completed);
      if (allLessonsDone) {
        await supabase.from("units").update({ completed: true }).eq("id", unitId);
        // Unlock next unit
        const { data: nextUnit } = await supabase
          .from("units")
          .select("id")
          .eq("subject_id", subjectId)
          .eq("sort_order", unit.sort_order + 1)
          .single();
        if (nextUnit) {
          await supabase.from("units").update({ unlocked: true }).eq("id", nextUnit.id);
        }
      }
      setReward({ xp: 50, message: "Quiz Passed!" });
    }
  };

  if (showQuiz && quizQuestions.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <button onClick={() => setShowQuiz(false)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Unit
          </button>
          <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Quiz: {unit.title}</h1>
          <QuizView questions={quizQuestions} onComplete={handleQuizComplete} />
          {reward && <RewardPopup {...reward} onClose={() => { setReward(null); setShowQuiz(false); }} />}
        </main>
      </div>
    );
  }

  if (currentLesson) {
    const lessonContent = Array.isArray(currentLesson.content) ? (currentLesson.content as string[]) : [];
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <button onClick={() => setActiveLesson(null)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Unit
          </button>
          <LessonViewer
            lesson={{ id: currentLesson.id, title: currentLesson.title, content: lessonContent, completed: currentLesson.completed }}
            onComplete={handleLessonComplete}
          />
          {reward && <RewardPopup {...reward} onClose={() => { setReward(null); setActiveLesson(null); }} />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/subject/$subjectId" params={{ subjectId }} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to {subject.name}
        </Link>

        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">{unit.title}</h1>
          <p className="mt-1 text-muted-foreground">{lessons.length} lessons · 1 quiz</p>
        </div>

        <div className="mx-auto max-w-md space-y-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson.id)}
              className="card-hover flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${lesson.completed ? "gradient-primary" : "bg-secondary"}`}>
                <BookOpen className={`h-5 w-5 ${lesson.completed ? "text-primary-foreground" : "text-secondary-foreground"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">{lesson.completed ? "Completed ✓" : "Not started"}</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">+20 XP</span>
            </button>
          ))}

          {quizQuestions.length > 0 && (
            <button
              onClick={() => setShowQuiz(true)}
              className="card-hover flex w-full items-center gap-4 rounded-2xl border-2 border-primary/30 bg-card p-4 text-left shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">Unit Quiz</p>
                <p className="text-xs text-muted-foreground">{quiz?.passed ? `Passed (${quiz.score}%)` : "Not attempted"}</p>
              </div>
              <span className="text-xs font-medium text-primary">+50 XP</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
