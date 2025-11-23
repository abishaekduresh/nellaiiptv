export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 md:px-8">
      <div className="container-custom max-w-4xl">
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none space-y-4 text-slate-300">
            <p className="text-sm text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
            
            <p className="text-lg">
              At Nellai IPTV, we respect your privacy and are committed to protecting your personal information.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Name and contact information</li>
              <li>Account credentials</li>
              <li>Payment information</li>
              <li>Usage data and preferences</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How We Use Your Information</h2>
            <p>We use the collected information for:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Providing and improving our services</li>
              <li>Processing your transactions</li>
              <li>Sending you updates and promotional content</li>
              <li>Responding to your requests and inquiries</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Third-Party Services</h2>
            <p>
              We may use third-party services that collect, monitor, and analyze data to improve
              our service functionality.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of your data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through our{' '}
              <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
