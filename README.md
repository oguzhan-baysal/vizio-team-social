# TeamSocial — Team-Based Social Media MVP

A team-based social media platform built with **Next.js 14 (App Router)** and **Supabase**.  
All actions are performed under a team identity — there are no individual profiles.

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd team-social
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
2. Enable Google and add your OAuth credentials
3. Set the redirect URL to: `http://localhost:3000/auth/callback`

### 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📊 Supabase Schema

### Tables

| Table | Description |
|---|---|
| `teams` | Team identity (id, name, created_at) |
| `profiles` | Links `auth.users` → `teams` (1-to-1 with users, N-to-1 with teams) |
| `posts` | Team-owned text posts (280 char limit, no individual author) |
| `team_follows` | Directional team-to-team follow relationships |

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

Returns the authenticated user's `team_id` from the `profiles` table. Used in all team-scoped RLS policies to avoid repeated joins.

### Signup Trigger

When a new user is created in `auth.users`, the `handle_new_user()` trigger automatically:
1. Creates a new team (name derived from email, with duplicate handling)
2. Creates a profile linking the user to the team

This works for both email/password and OAuth signups.

---

## 🏗️ Architecture

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

1. **Server Actions for mutations** — All write operations (post creation, follow/unfollow, auth) use Next.js Server Actions. This ensures `team_id` is always resolved server-side.

2. **`team_id` never from client** — The `createPostAction` fetches the user's `team_id` from the `profiles` table on the server. This prevents a malicious user from posting on behalf of another team.

3. **Optimistic UI for follows** — The `FollowButton` component uses optimistic updates for instant feedback, reverting on error.

4. **Parallel data fetching** — Dashboard and team detail pages use `Promise.all` to fetch independent data in parallel.

---

## ⚖️ Key Assumptions & Trade-offs

| Decision | Reasoning |
|---|---|
| Auto-create team on signup | Simplifies onboarding; team invite system is out of MVP scope |
| Team name from email prefix | Quick MVP approach; proper name selection would be added with more time |
| No `author_user_id` on posts | Spec explicitly states "no individual profiles" — posts belong to teams |
| No post edit/delete | MVP scope — straightforward to add with RLS policies |
| Feed limited to 50 posts | No pagination in MVP; cursor-based pagination planned for production |
| Email verification not enforced | For faster demo flow; would be enabled in production |
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

This project was created as a case study submission. All rights reserved by the author.
