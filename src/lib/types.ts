/**
 * Domain types shared between the query helpers in `src/lib/queries` and the
 * components that render their results. Defined once here so a query and its
 * consumers cannot drift apart.
 */

/** A team row as selected by `getTeams` / `getTeam`. */
export type Team = {
    id: string;
    name: string;
    created_at: string | null;
};

/** A post with its owning team embedded, as selected by the feed queries. */
export type PostWithTeam = {
    id: string;
    content: string;
    created_at: string | null;
    teams: {
        id: string;
        name: string;
    };
};
