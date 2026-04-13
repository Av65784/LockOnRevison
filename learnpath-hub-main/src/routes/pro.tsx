import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Brain, Infinity, Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/pro")({
  component: ProPage,
  head: () => ({
    meta: [
      { title: "Go Pro — LockOnRevision" },
      { name: "description", content: "Unlock unlimited features with LockOnRevision Pro for just ₹20." },
    ],
  }),
});

const features = [
  { icon: Infinity, title: "Unlimited Energy", desc: "No more waiting — study as much as you want" },
  { icon: Brain, title: "Advanced AI Chat", desc: "Deeper explanations, step-by-step solutions" },
  { icon: Zap, title: "Priority AI Generation", desc: "Faster course generation from your documents" },
  { icon: Shield, title: "Ad-Free Experience", desc: "Clean, distraction-free learning" },
];

const freeVsPro = [
  { feature: "Daily Energy", free: "5/day", pro: "Unlimited" },
  { feature: "AI Chat", free: "Basic", pro: "Advanced" },
  { feature: "Course Generation", free: "2 subjects", pro: "Unlimited" },
  { feature: "Quiz Attempts", free: "Limited", pro: "Unlimited" },
  { feature: "Priority Support", free: "—", pro: "✓" },
];

function ProPage() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const handlePayment = () => {
    // Razorpay integration placeholder
    alert("Razorpay payment integration coming soon! Price: ₹20");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Hero */}
        <div className="mb-8 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Go Pro</h1>
          <p className="mt-2 text-muted-foreground">Supercharge your learning journey</p>
          <div className="mt-4">
            <span className="text-5xl font-black text-foreground">₹20</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8 grid gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mb-8 rounded-2xl border bg-card overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-3 border-b bg-secondary/50 p-3 text-sm font-semibold">
            <span className="text-foreground">Feature</span>
            <span className="text-center text-muted-foreground">Free</span>
            <span className="text-center text-primary">Pro ✨</span>
          </div>
          {freeVsPro.map((row) => (
            <div key={row.feature} className="grid grid-cols-3 border-b last:border-0 p-3 text-sm">
              <span className="text-foreground">{row.feature}</span>
              <span className="text-center text-muted-foreground">{row.free}</span>
              <span className="text-center font-medium text-primary">{row.pro}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {profile?.is_pro ? (
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6 text-center">
              <Crown className="mx-auto h-8 w-8 text-amber-500" />
              <p className="mt-2 text-lg font-bold text-foreground">You're already Pro! 🎉</p>
              <p className="text-sm text-muted-foreground">Enjoy all premium features</p>
            </div>
          ) : (
            <Button
              onClick={handlePayment}
              className="w-full rounded-2xl py-6 text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg"
            >
              <Crown className="mr-2 h-6 w-6" />
              Upgrade to Pro — ₹20/month
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by Razorpay · Cancel anytime · 7-day money-back guarantee
        </p>
      </main>
    </div>
  );
}
