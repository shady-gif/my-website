import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type ChatbotSourceKind = "document" | "catalog";
export type ChatbotSourceStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "waiting_for_backend"
  | "failed";

export type ChatbotIngestionStatus = {
  unstructuredStatus: "not_needed" | "not_configured" | "ready" | "completed" | "failed";
  qdrantStatus: "not_configured" | "ready" | "completed" | "failed";
  embeddingStatus: "not_configured" | "ready" | "completed" | "failed";
  chunkCount: number;
  collectionName: string;
  message: string;
  lastRunAt?: string;
};

export type ChatbotSource = {
  id: string;
  tenantId: string;
  kind: ChatbotSourceKind;
  filename: string;
  contentType: string;
  size: number;
  storagePath: string;
  status: ChatbotSourceStatus;
  createdAt: string;
  updatedAt: string;
  ingestion: ChatbotIngestionStatus;
};

export type BackendStatus = {
  unstructured: {
    configured: boolean;
    reachable: boolean;
    url: string;
    message: string;
  };
  qdrant: {
    configured: boolean;
    reachable: boolean;
    url: string;
    collectionName: string;
    message: string;
  };
  embeddings: {
    configured: boolean;
    model: string;
    message: string;
  };
};

type SourcePatch = Partial<
  Omit<ChatbotSource, "id" | "createdAt" | "ingestion"> & {
    ingestion: Partial<ChatbotIngestionStatus>;
  }
>;

export type CatalogProductMetadata = {
  productName: string;
  productUrl: string;
  category: string;
  brand: string;
  size: string;
  availability: string;
  price: string;
  priceAmount?: number;
  description: string;
  offers: string;
};

export type ProductCatalogFilters = {
  category?: string;
  brand?: string;
  size?: string;
  availability?: string;
  productUrl?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type ProductCatalogResult = CatalogProductMetadata & {
  id: string;
  score: number;
  sourceId: string;
  tenantId: string;
  filename: string;
  text: string;
};

type ParsedChunk = {
  text: string;
  metadata?: Partial<CatalogProductMetadata>;
};

type ParsedContent = {
  chunks: ParsedChunk[];
  unstructuredStatus: ChatbotIngestionStatus["unstructuredStatus"];
};

const dataRoot = path.join(process.cwd(), "data", "chatbot-admin");
const filesDir = path.join(dataRoot, "files");
const chunksDir = path.join(dataRoot, "chunks");
const sourcesFile = path.join(dataRoot, "sources.json");

const maxFileSize = 25 * 1024 * 1024;
const qdrantUrl = () => process.env.QDRANT_URL?.replace(/\/$/, "") ?? "";
const qdrantApiKey = () => process.env.QDRANT_API_KEY ?? "";
const unstructuredApiUrl = () => process.env.UNSTRUCTURED_API_URL ?? "";
const unstructuredApiKey = () => process.env.UNSTRUCTURED_API_KEY ?? "";
const embeddingModel = () =>
  process.env.SHADYY_EMBEDDING_MODEL ?? "text-embedding-3-small";

const nowIso = () => new Date().toISOString();

const defaultCollectionName = (tenantId: string) =>
  process.env.QDRANT_COLLECTION_NAME ?? `${tenantId.replace(/[^a-z0-9_-]/gi, "_")}_knowledge`;

const defaultIngestion = (tenantId: string): ChatbotIngestionStatus => ({
  unstructuredStatus: unstructuredApiUrl() ? "ready" : "not_configured",
  qdrantStatus: qdrantUrl() ? "ready" : "not_configured",
  embeddingStatus: process.env.OPENAI_API_KEY ? "ready" : "not_configured",
  chunkCount: 0,
  collectionName: defaultCollectionName(tenantId),
  message: "Uploaded and waiting for ingestion.",
});

const ensureStore = async () => {
  await fs.mkdir(filesDir, { recursive: true });
  await fs.mkdir(chunksDir, { recursive: true });

  try {
    await fs.access(sourcesFile);
  } catch {
    await fs.writeFile(sourcesFile, "[]", "utf8");
  }
};

const sanitizeFilename = (filename: string) =>
  filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "upload";

const readSources = async (): Promise<ChatbotSource[]> => {
  await ensureStore();
  const raw = await fs.readFile(sourcesFile, "utf8");
  return JSON.parse(raw) as ChatbotSource[];
};

const writeSources = async (sources: ChatbotSource[]) => {
  await ensureStore();
  await fs.writeFile(sourcesFile, JSON.stringify(sources, null, 2), "utf8");
};

const extensionFor = (filename: string) => path.extname(filename).toLowerCase();

const isSupportedDocument = (filename: string, contentType: string) => {
  const ext = extensionFor(filename);
  return (
    [".pdf", ".doc", ".docx", ".txt", ".md"].includes(ext) ||
    ["application/pdf", "text/plain", "text/markdown"].includes(contentType)
  );
};

const isSupportedCatalog = (filename: string, contentType: string) => {
  const ext = extensionFor(filename);
  return ext === ".csv" || contentType.includes("csv") || contentType === "text/plain";
};

const splitText = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: ParsedChunk[] = [];
  const size = 1200;
  const overlap = 150;

  for (let index = 0; index < normalized.length; index += size - overlap) {
    chunks.push({ text: normalized.slice(index, index + size) });
  }

  return chunks;
};

