import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/core/auth/actions";

// Navigation only: each page checks the session itself (layouts don't re-run on navigation).
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
          <Link href="/" className="font-semibold text-stone-900">
            Research Lab
          </Link>
          <Link href="/">Proyectos</Link>
          <Link href="/products">Productos</Link>
          <Link href="/account">Cuenta</Link>
          <form action={signOut} className="ml-auto">
            <button className="btn btn-secondary">Salir</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">{children}</main>
    </>
  );
}
