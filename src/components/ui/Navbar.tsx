import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";

/**
 * Top navigation bar.
 * Shows login/signup links for unauthenticated users
 * and team name + logout for authenticated users.
 */
export default async function Navbar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let teamName: string | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("team_id")
            .eq("id", user.id)
            .single();

        if (profile) {
            const { data: team } = await supabase
                .from("teams")
                .select("name")
                .eq("id", profile.team_id)
                .single();
            teamName = team?.name ?? null;
        }
    }

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    TeamSocial
                </Link>

                <div className="navbar-links">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="nav-link">
                                Dashboard
                            </Link>
                            {teamName && (
                                <span className="nav-team-badge">{teamName}</span>
                            )}
                            <form action={signOut}>
                                <button type="submit" className="btn btn-secondary btn-sm">
                                    Sign Out
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="btn btn-secondary btn-sm">
                                Sign In
                            </Link>
                            <Link href="/auth/signup" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
