"use client";

import * as React from "react";

const REQUEST_EMAIL = "sarrthak.chauhan016@nmims.in";

type TemplateRequestDialogProps = {
  templateTitle: string;
};

export function TemplateRequestDialog({
  templateTitle,
}: TemplateRequestDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showEmail, setShowEmail] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openDialog = () => {
    setIsOpen(true);
    setShowEmail(false);
    setCopyStatus("");
  };

  const revealEmail = async () => {
    setShowEmail(true);

    try {
      await navigator.clipboard.writeText(REQUEST_EMAIL);
      setCopyStatus("Email address copied");
    } catch {
      setCopyStatus("Email address shown below");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="whitespace-nowrap rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        Request This Website
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-request-title"
        >
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#111] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                  Shadyy Request
                </p>
                <h2
                  id="template-request-title"
                  className="mt-1 text-lg font-semibold"
                >
                  {templateTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/60 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Close request popup"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">
              To request this website template, email our team.
            </p>

            <button
              type="button"
              onClick={revealEmail}
              className="mt-5 w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Email Now
            </button>

            {showEmail ? (
              <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Email address
                </p>
                <p className="mt-1 break-all text-sm font-medium text-white">
                  {REQUEST_EMAIL}
                </p>
                {copyStatus ? (
                  <p className="mt-2 text-xs text-white/50">{copyStatus}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
