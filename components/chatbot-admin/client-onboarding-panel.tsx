"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Code2,
  Globe2,
  Loader2,
  MonitorCheck,
  Palette,
  TestTube2,
  Upload,
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
import type {
  ClientOnboardingSummary,
  OnboardingScenario,
  OnboardingScenarioStatus,
} from "@/lib/chatbot-admin/onboarding";

type OnboardingResponse = {
  ok: boolean;
  clients?: ClientOnboardingSummary[];
  client?: ClientOnboardingSummary;
  message?: string;
};

type ClientFormState = {
  tenantId: string;
  businessName: string;
  domains: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  launcherText: string;
  logoUrl: string;
  starterPrompts: string;
  productTitle: string;
  price: string;
  category: string;
  searchInput: string;
  productCards: string;
  addToCart: string;
  customActions: string;
  flowiseApiHost: string;
  flowiseChatflowId: string;
};

const emptyForm: ClientFormState = {
  tenantId: "",
  businessName: "",
  domains: "",
  brandName: "",
  primaryColor: "#f97316",
  accentColor: "#ffffff",
  launcherText: "☺",
  logoUrl: "",
  starterPrompts:
    "What can I do on this page?\nWhich option should I choose?\nRequest a callback",
  productTitle: "[data-product-title]\nh1",
  price: "[data-product-price]\n[itemprop='price']\n.price",
  category: "[data-category]\n[aria-label='breadcrumb']\n.breadcrumb",
  searchInput: "input[type='search']\ninput[name='q']\ninput[name='search']",
  productCards: "[data-product-card]\n.product-card",
  addToCart: "[data-add-to-cart]\nbutton[name='add']\nbutton\na[href]",
  customActions: "[data-shadyy-action='true']",
  flowiseApiHost: "http://localhost:3002",
  flowiseChatflowId: "",
};

const lines = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinLines = (value: string[] | undefined) => (value ?? []).join("\n");

