import { createClient } from "@/lib/supabase/server";

/**
 * Fetches the global feed — all posts from all teams, newest first.
 * No authentication required (public feed).
 */
export async function getFeed(limit = 50) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("posts")
        .select(
            `
      id,
      content,
      created_at,
      teams ( id, name )
    `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

/**
 * Fetches all posts for a specific team, newest first.
 */
export async function getTeamPosts(teamId: string, limit = 50) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("posts")
        .select(
            `
      id,
      content,
      created_at,
      teams ( id, name )
    `
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

/**
 * Creates a new post on behalf of the authenticated user's team.
 * The team_id is always fetched server-side from the profiles table
 * to prevent unauthorized posting on behalf of other teams.
 */
export async function createPost(content: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Always fetch team_id from the database — never trust client input
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) throw new Error("Profile not found");

    const { error } = await supabase
        .from("posts")
        .insert({ content, team_id: profile.team_id });

    if (error) throw error;
}
