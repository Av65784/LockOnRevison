import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LearningPath } from "@/components/LearningPath";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/subject/$subjectId")({
  component: SubjectPage,
  head: () => ({
    meta: [
      { title: "Subject — LockOnRevision" },
      { name: "description", content: "View your learning path and track your progress." },
    ],
  }),
});

interface UnitWithMeta extends Tables<"units"> {
  lessonCount: number;
  quizPassed: boolean | null;
}

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const { user } = useAuth();
  const [subject, setSubject] = useState<Tables<"subjects"> | null>(null);
  const [units, setUnits] = useState<UnitWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: subjectData }, { data: unitsData }] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", subjectId).single(),
        supabase.from("units").select("*, lessons(id), quizzes(passed)").eq("subject_id", subjectId).order("sort_order"),
      ]);
      setSubject(subjectData);
      if (unitsData) {
        setUnits(unitsData.map((u: any) => ({
          ...u,
          lessonCount: u.lessons?.length ?? 0,
          quizPassed: u.quizzes?.[0]?.passed ?? null,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user, subjectId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Subject not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  // Convert units to the format LearningPath expects
  const pathUnits = units.map(u => ({
    id: u.id,
    title: u.title,
    unlocked: u.unlocked,
    completed: u.completed,
    lessons: [],
    quiz: { id: "", questions: [], score: null, passed: u.quizPassed },
  }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8 text-center animate-slide-up">
          <span className="text-5xl">{subject.icon}</span>
          <h1 className="mt-3 text-3xl font-bold text-foreground">{subject.name}</h1>
          <p className="mt-1 text-muted-foreground">{units.length} units · {subject.progress}% complete</p>
        </div>

        <LearningPath units={pathUnits} subjectId={subjectId} />
      </main>
    </div>
  );
}
