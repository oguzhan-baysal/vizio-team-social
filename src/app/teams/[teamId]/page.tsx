import { notFound } from "next/navigation";
import { getTeam } from "@/lib/queries/teams";
import { getTeamPosts } from "@/lib/queries/posts";
import { isFollowing, getFollowerCount, getFollowingCount } from "@/lib/queries/follows";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/feed/PostCard";
import FollowButton from "@/components/teams/FollowButton";

type Props = {
    params: Promise<{ teamId: string }>;
};

/**
 * Team detail page.
 * Shows team info, follower/following counts, posts, and follow button.
 * Publicly accessible (no auth required to view).
 */
export default async function TeamDetailPage({ params }: Props) {
    const { teamId } = await params;

    const team = await getTeam(teamId);

    if (!team) {
        notFound();
    }

    // Get team data in parallel
    const [posts, followerCount, followingCount] = await Promise.all([
        getTeamPosts(teamId),
        getFollowerCount(teamId),
        getFollowingCount(teamId),
    ]);

    // Check if current user is authenticated and if this is their team
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let isOwnTeam = false;
    let following = false;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("team_id")
            .eq("id", user.id)
            .single();

        if (profile) {
            isOwnTeam = profile.team_id === teamId;
            if (!isOwnTeam) {
                following = await isFollowing(teamId);
            }
        }
    }

    return (
        <div className="team-detail-container">
            {/* Team Header */}
            <section className="team-detail-header">
                <div className="team-detail-info">
                    <h1 className="team-detail-name">{team.name}</h1>
                    <div className="team-stats">
                        <span className="stat">
                            <strong>{followerCount}</strong> Followers
                        </span>
                        <span className="stat">
                            <strong>{followingCount}</strong> Following
                        </span>
                        <span className="stat">
                            <strong>{posts?.length ?? 0}</strong> Posts
                        </span>
                    </div>
                </div>
                {user && !isOwnTeam && (
                    <FollowButton targetTeamId={teamId} isFollowing={following} />
                )}
                {isOwnTeam && <span className="own-team-badge">Your Team</span>}
            </section>

            {/* Team Posts */}
            <section className="dashboard-section">
                <h2 className="section-subtitle">Posts</h2>
                {posts && posts.length > 0 ? (
                    <div className="feed-list">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post as any} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>This team hasn&apos;t posted anything yet.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
