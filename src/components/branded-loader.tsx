import { Spinner } from "./spinner";

export function BrandedLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-heading font-extrabold text-primary">
        Layd
      </h1>
      <Spinner className="mt-4 h-6 w-6 text-primary" />
    </div>
  );
}
