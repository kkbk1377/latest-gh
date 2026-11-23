import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Factory,
  Home,
  Lock,
  MessageCircle,
  Radio,
  Server,
  ShieldCheck,
  Smartphone,
  Sun,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import {
  SOLUTION_SECTORS,
  SURVEILLANCE_FAQS,
} from '../data/solutionsData.ts';

const SECTOR_ICONS: Record<string, typeof Cpu> = {
  'smart-ai': Cpu,
  industrial: Factory,
  commercial: Building2,
  residential: Home,
  'campus-solar': Sun,
};

interface SolutionsShowcaseProps {
  compact?: boolean;
}

export function SolutionsShowcase({ compact = false }: SolutionsShowcaseProps) {
  const { settings, openQuoteModal } = useBusiness();
  const [activeId, setActiveId] = useState<string>(SOLUTION_SECTORS[0].id);

  const activeSector =
    SOLUTION_SECTORS.find((s) => s.id === activeId) ?? SOLUTION_SECTORS[0];
  const ActiveIcon = SECTOR_ICONS[activeSector.id] ?? ShieldCheck;

  const waHref = formatWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.businessName}, I would like a consultation / demo for: ${activeSector.title}.`,
  );

  return (
    <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#9E7216] mb-1.5">
              Smart Surveillance &amp; Industry Solutions
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
              Tailored Security Architecture for Every Site
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Whether upgrading existing CCTV with smart on-premise AI detection or deploying
              complete security for factories, offices, apartments, or off-grid solar sites — explore
              our turnkey solutions below.
            </p>
          </div>
          {compact && (
            <Link
              to="/solutions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Explore All Security Solutions</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Interactive Sector Tabs */}
        <div
          role="tablist"
          aria-label="Security Solution Categories"
          className="flex flex-wrap gap-2 mb-6"
        >
          {SOLUTION_SECTORS.map((sector) => {
            const Icon = SECTOR_ICONS[sector.id] ?? ShieldCheck;
            const isSelected = sector.id === activeSector.id;
            return (
              <button
                key={sector.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveId(sector.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-[#C99B2E] hover:text-[#0B1B36]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-[#DFB85A]' : 'text-[#9E7216]'
                  }`}
                  aria-hidden="true"
                />
                <span>{sector.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Active Solution Detail Card */}
        <motion.div
          key={activeSector.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Capabilities */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0B1B36] flex items-center justify-center shrink-0">
                    <ActiveIcon className="w-4.5 h-4.5 text-[#DFB85A]" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium text-[#9E7216]">
                    Ideal for: {activeSector.idealFor}
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0B1B36] tracking-tight mb-3">
                  {activeSector.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                  {activeSector.subtitle}
                </p>

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Key Capabilities &amp; Outcomes
                </p>
                <ul className="space-y-2.5 mb-6">
                  {activeSector.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2
                        className="w-4 h-4 text-[#9E7216] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openQuoteModal({
                      subject: `Solution Inquiry: ${activeSector.title}`,
                      serviceRef: activeSector.title,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] transition-colors cursor-pointer"
                >
                  <span>Book Free Site Survey / Demo</span>
                  <ArrowRight className="w-4 h-4 text-[#DFB85A]" aria-hidden="true" />
                </button>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-sm font-semibold hover:border-[#0B1B36] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#9E7216]" aria-hidden="true" />
                  <span>WhatsApp Specialist</span>
                </a>
              </div>
            </div>

            {/* Right: Recommended Hardware Stack + Privacy Highlight */}
            <div className="lg:col-span-5 bg-[#0B1B36] text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-[#DFB85A] mb-2">
                  Recommended Hardware Stack
                </p>
                <h4 className="font-display font-bold text-lg text-white mb-4">
                  Engineered for 24/7 AP &amp; Telangana Field Conditions
                </h4>
                <ul className="space-y-3">
                  {activeSector.recommendedHardware.map((hw, i) => (
                    <li
                      key={hw}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span className="font-mono text-xs font-semibold text-[#DFB85A] mt-0.5">
                        0{i + 1}
                      </span>
                      <span className="text-sm text-slate-200 leading-snug">{hw}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-[#C99B2E]/40">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#DFB85A] mb-1">
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>On-Premise Security &amp; Reliability</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeSector.privacyNote}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* On-Premise Privacy & Existing CCTV Architecture Strip */}
        <div className="mt-8 p-6 sm:p-7 rounded-xl bg-[#061022] text-white border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 mb-5 border-b border-white/10">
            <div>
              <p className="text-xs font-medium text-[#DFB85A]">
                Works With Existing CCTV · Zero Cloud Lock-In
              </p>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white mt-0.5">
                100% On-Premise Privacy &amp; Instant Alert Architecture
              </h3>
            </div>
            <Link
              to="/planner"
              className="text-xs font-semibold text-[#DFB85A] hover:underline whitespace-nowrap"
            >
              Size Your Recorder &amp; Storage →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-[#DFB85A] mb-2">
                <Radio className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs font-semibold">STEP 1 · CAPTURE</span>
              </div>
              <p className="font-display font-semibold text-sm text-white mb-1">
                New or Existing CCTV Cameras
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect IP, HD analog, PTZ, Wi-Fi, or 4G solar cameras across gates, corridors, and
                perimeters without replacing working wiring.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-[#DFB85A] mb-2">
                <Server className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs font-semibold">STEP 2 · ON-PREMISE ENGINE</span>
              </div>
              <p className="font-display font-semibold text-sm text-white mb-1">
                Local Smart NVR / XVR &amp; HDD
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Video stays strictly on your site’s surveillance hard disk with smart human/vehicle
                motion filtering — no mandatory monthly cloud fees.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-[#DFB85A] mb-2">
                <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs font-semibold">STEP 3 · ACTION</span>
              </div>
              <p className="font-display font-semibold text-sm text-white mb-1">
                Live Mobile &amp; Control-Desk Alerts
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Monitor live multi-camera feeds, receive perimeter push alerts, and review HD
                playback securely from anywhere on iOS, Android, or PC.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqAccordion() {
  const [openId, setOpenId] = useState<string>(SURVEILLANCE_FAQS[0].id);

  return (
    <section className="py-16 lg:py-20 bg-[#F8FAFC] border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-medium text-[#9E7216] mb-1.5">
            Frequently Asked Questions
          </p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
            Answers Before You Install or Upgrade
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Straightforward technical answers on upgrades, on-premise privacy, storage days, and
            regional service across Andhra Pradesh &amp; Telangana.
          </p>
        </div>

        <div className="space-y-3">
          {SURVEILLANCE_FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? '' : faq.id)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <span className="font-display font-semibold text-sm sm:text-base text-[#0B1B36]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#9E7216] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
