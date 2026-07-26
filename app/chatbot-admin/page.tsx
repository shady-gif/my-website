import { CompanyDocsDashboard } from "@/components/chatbot-admin/company-docs-dashboard";

export const metadata = {
  title: "Chatbot Admin | Shadyy",
  description: "Upload company docs and product catalogs for Shadyy chatbot ingestion.",
};

export default function ChatbotAdminPage() {
  return <CompanyDocsDashboard />;
}
