import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HealthCheck = {
  name: string;
  ok: boolean;
  required: boolean;
  message: string;
};

const hasAny = (...keys: string[]) => keys.some((key) => Boolean(process.env[key]));
const hasAll = (...keys: string[]) => keys.every((key) => Boolean(process.env[key]));

const check = (
  name: string,
  ok: boolean,
  required: boolean,
  message: string,
): HealthCheck => ({ name, ok, required, message });

export async function GET() {
  const checks = [
    check(
      "Widget/API/dashboard",
      true,
      true,
      "Next.js runtime is responding.",
    ),
    check(
      "Admin token",
      Boolean(process.env.SHADYY_ADMIN_TOKEN),
      true,
      "SHADYY_ADMIN_TOKEN protects admin APIs.",
    ),
    check(
      "Flowise",
      hasAll("SHADYY_FLOWISE_API_HOST", "SHADYY_FLOWISE_CHATFLOW_ID"),
      true,
      "Set hosted Flowise URL and chatflow ID.",
    ),
    check(
      "Postgres",
      hasAny("POSTGRES_URL", "DATABASE_URL") ||
        hasAll("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"),
      true,
      "Use Supabase/Neon/Postgres connection env for production metadata.",
    ),
    check(
      "Qdrant",
      Boolean(process.env.QDRANT_URL),
      true,
      "Use Qdrant Cloud or a hosted/self-hosted Qdrant URL.",
    ),
    check(
      "Storage",
      hasAny("S3_STORAGE_BUCKET_NAME", "S3_BUCKET", "MINIO_BUCKET"),
      true,
      "Use S3/MinIO bucket env for uploaded source files.",
    ),
    check(
      "OpenAI embeddings",
      Boolean(process.env.OPENAI_API_KEY),
      true,
      "OPENAI_API_KEY is required for document/catalog embeddings.",
    ),
    check(
      "Langfuse",
      hasAll("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"),
      true,
      "Use Langfuse Cloud/self-host keys for trace export.",
    ),
    check(
      "Lead delivery",
      hasAny("SHADYY_LEAD_EMAIL_WEBHOOK_URL", "SHADYY_LEAD_GOOGLE_SHEET_WEBHOOK_URL"),
      false,
      "Email or Google Sheet webhook is optional but recommended.",
    ),
  ];

  const missingRequired = checks.filter((item) => item.required && !item.ok);

  return NextResponse.json(
    {
      ok: missingRequired.length === 0,
      environment: process.env.VERCEL
        ? "vercel"
        : process.env.RAILWAY_ENVIRONMENT
          ? "railway"
          : "node",
      checks,
      message:
        missingRequired.length === 0
          ? "Deployment dependencies are configured."
          : "Some required production dependencies are not configured yet.",
    },
    { status: missingRequired.length === 0 ? 200 : 503 },
  );
}
