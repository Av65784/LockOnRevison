import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const addXp = async (amount: number) => {
    if (!user || !profile) return;
    const newXp = profile.xp + amount;
    const { data } = await supabase
      .from("profiles")
      .update({ xp: newXp })
      .eq("user_id", user.id)
      .select()
      .single();
    if (data) setProfile(data);
  };

  const useEnergy = async () => {
    if (!user || !profile || profile.energy <= 0) return false;
    const { data } = await supabase
      .from("profiles")
      .update({ energy: profile.energy - 1 })
      .eq("user_id", user.id)
      .select()
      .single();
    if (data) setProfile(data);
    return true;
  };

  const updateStreak = async () => {
    if (!user || !profile) return;
    const today = new Date().toISOString().split("T")[0];
    if (profile.last_activity_date === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = profile.last_activity_date === yesterday ? profile.streak + 1 : 1;

    const { data } = await supabase
      .from("profiles")
      .update({ streak: newStreak, last_activity_date: today })
      .eq("user_id", user.id)
      .select()
      .single();
    if (data) setProfile(data);
  };

  return { profile, loading, addXp, useEnergy, updateStreak, refetch: async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) setProfile(data);
  }};
}
