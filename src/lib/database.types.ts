/**
 * Database schema types for the Supabase client.
 *
 * Hand-maintained to mirror `supabase/migrations/001_initial_schema.sql`.
 * Once the project is linked, this file can be regenerated with the Supabase
 * CLI (`supabase gen types typescript`).
 *
 * Passing `Database` to the client factories is what makes `.select(...)`
 * results resolve to their real shapes: without it, embedded relations such as
 * `posts -> teams` are typed as arrays instead of the single objects that
 * PostgREST actually returns, forcing the callers to cast to `any`.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            posts: {
                Row: {
                    content: string;
                    created_at: string | null;
                    id: string;
                    team_id: string;
                };
                Insert: {
                    content: string;
                    created_at?: string | null;
                    id?: string;
                    team_id: string;
                };
                Update: {
                    content?: string;
                    created_at?: string | null;
                    id?: string;
                    team_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "posts_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                ];
            };
            profiles: {
                Row: {
                    created_at: string | null;
                    id: string;
                    team_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id: string;
                    team_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    team_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "profiles_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                ];
            };
            team_follows: {
                Row: {
                    created_at: string | null;
                    follower_id: string;
                    following_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    follower_id: string;
                    following_id: string;
                };
                Update: {
                    created_at?: string | null;
                    follower_id?: string;
                    following_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "team_follows_follower_id_fkey";
                        columns: ["follower_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "team_follows_following_id_fkey";
                        columns: ["following_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                ];
            };
            teams: {
                Row: {
                    created_at: string | null;
                    id: string;
                    name: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    name: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    name?: string;
                };
                Relationships: [];
            };
        };
        Views: { [_ in never]: never };
        Functions: {
            get_my_team_id: { Args: never; Returns: string };
            handle_new_user: { Args: never; Returns: unknown };
        };
        Enums: { [_ in never]: never };
        CompositeTypes: { [_ in never]: never };
    };
};
