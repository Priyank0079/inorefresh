import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryHeader from '../components/DeliveryHeader';
import DeliveryBottomNav from '../components/DeliveryBottomNav';
import { getHelpSupport } from '../../../services/api/delivery/deliveryService';

const CONTACT_OPTIONS = [
  { label: 'Call Support', value: '+91 9481214922', icon: 'phone' },
  { label: 'Email Support', value: 'support@inorfresh.com', icon: 'email' },
];

export default function DeliveryHelp() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHelp = async () => {
      try {
        const data = await getHelpSupport();
        setFaqs(data.faqs || []);
      } catch (error) {
        console.error("Failed to load help data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHelp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-neutral-500">Loading help content...</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <DeliveryHeader />
      <div className="px-4 py-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-neutral-900 text-xl font-semibold">Help & Support</h2>
        </div>

        {/* Contact Options */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-4">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-neutral-900 font-semibold">Contact Us</h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {CONTACT_OPTIONS.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  if (option.icon === 'phone') {
                    window.location.href = `tel:${option.value}`;
                  } else {
                    window.location.href = `mailto:${option.value}`;
                  }
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left"
              >
                <div>
                  <p className="text-neutral-900 text-sm font-medium mb-1">{option.label}</p>
                  <p className="text-teal-600 text-xs">{option.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{option.icon === 'phone' ? '📞' : '✉️'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                    <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-neutral-900 font-semibold">Frequently Asked Questions</h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {faqs.map((item, index) => (
              <div key={index} className="p-4">
                <p className="text-neutral-900 text-sm font-medium mb-2">{item.question}</p>
                <p className="text-neutral-500 text-xs leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      <DeliveryBottomNav />
    </div>
  );
}

