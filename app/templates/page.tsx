import type { Metadata } from "next";

import { TemplatesGallery } from "@/components/templates-gallery";

export const metadata: Metadata = {
  title: "Website Templates",
  description: "Preview the free website experiences available from Shadyy.",
};

export default function TemplatesPage() {
  return (
    <main className="min-h-screen w-full bg-[#f6f6f6] px-4 py-12 text-foreground sm:px-6 md:px-8">
      <section className="mx-auto max-w-[68rem] bg-white px-6 py-10 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] sm:px-8">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-5xl">
            Website Templates
          </h1>
          <p className="text-lg text-muted-foreground">
            A gallery of cinematic website references
          </p>
        </header>

        <TemplatesGallery />
      </section>
    </main>
  );
}