const parseCsvRows = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
};

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeFilterValue = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const findField = (
  row: string[],
  headers: string[],
  aliases: string[],
) => {
  const normalizedAliases = aliases.map(normalizeKey);
  const index = headers.findIndex((header) =>
    normalizedAliases.includes(normalizeKey(header)),
  );
  return index >= 0 ? row[index]?.trim() ?? "" : "";
};

const parsePriceAmount = (value: string) => {
  const match = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
};

const catalogMetadataFromRow = (
  row: string[],
  headers: string[],
): CatalogProductMetadata => {
  const productName =
    findField(row, headers, ["product name", "product_name", "name", "title", "product", "sku name"]) ||
    row[0] ||
    "";
  const productUrl = findField(row, headers, [
    "product url",
    "product_url",
    "url",
    "link",
    "product link",
    "page url",
  ]);
  const category = findField(row, headers, ["category", "type", "department", "collection"]);
  const brand = findField(row, headers, ["brand", "manufacturer", "vendor"]);
  const size = findField(row, headers, ["size", "sizes", "variant size", "variant"]);
  const availability = findField(row, headers, [
    "availability",
    "stock",
    "in stock",
    "inventory",
    "status",
  ]);
  const price = findField(row, headers, ["price", "sale price", "mrp", "amount"]);
  const description = findField(row, headers, [
    "description",
    "details",
    "product description",
    "short description",
  ]);
  const offers = findField(row, headers, ["offers", "offer", "discount", "promotion", "deal"]);

  return {
    productName,
    productUrl,
    category,
    brand,
    size,
    availability,
    price,
    priceAmount: parsePriceAmount(price),
    description,
    offers,
  };
};

const parseCatalog = async (source: ChatbotSource) => {
  const raw = await fs.readFile(source.storagePath, "utf8");
  const rows = parseCsvRows(raw);
  const headers = rows.shift()?.map((header) => header || "field") ?? [];

  return rows
    .map((row, index) => {
      const metadata = catalogMetadataFromRow(row, headers);
      const fields = headers.map((header, fieldIndex) => {
        const value = row[fieldIndex];
        return value ? `${header}: ${value}` : "";
      });

      return {
        text: [
          `Catalog item ${index + 1}`,
          metadata.productName ? `Product name: ${metadata.productName}` : "",
          metadata.productUrl ? `Product URL: ${metadata.productUrl}` : "",
          metadata.category ? `Category: ${metadata.category}` : "",
          metadata.brand ? `Brand: ${metadata.brand}` : "",
          metadata.size ? `Size: ${metadata.size}` : "",
          metadata.availability ? `Availability: ${metadata.availability}` : "",
          metadata.price ? `Price: ${metadata.price}` : "",
          metadata.offers ? `Offers: ${metadata.offers}` : "",
          metadata.description ? `Description: ${metadata.description}` : "",
          ...fields.filter(Boolean),
        ]
          .filter(Boolean)
          .join("\n"),
        metadata,
      };
    })
    .filter((chunk) => chunk.text);
};

