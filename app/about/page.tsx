export const metadata = {
    title: "About",
    description: "Learn more about Shadyy.",
  };
  
  export default function AboutPage() {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold">About Shadyy</h1>
  
          <p className="mb-4">
            Shadyy is a platform focused on making AI-powered tools simple,
            useful, and accessible for everyone.
          </p>
  
          <p className="mb-4">
            We build creative AI experiences, automation tools, and digital
            products designed to help users save time, improve productivity, and
            explore new ideas.
          </p>
  
          <p>
            Our goal is to keep improving Shadyy with practical tools, helpful
            features, and a user-friendly experience.
          </p>
        </div>
      </main>
    );
  }