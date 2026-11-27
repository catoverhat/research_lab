import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/core/auth/actions";
import { NavLink } from "@/shared/ui/nav-link";

// Navigation only: each page checks the session itself (layouts don't re-run on navigation).
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-stone-200 bg-white">
        <nav aria-label="Principal" className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
          <Link href="/" className="font-semibold text-stone-900">
            Research Lab
          </Link>
          <NavLink href="/" sections={["/projects/"]}>
            Proyectos
          </NavLink>
          <NavLink href="/products" sections={["/products/"]}>
            Productos
          </NavLink>
          <NavLink href="/account">Cuenta</NavLink>
          <form action={signOut} className="ml-auto">
            <button type="submit" className="btn btn-secondary">
              Salir
            </button>
          </form>
        </nav>
      </header>
      {/* tabIndex -1: the skip link moves the keyboard focus here, not only the scroll. */}
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl space-y-6 px-4 py-6 outline-none">
        {children}
      </main>
    </>
  );
}
