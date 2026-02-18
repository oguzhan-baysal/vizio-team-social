"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

/**
 * Signup page with email/password and Google OAuth options.
 * The database trigger automatically creates a team and profile on signup.
 */
export default function SignupPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignup(formData: FormData) {
        setError(null);
        setIsLoading(true);

        try {
            const result = await signUp(formData);
            if (result?.error) {
                setError(result.error);
            }
        } catch {
            // redirect throws, this is expected
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGoogleSignup() {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">
                    Sign up to create your team and start posting
                </p>

                {error && <div className="form-error-box">{error}</div>}

                <form action={handleSignup} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="form-input"
                            placeholder="you@example.com"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            placeholder="Min. 6 characters"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <button
                    onClick={handleGoogleSignup}
                    className="btn btn-google btn-full"
                    disabled={isLoading}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path
                            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                            fill="#4285F4"
                        />
                        <path
                            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                            fill="#34A853"
                        />
                        <path
                            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="auth-link">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
