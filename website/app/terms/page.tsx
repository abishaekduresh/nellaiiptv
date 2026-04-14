export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-12 px-4 md:px-8">
      <div className="container-custom max-w-4xl">
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none space-y-4 text-slate-300">
            <p className="text-sm text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
            
            <p className="text-lg">
              Please read these Terms of Service carefully before using Nellai IPTV.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this service, you accept and agree to be bound by the terms
              and conditions of this agreement.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the content on Nellai IPTV for personal,
              non-commercial viewing only.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Restrictions</h2>
            <p>You are specifically restricted from:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Republishing, selling, or sublicensing our content</li>
              <li>Using the service in any way that is unlawful</li>
              <li>Engaging in any data mining or similar activities</li>
              <li>Using the service to engage in advertising or marketing</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Content Disclaimer</h2>
            <p>
              All content is provided by third-party sources. We do not guarantee the accuracy,
              completeness, or availability of any content.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              Nellai IPTV shall not be held liable for any indirect, consequential, or incidental
              damages arising from your use of the service.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at any time without prior
              notice for conduct that we believe violates these Terms of Service.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service
              after changes constitutes acceptance of the new terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
