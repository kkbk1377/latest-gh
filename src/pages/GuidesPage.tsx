import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { SECURITY_GUIDES, STORE_POLICIES } from '../data/guidesData.ts';

export function GuidesPage() {
  const { openQuoteModal } = useBusiness();
  const [selectedGuideId, setSelectedGuideId] = useState<string>(SECURITY_GUIDES[0].id);

  const activeGuide =
    SECURITY_GUIDES.find((g) => g.id === selectedGuideId) ?? SECURITY_GUIDES[0];

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <section className="bg-[#0B1B36] text-white py-12 lg:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#DFB85A] mb-2">
            TRINETRA Knowledge Center · Security Buyer Guides &amp; Store Policies
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-3">
                CCTV Buying Guides, Engineering Tips &amp; Store Policies
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Make confident decisions on camera selection, IP vs HD systems, surveillance hard
                disk sizing, biometric access control, and TRINETRA’s transparent shipping &amp;
                warranty policies.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#C99B2E] text-[#061022] text-sm font-semibold hover:bg-[#DFB85A] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop CCTV Store</span>
              </Link>
              <Link
                to="/planner"
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <Calculator className="w-4 h-4 text-[#DFB85A]" />
                <span>Storage Calculator</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Guides Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Guide List Rail */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Featured Guides ({SECURITY_GUIDES.length})
            </p>
            {SECURITY_GUIDES.map((guide) => {
              const isSelected = guide.id === activeGuide.id;
              return (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedGuideId(guide.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                      : 'bg-white text-[#0B1B36] border-slate-200 hover:border-[#C99B2E]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className={isSelected ? 'text-[#DFB85A] font-semibold' : 'text-[#9E7216] font-semibold'}>
                      {guide.category}
                    </span>
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                      {guide.readTime}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-sm leading-snug">{guide.title}</h2>
                </button>
              );
            })}
          </div>

          {/* Active Guide Reader */}
          <article className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9E7216] mb-2">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>
                  {activeGuide.category} · {activeGuide.readTime} · Updated {activeGuide.publishedDate}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0B1B36] tracking-tight mb-3">
                {activeGuide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {activeGuide.excerpt}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0B1B36] mb-3">
                Key Practical Takeaways
              </p>
              <ul className="space-y-2">
                {activeGuide.keyTakeaways.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#9E7216] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5">
              {activeGuide.sections.map((sec) => (
                <div key={sec.heading}>
                  <h3 className="font-display font-bold text-lg text-[#0B1B36] mb-1.5">
                    {sec.heading}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <Link
                to={`/store?category=${encodeURIComponent(activeGuide.relatedStoreCategory)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] transition-colors"
              >
                <span>Shop {activeGuide.relatedStoreCategory}</span>
                <ArrowRight className="w-4 h-4 text-[#DFB85A]" />
              </Link>
              <button
                type="button"
                onClick={() =>
                  openQuoteModal({
                    subject: `Consultation from Guide: ${activeGuide.title}`,
                  })
                }
                className="text-xs font-semibold text-[#9E7216] hover:underline cursor-pointer"
              >
                Speak with a TRINETRA Engineer →
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Transparent Store Policies (Shipping, Warranty, Privacy, Terms) */}
      <section id="policies" className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <div className="flex items-center gap-2 text-xs font-medium text-[#9E7216] mb-1.5">
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>Transparent Commerce Standards</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
              Shipping, Warranty, Privacy &amp; Service Policies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STORE_POLICIES.map((policy) => (
              <div
                key={policy.id}
                id={`policy-${policy.id}`}
                className="p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#9E7216] shrink-0" aria-hidden="true" />
                  <h3 className="font-display font-bold text-base text-[#0B1B36]">
                    {policy.title}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
                  {policy.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <span className="text-[#9E7216] font-bold">·</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
