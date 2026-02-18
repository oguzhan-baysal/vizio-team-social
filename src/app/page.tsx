import { getFeed } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import FeedList from "@/components/feed/FeedList";
import CreatePostForm from "@/components/posts/CreatePostForm";

/**
 * Home page — Global feed.
 * Publicly accessible. Shows all posts from all teams, newest first.
 * Authenticated users can also create posts from here.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await getFeed();

  return (
    <div className="home-container">
      <section className="home-hero">
        <h1 className="home-title">Global Feed</h1>
        <p className="home-subtitle">
          See what teams are sharing across the platform
        </p>
      </section>

      {/* Show post form only for authenticated users */}
      {user && (
        <section className="home-section">
          <CreatePostForm />
        </section>
      )}

      <section className="home-section">
        <FeedList posts={posts as any} />
      </section>
    </div>
  );
}
