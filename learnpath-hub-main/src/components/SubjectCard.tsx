import { Link } from "@tanstack/react-router";
import type { Subject } from "@/lib/mock-data";

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Link to="/subject/$subjectId" params={{ subjectId: subject.id }}>
      <div className="card-hover group cursor-pointer rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl transition-transform group-hover:scale-110">
            {subject.icon}
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {subject.progress}%
          </span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-card-foreground">{subject.name}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{subject.units.length} units</p>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${subject.progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
