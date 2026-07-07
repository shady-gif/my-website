import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  Monitor,
  Package,
  Server,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mini Store',
  description:
    'Download the Shadyy Mini Store to install Mautic locally on your computer.',
};

const mauticDownloads = [
  {
    platform: 'Windows',
    fileType: '.zip package',
    href: '/downloads/shadyy-mini-store-mautic-milestone-18-mautic-first-public.zip',
  },
  {
    platform: 'Mac',
    fileType: '.tar.gz package',
    href: '/downloads/shadyy-mini-store-mautic-milestone-18-mautic-first-public.tar.gz',
  },
];

const flowSteps = [
  'Open package',
  'Confirm Mautic',
  'Click Install',
  'Wait for setup',
  'Click Open',
];

const requirements = [
  'Docker Desktop installed and running',
  '8 GB RAM minimum, 16 GB recommended',
  '20 GB free storage minimum',
  'Stable internet for first install',
  'Port 8080 available on the computer',
];

export default function MiniStorePage() {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-[#17201f]">
      <header className="border-b border-[#dce5df] bg-white/90 px-5 py-4 backdrop-blur md:px-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#52615d] transition hover:text-[#17201f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Shadyy
          </Link>
          <span className="rounded-md border border-[#dce5df] bg-[#f7faf8] px-3 py-1 text-xs font-bold uppercase tracking-normal text-[#17664a]">
            Mini Store
          </span>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] md:px-10 md:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-black uppercase tracking-normal text-[#17664a]">
            Mautic-ready local installer
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-normal text-[#17201f] md:text-7xl">
            Install Mautic on your computer.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f6f6a]">
            Download Shadyy Mini Store, run it locally, click Install, and open
            Mautic at localhost when it is ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {mauticDownloads.map((download, index) => (
              <a
                key={download.platform}
                href={download.href}
                download
                className={`inline-flex min-h-16 min-w-60 items-center gap-3 rounded-lg border px-5 py-3 font-bold transition ${
                  index === 0
                    ? 'border-[#174536] bg-[#174536] text-white hover:bg-[#12392d]'
                    : 'border-[#dce5df] bg-white text-[#17201f] hover:border-[#9bb7ac]'
                }`}
              >
                <Download className="h-5 w-5" />
                <span>
                  Mautic for {download.platform}
                  <small
                    className={`block text-xs font-semibold ${
                      index === 0 ? 'text-[#d5eee2]' : 'text-[#66736f]'
                    }`}
                  >
                    {download.fileType}
                  </small>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-6 grid max-w-2xl gap-3 rounded-lg border border-[#e1c76f] bg-[#fff8df] p-4 text-sm text-[#68561b]">
            <strong className="text-[#43350c]">Twenty CRM is next.</strong>
            <span>
              It appears here as pending until the final local install smoke
              test passes.
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#dce5df] bg-white shadow-[0_24px_70px_rgba(23,32,31,0.12)]">
          <div className="flex gap-2 border-b border-[#dce5df] bg-[#edf3f0] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#aab7b2]" />
            <span className="h-3 w-3 rounded-full bg-[#aab7b2]" />
            <span className="h-3 w-3 rounded-full bg-[#aab7b2]" />
          </div>

          <div className="grid min-h-[520px] grid-cols-[74px_minmax(0,1fr)] max-sm:grid-cols-1">
            <aside className="grid content-start justify-items-center gap-5 border-r border-[#dce5df] bg-[#f5f8f7] px-3 py-5 max-sm:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#17201f] text-lg font-black text-white">
                S
              </span>
              <span className="h-2 w-8 rounded-full bg-[#d8e1dd]" />
              <span className="h-2 w-8 rounded-full bg-[#d8e1dd]" />
              <span className="h-2 w-8 rounded-full bg-[#d8e1dd]" />
            </aside>

            <div className="p-5">
              <div className="mb-5 flex items-center justify-between gap-4 text-sm text-[#66736f]">
                <span className="font-semibold">Local marketing apps</span>
                <span className="font-bold text-[#17664a]">Ready</span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                <article className="min-h-32 rounded-lg border border-dashed border-[#dfc978] bg-[#fffaf0] p-4">
                  <span className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#f6e6ad] text-sm font-black text-[#5f4712]">
                    20
                  </span>
                  <h2 className="text-base font-black">Twenty</h2>
                  <p className="text-xs font-semibold text-[#7b692e]">
                    Pending final smoke
                  </p>
                </article>

                <article className="min-h-32 rounded-lg border border-[#76b99e] bg-[#effaf5] p-4">
                  <span className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#17664a] text-lg font-black text-white">
                    M
                  </span>
                  <h2 className="text-base font-black">Mautic</h2>
                  <p className="text-xs font-semibold text-[#17664a]">
                    Selected
                  </p>
                </article>

                <article className="min-h-32 rounded-lg border border-[#dce5df] bg-white p-4">
                  <span className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#edf1f0] text-lg font-black">
                    S
                  </span>
                  <h2 className="text-base font-black">Mini Store</h2>
                  <p className="text-xs font-semibold text-[#66736f]">
                    Local
                  </p>
                </article>
              </div>

              <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-[#dce5df] bg-[#fbfcfb] p-4 max-sm:flex-col max-sm:items-stretch">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3">
                  <span className="row-span-2 grid h-14 w-14 place-items-center rounded-lg bg-[#17664a] text-xl font-black text-white">
                    M
                  </span>
                  <strong>Mautic</strong>
                  <small className="text-[#66736f]">Marketing automation</small>
                </div>
                <span className="inline-flex min-h-11 min-w-28 items-center justify-center rounded-lg bg-[#245fca] px-4 text-sm font-black text-white">
                  Install
                </span>
              </div>

              <ol className="grid gap-2">
                {flowSteps.map((step, index) => (
                  <li
                    key={step}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${
                      index === flowSteps.length - 1
                        ? 'bg-[#dff4ea] text-[#17664a]'
                        : 'bg-[#f4f7f5] text-[#66736f]'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce5df] bg-white px-5 py-10 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-[#dce5df] bg-[#fbfcfb] p-5">
            <Package className="mb-4 h-6 w-6 text-[#17664a]" />
            <strong>One local package</strong>
            <p className="mt-2 text-sm leading-6 text-[#66736f]">
              Mini Store opens with Mautic already selected.
            </p>
          </div>
          <div className="rounded-lg border border-[#dce5df] bg-[#fbfcfb] p-5">
            <Server className="mb-4 h-6 w-6 text-[#17664a]" />
            <strong>Runs on localhost</strong>
            <p className="mt-2 text-sm leading-6 text-[#66736f]">
              Mautic opens locally at port 8080 after setup.
            </p>
          </div>
          <div className="rounded-lg border border-[#dce5df] bg-[#fbfcfb] p-5">
            <ShieldCheck className="mb-4 h-6 w-6 text-[#17664a]" />
            <strong>Docker-based</strong>
            <p className="mt-2 text-sm leading-6 text-[#66736f]">
              App services and data stay on the user&apos;s computer.
            </p>
          </div>
          <div className="rounded-lg border border-[#dce5df] bg-[#fbfcfb] p-5">
            <Clock3 className="mb-4 h-6 w-6 text-[#17664a]" />
            <strong>First install downloads</strong>
            <p className="mt-2 text-sm leading-6 text-[#66736f]">
              The first setup needs time and a stable connection.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[0.8fr_1.2fr] md:px-10">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-normal text-[#17664a]">
            Before downloading
          </p>
          <h2 className="text-4xl font-black tracking-normal">
            Computer requirements
          </h2>
        </div>
        <div className="grid gap-3">
          {requirements.map((requirement) => (
            <div
              key={requirement}
              className="flex min-h-12 items-center gap-3 rounded-lg border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#52615d]"
            >
              <Monitor className="h-4 w-4 text-[#17664a]" />
              {requirement}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
