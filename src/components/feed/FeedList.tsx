import PostCard from "./PostCard";
import type { PostWithTeam } from "@/lib/types";

/**
 * Renders the global feed as a list of PostCards.
 * Shows an empty state message when there are no posts.
 */
export default function FeedList({ posts }: { posts: PostWithTeam[] }) {
    if (posts.length === 0) {
        return (
            <div className="empty-state">
                <p>No posts yet. Be the first to share something!</p>
            </div>
        );
    }

    return (
        <div className="feed-list">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
