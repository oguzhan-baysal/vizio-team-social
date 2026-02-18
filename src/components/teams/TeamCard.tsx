import Link from "next/link";
import FollowButton from "./FollowButton";

type TeamCardProps = {
    team: {
        id: string;
        name: string;
    };
    isOwnTeam: boolean;
    isFollowing: boolean;
    isAuthenticated: boolean;
};

/**
 * Displays a team card with name and optional follow button.
 * Does not show the follow button for the user's own team.
 */
export default function TeamCard({
    team,
    isOwnTeam,
    isFollowing,
    isAuthenticated,
}: TeamCardProps) {
    return (
        <div className="team-card">
            <Link href={`/teams/${team.id}`} className="team-card-name">
                {team.name}
            </Link>
            {isAuthenticated && !isOwnTeam && (
                <FollowButton targetTeamId={team.id} isFollowing={isFollowing} />
            )}
            {isOwnTeam && <span className="own-team-badge">Your Team</span>}
        </div>
    );
}
