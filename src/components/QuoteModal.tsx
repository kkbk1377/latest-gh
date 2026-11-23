import { CheckCircle2, Loader2, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';

export function QuoteModal() {
  const { settings, quoteOpen, quotePrefill, closeQuoteModal } = useBusiness();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<'Andhra Pradesh' | 'Telangana' | 'Other'>('Telangana');
  const [cameraCount, setCameraCount] = useState('4 – 8 Cameras');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  useEffect(() => {
    if (quoteOpen) {
      setError(null);
      setConfirmedId(null);
      if (quotePrefill.cameraCount) {
        setCameraCount(quotePrefill.cameraCount);
      }
      if (quotePrefill.message) {
        setMessage(quotePrefill.message);
      } else if (quotePrefill.productRef) {
        setMessage(
          `Interested in ${quotePrefill.productRef}. Please share pricing and installation timeline.`,
        );
      } else if (quotePrefill.serviceRef) {
        setMessage(`Requesting ${quotePrefill.serviceRef} at our location.`);
      } else {
        setMessage('');
      }
    }
  }, [quoteOpen, quotePrefill]);

  if (!quoteOpen) return null;

  const subject = quotePrefill.subject || 'CCTV Quotation & Site Survey Request';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitEnquiry({
        type: quotePrefill.message
          ? 'planner'
          : quotePrefill.productRef
            ? 'product'
            : quotePrefill.serviceRef
              ? 'service'
              : 'quote',
        name,
        phone,
        email,
        city,
        state,
        subject,
        productRef: quotePrefill.productRef,
        serviceRef: quotePrefill.serviceRef,
        cameraCount,
        message,
      });
      setConfirmedId(res.enquiry.id);
      setName('');
      setPhone('');
      setEmail('');
      setCity('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappQuickUrl = formatWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.businessName}, I need a quotation for: ${subject}.`,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061022]/70 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#9E7216] mb-1">
              Andhra Pradesh &amp; Telangana Quotation Desk
            </p>
            <h2
              id="quote-modal-title"
              className="font-display font-bold text-xl text-[#0B1B36]"
            >
              Request a CCTV Quotation
            </h2>
          </div>
          <button
            type="button"
            onClick={closeQuoteModal}
            aria-label="Close quotation dialog"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#0B1B36] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {confirmedId ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-[#0B1B36] mb-1">
                Quotation Request Recorded
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Reference ID:{' '}
                <span className="font-mono font-semibold text-[#0B1B36]">{confirmedId}</span>
              </p>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                Save your Reference ID to track progress live anytime. Our team will contact you
                shortly.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={whatsappQuickUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#DFB85A]" />
                  <span>Continue on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={closeQuoteModal}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#0B1B36] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {(quotePrefill.productRef || quotePrefill.serviceRef) && (
                <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-semibold text-[#0B1B36]">Selected Reference: </span>
                  {quotePrefill.productRef || quotePrefill.serviceRef}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="q-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="q-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                  />
                </div>
                <div>
                  <label htmlFor="q-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    id="q-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="q-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    City / Town *
                  </label>
                  <input
                    id="q-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad, Vijayawada, Vizag"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                  />
                </div>
                <div>
                  <label htmlFor="q-state" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State *
                  </label>
                  <select
                    id="q-state"
                    value={state}
                    onChange={(e) =>
                      setState(e.target.value as 'Andhra Pradesh' | 'Telangana' | 'Other')
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                  >
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="q-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    id="q-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                  />
                </div>
                <div>
                  <label htmlFor="q-cameras" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Estimated Scale
                  </label>
                  <input
                    id="q-cameras"
                    type="text"
                    value={cameraCount}
                    onChange={(e) => setCameraCount(e.target.value)}
                    placeholder="e.g. 4 – 8 Cameras"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="q-msg" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requirement Details *
                </label>
                <textarea
                  id="q-msg"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share site type (home, shop, warehouse), preferred brand, or repair issue."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <a
                  href={whatsappQuickUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1B36] hover:bg-slate-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#9E7216]" />
                  <span>Or Enquire on WhatsApp</span>
                </a>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[42px] rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Submitting...' : 'Submit Quotation Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
