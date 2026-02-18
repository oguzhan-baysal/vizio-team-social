<img width="1280" height="916" alt="Image" src="https://github.com/user-attachments/assets/5daf0239-2ea0-449e-aa8b-3c9549b5c9fd" />



# TeamSocial — Team-Based Social Media MVP

A team-based social media platform built with **Next.js 14 (App Router)** and **Supabase**.  
All actions are performed under a team identity — there are no individual profiles.

> **Live Demo:** [vizio-team-social.vercel.app](https://vizio-team-social.vercel.app) *(deploy sonrası güncellenecek)*  
> **GitHub:** [github.com/oguzhan-baysal/vizio-team-social](https://github.com/oguzhan-baysal/vizio-team-social)

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/oguzhan-baysal/vizio-team-social.git
cd vizio-team-social
npm install
```

### 2. Set Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up the Database

Run the SQL migration against your Supabase project:

1. Open your Supabase Dashboard → **SQL Editor**
2. Paste and run the contents of `supabase/migrations/001_initial_schema.sql`

This creates all tables, RLS policies, helper functions, and the signup trigger.

### 4. Enable Google OAuth (Optional)

1. Go to **Supabase Dashboard → Authentication → Providers → Google**
2. Enable Google and add your OAuth credentials from Google Cloud Console
3. Add the Supabase callback URL to your Google OAuth app's authorized redirect URIs:  
   `https://<your-project>.supabase.co/auth/v1/callback`

### 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🎬 Architecture Walkthrough

> *This section serves as a written walkthrough of the architectural decisions, data model, and key design choices behind this project.*

### The Core Problem & My Approach

The central challenge of this case study is **team-based identity**: every action (posting, following) must be attributed to a *team*, not an individual user. This sounds simple but has deep implications for data modeling, security, and the authentication flow.

My approach was to enforce this at **every layer of the stack**:
- **Database level:** The `posts` table has no `author_user_id` column — only `team_id`. You physically cannot store individual authorship.
- **RLS level:** Policies use a `get_my_team_id()` helper that resolves the team from the server-side session, not from client input.
- **Application level:** Server Actions fetch `team_id` from `profiles` on every mutation. The client never sends a `team_id`.

---

### Data Model Decisions

#### Why no `author_user_id` on posts?
The spec says "no individual profiles." Storing `author_user_id` would create an implicit individual identity. By omitting it entirely, we make team ownership a structural guarantee, not just a convention.

#### Why a separate `profiles` table instead of using `auth.users` metadata?
Supabase's `auth.users` table is managed by the auth system and shouldn't be extended directly. The `profiles` table acts as the bridge between `auth.users` and `teams`, giving us a clean separation of concerns and a place to add user-specific data later without touching auth internals.

#### Why a composite primary key on `team_follows`?
`PRIMARY KEY (follower_id, following_id)` makes duplicate follows **impossible at the database level** — no application-level check needed. Combined with the `CHECK (follower_id <> following_id)` constraint, self-follows are also prevented at the DB level. Defense in depth.

#### Why a Database Trigger for team creation?
When a user signs up (via email or Google OAuth), they need a team immediately. Two alternatives:
1. **Server Action after signup:** Requires two round trips and can fail silently if the second call errors.
2. **Database Trigger (`handle_new_user`):** Runs atomically within the same transaction as the user creation. If team creation fails, the entire signup rolls back. No orphaned users without teams.

The trigger approach is more robust and works identically for both email and OAuth signups.

---

### Security Architecture

The most critical security decision: **`team_id` is never trusted from the client.**

Here's the attack this prevents: A malicious user could modify the request payload to include a different team's ID, posting content on behalf of a team they don't belong to. Our Server Actions prevent this:

```typescript
// WRONG (vulnerable): accepting team_id from client
const { team_id, content } = formData; // ❌ Never do this

// RIGHT (secure): resolving team_id server-side
const { data: profile } = await supabase
  .from("profiles")
  .select("team_id")
  .eq("id", user.id)
  .single();
// profile.team_id is the ground truth ✅
```

Even if someone bypasses the UI, the RLS policy `posts_insert_own_team` enforces `team_id = get_my_team_id()` at the database level — a second layer of protection.

---

### Request Flow (End-to-End)

```
User clicks "Post"
    ↓
CreatePostForm (Client Component)
    ↓ calls Server Action
createPostAction() [Server]
    ↓ verifies session
supabase.auth.getUser()
    ↓ resolves team_id (never from client)
profiles.select("team_id").eq("id", user.id)
    ↓ inserts post
posts.insert({ content, team_id: profile.team_id })
    ↓ RLS policy validates: team_id = get_my_team_id()
    ↓ revalidatePath("/") — Next.js cache invalidation
UI updates with new post
```

---

### Session Management

Next.js App Router Server Components don't have access to browser cookies by default. We use `@supabase/ssr` with a custom middleware (`middleware.ts`) that:
1. Reads the session cookie on every request
2. Refreshes the token if expired
3. Writes the updated cookie back to the response

This ensures Server Components always have a fresh, valid session without any client-side token management.

---

## 📊 Supabase Schema

### Tables

| Table | Description |
|---|---|
| `teams` | Team identity (id, name, created_at) |
| `profiles` | Links `auth.users` → `teams` (1-to-1 with users) |
| `posts` | Team-owned text posts (280 char limit, no individual author) |
| `team_follows` | Directional team-to-team follow relationships |

### Relationship Diagram

```
auth.users (1) ──── (1) profiles (N) ──── (1) teams
                                                │
                                           (N) posts
                                                │
                                      team_follows (N:M)
```

### Key Constraints

- `profiles.id` references `auth.users(id)` — 1:1 relationship
- `profiles.team_id` is NOT NULL — every user must belong to a team
- `team_follows` has a composite PK `(follower_id, following_id)` — prevents duplicate follows
- `team_follows` has a CHECK constraint `follower_id <> following_id` — prevents self-follows at DB level

### RLS Summary

| Table | SELECT | INSERT | DELETE |
|---|---|---|---|
| `teams` | Public (anyone) | Server-only (trigger) | — |
| `profiles` | Own profile only | Own profile only (trigger) | — |
| `posts` | Public (anyone) | Own team only (`get_my_team_id()`) | — |
| `team_follows` | Public (anyone) | Own team only | Own team only |

### Helper Function

```sql
get_my_team_id() → uuid
```

Returns the authenticated user's `team_id` from the `profiles` table. Used in all team-scoped RLS policies to avoid repeated joins and to centralize the team resolution logic.

---

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home — public global feed
│   ├── layout.tsx                # Root layout with Navbar
│   ├── auth/
│   │   ├── login/page.tsx        # Email + Google login
│   │   ├── signup/page.tsx       # Registration
│   │   └── callback/route.ts     # OAuth callback handler
│   ├── dashboard/page.tsx        # Authenticated team dashboard
│   └── teams/[teamId]/page.tsx   # Team detail + posts + follow
│
├── components/
│   ├── feed/                     # FeedList, PostCard
│   ├── posts/                    # CreatePostForm
│   ├── teams/                    # TeamCard, FollowButton
│   └── ui/                       # Navbar
│
├── lib/
│   ├── supabase/                 # Client factories (server, client, middleware)
│   ├── queries/                  # Data access functions (posts, teams, follows)
│   └── actions.ts                # Server Actions (auth, post, follow)
│
└── middleware.ts                  # Session refresh on every request
```

### Key Design Decisions

1. **Server Actions for all mutations** — All write operations use Next.js Server Actions. This keeps sensitive logic server-side and makes `team_id` resolution impossible to bypass.

2. **`team_id` never from client** — The `createPostAction` fetches the user's `team_id` from the `profiles` table on the server. This prevents a malicious user from posting on behalf of another team.

3. **Optimistic UI for follows** — The `FollowButton` component uses `useOptimistic` for instant feedback, reverting on error.

4. **Parallel data fetching** — Dashboard and team detail pages use `Promise.all` to fetch independent data in parallel, reducing waterfall latency.

5. **No `author_user_id` on posts** — Posts belong to teams, not users. This is enforced structurally, not just by convention.

---

## ⚖️ Key Assumptions & Trade-offs

| Decision | Reasoning |
|---|---|
| Auto-create team on signup | Simplifies onboarding; team invite system is out of MVP scope |
| Team name from email prefix | Quick MVP approach; proper name selection would be added with more time |
| No `author_user_id` on posts | Spec explicitly states "no individual profiles" — posts belong to teams |
| No post edit/delete | MVP scope — straightforward to add with proper RLS policies |
| Feed limited to 50 posts | No pagination in MVP; cursor-based pagination planned for production |
| Email verification disabled | For faster demo flow; would be enabled in production |
| Duplicate team name handling | Trigger appends a counter suffix when email prefixes collide |

---

## 🔮 What I'd Improve With More Time

1. **Team name selection** during signup (custom input instead of email-derived)
2. **Cursor-based infinite scroll** for the feed
3. **Optimistic UI** for post creation (instant feedback)
4. **Post edit/delete** with proper RLS policies
5. **Team invite system** — allow multiple users to join an existing team
6. **"Following" feed** — filtered feed showing only followed teams' posts
7. **E2E tests** with Playwright covering auth flow, posting, and following
8. **Real-time updates** using Supabase Realtime subscriptions
9. **Rate limiting** for post creation to prevent spam
10. **Image/media attachments** on posts

---

## 🛡️ Security Highlights

- **RLS on every table** — no table is accessible without explicit policies
- **`team_id` always server-resolved** — never accepted from client input
- **Self-follow prevention** at both database (CHECK constraint) and application level
- **Session management** via middleware — tokens refreshed on every request
- **OAuth callback validation** — code exchange happens server-side

---

## 📦 Tech Stack

- **Next.js 14+** (App Router, Server Components, Server Actions)
- **Supabase** (Auth, PostgreSQL, RLS)
- **TypeScript**
- **Tailwind CSS** (utility-first styling)

---

## 📄 License

This project was created as a case study submission for Vizio Ventures. All rights reserved by the author.
