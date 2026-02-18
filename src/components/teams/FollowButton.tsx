"use client";

import { useState, useTransition } from "react";
import { followTeamAction, unfollowTeamAction } from "@/lib/actions";

/**
 * Follow/Unfollow toggle button for a target team.
 * Uses optimistic UI updates for better UX.
 */
export default function FollowButton({
    targetTeamId,
    isFollowing: initialIsFollowing,
}: {
    targetTeamId: string;
    isFollowing: boolean;
}) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleToggle() {
        setError(null);
        const previousState = isFollowing;

        // Optimistic update
        setIsFollowing(!isFollowing);

        startTransition(async () => {
            try {
                const result = isFollowing
                    ? await unfollowTeamAction(targetTeamId)
                    : await followTeamAction(targetTeamId);

                if (result?.error) {
                    // Revert on error
                    setIsFollowing(previousState);
                    setError(result.error);
                }
            } catch {
                setIsFollowing(previousState);
                setError("Something went wrong");
            }
        });
    }

    return (
        <div>
            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`btn btn-sm ${isFollowing ? "btn-secondary" : "btn-primary"}`}
            >
                {isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
            {error && <p className="form-error text-xs mt-1">{error}</p>}
        </div>
    );
}
