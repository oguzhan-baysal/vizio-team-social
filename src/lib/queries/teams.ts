import { createClient } from "@/lib/supabase/server";

/**
 * Fetches all teams.
 */
export async function getTeams() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("teams")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Fetches a single team by ID.
 */
export async function getTeam(teamId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("teams")
        .select("id, name, created_at")
        .eq("id", teamId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Gets the current user's team ID from their profile.
 * Returns null if user is not authenticated or has no profile.
 */
export async function getMyTeamId(): Promise<string | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    return profile?.team_id ?? null;
}

/**
 * Gets the current user's team (full team object).
 * Returns null if user is not authenticated.
 */
export async function getMyTeam() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    const { data: team } = await supabase
        .from("teams")
        .select("id, name, created_at")
        .eq("id", profile.team_id)
        .single();

    return team;
}
