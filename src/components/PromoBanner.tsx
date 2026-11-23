import { Check, Copy, X } from 'lucide-react';
import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';

export function PromoBanner() {
  const { offers } = useBusiness();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const bannerOffer = offers.find((o) => o.active && o.showInBanner);
  if (dismissed || !bannerOffer) return null;

  const handleCopy = () => {
    void navigator.clipboard?.writeText(bannerOffer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#061022] text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[36px] py-1.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <span className="text-[#DFB85A] font-semibold truncate">{bannerOffer.title}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 font-mono font-semibold text-white hover:text-[#DFB85A] underline underline-offset-2 whitespace-nowrap cursor-pointer"
          >
            <span>Code: {bannerOffer.code}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="w-3 h-3" aria-hidden="true" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss offer announcement"
          className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
