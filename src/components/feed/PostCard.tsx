import Link from "next/link";

type Post = {
    id: string;
    content: string;
    created_at: string;
    teams: {
        id: string;
        name: string;
    };
};

/**
 * Renders a single post card showing team name, content, and timestamp.
 */
export default function PostCard({ post }: { post: Post }) {
    const timeAgo = getRelativeTime(post.created_at);

    return (
        <article className="post-card">
            <div className="post-header">
                <Link
                    href={`/teams/${post.teams.id}`}
                    className="post-team-name"
                >
                    {post.teams.name}
                </Link>
                <time className="post-time" dateTime={post.created_at}>
                    {timeAgo}
                </time>
            </div>
            <p className="post-content">{post.content}</p>
        </article>
    );
}

/**
 * Simple relative time formatter.
 */
function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    return date.toLocaleDateString();
}