const parseWithUnstructured = async (source: ChatbotSource) => {
  const url = unstructuredApiUrl();
  if (!url) {
    return {
      chunks: [],
      unstructuredStatus: "not_configured" as const,
    };
  }

  const fileBuffer = await fs.readFile(source.storagePath);
  const body = new FormData();
  body.append(
    "files",
    new Blob([new Uint8Array(fileBuffer)], {
      type: source.contentType || "application/octet-stream",
    }),
    source.filename,
  );

  const headers: Record<string, string> = {};
  const apiKey = unstructuredApiKey();
  if (apiKey) headers["unstructured-api-key"] = apiKey;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Unstructured request failed with ${response.status}`);
  }

  const elements = (await response.json()) as Array<Record<string, unknown>>;
  const text = elements
    .map((element) => String(element.text ?? ""))
    .filter(Boolean)
    .join("\n\n");

  return {
    chunks: splitText(text),
    unstructuredStatus: "completed" as const,
  };
};

const parseSourceContent = async (source: ChatbotSource): Promise<ParsedContent> => {
  if (source.kind === "catalog") {
    return {
      chunks: await parseCatalog(source),
      unstructuredStatus: "not_needed",
    };
  }

  const ext = extensionFor(source.filename);
  if ([".txt", ".md"].includes(ext) || source.contentType.startsWith("text/")) {
    return {
      chunks: splitText(await fs.readFile(source.storagePath, "utf8")),
      unstructuredStatus: "not_needed",
    };
  }

  return parseWithUnstructured(source);
};

const embedChunks = async (chunks: string[]) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: embeddingModel(),
      input: chunks,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };

  return data.data?.map((item) => item.embedding) ?? [];
};

const qdrantHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = qdrantApiKey();
  if (apiKey) headers["api-key"] = apiKey;
  return headers;
};

const ensureQdrantCollection = async (collectionName: string, vectorSize: number) => {
  const baseUrl = qdrantUrl();
  if (!baseUrl) return false;

  const collectionUrl = `${baseUrl}/collections/${encodeURIComponent(collectionName)}`;
  const existing = await fetch(collectionUrl, {
    headers: qdrantHeaders(),
  });

  if (existing.ok) return true;

  const created = await fetch(collectionUrl, {
    method: "PUT",
    headers: qdrantHeaders(),
    body: JSON.stringify({
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    }),
  });

  if (!created.ok) {
    throw new Error(`Qdrant collection request failed with ${created.status}`);
  }

  return true;
};

const upsertQdrantChunks = async (
  source: ChatbotSource,
  chunks: ParsedChunk[],
  vectors: number[][],
) => {
  const baseUrl = qdrantUrl();
  if (!baseUrl || vectors.length === 0) return false;

  const collectionName = source.ingestion.collectionName || defaultCollectionName(source.tenantId);
  await ensureQdrantCollection(collectionName, vectors[0].length);

  const points = chunks.map((chunk, index) => ({
    id: crypto
      .createHash("sha1")
      .update(`${source.id}:${index}`)
      .digest("hex"),
    vector: vectors[index],
    payload: {
      sourceId: source.id,
      tenantId: source.tenantId,
      kind: source.kind,
      filename: source.filename,
      chunkIndex: index,
      text: chunk.text,
      productName: chunk.metadata?.productName ?? "",
      productUrl: chunk.metadata?.productUrl ?? "",
      category: chunk.metadata?.category ?? "",
      categoryFilter: normalizeFilterValue(chunk.metadata?.category ?? ""),
      brand: chunk.metadata?.brand ?? "",
      brandFilter: normalizeFilterValue(chunk.metadata?.brand ?? ""),
      size: chunk.metadata?.size ?? "",
      sizeFilter: normalizeFilterValue(chunk.metadata?.size ?? ""),
      availability: chunk.metadata?.availability ?? "",
      availabilityFilter: normalizeFilterValue(chunk.metadata?.availability ?? ""),
      price: chunk.metadata?.price ?? "",
      priceAmount: chunk.metadata?.priceAmount,
      description: chunk.metadata?.description ?? "",
      offers: chunk.metadata?.offers ?? "",
    },
  }));

  const response = await fetch(
    `${baseUrl}/collections/${encodeURIComponent(collectionName)}/points?wait=true`,
    {
      method: "PUT",
      headers: qdrantHeaders(),
      body: JSON.stringify({ points }),
    },
  );

  if (!response.ok) {
    throw new Error(`Qdrant upsert failed with ${response.status}`);
  }

  return true;
};

const buildQdrantFilter = (tenantId: string, filters: ProductCatalogFilters = {}) => {
  const must: Array<Record<string, unknown>> = [
    { key: "tenantId", match: { value: tenantId } },
    { key: "kind", match: { value: "catalog" } },
  ];

  if (filters.category) {
    must.push({
      key: "categoryFilter",
      match: { value: normalizeFilterValue(filters.category) },
    });
  }

  if (filters.brand) {
    must.push({
      key: "brandFilter",
      match: { value: normalizeFilterValue(filters.brand) },
    });
  }

  if (filters.size) {
    must.push({
      key: "sizeFilter",
      match: { value: normalizeFilterValue(filters.size) },
    });
  }

  if (filters.availability) {
    must.push({
      key: "availabilityFilter",
      match: { value: normalizeFilterValue(filters.availability) },
    });
  }

  if (filters.productUrl) {
    must.push({
      key: "productUrl",
      match: { value: filters.productUrl },
    });
  }

  if (typeof filters.minPrice === "number" || typeof filters.maxPrice === "number") {
    must.push({
      key: "priceAmount",
      range: {
        gte: filters.minPrice,
        lte: filters.maxPrice,
      },
    });
  }

  return { must };
};

const asCatalogResult = (
  item: Record<string, unknown>,
): ProductCatalogResult => {
  const payload = (item.payload ?? {}) as Record<string, unknown>;
  const score =
    typeof item.score === "number"
      ? item.score
      : typeof item.version === "number"
        ? item.version
        : 0;

  return {
    id: String(item.id ?? ""),
    score,
    sourceId: String(payload.sourceId ?? ""),
    tenantId: String(payload.tenantId ?? ""),
    filename: String(payload.filename ?? ""),
    text: String(payload.text ?? ""),
    productName: String(payload.productName ?? ""),
    productUrl: String(payload.productUrl ?? ""),
    category: String(payload.category ?? ""),
    brand: String(payload.brand ?? ""),
    size: String(payload.size ?? ""),
    availability: String(payload.availability ?? ""),
    price: String(payload.price ?? ""),
    priceAmount:
      typeof payload.priceAmount === "number" ? payload.priceAmount : undefined,
    description: String(payload.description ?? ""),
    offers: String(payload.offers ?? ""),
  };
};

export const searchProductCatalog = async ({
  tenantId,
  query,
  filters = {},
  limit = 5,
}: {
  tenantId: string;
  query: string;
  filters?: ProductCatalogFilters;
  limit?: number;
}) => {
  const baseUrl = qdrantUrl();
  if (!baseUrl || !process.env.OPENAI_API_KEY || !query.trim()) {
    return {
      ok: false,
      message:
        "Catalog retrieval needs QDRANT_URL, OPENAI_API_KEY, and a search query.",
      products: [] as ProductCatalogResult[],
    };
  }

  const [vector] = (await embedChunks([query])) ?? [];
  if (!vector) {
    return {
      ok: false,
      message: "Could not create a query embedding for catalog retrieval.",
      products: [] as ProductCatalogResult[],
    };
  }

  const collectionName = defaultCollectionName(tenantId);
  const response = await fetch(
    `${baseUrl}/collections/${encodeURIComponent(collectionName)}/points/search`,
    {
      method: "POST",
      headers: qdrantHeaders(),
      body: JSON.stringify({
        vector,
        filter: buildQdrantFilter(tenantId, filters),
        limit,
        with_payload: true,
        with_vector: false,
      }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      message: `Qdrant catalog search failed with ${response.status}.`,
      products: [] as ProductCatalogResult[],
    };
  }

  const data = (await response.json()) as {
    result?: Array<Record<string, unknown>>;
  };

  return {
    ok: true,
    message: "Catalog retrieval completed.",
    products: (data.result ?? []).map(asCatalogResult),
  };
};

export const listChatbotSources = async (tenantId?: string) => {
  const sources = await readSources();
  return tenantId
    ? sources.filter((source) => source.tenantId === tenantId)
    : sources;
};

export const getChatbotSource = async (sourceId: string) => {
  const sources = await readSources();
  return sources.find((source) => source.id === sourceId) ?? null;
};

export const updateChatbotSource = async (sourceId: string, patch: SourcePatch) => {
  const sources = await readSources();
  const index = sources.findIndex((source) => source.id === sourceId);

  if (index === -1) return null;

  const current = sources[index];
  const next: ChatbotSource = {
    ...current,
    ...patch,
    ingestion: {
      ...current.ingestion,
      ...patch.ingestion,
    },
    updatedAt: nowIso(),
  };

  sources[index] = next;
  await writeSources(sources);
  return next;
};

export const createChatbotSource = async ({
  tenantId,
  kind,
  file,
}: {
  tenantId: string;
  kind: ChatbotSourceKind;
  file: File;
}) => {
  const filename = sanitizeFilename(file.name);
  const contentType = file.type || "application/octet-stream";

  if (file.size > maxFileSize) {
    throw new Error("File is larger than the 25MB MVP upload limit.");
  }

  if (kind === "document" && !isSupportedDocument(filename, contentType)) {
    throw new Error("Upload a PDF, DOC, DOCX, TXT, or Markdown document.");
  }

  if (kind === "catalog" && !isSupportedCatalog(filename, contentType)) {
    throw new Error("Upload a CSV product/SKU file.");
  }

  await ensureStore();

  const id = crypto.randomUUID();
  const storedName = `${id}-${filename}`;
  const storagePath = path.join(filesDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, buffer);

  const source: ChatbotSource = {
    id,
    tenantId: tenantId || "shadyy",
    kind,
    filename,
    contentType,
    size: file.size,
    storagePath,
    status: "uploaded",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ingestion: defaultIngestion(tenantId || "shadyy"),
  };

  const sources = await readSources();
  sources.unshift(source);
  await writeSources(sources);
  return source;
};

export const ingestChatbotSource = async (sourceId: string) => {
  const source = await updateChatbotSource(sourceId, {
    status: "processing",
    ingestion: {
      message: "Parsing upload and preparing searchable chunks.",
      lastRunAt: nowIso(),
    },
  });

  if (!source) return null;

  try {
    const parsed = await parseSourceContent(source);
    const collectionName = source.ingestion.collectionName || defaultCollectionName(source.tenantId);

    await fs.writeFile(
      path.join(chunksDir, `${source.id}.json`),
      JSON.stringify(
        parsed.chunks.map((chunk, index) => ({
          sourceId: source.id,
          tenantId: source.tenantId,
          kind: source.kind,
          filename: source.filename,
          chunkIndex: index,
          text: chunk.text,
          metadata: chunk.metadata ?? {},
        })),
        null,
        2,
      ),
      "utf8",
    );

    const vectors = await embedChunks(parsed.chunks.map((chunk) => chunk.text));
    const qdrantCompleted =
      vectors && vectors.length > 0
        ? await upsertQdrantChunks(source, parsed.chunks, vectors)
        : false;

    const waitingReasons = [
      parsed.unstructuredStatus === "not_configured"
        ? "configure UNSTRUCTURED_API_URL for PDF/DOC parsing"
        : "",
      !process.env.OPENAI_API_KEY ? "configure OPENAI_API_KEY for embeddings" : "",
      !qdrantUrl() ? "configure QDRANT_URL for searchable indexing" : "",
    ].filter(Boolean);

    if (waitingReasons.length > 0) {
      return updateChatbotSource(source.id, {
        status: "waiting_for_backend",
        ingestion: {
          unstructuredStatus: parsed.unstructuredStatus,
          qdrantStatus: qdrantUrl() ? "ready" : "not_configured",
          embeddingStatus: process.env.OPENAI_API_KEY ? "ready" : "not_configured",
          chunkCount: parsed.chunks.length,
          collectionName,
          message: `Chunks are saved locally. To complete searchable ingestion, ${waitingReasons.join(", ")}.`,
          lastRunAt: nowIso(),
        },
      });
    }

    return updateChatbotSource(source.id, {
      status: "completed",
      ingestion: {
        unstructuredStatus: parsed.unstructuredStatus,
        qdrantStatus: qdrantCompleted ? "completed" : "failed",
        embeddingStatus: vectors ? "completed" : "failed",
        chunkCount: parsed.chunks.length,
        collectionName,
        message: `Ingested ${parsed.chunks.length} chunks into Qdrant.`,
        lastRunAt: nowIso(),
      },
    });
  } catch (error) {
    return updateChatbotSource(source.id, {
      status: "failed",
      ingestion: {
        message: error instanceof Error ? error.message : "Ingestion failed.",
        lastRunAt: nowIso(),
      },
    });
  }
};

export const getBackendStatus = async (): Promise<BackendStatus> => {
  const unstructuredUrl = unstructuredApiUrl();
  const qdrantBaseUrl = qdrantUrl();
  const collectionName = defaultCollectionName("shadyy");

  const [unstructuredReachable, qdrantReachable] = await Promise.all([
    unstructuredUrl
      ? fetch(unstructuredUrl, { method: "OPTIONS" })
          .then((response) => response.ok || response.status < 500)
          .catch(() => false)
      : Promise.resolve(false),
    qdrantBaseUrl
      ? fetch(`${qdrantBaseUrl}/collections`, { headers: qdrantHeaders() })
          .then((response) => response.ok)
          .catch(() => false)
      : Promise.resolve(false),
  ]);

  return {
    unstructured: {
      configured: Boolean(unstructuredUrl),
      reachable: unstructuredReachable,
      url: unstructuredUrl,
      message: unstructuredUrl
        ? unstructuredReachable
          ? "Unstructured is reachable."
          : "Unstructured URL is configured but not reachable."
        : "Set UNSTRUCTURED_API_URL for PDF/DOC parsing.",
    },
    qdrant: {
      configured: Boolean(qdrantBaseUrl),
      reachable: qdrantReachable,
      url: qdrantBaseUrl,
      collectionName,
      message: qdrantBaseUrl
        ? qdrantReachable
          ? "Qdrant is reachable."
          : "Qdrant URL is configured but not reachable."
        : "Set QDRANT_URL for searchable indexing.",
    },
    embeddings: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: embeddingModel(),
      message: process.env.OPENAI_API_KEY
        ? "Embedding key is configured."
        : "Set OPENAI_API_KEY for vector embeddings.",
    },
  };
};
