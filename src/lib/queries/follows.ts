import { createClient } from "@/lib/supabase/server";

/**
 * Follow a target team on behalf of the authenticated user's team.
 * Validates that the user isn't trying to follow their own team.
 */
export async function followTeam(targetTeamId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    if (profile.team_id === targetTeamId) {
        throw new Error("Cannot follow your own team");
    }

    const { error } = await supabase.from("team_follows").insert({
        follower_id: profile.team_id,
        following_id: targetTeamId,
    });

    if (error) throw error;
}

/**
 * Unfollow a target team on behalf of the authenticated user's team.
 */
export async function unfollowTeam(targetTeamId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const { error } = await supabase
        .from("team_follows")
        .delete()
        .eq("follower_id", profile.team_id)
        .eq("following_id", targetTeamId);

    if (error) throw error;
}

/**
 * Checks if the authenticated user's team is following a target team.
 * Returns false if user is not authenticated.
 */
export async function isFollowing(targetTeamId: string): Promise<boolean> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) return false;

    const { data } = await supabase
        .from("team_follows")
        .select("follower_id")
        .eq("follower_id", profile.team_id)
        .eq("following_id", targetTeamId)
        .maybeSingle();

    return !!data;
}

/**
 * Gets the list of team IDs that the user's team is following.
 */
export async function getFollowingIds(): Promise<string[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) return [];

    const { data } = await supabase
        .from("team_follows")
        .select("following_id")
        .eq("follower_id", profile.team_id);

    return data?.map((f) => f.following_id) ?? [];
}

/**
 * Gets the follower count for a team.
 */
export async function getFollowerCount(teamId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from("team_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", teamId);

    if (error) throw error;
    return count ?? 0;
}

/**
 * Gets the following count for a team.
 */
export async function getFollowingCount(teamId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from("team_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", teamId);

    if (error) throw error;
    return count ?? 0;
}
