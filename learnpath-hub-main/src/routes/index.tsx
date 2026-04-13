import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { DocumentUpload } from "@/components/DocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "LockOnRevision — Your Learning Dashboard" },
      { name: "description", content: "Track your progress, earn XP, and master subjects with LockOnRevision." },
    ],
  }),
});

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Tables<"subjects">[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setSubjects(data);
    };
    fetchSubjects();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleUploadSuccess = async (subjectId: string) => {
    setShowUpload(false);
    // Refresh subjects
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setSubjects(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.display_name || "Learner"}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Keep your streak alive! You're on fire 🔥</p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <StatCard icon="⭐" label="Total XP" value={(profile?.xp ?? 0).toLocaleString()} variant="xp" />
          <StatCard icon="⚡" label="Energy" value={`${profile?.energy ?? 0}/${profile?.max_energy ?? 5}`} variant="energy" />
          <StatCard icon="🔥" label="Day Streak" value={(profile?.streak ?? 0).toString()} variant="streak" />
        </div>

        {/* AI Upload Section */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {showUpload ? (
            <DocumentUpload onSuccess={handleUploadSuccess} />
          ) : (
            <button
              onClick={() => setShowUpload(true)}
              className="card-hover w-full rounded-2xl border-2 border-dashed border-primary/30 bg-card p-6 text-center shadow-sm transition-all hover:border-primary/60"
            >
              <span className="text-3xl">✨</span>
              <p className="mt-2 font-bold text-card-foreground">Generate Course with AI</p>
              <p className="text-sm text-muted-foreground">Upload your notes and AI creates a full course</p>
            </button>
          )}
        </div>

        {/* Subjects */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="mb-4 text-xl font-bold text-foreground">Your Subjects</h2>
          {subjects.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
              <span className="text-4xl">📚</span>
              <p className="mt-2 font-semibold text-card-foreground">No subjects yet</p>
              <p className="text-sm text-muted-foreground">Upload a document above to create your first AI-generated course!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(subject => (
                <Link
                  key={subject.id}
                  to="/subject/$subjectId"
                  params={{ subjectId: subject.id }}
                  className="card-hover rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
                    <span className="text-2xl">{subject.icon}</span>
                  </div>
                  <h3 className="font-bold text-card-foreground">{subject.name}</h3>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-secondary">
                      <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${subject.progress}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, variant }: { icon: string; label: string; value: string; variant: string }) {
  const gradientClass = variant === "xp" ? "gradient-xp" : variant === "energy" ? "gradient-energy" : "gradient-streak";
  return (
    <div className="card-hover rounded-2xl border bg-card p-4 text-center shadow-sm">
      <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl ${gradientClass}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