const statusStyles: Record<OnboardingScenarioStatus, string> = {
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

function OnboardingTextarea({
  id,
  label,
  value,
  rows = 3,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className="min-h-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-400"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ClientOnboardingPanel({ adminToken }: { adminToken: string }) {
  const [clients, setClients] = useState<ClientOnboardingSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [form, setForm] = useState<ClientFormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedClient = useMemo(
    () => clients.find((client) => client.tenantId === selectedTenantId) ?? null,
    [clients, selectedTenantId],
  );

  const adminFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (adminToken) headers.set("X-Shadyy-Admin-Token", adminToken);

    return fetch(input, { ...init, headers });
  };

  const refreshClients = async () => {
    if (!adminToken) return;

    const response = await adminFetch("/api/chatbot-admin/onboarding");
    const data = (await response.json()) as OnboardingResponse;
    if (!data.ok) throw new Error(data.message ?? "Could not load onboarding clients.");
    setClients(data.clients ?? []);
    if (!selectedTenantId && data.clients?.[0]) setSelectedTenantId(data.clients[0].tenantId);
  };

  useEffect(() => {
    void refreshClients().catch((error) => {
      setNotice(error instanceof Error ? error.message : "Could not load onboarding.");
    });
  }, [adminToken]);

  useEffect(() => {
    if (!selectedClient) return;

    setForm({
      tenantId: selectedClient.tenantId,
      businessName: selectedClient.businessName,
      domains: joinLines(selectedClient.domains),
      brandName: selectedClient.brandName,
      primaryColor: selectedClient.primaryColor,
      accentColor: selectedClient.accentColor,
      launcherText: selectedClient.launcherText,
      logoUrl: selectedClient.logoUrl,
      starterPrompts: joinLines(selectedClient.starterPrompts),
      productTitle: joinLines(selectedClient.selectors.productTitle),
      price: joinLines(selectedClient.selectors.price),
      category: joinLines(selectedClient.selectors.category),
      searchInput: joinLines(selectedClient.selectors.searchInput),
      productCards: joinLines(selectedClient.selectors.productCards),
      addToCart: joinLines(selectedClient.selectors.addToCart),
      customActions: joinLines(selectedClient.selectors.customActions),
      flowiseApiHost: selectedClient.flowiseApiHost,
      flowiseChatflowId: selectedClient.flowiseChatflowId,
    });
  }, [selectedClient]);

  const updateForm = (key: keyof ClientFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const payloadFromForm = (scenarios?: OnboardingScenario[]) => ({
    tenantId: form.tenantId,
    businessName: form.businessName,
    domains: lines(form.domains),
    brandName: form.brandName,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    launcherText: form.launcherText,
    logoUrl: form.logoUrl,
    starterPrompts: lines(form.starterPrompts),
    selectors: {
      productTitle: lines(form.productTitle),
      price: lines(form.price),
      category: lines(form.category),
      searchInput: lines(form.searchInput),
      productCards: lines(form.productCards),
      addToCart: lines(form.addToCart),
      customActions: lines(form.customActions),
    },
    searchParams: ["q", "query", "search", "keyword"],
    docsCatalogCollectionId: `${form.tenantId || form.businessName}_knowledge`,
    flowiseApiHost: form.flowiseApiHost,
    flowiseChatflowId: form.flowiseChatflowId,
    scenarios,
  });

  const saveClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToken) {
      setNotice("Unlock admin access first.");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const response = await adminFetch("/api/chatbot-admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm(selectedClient?.scenarios)),
      });
      const data = (await response.json()) as OnboardingResponse;
      if (!data.ok) throw new Error(data.message ?? "Could not save client.");
      setSelectedTenantId(data.client?.tenantId ?? form.tenantId);
      setNotice("Client onboarding record saved.");
      await refreshClients();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save client.");
    } finally {
      setBusy(false);
    }
  };

  const updateScenario = async (
    scenarioId: string,
    status: OnboardingScenarioStatus,
  ) => {
    if (!selectedClient) return;
    const scenarios = selectedClient.scenarios.map((scenario) =>
      scenario.id === scenarioId ? { ...scenario, status } : scenario,
    );

    setBusy(true);
    setNotice("");

    try {
      const response = await adminFetch("/api/chatbot-admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm(scenarios)),
      });
      const data = (await response.json()) as OnboardingResponse;
      if (!data.ok) throw new Error(data.message ?? "Could not update scenario.");
      setNotice("Scenario status updated.");
      await refreshClients();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update scenario.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Client onboarding process
          </CardTitle>
          <CardDescription>
            Create tenants, configure domains/selectors/branding, test 10 real scenarios, generate the script tag, and monitor first conversations.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {clients.map((client) => (
            <Button
              key={client.tenantId}
              size="sm"
              type="button"
              variant={client.tenantId === selectedTenantId ? "default" : "outline"}
              onClick={() => setSelectedTenantId(client.tenantId)}
            >
              {client.brandName}
            </Button>
          ))}
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedTenantId("");
              setForm(emptyForm);
            }}
          >
            New client
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {notice ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {notice}
          </div>
        ) : null}

        <form className="grid gap-5" onSubmit={saveClient}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="tenant-id">Tenant ID</Label>
              <Input
                id="tenant-id"
                value={form.tenantId}
                onChange={(event) => updateForm("tenantId", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                value={form.businessName}
                onChange={(event) => updateForm("businessName", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand-name">Widget brand name</Label>
              <Input
                id="brand-name"
                value={form.brandName}
                onChange={(event) => updateForm("brandName", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <OnboardingTextarea
              id="domains"
              label="Allowed domains"
              value={form.domains}
              onChange={(value) => updateForm("domains", value)}
            />
            <OnboardingTextarea
              id="starter-prompts"
              label="Starter prompts"
              value={form.starterPrompts}
              onChange={(value) => updateForm("starterPrompts", value)}
            />
            <OnboardingTextarea
              id="product-title-selector"
              label="Product title selectors"
              value={form.productTitle}
              onChange={(value) => updateForm("productTitle", value)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="primary-color">Primary color</Label>
              <Input
                id="primary-color"
                type="color"
                value={form.primaryColor}
                onChange={(event) => updateForm("primaryColor", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accent-color">Accent color</Label>
              <Input
                id="accent-color"
                type="color"
                value={form.accentColor}
                onChange={(event) => updateForm("accentColor", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="launcher-text">Launcher text</Label>
              <Input
                id="launcher-text"
                maxLength={4}
                value={form.launcherText}
                onChange={(event) => updateForm("launcherText", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={form.logoUrl}
                onChange={(event) => updateForm("logoUrl", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <OnboardingTextarea
              id="price-selector"
              label="Price selectors"
              value={form.price}
              onChange={(value) => updateForm("price", value)}
            />
            <OnboardingTextarea
              id="product-card-selector"
              label="Product card selectors"
              value={form.productCards}
              onChange={(value) => updateForm("productCards", value)}
            />
            <OnboardingTextarea
              id="custom-action-selector"
              label="CTA/action selectors"
              value={form.customActions}
              onChange={(value) => updateForm("customActions", value)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="flowise-api-host">Flowise API host</Label>
              <Input
                id="flowise-api-host"
                value={form.flowiseApiHost}
                onChange={(event) => updateForm("flowiseApiHost", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="flowise-chatflow-id">Flowise chatflow ID</Label>
              <Input
                id="flowise-chatflow-id"
                value={form.flowiseChatflowId}
                onChange={(event) => updateForm("flowiseChatflowId", event.target.value)}
              />
            </div>
          </div>

          <Button className="w-fit gap-2" disabled={busy || !adminToken} type="submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
            Save client onboarding
          </Button>
        </form>

        {selectedClient ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Globe2 className="h-4 w-4" />
                  Domains
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedClient.domains.length}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Upload className="h-4 w-4" />
                  Sources
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedClient.completedSourceCount}/{selectedClient.sourceCount}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <TestTube2 className="h-4 w-4" />
                  Scenarios
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedClient.passedScenarioCount}/10
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <MonitorCheck className="h-4 w-4" />
                  First chats
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {selectedClient.monitorStatus}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedClient.leadCount} leads, {selectedClient.missedAnswers} missed answers
                </p>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Code2 className="h-4 w-4" />
                Script tag
              </p>
              <code className="mt-3 block overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-slate-100">
                {selectedClient.scriptTag}
              </code>
            </div>

            <div className="rounded-md border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <CheckCircle2 className="h-4 w-4" />
                  10 real scenario tests
                </p>
              </div>
              <div className="grid gap-0">
                {selectedClient.scenarios.map((scenario, index) => (
                  <div
                    key={scenario.id}
                    className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 xl:grid-cols-[34px_1fr_220px]"
                  >
                    <div className="text-sm font-semibold text-slate-400">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        {scenario.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{scenario.prompt}</p>
                      <p className="mt-1 text-xs text-slate-500">{scenario.expected}</p>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 xl:justify-end">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[scenario.status]}`}
                      >
                        {scenario.status}
                      </span>
                      {(["pending", "passed", "failed"] as OnboardingScenarioStatus[]).map(
                        (status) => (
                          <Button
                            key={status}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => void updateScenario(scenario.id, status)}
                          >
                            {status}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
