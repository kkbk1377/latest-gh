import {
  ArrowRight,
  Calculator,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaqAccordion, SolutionsShowcase } from '../components/SolutionsShowcase.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import { formatTelUrl, formatWhatsAppUrl } from '../data/catalogData.ts';
import {
  DEPLOYMENT_STEPS,
  INTEGRATED_SECURITY_SYSTEMS,
} from '../data/solutionsData.ts';

export function SolutionsPage() {
  const { settings, openQuoteModal } = useBusiness();

  const telHref = formatTelUrl(settings.phone);
  const waHref = formatWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.businessName}, I would like to book a free site survey & security solution demo.`,
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Dark Navy Solutions Header */}
      <section className="bg-[#0B1B36] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-medium text-[#DFB85A] tracking-wide mb-3">
              TRINETRA CCTV SOLUTIONS · Smart Surveillance &amp; ELV Systems
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.75rem] tracking-tight leading-[1.12] mb-4">
              Smart CCTV, AI Detection &amp; Integrated Electronic Security
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              From upgrading existing cameras with on-premise smart alerts to turnkey installations
              of Biometric Access Control, Video Intercoms, Boom Barriers, Fire Alarms, and 4G Solar
              CCTV across Andhra Pradesh and Telangana.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  openQuoteModal({
                    subject: 'Book Free Site Survey & Solution Demo',
                    serviceRef: 'Complete Security Solution Consultation',
                  })
                }
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[46px] rounded-lg bg-[#C99B2E] text-[#061022] font-semibold text-sm hover:bg-[#DFB85A] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Book Free Site Survey / Demo</span>
              </button>
              <Link
                to="/planner"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] rounded-lg border border-white/25 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                <Calculator className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
                <span>CCTV System Planner</span>
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[46px] rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Industry & Smart CCTV Solutions Explorer */}
      <SolutionsShowcase />

      {/* Integrated Electronic Security & ELV Capabilities */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium text-[#9E7216] mb-1.5">
              Complete Electronic Security Under One Roof
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
              Integrated Security &amp; Automation Systems We Deliver
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Every access point, gate, corridor, and safety perimeter integrated cleanly by one
              accountable technical team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INTEGRATED_SECURITY_SYSTEMS.map((sys) => (
              <div
                key={sys.id}
                className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between hover:border-[#C99B2E] transition-colors"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-[#9E7216] mb-2">
                    {sys.code}.
                  </p>
                  <h3 className="font-display font-bold text-lg text-[#0B1B36] mb-2">
                    {sys.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{sys.summary}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 truncate">{sys.useCases}</span>
                  <button
                    type="button"
                    onClick={() =>
                      openQuoteModal({
                        subject: `Quote Request: ${sys.title}`,
                        serviceRef: sys.title,
                      })
                    }
                    className="text-xs font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Request Quote →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Deployment Roadmap */}
      <section className="py-16 lg:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium text-[#9E7216] mb-1.5">How We Execute</p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
              From Site Survey to Clean Handover in 4 Clear Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEPLOYMENT_STEPS.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block font-mono text-xs font-bold text-[#9E7216] mb-3">
                    STEP {item.step}
                  </span>
                  <h3 className="font-display font-bold text-base text-[#0B1B36] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive FAQ */}
      <FaqAccordion />

      {/* Bottom Action Banner */}
      <section className="py-14 bg-[#0B1B36] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2">
              Ready to Upgrade Your Site Security?
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Speak directly with our AP &amp; Telangana engineering desk for a custom BoQ, on-site
              survey, or direct hardware order from our online store.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#C99B2E] text-[#061022] font-semibold text-sm hover:bg-[#DFB85A] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Shop Online Store</span>
            </Link>
            <a
              href={telHref}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#DFB85A]" aria-hidden="true" />
              <span>Call {settings.phone}</span>
            </a>
            <button
              type="button"
              onClick={() => openQuoteModal({ subject: 'Custom Security Proposal Request' })}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span>Get a Quote</span>
              <ArrowRight className="w-4 h-4 text-[#DFB85A]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
