import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeams } from "@/lib/queries/teams";
import { getFollowingIds } from "@/lib/queries/follows";
import { getTeamPosts } from "@/lib/queries/posts";
import CreatePostForm from "@/components/posts/CreatePostForm";
import PostCard from "@/components/feed/PostCard";
import TeamCard from "@/components/teams/TeamCard";

/**
 * Dashboard page — requires authentication.
 * Shows the user's team info, post creation form,
 * their team's recent posts, and a team discovery section.
 */
export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Get user's profile and team
    const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/auth/login");
    }

    const { data: myTeam } = await supabase
        .from("teams")
        .select("id, name")
        .eq("id", profile.team_id)
        .single();

    // Get team's posts, all teams, and following relationships in parallel
    const [teamPosts, allTeams, followingIds] = await Promise.all([
        getTeamPosts(profile.team_id),
        getTeams(),
        getFollowingIds(),
    ]);

    // Filter out own team from discovery list
    const otherTeams = allTeams?.filter((t) => t.id !== profile.team_id) ?? [];

    return (
        <div className="dashboard-container">
            {/* Team Info */}
            <section className="dashboard-section">
                <div className="team-header">
                    <h1 className="section-title">
                        <span className="team-icon">👥</span>
                        {myTeam?.name}
                    </h1>
                </div>
            </section>

            {/* Create Post */}
            <section className="dashboard-section">
                <h2 className="section-subtitle">Create a Post</h2>
                <CreatePostForm />
            </section>

            {/* Team's Posts */}
            <section className="dashboard-section">
                <h2 className="section-subtitle">Your Team&apos;s Posts</h2>
                {teamPosts && teamPosts.length > 0 ? (
                    <div className="feed-list">
                        {teamPosts.map((post) => (
                            <PostCard key={post.id} post={post as any} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Your team hasn&apos;t posted anything yet. Start the conversation!</p>
                    </div>
                )}
            </section>

            {/* Discover Teams */}
            <section className="dashboard-section">
                <h2 className="section-subtitle">Discover Teams</h2>
                {otherTeams.length > 0 ? (
                    <div className="team-grid">
                        {otherTeams.map((team) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                isOwnTeam={false}
                                isFollowing={followingIds.includes(team.id)}
                                isAuthenticated={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No other teams to discover yet.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
