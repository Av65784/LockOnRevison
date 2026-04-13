import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface DocumentUploadProps {
  onSuccess: (subjectId: string) => void;
}

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        setError("File too large. Max 5MB.");
        return;
      }
      setFile(f);
      setError("");
      if (!subjectName) {
        setSubjectName(f.name.replace(/\.[^.]+$/, ""));
      }
    }
  };

  const handleGenerate = async () => {
    if (!file || !subjectName.trim() || !user) return;
    setLoading(true);
    setError("");

    try {
      // Read file as text
      const text = await file.text();

      if (text.length < 50) {
        setError("Document is too short. Please provide more content.");
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentText: text,
            subjectName: subjectName.trim(),
          }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      onSuccess(data.subjectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold text-card-foreground">Generate Course with AI</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your notes or study material and AI will create a full course
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Subject Name</label>
          <input
            type="text"
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            placeholder="e.g. Physics, Biology..."
            maxLength={100}
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Upload Document</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background px-4 py-3 transition-colors hover:bg-accent">
            {file ? (
              <>
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground">{file.name}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Choose .txt, .md, or paste text file</span>
              </>
            )}
            <input
              type="file"
              accept=".txt,.md,.text"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!file || !subjectName.trim() || loading}
          className="w-full rounded-xl py-3 text-base font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Course...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Course with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
