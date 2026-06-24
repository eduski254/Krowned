"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { CATEGORY_ICONS, ICON_NAMES } from "@/lib/category-icons";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/lib/categories/actions";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

// ── Main Component ──────────────────────────────────────────────

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Move category up/down
  const handleMove = (id: string, dir: -1 | 1) => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const updated = [...categories];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setCategories(reordered);

    startTransition(async () => {
      const result = await reorderCategories(
        reordered.map((c) => ({ id: c.id, sort_order: c.sort_order })),
      );
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        setError(result.error);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    });
  };

  const handleCreated = (cat: Category | (Partial<Category> & { id: string })) => {
    // Create always returns a full Category, but the type union is needed for the form
    setCategories((prev) => [...prev, cat as Category]);
    setShowCreate(false);
    router.refresh();
  };

  const handleUpdated = (updated: Category | (Partial<Category> & { id: string })) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
    setEditingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <CategoryForm
                initial={cat}
                onSave={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMove(cat.id, -1)}
                    disabled={isPending || categories.indexOf(cat) === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <GripVertical className="h-4 w-4 rotate-90 scale-x-[-1]" />
                  </button>
                </div>

                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {cat.icon && CATEGORY_ICONS[cat.icon] ? (
                    (() => {
                      const Icon = CATEGORY_ICONS[cat.icon];
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()
                  ) : (
                    <span className="text-sm text-muted-foreground">?</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/c/{cat.slug} &middot; #{cat.sort_order}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingId(cat.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create */}
      {showCreate ? (
        <CategoryForm
          onSave={handleCreated}
          onCancel={() => setShowCreate(false)}
          defaultSortOrder={categories.length + 1}
        />
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      )}
    </div>
  );
}

// ── Category Form (create / edit) ────────────────────────────────

function CategoryForm({
  initial,
  onSave,
  onCancel,
  defaultSortOrder,
}: {
  initial?: Category;
  onSave: (cat: Category | (Partial<Category> & { id: string })) => void;
  onCancel: () => void;
  defaultSortOrder?: number;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? defaultSortOrder ?? 0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);

    startTransition(async () => {
      if (initial) {
        // Update
        const result = await updateCategory({
          id: initial.id,
          name: name.trim(),
          icon: icon || null,
          sort_order: sortOrder,
        });
        if (result.error) setError(result.error);
        else onSave({ id: initial.id, name: name.trim(), icon: icon || null, sort_order: sortOrder });
      } else {
        // Create
        const result = await createCategory({
          name: name.trim(),
          icon: icon || undefined,
          sort_order: sortOrder,
        });
        if (result.error) setError(result.error);
        else if (result.data) onSave(result.data as Category);
      }
    });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Name */}
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hair & Barber"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Sort Order */}
        <div className="w-20">
          <label className="text-xs font-medium text-muted-foreground">Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Icon selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Icon</label>
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            {icon && CATEGORY_ICONS[icon] ? (
              (() => {
                const Icon = CATEGORY_ICONS[icon];
                return <Icon className="h-4 w-4 text-primary" />;
              })()
            ) : (
              <span className="text-muted-foreground">Pick</span>
            )}
            <span className="text-xs text-muted-foreground">{icon || "none"}</span>
          </button>
        </div>
      </div>

      {/* Icon picker */}
      {showIconPicker && (
        <IconPicker
          selected={icon}
          onSelect={(name) => {
            setIcon(name);
            setShowIconPicker(false);
          }}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {initial ? "Save" : "Create"}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Icon Picker ─────────────────────────────────────────────────

function IconPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ICON_NAMES;
    const q = search.toLowerCase();
    return ICON_NAMES.filter((name) => name.includes(q));
  }, [search]);

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10 max-h-48 overflow-y-auto">
        {filtered.map((name) => {
          const Icon = CATEGORY_ICONS[name];
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              title={name}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg p-2 text-xs transition-colors ${
                selected === name
                  ? "bg-primary/10 text-primary ring-1 ring-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center text-[10px] text-muted-foreground">{name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-muted-foreground">
            No icons match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
