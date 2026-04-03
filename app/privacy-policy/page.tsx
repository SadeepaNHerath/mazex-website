import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HexBackground from "@/components/HexBackground";

export const metadata = {
  title: "Privacy Policy | MazeX",
  description: "Privacy policy and data handling practices for MazeX.",
};

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="site-shell min-h-screen flex flex-col pt-[5rem]">
        <div aria-hidden="true" className="site-background">
          <div className="site-background-glow site-background-glow-primary" />
          <div className="site-background-glow site-background-glow-secondary" />
          <div className="site-background-glow site-background-glow-tertiary" />
          <HexBackground opacity={0.2} />
        </div>
        
        <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 relative z-10 my-10">
          <div className="theme-card p-8 md:p-12 prose prose-invert max-w-none">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">
              Privacy Policy
            </h1>
            
            <p className="text-white/70 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Introduction</h2>
              <p>
                Welcome to MazeX. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Information We Collect</h2>
              <p>
                As part of our operations, particularly concerning our integration with Google OAuth and Google Sheets syncing, we may collect and process the following types of data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                <li><strong>Google Account Data:</strong> When you use our Google OAuth integration to sync data, we may access information associated with your Google account as strictly necessary to facilitate the synchronization to Google Sheets.</li>
              </ul>
            </section>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To register you as a participant or user.</li>
                <li>To manage our relationship with you.</li>
                <li>To enable the core functionality of our service, including syncing necessary application data to Google Sheets via secure integrations.</li>
                <li>To improve our website, products/services, marketing, customer relationships, and experiences.</li>
              </ul>
            </section>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Google OAuth and Data Sharing</h2>
              <p>
                Our web app uses Google OAuth for authentication and authorization to interact with Google Sheets on your behalf.
                <br /><br />
                <strong>Important Note Regarding Google Data:</strong>
                <br />
                Our app&apos;s use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not use Google Workspace APIs to develop, improve, or train generalized AI and/or ML models.</li>
                <li>We only request the minimum necessary scopes required to perform the sync operations to Google Sheets.</li>
                <li>Your data retrieved from Google is stored securely and is only accessed by authorized personnel strictly for the purpose of maintaining the functionality of the service.</li>
              </ul>
            </section>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
              </p>
            </section>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Your Legal Rights</h2>
              <p>
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
              </p>
            </section>

            <section className="mb-8 text-white/80 space-y-4">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us via the contact form on our website or directly through our official channels. 
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
