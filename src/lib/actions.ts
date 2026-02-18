"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign in with email and password.
 */
export async function signIn(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

/**
 * Sign up with email and password.
 * The database trigger automatically creates a team and profile.
 */
export async function signUp(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}

/**
 * Create a new post on behalf of the user's team.
 * team_id is fetched server-side from the profiles table — never from client input.
 */
export async function createPostAction(formData: FormData) {
    const supabase = await createClient();

    const content = formData.get("content") as string;

    if (!content || content.trim().length === 0) {
        return { error: "Post content cannot be empty" };
    }

    if (content.length > 280) {
        return { error: "Post content cannot exceed 280 characters" };
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to post" };
    }

    // Always fetch team_id from server — never trust client
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        return { error: "Profile not found" };
    }

    const { error } = await supabase
        .from("posts")
        .insert({ content: content.trim(), team_id: profile.team_id });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
}

/**
 * Follow a target team on behalf of the user's team.
 */
export async function followTeamAction(targetTeamId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to follow teams" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return { error: "Profile not found" };
    }

    if (profile.team_id === targetTeamId) {
        return { error: "Cannot follow your own team" };
    }

    const { error } = await supabase.from("team_follows").insert({
        follower_id: profile.team_id,
        following_id: targetTeamId,
    });

    if (error) {
        // Handle duplicate follow gracefully
        if (error.code === "23505") {
            return { error: "Already following this team" };
        }
        return { error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/teams/${targetTeamId}`);
}

/**
 * Unfollow a target team on behalf of the user's team.
 */
export async function unfollowTeamAction(targetTeamId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to unfollow teams" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return { error: "Profile not found" };
    }

    const { error } = await supabase
        .from("team_follows")
        .delete()
        .eq("follower_id", profile.team_id)
        .eq("following_id", targetTeamId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/teams/${targetTeamId}`);
}
