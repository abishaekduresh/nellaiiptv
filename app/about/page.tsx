export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 md:px-8">
      <div className="container-custom max-w-4xl">
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <h1 className="text-4xl font-bold text-white mb-6">About Nellai IPTV</h1>
          
          <div className="prose prose-invert max-w-none space-y-4 text-slate-300">
            <p className="text-lg">
              Welcome to Nellai IPTV, your premier destination for live Tamil television streaming.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Our Mission</h2>
            <p>
              We are dedicated to bringing the best Tamil entertainment, news, and cultural content
              to viewers around the world. Our mission is to preserve and promote Tamil culture through
              accessible, high-quality streaming services.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What We Offer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Live streaming of popular Tamil channels</li>
              <li>High-definition video quality</li>
              <li>24/7 access to your favorite content</li>
              <li>Multi-device support</li>
              <li>Regular content updates</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Our Team</h2>
            <p>
              Nellai IPTV is powered by a dedicated team of technology professionals and content
              curators who are passionate about Tamil culture and entertainment.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
            <p>
              For any queries or support, please visit our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
