export const metadata = {
    title: "Contact",
    description: "Contact Shadyy.",
  };
  
  export default function ContactPage() {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold">Contact Us</h1>
  
          <p className="mb-4">
            Have questions, feedback, support requests, or partnership inquiries?
            You can contact us by email.
          </p>
  
          <p className="text-lg font-medium">
            Email: support@shaddy.org
          </p>
  
          <p className="mt-6">
            We aim to respond within a reasonable timeframe.
          </p>
        </div>
      </main>
    );
  }