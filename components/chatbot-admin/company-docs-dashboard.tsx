"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Database,
  DollarSign,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Loader2,
  Mail,
  MessageSquare,
  PackageSearch,
  RefreshCw,
  Target,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientOnboardingPanel } from "@/components/chatbot-admin/client-onboarding-panel";
import type { AnalyticsSummary } from "@/lib/chatbot-admin/analytics";
import type { LeadCapture, LeadDeliveryStatus } from "@/lib/chatbot-admin/leads";
import type { BackendStatus, ChatbotSource } from "@/lib/chatbot-admin/sources";

type UploadKind = "document" | "catalog";

type SourcesResponse = {
  ok: boolean;
  sources: ChatbotSource[];
  message?: string;
};

type UploadResponse = {
  ok: boolean;
  source?: ChatbotSource;
  message?: string;
};

type BackendStatusResponse = {
  ok: boolean;
  status: BackendStatus;
};

type LeadsResponse = {
  ok: boolean;
  leads: LeadCapture[];
  message?: string;
};

type AnalyticsResponse = {
  ok: boolean;
  analytics: AnalyticsSummary;
  message?: string;
};

const tenantId = "shadyy";

const statusStyles: Record<ChatbotSource["status"], string> = {
  uploaded: "border-slate-200 bg-slate-50 text-slate-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  waiting_for_backend: "border-amber-200 bg-amber-50 text-amber-800",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const deliveryStyles: Record<LeadDeliveryStatus, string> = {
  not_configured: "border-slate-200 bg-slate-50 text-slate-600",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusLabel = (status: ChatbotSource["status"]) =>
  status.replaceAll("_", " ");

const deliveryLabel = (status: LeadDeliveryStatus) => status.replaceAll("_", " ");

function BackendPill({
  label,
  ready,
  message,
}: {
  label: string;
  ready: boolean;
  message: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
      {ready ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="truncate text-xs text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function UploadPanel({
  kind,
  title,
  description,
  accept,
  busy,
  onSubmit,
}: {
  kind: UploadKind;
  title: string;
  description: string;
  accept: string;
  busy: boolean;
  onSubmit: (kind: UploadKind, file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    await onSubmit(kind, file);
    setFile(null);
    event.currentTarget.reset();
  };

  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
            {kind === "document" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <FileSpreadsheet className="h-5 w-5" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor={`${kind}-file`}>File</Label>
            <Input
              id={`${kind}-file`}
              accept={accept}
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button className="w-full gap-2" disabled={!file || busy} type="submit">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CompanyDocsDashboard() {
  const [sources, setSources] = useState<ChatbotSource[]>([]);
  const [leads, setLeads] = useState<LeadCapture[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [busyUpload, setBusyUpload] = useState<UploadKind | null>(null);
  const [busyIngestion, setBusyIngestion] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");

  const completedCount = useMemo(
    () => sources.filter((source) => source.status === "completed").length,
    [sources],
  );

  const waitingCount = useMemo(
    () => sources.filter((source) => source.status === "waiting_for_backend").length,
    [sources],
  );

  const sentLeadCount = useMemo(
    () =>
      leads.filter((lead) =>
        lead.delivery.some((attempt) => attempt.status === "sent"),
      ).length,
    [leads],
  );

  const adminFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (adminToken) headers.set("X-Shadyy-Admin-Token", adminToken);

    return fetch(input, {
      ...init,
      headers,
    });
  };

  const unlockAdmin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanToken = tokenDraft.trim();
    setAdminToken(cleanToken);
    window.sessionStorage.setItem("shadyy-admin-token", cleanToken);
    setNotice(cleanToken ? "Admin access token saved for this tab." : "");
  };

  const refreshSources = async () => {
    if (!adminToken) return;
    const response = await adminFetch(`/api/chatbot-admin/sources?tenantId=${tenantId}`);
    const data = (await response.json()) as SourcesResponse;
    if (!data.ok) throw new Error(data.message ?? "Could not load sources.");
    if (data.ok) setSources(data.sources);
  };

  const refreshBackendStatus = async () => {
    if (!adminToken) return;
    const response = await adminFetch("/api/chatbot-admin/backend-status");
    const data = (await response.json()) as BackendStatusResponse;
    if (!data.ok) throw new Error("Could not load backend status.");
    if (data.ok) setBackendStatus(data.status);
  };

  const refreshLeads = async () => {
    if (!adminToken) return;
    const response = await adminFetch(`/api/chatbot-admin/leads?tenantId=${tenantId}`);
    const data = (await response.json()) as LeadsResponse;
    if (!data.ok) throw new Error(data.message ?? "Could not load leads.");
    if (data.ok) setLeads(data.leads);
  };

  const refreshAnalytics = async () => {
    if (!adminToken) return;
    const response = await adminFetch(`/api/chatbot-admin/analytics?tenantId=${tenantId}`);
    const data = (await response.json()) as AnalyticsResponse;
    if (!data.ok) throw new Error(data.message ?? "Could not load analytics.");
    if (data.ok) setAnalytics(data.analytics);
  };

  useEffect(() => {
    const savedToken = window.sessionStorage.getItem("shadyy-admin-token") ?? "";
    setAdminToken(savedToken);
    setTokenDraft(savedToken);
  }, []);

  useEffect(() => {
    if (!adminToken) return;

    void Promise.all([
      refreshSources(),
      refreshBackendStatus(),
      refreshLeads(),
      refreshAnalytics(),
    ]).catch((error) => {
      setNotice(error instanceof Error ? error.message : "Admin access failed.");
    });
  }, [adminToken]);

  const uploadFile = async (kind: UploadKind, file: File) => {
    setBusyUpload(kind);
    setNotice("");

    const formData = new FormData();
    formData.append("tenantId", tenantId);
    formData.append("kind", kind);
    formData.append("file", file);

    try {
      const response = await adminFetch("/api/chatbot-admin/sources", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as UploadResponse;
      if (!data.ok) throw new Error(data.message);
      setNotice(`${data.source?.filename ?? "File"} uploaded.`);
      await refreshSources();
      await refreshBackendStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusyUpload(null);
    }
  };

  const triggerIngestion = async (sourceId: string) => {
    setBusyIngestion(sourceId);
    setNotice("");

    try {
      const response = await adminFetch(
        `/api/chatbot-admin/sources/${sourceId}/ingest`,
        { method: "POST" },
      );
      const data = (await response.json()) as UploadResponse;
      if (!data.ok) throw new Error(data.message);
      setNotice(data.source?.ingestion.message ?? "Ingestion updated.");
      await refreshSources();
      await refreshBackendStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ingestion failed.");
    } finally {
      setBusyIngestion(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
              Shadyy knowledge admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Company docs upload app
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Upload documents and product catalogs, then trigger ingestion into the
              searchable company knowledge backend.
            </p>
          </div>
          <Button
            className="w-full gap-2 sm:w-auto"
            variant="outline"
            onClick={() => {
              void Promise.all([
                refreshSources(),
                refreshBackendStatus(),
                refreshLeads(),
                refreshAnalytics(),
              ]).catch((error) => {
                setNotice(
                  error instanceof Error ? error.message : "Admin refresh failed.",
                );
              });
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8">
        <Card className="rounded-md border-slate-200 shadow-none">
          <CardContent className="pt-6">
            <form
              className="grid gap-4 md:grid-cols-[1fr_auto]"
              onSubmit={unlockAdmin}
            >
              <div className="grid gap-2">
                <Label htmlFor="admin-token" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Admin access token
                </Label>
                <Input
                  id="admin-token"
                  type="password"
                  value={tokenDraft}
                  onChange={(event) => setTokenDraft(event.target.value)}
                />
              </div>
              <Button className="gap-2 self-end" type="submit">
                <KeyRound className="h-4 w-4" />
                Unlock admin
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <BackendPill
            label="Unstructured"
            ready={Boolean(backendStatus?.unstructured.reachable)}
            message={backendStatus?.unstructured.message ?? "Checking parser backend."}
          />
          <BackendPill
            label="Qdrant"
            ready={Boolean(backendStatus?.qdrant.reachable)}
            message={backendStatus?.qdrant.message ?? "Checking vector backend."}
          />
          <BackendPill
            label="Embeddings"
            ready={Boolean(backendStatus?.embeddings.configured)}
            message={backendStatus?.embeddings.message ?? "Checking embedding key."}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <BackendPill
            label="Captured leads"
            ready={leads.length > 0}
            message={`${leads.length} total lead${leads.length === 1 ? "" : "s"} in dashboard.`}
          />
          <BackendPill
            label="Lead delivery"
            ready={sentLeadCount > 0}
            message={`${sentLeadCount} lead${sentLeadCount === 1 ? "" : "s"} accepted by configured hooks.`}
          />
          <BackendPill
            label="CRM later"
            ready={false}
            message="CRM handoff is tracked as a future delivery hook."
          />
        </div>

        <Card className="rounded-md border-slate-200 shadow-none">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Conversation analytics
              </CardTitle>
              <CardDescription>
                Business summary from Shadyy chat turns, lead captures, and Langfuse trace status.
              </CardDescription>
            </div>
            <Button
              className="gap-2"
              size="sm"
              variant="outline"
              onClick={() =>
                void refreshAnalytics().catch((error) => {
                  setNotice(
                    error instanceof Error ? error.message : "Analytics refresh failed.",
                  );
                })
              }
            >
              <RefreshCw className="h-4 w-4" />
              Refresh analytics
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                detail={`${analytics?.totalMessages ?? 0} analyzed message${analytics?.totalMessages === 1 ? "" : "s"}.`}
                icon={MessageSquare}
                label="Total chats"
                value={analytics?.totalChats ?? 0}
              />
              <MetricCard
                detail="Captured through the widget lead form."
                icon={Users}
                label="Leads captured"
                value={analytics?.leadsCaptured ?? 0}
              />
              <MetricCard
                detail="Fallbacks, errors, or unclear answers."
                icon={AlertCircle}
                label="Missed answers"
                value={analytics?.missedAnswers ?? 0}
              />
              <MetricCard
                detail="Tracked from revenue-engine playbooks."
                icon={Target}
                label="Opportunities"
                value={analytics?.conversionOpportunities ?? 0}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <BackendPill
                label="Product objections"
                ready={(analytics?.productObjections ?? 0) > 0}
                message={`${analytics?.productObjections ?? 0} objection-handling chat${analytics?.productObjections === 1 ? "" : "s"}.`}
              />
              <BackendPill
                label="OpenAI cost"
                ready={(analytics?.openAiCostUsd ?? 0) > 0}
                message={`$${(analytics?.openAiCostUsd ?? 0).toFixed(4)} tracked from provider payloads.`}
              />
              <BackendPill
                label="Langfuse"
                ready={Boolean(analytics?.langfuse.configured)}
                message={analytics?.langfuse.message ?? "Analytics not loaded yet."}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <BackendPill
                label="Top CTA"
                ready={Boolean(analytics?.ctaSelections.length)}
                message={
                  analytics?.ctaSelections[0]
                    ? `${analytics.ctaSelections[0].name} · ${analytics.ctaSelections[0].count}`
                    : "No CTA decisions captured yet."
                }
              />
              <BackendPill
                label="Lead triggers"
                ready={Boolean(analytics?.leadTriggers.length)}
                message={
                  analytics?.leadTriggers[0]
                    ? `${analytics.leadTriggers[0].name} · ${analytics.leadTriggers[0].count}`
                    : "No lead triggers captured yet."
                }
              />
              <BackendPill
                label="Close type"
                ready={Boolean(analytics?.closeTypes.length)}
                message={
                  analytics?.closeTypes[0]
                    ? `${analytics.closeTypes[0].name} · ${analytics.closeTypes[0].count}`
                    : "No close types captured yet."
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Common questions</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.commonQuestions.length ? (
                    analytics.commonQuestions.map((item) => (
                      <div key={item.question} className="flex gap-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {item.count}
                        </span>
                        <p className="line-clamp-2 text-sm text-slate-700">{item.question}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No questions captured yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <PackageSearch className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Recommended products</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.recommendedProducts.length ? (
                    analytics.recommendedProducts.map((product) => (
                      <div key={`${product.name}-${product.url}`} className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.count} mention{product.count === 1 ? "" : "s"}
                          {product.price ? ` · ${product.price}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No product recommendations yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Conversion opportunities</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.conversionOpportunityExamples.length ? (
                    analytics.conversionOpportunityExamples.map((item) => (
                      <div key={`${item.createdAt}-${item.question}`}>
                        <p className="line-clamp-2 text-sm text-slate-700">{item.question}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.workflow}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No opportunities captured yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <Target className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Sales playbooks</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.salesPlaybooks.length ? (
                    analytics.salesPlaybooks.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-slate-700">{item.name}</p>
                        <span className="text-xs font-semibold text-slate-500">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No playbooks captured yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Buyer stages</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.buyerStates.length ? (
                    analytics.buyerStates.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-slate-700">{item.name}</p>
                        <span className="text-xs font-semibold text-slate-500">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No buyer stages captured yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Objections</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.objectionTypes.length ? (
                    analytics.objectionTypes.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-slate-700">{item.name}</p>
                        <span className="text-xs font-semibold text-slate-500">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No objections captured yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Bias signals</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.cognitiveBiases.length ? (
                    analytics.cognitiveBiases.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-slate-700">{item.name}</p>
                        <span className="text-xs font-semibold text-slate-500">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No bias signals captured yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Missed answer examples</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.missedAnswerExamples.length ? (
                    analytics.missedAnswerExamples.map((item) => (
                      <div key={`${item.createdAt}-${item.question}`}>
                        <p className="line-clamp-2 text-sm font-medium text-slate-800">
                          {item.question}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {item.answerPreview}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No missed answers yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Recent analytics events</p>
                </div>
                <div className="grid gap-3 p-4">
                  {analytics?.recentEvents.length ? (
                    analytics.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="grid gap-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                      >
                        <p className="line-clamp-2 text-sm text-slate-800">
                          {event.question}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{event.salesWorkflowLabel}</span>
                          <span>{event.ctaLabel || event.ctaSelected || "No CTA"}</span>
                          <span>{event.leadTrigger || "No lead trigger"}</span>
                          <span>{event.responseMs}ms</span>
                          <span>{event.langfuseStatus.replace("_", " ")}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No chat analytics captured yet.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ClientOnboardingPanel adminToken={adminToken} />

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
          <div className="grid gap-6">
            <UploadPanel
              accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain"
              busy={busyUpload === "document"}
              description="PDF, DOC, DOCX, TXT, and Markdown sources."
              kind="document"
              title="Upload docs"
              onSubmit={uploadFile}
            />
            <UploadPanel
              accept=".csv,text/csv"
              busy={busyUpload === "catalog"}
              description="Product catalog, SKU, offer, and URL rows."
              kind="catalog"
              title="Upload product CSV"
              onSubmit={uploadFile}
            />
          </div>

          <Card className="rounded-md border-slate-200 shadow-none">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5" />
                  Uploaded sources
                </CardTitle>
                <CardDescription>
                  {sources.length} total, {completedCount} indexed, {waitingCount} waiting
                  for backend configuration.
                </CardDescription>
              </div>
              {notice ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {notice}
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="hidden grid-cols-[1.5fr_0.7fr_0.7fr_1fr_140px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-slate-500 lg:grid">
                  <span>Source</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span>Ingestion</span>
                  <span className="text-right">Action</span>
                </div>

                {sources.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-slate-500">
                    No sources uploaded yet.
                  </div>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.id}
                      className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 lg:grid-cols-[1.5fr_0.7fr_0.7fr_1fr_140px] lg:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {source.filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(source.size)} · {new Date(source.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-sm capitalize text-slate-700">{source.kind}</p>

                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[source.status]}`}
                      >
                        {statusLabel(source.status)}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">
                          {source.ingestion.message}
                        </p>
                        <p className="text-xs text-slate-500">
                          {source.ingestion.chunkCount} chunks ·{" "}
                          {source.ingestion.collectionName}
                        </p>
                      </div>

                      <Button
                        className="gap-2 lg:justify-self-end"
                        disabled={
                          busyIngestion === source.id || source.status === "processing"
                        }
                        size="sm"
                        variant="outline"
                        onClick={() => void triggerIngestion(source.id)}
                      >
                        {busyIngestion === source.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Ingest
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-md border-slate-200 shadow-none">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Dashboard leads table
              </CardTitle>
              <CardDescription>
                Interested or confused buyers captured by the Shadyy widget.
              </CardDescription>
            </div>
            <Button
              className="gap-2"
              size="sm"
              variant="outline"
              onClick={() => void refreshLeads()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh leads
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1.2fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-slate-500 xl:grid">
                <span>Buyer</span>
                <span>Product/page</span>
                <span>Budget</span>
                <span>Interest</span>
                <span>Summary</span>
                <span>Delivery</span>
              </div>

              {leads.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-slate-500">
                  No leads captured yet.
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 xl:grid-cols-[1fr_1fr_1fr_1fr_1.2fr_1fr] xl:items-start"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {lead.name}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {lead.contact}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(lead.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-700">
                        {lead.productPage || lead.pageTitle || "Page not captured"}
                      </p>
                      {lead.pageUrl ? (
                        <a
                          className="truncate text-xs text-blue-700 underline-offset-2 hover:underline"
                          href={lead.pageUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {lead.pagePath || lead.pageUrl}
                        </a>
                      ) : null}
                    </div>

                    <p className="text-sm text-slate-700">{lead.budget || "Not shared"}</p>

                    <div className="min-w-0">
                      <p className="line-clamp-3 text-sm text-slate-700">
                        {lead.interest || "Not shared"}
                      </p>
                      {lead.objection ? (
                        <p className="mt-2 line-clamp-2 text-xs text-amber-700">
                          Objection: {lead.objection}
                        </p>
                      ) : null}
                    </div>

                    <p className="line-clamp-4 text-sm text-slate-600">
                      {lead.conversationSummary || "No conversation summary captured."}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {lead.delivery.map((attempt) => (
                        <span
                          key={`${lead.id}-${attempt.channel}`}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${deliveryStyles[attempt.status]}`}
                          title={attempt.message}
                        >
                          {attempt.channel.replace("_", " ")}:{" "}
                          {deliveryLabel(attempt.status)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
