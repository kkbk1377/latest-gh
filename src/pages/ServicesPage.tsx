import { Check, MessageCircle, Phone } from 'lucide-react';
import { SafeImage } from '../components/SafeImage.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import {
  ASSET_IMAGES,
  CORE_SERVICES,
  formatTelUrl,
  formatWhatsAppUrl,
} from '../data/catalogData.ts';

export function ServicesPage() {
  const { settings, openQuoteModal } = useBusiness();

  return (
    <div className="bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-[#0B1B36] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium text-[#DFB85A] mb-2">
              Installation, Diagnostics &amp; Preventive AMC
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
              End-to-End CCTV Engineering Services
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mb-6">
              TRINETRA CCTV SOLUTIONS delivers complete on-site technical execution across Andhra
              Pradesh and Telangana — from new multi-camera installations and PoE network racks to
              hard disk upgrades, breakdown repair, and Annual Maintenance Services.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openQuoteModal({ subject: 'On-Site CCTV Service Booking' })}
                className="px-6 py-3 min-h-[44px] rounded-lg bg-[#C99B2E] text-[#061022] text-sm font-semibold hover:bg-[#DFB85A] transition-colors cursor-pointer"
              >
                Book a Site Visit
              </button>
              <a
                href={formatTelUrl(settings.phone)}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg border border-white/25 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#DFB85A]" />
                <span>Call Service Desk</span>
              </a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[16/10] rounded-xl overflow-hidden border border-white/15 bg-[#061022]">
              <SafeImage
                src={ASSET_IMAGES.installationTech}
                alt="TRINETRA technician performing ceiling CCTV camera installation and tablet diagnostics"
                fallbackTitle="CCTV Engineering Services"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Service Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
        {CORE_SERVICES.map((service) => {
          const waUrl = formatWhatsAppUrl(
            settings.whatsapp,
            `Hello TRINETRA CCTV SOLUTIONS, I need assistance with ${service.title}.`,
          );
          return (
            <article
              key={service.id}
              id={service.id}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-7">
                <p className="font-mono text-xs font-semibold text-[#9E7216] mb-1.5">
                  Service {service.number}
                </p>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0B1B36] mb-3">
                  {service.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
                  {service.shortDescription}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{service.details}</p>
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">Suitable For:</strong> {service.idealFor}
                </p>
              </div>

              <div className="lg:col-span-5 bg-[#F8FAFC] border border-slate-200/90 rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold text-sm text-[#0B1B36] mb-3">
                    Scope &amp; Deliverables
                  </h3>
                  <ul className="space-y-2.5 mb-6">
                    {service.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check
                          className="w-4 h-4 text-[#9E7216] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      openQuoteModal({
                        subject: `Service Request: ${service.title}`,
                        serviceRef: service.title,
                      })
                    }
                    className="px-4 py-2.5 min-h-[42px] rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Request Service Quote
                  </button>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:border-[#0B1B36] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#9E7216]" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
