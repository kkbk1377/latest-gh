import { MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ServiceCoverageMap } from '../components/ServiceCoverageMap.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import { COVERAGE_HUBS, formatWhatsAppUrl } from '../data/catalogData.ts';

export function CoveragePage() {
  const { settings, openQuoteModal } = useBusiness();
  const [stateFilter, setStateFilter] = useState<'All' | 'Telangana' | 'Andhra Pradesh'>('All');
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);

  const visibleHubs =
    stateFilter === 'All'
      ? COVERAGE_HUBS
      : COVERAGE_HUBS.filter((h) => h.state === stateFilter);

  return (
    <div className="bg-[#F8FAFC] min-h-[75vh]">
      <section className="bg-[#0B1B36] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#DFB85A] mb-2">Regional Operations</p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-3">
            Andhra Pradesh &amp; Telangana Service Coverage
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            TRINETRA CCTV SOLUTIONS supplies, installs, and services surveillance systems across
            major urban centers, commercial corridors, industrial estates, and towns throughout
            Telangana and Andhra Pradesh.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Interactive Map */}
        <ServiceCoverageMap
          mode="coverage"
          selectedHubId={selectedHubId}
          onSelectHub={setSelectedHubId}
          heightClass="h-[420px] sm:h-[500px]"
        />

        {/* State Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
            {(['All', 'Telangana', 'Andhra Pradesh'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStateFilter(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  stateFilter === tab
                    ? 'bg-white text-[#0B1B36] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1B36]'
                }`}
              >
                {tab === 'All' ? 'All Regions' : tab}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Click any hub card below to focus it on the interactive map.
          </p>
        </div>

        {/* Regional Hub Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleHubs.map((hub) => {
            const isSelected = selectedHubId === hub.id;
            const waHref = formatWhatsAppUrl(
              settings.whatsapp,
              `Hello TRINETRA CCTV SOLUTIONS, I need CCTV sales/installation support in ${hub.city}, ${hub.state}.`,
            );
            return (
              <article
                key={hub.id}
                className={`p-6 rounded-xl border bg-white flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-[#C99B2E] ring-1 ring-[#C99B2E]' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-[#9E7216]">{hub.state}</span>
                    <span>{hub.regionLabel}</span>
                  </div>
                  <h2 className="font-display font-bold text-lg text-[#0B1B36] mb-2">
                    {hub.city}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mb-1">Districts &amp; Zones:</p>
                  <p className="text-sm text-slate-700 leading-relaxed mb-5">
                    {hub.districtsCovered.join(' · ')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHubId(hub.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Show on Map</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0B1B36]"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#9E7216]" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        openQuoteModal({
                          subject: `Site Survey Request — ${hub.city}, ${hub.state}`,
                        })
                      }
                      className="px-3 py-1.5 rounded-md bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                    >
                      Book Visit
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
