export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-12 px-4 md:px-8">
      <div className="container-custom max-w-4xl">
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <h1 className="text-4xl font-bold text-white mb-6">Disclaimer</h1>
          
          <div className="prose prose-invert max-w-none space-y-4 text-slate-300">
            <p className="text-lg">
              Please read this disclaimer carefully before using Nellai IPTV services.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Content Disclaimer</h2>
            <p>
              NELLAI IPTV is a platform that aggregates and provides access to publicly available IPTV streams. We do not host, own, or control any of the content broadcasted through the channels available on our platform. All content is the sole responsibility of the respective channel owners or content providers.

NELLAI IPTV does not assume any responsibility or liability for any copyrighted materials, infringement claims, or legal issues arising from the content streamed by third-party channels. Users and content owners are advised to ensure compliance with applicable copyright laws in their respective jurisdictions.

By using our service, you acknowledge and agree that NELLAI IPTV is not responsible for the legality, accuracy, or nature of the content provided by third-party sources.
            </p>
            
            {/* <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Copyright Notice</h2>
            <p>
              All trademarks, logos, and copyrights belong to their respective owners. If you
              believe any content infringes on your copyright, please contact us immediately at
              our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Age Restriction</h2>
            <p>
              This service is intended for users aged 18 years and above. By using this service,
              you confirm that you are of legal age in your jurisdiction.
            </p> */}
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Service Availability</h2>
            <p>
              We strive to provide uninterrupted service, but we cannot guarantee 100% uptime.
              Channels may be temporarily unavailable due to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Scheduled maintenance</li>
              <li>Technical difficulties</li>
              <li>Third-party stream interruptions</li>
              <li>Network issues</li>
            </ul>
            
            {/* <h2 className="text-2xl font-semibold text-white mt-8 mb-4">External Links</h2>
            <p>
              This service may contain links to external websites. We are not responsible for
              the content, privacy policies, or practices of any third-party sites.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">No Warranty</h2>
            <p>
              The service is provided "as is" and "as available" without any warranties of any kind,
              either express or implied, including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Limitation of Liability</h2>
            <p>
              In no event shall Nellai IPTV be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the service.
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}
