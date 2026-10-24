
import { Link } from "react-router-dom";

export default function AuthLayout({
  title,
  subtitle,
  children,
  bottomText,
  bottomLink,
  bottomLabel,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8 font-sans text-neutral-900">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 sm:p-9">
        <Link to="/" className="mb-8 inline-flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-lg font-bold text-white">
            N.
          </span>
          <span className="text-xs font-bold tracking-[0.2em]">
            YOUR BRAND
          </span>
        </Link>

        <header className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {subtitle}
          </p>
        </header>

        {children}

        <p className="mt-6 text-center text-sm text-neutral-500">
          {bottomText}{" "}
          <Link
            to={bottomLink}
            className="font-semibold text-neutral-900 hover:underline"
          >
            {bottomLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
