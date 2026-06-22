import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        We&apos;ve sent you a verification link. Please check your inbox and
        click the link to activate your account.
      </p>

      <p className="mt-6 text-sm text-muted-foreground">
        Already verified?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
