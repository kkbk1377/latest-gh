import { ArrowRight, Check, Scale, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildRecommendedPackage,
  calculatePackage,
  compareBrandsForPackage,
} from '../lib/packageEngine.ts';
import type {
  PackageCalculationInput,
  PackageCatalogData,
  PackageSelectionItem,
  PackageSystemType,
} from '../types.ts';

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface PackageCompareModalProps {
  open: boolean;
  initialTab: 'hd-vs-ip' | 'brands';
  onClose: () => void;
  catalog: PackageCatalogData;
  currentInput: PackageCalculationInput;
  onSwitchSystemType: (next: PackageSystemType) => void;
  onApplyBrandItems: (items: PackageSelectionItem[], brandName: string) => void;
}

export function PackageCompareModal({
  open,
  initialTab,
  onClose,
  catalog,
  currentInput,
  onSwitchSystemType,
  onApplyBrandItems,
}: PackageCompareModalProps) {
  const [tab, setTab] = useState<'hd-vs-ip' | 'brands'>(initialTab);

  const hdComparison = useMemo(() => {
    const recItems = buildRecommendedPackage(
      'HD',
      currentInput.channel,
      currentInput.megapixel,
      undefined,
      catalog,
    );
    return calculatePackage(
      {
        systemType: 'HD',
        channel: currentInput.channel,
        megapixel: currentInput.megapixel,
        items: recItems,
      },
      catalog,
    );
  }, [catalog, currentInput.channel, currentInput.megapixel]);

  const ipComparison = useMemo(() => {
    const recItems = buildRecommendedPackage(
      'IP',
      currentInput.channel,
      currentInput.megapixel,
      undefined,
      catalog,
    );
    return calculatePackage(
      {
        systemType: 'IP',
        channel: currentInput.channel,
        megapixel: currentInput.megapixel,
        items: recItems,
      },
      catalog,
    );
  }, [catalog, currentInput.channel, currentInput.megapixel]);

  const brandRows = useMemo(
    () => compareBrandsForPackage(currentInput, catalog),
    [catalog, currentInput],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compare CCTV Packages and Brands"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#061022]/70 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-[#9E7216]" />
            <div>
              <h2 className="font-display font-bold text-base text-[#0B1B36]">
                Compare Packages &amp; Multi-Brand Pricing
              </h2>
              <p className="text-xs text-slate-600">
                Live comparison for {currentInput.channel}CH · {currentInput.megapixel} setup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison modal"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#0B1B36] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-6 text-sm">
          <button
            type="button"
            onClick={() => setTab('hd-vs-ip')}
            className={`pb-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'hd-vs-ip'
                ? 'border-[#0B1B36] text-[#0B1B36]'
                : 'border-transparent text-slate-500 hover:text-[#0B1B36]'
            }`}
          >
            HD vs IP ({currentInput.channel}CH · {currentInput.megapixel})
          </button>
          <button
            type="button"
            onClick={() => setTab('brands')}
            className={`pb-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'brands'
                ? 'border-[#0B1B36] text-[#0B1B36]'
                : 'border-transparent text-slate-500 hover:text-[#0B1B36]'
            }`}
          >
            Multi-Brand Price Comparison ({brandRows.length} Brands)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === 'hd-vs-ip' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* HD Column */}
                <div
                  className={`rounded-xl border p-5 flex flex-col justify-between ${
                    currentInput.systemType === 'HD'
                      ? 'border-[#0B1B36] bg-[#F8FAFC]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-lg text-[#0B1B36]">
                        HD CCTV Package
                      </p>
                      <span className="text-xs font-mono font-semibold text-[#9E7216]">
                        {inr(catalog.config.hdInstallationPerCameraInr)}/cam install
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Coaxial 3+1 cabling with DVR and SMPS power supply. Best cost-effective option
                      for homes, retail shops, schools &amp; small offices.
                    </p>
                    <dl className="divide-y divide-slate-200 text-xs pt-2">
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">Recorder &amp; Power</dt>
                        <dd className="font-medium text-[#0B1B36]">
                          {currentInput.channel}CH DVR + {currentInput.channel}CH SMPS
                        </dd>
                      </div>
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">Cabling &amp; Connectors</dt>
                        <dd className="font-medium text-[#0B1B36]">3+1 Copper + BNC + DC Pins</dd>
                      </div>
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">Recommended Kit Hardware</dt>
                        <dd className="font-mono tabular-nums font-semibold text-[#0B1B36]">
                          {inr(hdComparison.productSubtotalInr)}
                        </dd>
                      </div>
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">
                          Installation ({hdComparison.totalCameraCount} cams)
                        </dt>
                        <dd className="font-mono tabular-nums font-semibold text-[#0B1B36]">
                          {inr(hdComparison.installationTotalInr)}
                        </dd>
                      </div>
                      <div className="py-2.5 flex justify-between text-sm font-bold text-[#0B1B36]">
                        <dt>Estimated Total</dt>
                        <dd className="font-mono tabular-nums">
                          {inr(hdComparison.grandTotalInr)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <button
                    type="button"
                    disabled={!catalog.config.hdEnabled}
                    onClick={() => {
                      onSwitchSystemType('HD');
                      onClose();
                    }}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {currentInput.systemType === 'HD'
                        ? 'Currently Configuring HD'
                        : 'Switch to HD Package'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* IP Column */}
                <div
                  className={`rounded-xl border p-5 flex flex-col justify-between ${
                    currentInput.systemType === 'IP'
                      ? 'border-[#0B1B36] bg-[#F8FAFC]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-lg text-[#0B1B36]">
                        IP CCTV Package
                      </p>
                      <span className="text-xs font-mono font-semibold text-[#9E7216]">
                        {inr(catalog.config.ipInstallationPerCameraInr)}/cam install
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Single-cable CAT6 PoE architecture with 4K NVR, digital zoom clarity, smart
                      motion analytics &amp; easy future expansion.
                    </p>
                    <dl className="divide-y divide-slate-200 text-xs pt-2">
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">Recorder &amp; Power</dt>
                        <dd className="font-medium text-[#0B1B36]">
                          {currentInput.channel}CH NVR + PoE Switch
                        </dd>
                      </div>
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">Cabling &amp; Connectors</dt>
                        <dd className="font-medium text-[#0B1B36]">CAT6 Copper + RJ45 Jacks</dd>
                      </div>
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">Recommended Kit Hardware</dt>
                        <dd className="font-mono tabular-nums font-semibold text-[#0B1B36]">
                          {inr(ipComparison.productSubtotalInr)}
                        </dd>
                      </div>
                      <div className="py-2 flex justify-between">
                        <dt className="text-slate-500">
                          Installation ({ipComparison.totalCameraCount} cams)
                        </dt>
                        <dd className="font-mono tabular-nums font-semibold text-[#0B1B36]">
                          {inr(ipComparison.installationTotalInr)}
                        </dd>
                      </div>
                      <div className="py-2.5 flex justify-between text-sm font-bold text-[#0B1B36]">
                        <dt>Estimated Total</dt>
                        <dd className="font-mono tabular-nums">
                          {inr(ipComparison.grandTotalInr)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <button
                    type="button"
                    disabled={!catalog.config.ipEnabled}
                    onClick={() => {
                      onSwitchSystemType('IP');
                      onClose();
                    }}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {currentInput.systemType === 'IP'
                        ? 'Currently Configuring IP'
                        : 'Switch to IP Package'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : brandRows.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-600">
              Select at least one camera or component in your package to compare prices across
              brands.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Swaps every compatible item in your current{' '}
                <strong>
                  {currentInput.systemType} {currentInput.channel}CH {currentInput.megapixel}
                </strong>{' '}
                selection to each brand (retaining existing brands for specialized accessories not
                made by that brand).
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600">
                      <th className="py-3 px-4 font-semibold">Brand</th>
                      <th className="py-3 px-4 font-semibold">Matched Items</th>
                      <th className="py-3 px-4 font-semibold text-right">Hardware</th>
                      <th className="py-3 px-4 font-semibold text-right">Installation</th>
                      <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brandRows.map((row, idx) => (
                      <tr key={row.brand.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-display font-bold text-sm text-[#0B1B36]">
                            {row.brand.name}
                            {idx === 0 && (
                              <span className="ml-2 text-[11px] font-sans font-semibold text-emerald-700">
                                · Best Value
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {row.brand.description}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {row.matchedItemCount} / {row.totalItemCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {inr(row.productSubtotalInr)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {inr(row.installationTotalInr)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0B1B36]">
                          {inr(row.grandTotalInr)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onApplyBrandItems(row.switchedItems, row.brand.name);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#0B1B36] text-[#0B1B36] font-semibold hover:bg-[#0B1B36] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply Brand</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
