import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
          >
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800">Terms & Conditions</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 prose prose-slate max-w-none">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Terms of Service</h2>
          <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">1. Acceptance of Terms</h3>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. 
                In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">2. Service Usage</h3>
              <p className="text-slate-600 leading-relaxed">
                Our platform provides a marketplace for trading and purchasing fresh seafood. Users must ensure that all information provided during registration and transactions is accurate and up-to-date.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">3. Privacy Policy</h3>
              <p className="text-slate-600 leading-relaxed">
                We take your privacy seriously. Any personal information you provide to us is subject to our Privacy Policy. We will not share your personal information with third parties without your explicit consent, except as required by law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">4. Modifications</h3>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these terms at any time. Your continued use of the service following any such modification constitutes your agreement to follow and be bound by the terms as modified.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Terms;
