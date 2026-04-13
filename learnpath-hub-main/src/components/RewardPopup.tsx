import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Zap } from "lucide-react";

interface RewardPopupProps {
  xp: number;
  message: string;
  onClose: () => void;
}

export function RewardPopup({ xp, message, onClose }: RewardPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="animate-bounce-in mx-4 w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full gradient-xp animate-pop">
          <Star className="h-10 w-10 text-primary-foreground" fill="currentColor" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-card-foreground">{message}</h2>
        <div className="mb-6 flex items-center justify-center gap-2">
          <Zap className="h-5 w-5 text-xp" />
          <span className="text-xl font-bold text-xp">+{xp} XP</span>
        </div>
        <Button onClick={onClose} size="lg" className="w-full rounded-xl font-bold">
          Continue
        </Button>
      </div>
    </div>
  );
}
