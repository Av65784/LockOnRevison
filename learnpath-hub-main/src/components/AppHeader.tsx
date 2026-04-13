import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Crown, LogOut } from "lucide-react";

export function AppHeader() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-50 glass-card border-b">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <span className="text-lg font-bold text-primary-foreground">L</span>
          </div>
          <span className="text-lg font-bold text-foreground">LockOn</span>
          {profile?.is_pro && (
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">PRO</span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <StatBadge icon="⭐" value={profile?.xp ?? 0} variant="xp" />
          <StatBadge icon="⚡" value={`${profile?.energy ?? 0}/${profile?.max_energy ?? 5}`} variant="energy" />
          <StatBadge icon="🔥" value={profile?.streak ?? 0} variant="streak" />
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink to="/" current={location.pathname}>Home</NavLink>
          <NavLink to="/chat" current={location.pathname}>AI Chat</NavLink>
          <NavLink to="/pro" current={location.pathname}>
            <Crown className="inline h-3.5 w-3.5 mr-1" />Pro
          </NavLink>
          {user ? (
            <button onClick={() => signOut()} className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <NavLink to="/login" current={location.pathname}>Login</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

function StatBadge({ icon, value, variant }: { icon: string; value: string | number; variant: "xp" | "energy" | "streak" }) {
  const bgClass = variant === "xp" ? "gradient-xp" : variant === "energy" ? "gradient-energy" : "gradient-streak";
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${bgClass} text-primary-foreground shadow-sm`}>
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function NavLink({ to, current, children }: { to: string; current: string; children: React.ReactNode }) {
  const isActive = current === to;
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
