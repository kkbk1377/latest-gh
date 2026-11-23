import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ServiceCoverageMap } from '../components/ServiceCoverageMap.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import { CORE_SERVICES, formatTelUrl, formatWhatsAppUrl } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';

export function ContactPage() {
  const { settings } = useBusiness();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<'Andhra Pradesh' | 'Telangana' | 'Other'>('Telangana');
  const [serviceRef, setServiceRef] = useState(CORE_SERVICES[0].title);
  const [cameraCount, setCameraCount] = useState('4 – 8 Cameras');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmedId(null);
    setSubmitting(true);
    try {
      const res = await api.submitEnquiry({
        type: 'contact',
        name,
        phone,
        email,
        city,
        state,
        subject: `Contact Page Enquiry — ${serviceRef}`,
        serviceRef,
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
      setError(err instanceof Error ? err.message : 'Unable to submit enquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const telHref = formatTelUrl(settings.phone);
  const waHref = formatWhatsAppUrl(
    settings.whatsapp,
    'Hello TRINETRA CCTV SOLUTIONS, I would like to discuss a CCTV requirement.',
  );
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${settings.officeLat},${settings.officeLng}`;

  return (
    <div className="bg-[#F8FAFC] min-h-[75vh]">
      <section className="bg-[#0B1B36] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#DFB85A] mb-2">Contact &amp; Enquiries</p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-3">
            Connect with TRINETRA CCTV SOLUTIONS
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Call, message on WhatsApp, email, or submit your project details below for hardware
            pricing, installation scheduling, repair visits, or AMC inquiries across Andhra Pradesh
            and Telangana.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <a
            href={telHref}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-[#0B1B36] transition-colors flex flex-col justify-between"
          >
            <Phone className="w-5 h-5 text-[#9E7216] mb-3" />
            <div>
              <p className="text-xs text-slate-500">Click to Call</p>
              <p className="font-mono tabular-nums text-sm font-bold text-[#0B1B36] mt-0.5">
                {settings.phone}
              </p>
            </div>
          </a>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-[#0B1B36] transition-colors flex flex-col justify-between"
          >
            <MessageCircle className="w-5 h-5 text-[#9E7216] mb-3" />
            <div>
              <p className="text-xs text-slate-500">WhatsApp Enquiry</p>
              <p className="font-mono tabular-nums text-sm font-bold text-[#0B1B36] mt-0.5">
                {settings.whatsapp}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${settings.email}`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-[#0B1B36] transition-colors flex flex-col justify-between"
          >
            <Mail className="w-5 h-5 text-[#9E7216] mb-3" />
            <div>
              <p className="text-xs text-slate-500">Business Email</p>
              <p className="text-sm font-bold text-[#0B1B36] mt-0.5 break-all">{settings.email}</p>
            </div>
          </a>

          <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
            <Clock className="w-5 h-5 text-[#9E7216] mb-3" />
            <div>
              <p className="text-xs text-slate-500">Business Hours</p>
              <p className="text-sm font-semibold text-[#0B1B36] mt-0.5">
                {settings.businessHours}
              </p>
            </div>
          </div>
        </div>

        {/* Form + Office Map Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="font-display font-bold text-xl text-[#0B1B36] mb-1">
              Submit a Service or Quotation Enquiry
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Share your premises location and requirement for an itemized estimate.
            </p>

            {confirmedId && (
              <div className="mb-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>
                  Enquiry submitted successfully (Ref:{' '}
                  <strong className="font-mono">{confirmedId}</strong>). We will respond shortly.
                </span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="cp-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="cp-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <input
                    id="cp-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cp-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    id="cp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="cp-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    City / Town *
                  </label>
                  <input
                    id="cp-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="cp-state" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State *
                  </label>
                  <select
                    id="cp-state"
                    value={state}
                    onChange={(e) =>
                      setState(e.target.value as 'Andhra Pradesh' | 'Telangana' | 'Other')
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-service" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Service / Enquiry Type
                  </label>
                  <select
                    id="cp-service"
                    value={serviceRef}
                    onChange={(e) => setServiceRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    {CORE_SERVICES.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                    <option value="Product Sales / Bulk Order">Product Sales / Bulk Order</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cp-scale" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Estimated Scale
                  </label>
                  <select
                    id="cp-scale"
                    value={cameraCount}
                    onChange={(e) => setCameraCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="1 – 4 Cameras">1 – 4 Cameras</option>
                    <option value="4 – 8 Cameras">4 – 8 Cameras</option>
                    <option value="8 – 16 Cameras">8 – 16 Cameras</option>
                    <option value="16+ Cameras">16+ Cameras</option>
                    <option value="Repair / Spares / AMC">Repair / Spares / AMC</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cp-msg" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requirement Details *
                </label>
                <textarea
                  id="cp-msg"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your site, preferred brands (Hikvision, CP Plus, Matrix Comsec, etc.), or technical issue..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-[#DFB85A]" />
                )}
                <span>{submitting ? 'Submitting...' : 'Submit Enquiry'}</span>
              </button>
            </form>
          </div>

          {/* Office Address & Google Map */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-xl bg-white border border-slate-200">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[#9E7216] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display font-bold text-base text-[#0B1B36]">
                    {settings.officeLocationName}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{settings.address}</p>
                </div>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors"
              >
                <span>Open Directions in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ServiceCoverageMap mode="office" heightClass="h-[380px]" />
          </div>
        </div>
      </section>
    </div>
  );
}
