"use client";

import { useState } from "react";
import { createPostAction } from "@/lib/actions";

/**
 * Form for creating new posts on behalf of the user's team.
 * Shows character count and provides validation feedback.
 */
export default function CreatePostForm() {
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const charCount = content.length;
    const isOverLimit = charCount > 280;

    async function handleSubmit(formData: FormData) {
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await createPostAction(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setContent("");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form action={handleSubmit} className="create-post-form">
            <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening with your team?"
                className="post-textarea"
                rows={3}
                maxLength={280}
                disabled={isSubmitting}
            />
            <div className="post-form-footer">
                <span
                    className={`char-count ${isOverLimit ? "char-count-over" : charCount > 250 ? "char-count-warn" : ""
                        }`}
                >
                    {charCount}/280
                </span>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || isOverLimit || charCount === 0}
                >
                    {isSubmitting ? "Posting..." : "Post"}
                </button>
            </div>
            {error && <p className="form-error">{error}</p>}
        </form>
    );
}
