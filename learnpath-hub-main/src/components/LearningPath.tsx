import { Link } from "@tanstack/react-router";
import type { Unit } from "@/lib/mock-data";
import { Lock, CheckCircle2, Play } from "lucide-react";

interface LearningPathProps {
  units: Unit[];
  subjectId: string;
}

export function LearningPath({ units, subjectId }: LearningPathProps) {
  return (
    <div className="relative mx-auto max-w-sm py-8">
      {/* Connecting line */}
      <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-border" />

      <div className="relative flex flex-col items-center gap-6">
        {units.map((unit, index) => {
          const offset = index % 2 === 0 ? -60 : 60;
          return (
            <div key={unit.id} className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
              {/* Node */}
              <PathNode unit={unit} subjectId={subjectId} />
              {/* Label */}
              <span className={`mt-2 text-center text-sm font-semibold ${unit.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {unit.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PathNode({ unit, subjectId }: { unit: Unit; subjectId: string }) {
  const baseClasses = "node-bounce flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-lg transition-all";

  if (!unit.unlocked) {
    return (
      <div className={`${baseClasses} border-node-locked bg-muted cursor-not-allowed`}>
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (unit.completed) {
    return (
      <Link to="/subject/$subjectId" params={{ subjectId }} className={`${baseClasses} border-node-completed bg-node-completed animate-pulse-glow`}>
        <CheckCircle2 className="h-7 w-7 text-success-foreground" />
      </Link>
    );
  }

  return (
    <Link
      to="/unit/$subjectId/$unitId"
      params={{ subjectId, unitId: unit.id }}
      className={`${baseClasses} border-node-active bg-node-active animate-pulse-glow`}
    >
      <Play className="h-7 w-7 text-primary-foreground" fill="currentColor" />
    </Link>
  );
}
