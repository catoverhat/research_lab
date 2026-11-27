import { LoginForm } from "@/core/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
      <h1>Research Lab</h1>
      <LoginForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} />
    </main>
  );
}
