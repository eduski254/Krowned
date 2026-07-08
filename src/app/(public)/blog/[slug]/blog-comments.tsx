"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { addComment, deleteComment, type PostFormState } from "@/lib/blog/actions";
import { Spinner } from "@/components/spinner";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
};

export function BlogComments({
  postId,
  comments,
  currentUserId,
  isLoggedIn,
}: {
  postId: string;
  comments: Comment[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PostFormState, FormData>(addComment, null);
  const [body, setBody] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setDeletingId(commentId);
    startDelete(async () => {
      await deleteComment(commentId);
      setDeletingId(null);
      router.refresh();
    });
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold font-heading text-foreground">
        <MessageCircle className="h-6 w-6" />
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      {isLoggedIn ? (
        <form
          action={(formData) => {
            action(formData);
            setBody("");
          }}
          className="mb-8"
        >
          <input type="hidden" name="post_id" value={postId} />
          {state?.error && (
            <div className="mb-2 rounded-lg bg-destructive/10 p-2 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                required
                maxLength={2000}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{body.length}/2000</span>
                <button
                  type="submit"
                  disabled={pending || !body.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {pending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="font-medium text-primary hover:underline">Log in</a>
            {" "}to join the conversation
          </p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {c.user_avatar ? (
                <img src={c.user_avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {c.user_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.user_name}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                  {currentUserId === c.user_id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={isDeleting && deletingId === c.id}
                      className="ml-auto rounded-md p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
