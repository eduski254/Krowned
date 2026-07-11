"use client";

import { useActionState, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { upsertPost, type PostFormState } from "@/lib/blog/actions";
import { Spinner } from "@/components/spinner";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, Heading4,
  List, ListOrdered, ListTodo,
  Quote, Code, Minus, Undo, Redo,
  ImagePlus, Video, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight,
  Eye, Save, Upload, X, ChevronDown,
} from "lucide-react";

type PostData = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  cover_image_url?: string;
  author_name?: string;
  author_bio?: string;
  author_avatar_url?: string;
  status?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
};

export function BlogEditor({ post }: { post?: PostData }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PostFormState, FormData>(upsertPost, null);
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? "");
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [authorName, setAuthorName] = useState(post?.author_name ?? "");
  const [authorBio, setAuthorBio] = useState(post?.author_bio ?? "");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(post?.author_avatar_url ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [showSeo, setShowSeo] = useState(false);
  const [showAuthor, setShowAuthor] = useState(!!(post?.author_name || post?.author_bio));
  const [coverUploading, setCoverUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!post?.id);

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
      Youtube.configure({ inline: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: post?.body ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3",
      },
    },
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (!autoSlug) return;
    const generated = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(generated);
  }, [title, autoSlug]);

  // Redirect on success
  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/admin/blog");
    }
  }, [state?.success, router]);

  // Cover image upload
  const handleCoverUpload = useCallback(async (file: File) => {
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/blog/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setCoverUrl(data.url);
    } finally {
      setCoverUploading(false);
    }
  }, []);

  // Inline image upload
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/blog/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    };
    input.click();
  }, [editor]);

  // YouTube embed
  const handleYoutubeEmbed = useCallback(() => {
    const url = prompt("Enter YouTube URL:");
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  // Link
  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const wordCount = editor?.storage.characterCount?.words?.() ??
    (editor?.getText().split(/\s+/).filter(Boolean).length ?? 0);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (!editor) return null;

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="body" value={editor.getHTML()} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="cover_image_url" value={coverUrl} />
      <input type="hidden" name="tags" value={tags} />
      <input type="hidden" name="author_name" value={authorName} />
      <input type="hidden" name="author_bio" value={authorBio} />
      <input type="hidden" name="author_avatar_url" value={authorAvatarUrl} />
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDescription} />

      {state?.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
        {coverUrl ? (
          <div className="relative aspect-[21/9] max-h-64 overflow-hidden rounded-xl border border-border">
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setCoverUrl("")}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
            <Upload className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">
              {coverUploading ? "Uploading..." : "Click or drag to upload cover image"}
            </span>
            <span className="text-xs mt-1">JPG, PNG, WebP, GIF — max 10 MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Title */}
      <div>
        <input
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          required
          className="w-full border-0 bg-transparent text-3xl font-bold font-heading text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* Slug */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">/blog/</span>
        <input
          name="slug"
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
          required
          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="post-slug"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Excerpt</label>
        <textarea
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Brief summary for cards and SEO..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-20 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-0.5 p-1.5">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarBtn>
          <ToolbarSep />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4"><Heading4 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarSep />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task list"><ListTodo className="h-4 w-4" /></ToolbarBtn>
          <ToolbarSep />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"><Quote className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block"><Code className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></ToolbarBtn>
          <ToolbarSep />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left"><AlignLeft className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center"><AlignCenter className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right"><AlignRight className="h-4 w-4" /></ToolbarBtn>
          <ToolbarSep />
          <ToolbarBtn onClick={handleLink} active={editor.isActive("link")} title="Link"><LinkIcon className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={handleImageUpload} title="Image"><ImagePlus className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={handleYoutubeEmbed} title="YouTube"><Video className="h-4 w-4" /></ToolbarBtn>
          <ToolbarSep />
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo className="h-4 w-4" /></ToolbarBtn>

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{wordCount} words</span>
            <span>~{readingTime} min read</span>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <EditorContent editor={editor} />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="wellness, beauty, tips (comma-separated)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
      </div>

      {/* Author override */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAuthor(!showAuthor)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50"
        >
          Author Info Override
          <ChevronDown className={`h-4 w-4 transition-transform ${showAuthor ? "rotate-180" : ""}`} />
        </button>
        {showAuthor && (
          <div className="space-y-3 border-t border-border px-4 py-4">
            <p className="text-xs text-muted-foreground">Leave blank to use your profile info</p>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Display Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Layd Team"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Bio</label>
              <input
                type="text"
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                placeholder="e.g. The Layd editorial team"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Avatar URL</label>
              <input
                type="text"
                value={authorAvatarUrl}
                onChange={(e) => setAuthorAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50"
        >
          SEO Settings
          <ChevronDown className={`h-4 w-4 transition-transform ${showSeo ? "rotate-180" : ""}`} />
        </button>
        {showSeo && (
          <div className="space-y-3 border-t border-border px-4 py-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || "Falls back to post title"}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-0.5 text-xs text-muted-foreground">{(metaTitle || title).length}/60 characters</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder={excerpt || "Falls back to excerpt"}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-0.5 text-xs text-muted-foreground">{(metaDescription || excerpt).length}/160 characters</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-0 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <button
          type="submit"
          onClick={() => setStatus("draft")}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {pending && status === "draft" ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save Draft
        </button>
        <button
          type="submit"
          onClick={() => setStatus("published")}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending && status === "published" ? <Spinner className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {post?.status === "published" ? "Update" : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/blog")}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- Toolbar helpers ----------

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md p-1.5 transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="mx-0.5 h-5 w-px bg-border" />;
}
