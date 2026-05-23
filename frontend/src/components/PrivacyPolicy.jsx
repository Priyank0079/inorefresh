import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
          <h1 className="text-xl font-bold text-slate-800">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 prose prose-slate max-w-none">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Privacy Policy</h2>
          <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">1. Information We Collect</h3>
              <p className="text-slate-600 leading-relaxed">
                We collect information you provide directly to us, such as your name, mobile number, email address,
                delivery address, and payment details when you register an account or place an order on Inor Fresh.
                We also collect information automatically when you use our platform, including device information,
                IP address, and usage data.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">2. How We Use Your Information</h3>
              <p className="text-slate-600 leading-relaxed">
                We use the information we collect to process and deliver your orders, send you order confirmations
                and delivery updates via SMS/notifications, improve our services, verify your identity, detect and
                prevent fraud, and communicate with you about promotions and offers (with your consent).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">3. Sharing of Information</h3>
              <p className="text-slate-600 leading-relaxed">
                We do not sell or rent your personal information to third parties. We may share your information
                with delivery partners to fulfil your orders, payment processors to handle transactions securely,
                and service providers who assist us in operating our platform. All such parties are bound by
                confidentiality obligations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">4. Location Data</h3>
              <p className="text-slate-600 leading-relaxed">
                With your permission, we collect and use your device's location to show you nearby products,
                calculate delivery distances, and assign delivery partners. You can disable location access in
                your device settings at any time, though some features may not function properly without it.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">5. Data Security</h3>
              <p className="text-slate-600 leading-relaxed">
                We implement industry-standard security measures to protect your personal information from
                unauthorized access, disclosure, alteration, or destruction. Passwords are never stored in
                plain text. Payment data is processed through secure, PCI-compliant payment gateways.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">6. Data Retention</h3>
              <p className="text-slate-600 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide
                services. You may request deletion of your account and associated data by contacting our support
                team. Certain data may be retained as required by applicable law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">7. Cookies & Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Our platform uses cookies and similar tracking technologies to enhance your experience, remember
                your preferences, and analyse usage patterns. You can control cookie settings through your browser,
                but disabling cookies may affect some functionality.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">8. Your Rights</h3>
              <p className="text-slate-600 leading-relaxed">
                You have the right to access, correct, or delete your personal information at any time. You can
                update your profile information from your account settings. To exercise any other rights or for
                questions about your data, please contact us at support@inorfresh.com.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">9. Changes to This Policy</h3>
              <p className="text-slate-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes
                by posting a notice on the app or sending you a notification. Your continued use of Inor Fresh
                after such changes constitutes your acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">10. Contact Us</h3>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions or concerns about this Privacy Policy, please contact us at:<br />
                <strong>Email:</strong> support@inorfresh.com<br />
                <strong>Address:</strong> Inor Fresh, India
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
