import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Book a Demo | Chayote",
  description: "Request access to Chayote.",
};

export default function BookDemoPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-8">
      <section className="w-full max-w-[380px] border border-line bg-panel px-5 py-6 text-center">
        <p className="text-base font-semibold text-secondary">chayote</p>
        <h1 className="mt-6 text-xl font-semibold text-secondary">Book a demo</h1>
        <p className="mt-3 text-sm leading-6 text-neutral">
          Demo scheduling is coming soon.
        </p>
        <Link
          className="mt-6 inline-flex h-9 items-center justify-center bg-primary px-4 text-sm font-semibold text-secondary transition duration-150 hover:bg-[#d7ff5a] focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          href="/auth"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
