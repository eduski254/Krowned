import { FileText } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Content</h1>
      <EmptyState
        icon={FileText}
        title="Content management"
        description="CMS and content management features are planned for a future release."
      />
    </div>
  );
}
