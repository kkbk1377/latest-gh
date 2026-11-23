import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Printer,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import type {
  PackageCalculationInput,
  PackageCalculationResult,
  PackageConfig,
  PackageQuotation,
} from '../types.ts';

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface PackageQuotationModalProps {
  open: boolean;
  onClose: () => void;
  config: PackageConfig;
  packageInput?: PackageCalculationInput;
  previewCalculation?: PackageCalculationResult;
  existingQuotation?: PackageQuotation | null;
  onSaved?: (quotation: PackageQuotation) => void;
}

export function PackageQuotationModal({
  open,
  onClose,
  config,
  packageInput,
  previewCalculation,
  existingQuotation,
  onSaved,
}: PackageQuotationModalProps) {
  const { settings } = useBusiness();
  const [savedQuotation, setSavedQuotation] = useState<PackageQuotation | null>(
    existingQuotation ?? null,
  );
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<'Andhra Pradesh' | 'Telangana' | 'Other'>('Telangana');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const activeQuotation = existingQuotation ?? savedQuotation;
  const calc = activeQuotation?.calculation ?? previewCalculation;

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!packageInput) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.createPackageQuotation({
        customerName,
        phone,
        email,
        city,
        state,
        companyName,
        gstin: gstin.trim().toUpperCase(),
        notes,
        packageInput,
      });
      setSavedQuotation(res.quotation);
      onSaved?.(res.quotation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintA4 = () => {
    document.body.classList.add('printing-quotation');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-quotation');
    }, 500);
  };

  const buildWhatsAppSummary = () => {
    if (!calc) return '';
    const refLine = activeQuotation ? `Quotation ID: ${activeQuotation.id}\n` : '';
    const itemLines = calc.lines
      .map(
        (l) =>
          `• ${l.brandName} ${l.componentName} (${l.modelCode}) × ${l.quantity} = ${inr(l.lineTotalInr)}`,
      )
      .join('\n');
    return `Hello ${settings.businessName},\n${refLine}Package: ${calc.systemType} CCTV · ${calc.channel}CH · ${calc.megapixel}\nCameras: ${calc.totalCameraCount} (${calc.domeCameraCount} Dome, ${calc.bulletCameraCount} Bullet)\n\nItems:\n${itemLines}\n\nProducts Subtotal: ${inr(calc.productSubtotalInr)}\nInstallation (${calc.totalCameraCount} × ${inr(calc.installationRatePerCameraInr)}): ${inr(calc.installationTotalInr)}${calc.discountInr > 0 ? `\nDiscount (${calc.discountCode}): -${inr(calc.discountInr)}` : ''}${calc.taxEnabled && calc.taxInr > 0 ? `\n${calc.taxLabel} (${calc.taxRatePercent}%): ${inr(calc.taxInr)}` : ''}\nGrand Total: ${inr(calc.grandTotalInr)}`;
  };

  const quoteDate = activeQuotation
    ? new Date(activeQuotation.createdAt)
    : new Date();
  const validUntil = new Date(
    quoteDate.getTime() + (config.quotationValidityDays || 15) * 86400000,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="TRINETRA CCTV Package Quotation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#061022]/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Action Bar */}
        <div className="no-print px-5 py-3.5 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-[#0B1B36]">
              {activeQuotation
                ? `Official Quotation · ${activeQuotation.id}`
                : 'Request & Download Formal CCTV Quotation'}
            </h2>
            <p className="text-xs text-slate-600">
              {activeQuotation
                ? 'Saved to TRINETRA records. Print or save as A4 PDF below.'
                : 'Enter customer details to generate an official, printable A4 TRINETRA quotation.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeQuotation && (
              <>
                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#DFB85A]" />
                  <span>Print / Save A4 PDF</span>
                </button>
                <a
                  href={formatWhatsAppUrl(settings.whatsapp, buildWhatsAppSummary())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quotation modal"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 hover:text-[#0B1B36] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {!activeQuotation ? (
            <form onSubmit={handleGenerate} className="space-y-4 max-w-2xl mx-auto">
              {calc && (
                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#9E7216] uppercase tracking-wide">
                      Selected Package Configuration
                    </p>
                    <p className="font-display font-bold text-sm text-[#0B1B36] mt-0.5">
                      {calc.systemType} CCTV · {calc.channel}CH · {calc.megapixel} ·{' '}
                      {calc.totalCameraCount} Cameras · {calc.lines.length} Line Items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Grand Total</p>
                    <p className="font-mono tabular-nums text-lg font-bold text-[#0B1B36]">
                      {inr(calc.grandTotalInr)}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer or contact person"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9XXXXXXXXX"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Hyderabad / Vijayawada"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) =>
                        setState(e.target.value as 'Andhra Pradesh' | 'Telangana' | 'Other')
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Shop Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="For commercial / office quotation"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN"
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site / Installation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Floor count, outdoor gate distance, preferred survey date..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Generating Quotation...' : 'Generate Official Quotation'}</span>
                </button>
              </div>
            </form>
          ) : calc ? (
            <div className="space-y-4">
              {!existingQuotation && (
                <div className="no-print p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Quotation <strong className="font-mono">{activeQuotation.id}</strong> has been
                    saved. You can print or save this A4 document as PDF, or share it directly on
                    WhatsApp.
                  </span>
                </div>
              )}

              {/* PRINTABLE A4 QUOTATION DOCUMENT */}
              <div
                id="trinetra-a4-quotation"
                className="bg-white border border-slate-300 rounded-lg p-6 sm:p-8 text-[#0F172A] space-y-6"
              >
                {/* Company Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-[#0B1B36]">
                  <div>
                    <p className="font-display font-extrabold text-xl tracking-tight text-[#0B1B36]">
                      {settings.businessName}
                    </p>
                    <p className="text-xs font-medium text-[#9E7216] mt-0.5">{settings.tagline}</p>
                    <p className="text-xs text-slate-600 mt-2 max-w-md">{settings.address}</p>
                    <p className="text-xs text-slate-600 mt-0.5 font-mono">
                      Ph: {settings.phone} · Email: {settings.email} ·{' '}
                      {settings.domain.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-xs font-bold tracking-widest uppercase text-[#9E7216]">
                      CCTV Package Quotation
                    </p>
                    <p className="font-mono text-base font-bold text-[#0B1B36] mt-0.5">
                      {activeQuotation.id}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Date: {quoteDate.toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-600">
                      Valid Until: {validUntil.toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Customer & System Spec Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200 space-y-1">
                    <p className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
                      Prepared For
                    </p>
                    <p className="font-display font-bold text-sm text-[#0B1B36]">
                      {activeQuotation.customerName}
                      {activeQuotation.companyName ? ` (${activeQuotation.companyName})` : ''}
                    </p>
                    <p className="text-slate-700 font-mono">Phone: {activeQuotation.phone}</p>
                    {activeQuotation.email && (
                      <p className="text-slate-700">Email: {activeQuotation.email}</p>
                    )}
                    <p className="text-slate-700">
                      Location: {activeQuotation.city}, {activeQuotation.state}
                    </p>
                    {activeQuotation.gstin && (
                      <p className="text-slate-700 font-mono">GSTIN: {activeQuotation.gstin}</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200 space-y-1">
                    <p className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
                      System Configuration
                    </p>
                    <p className="font-display font-bold text-sm text-[#0B1B36]">
                      {calc.systemType} CCTV Package · {calc.channel}CH · {calc.megapixel}
                    </p>
                    <p className="text-slate-700">
                      Cameras: {calc.totalCameraCount} / {calc.channel}CH ({calc.domeCameraCount}{' '}
                      Dome, {calc.bulletCameraCount} Bullet)
                    </p>
                    <p className="text-slate-700">
                      Installation Rate: {inr(calc.installationRatePerCameraInr)} per camera (
                      {calc.systemType})
                    </p>
                    {calc.estimatedRecordingDays && (
                      <p className="text-slate-700">
                        Est. 24×7 Recording Retention: ~{calc.estimatedRecordingDays} days (
                        {calc.totalStorageTb} TB)
                      </p>
                    )}
                  </div>
                </div>

                {/* Itemized Hardware Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0B1B36] text-white">
                        <th className="py-2.5 px-3 font-semibold w-10">#</th>
                        <th className="py-2.5 px-3 font-semibold">Component &amp; Model</th>
                        <th className="py-2.5 px-3 font-semibold">Brand</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {calc.lines.map((line, idx) => (
                        <tr key={line.variantId} className="even:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-[#0B1B36]">{line.componentName}</p>
                            <p className="text-[11px] text-slate-500">
                              Model: {line.modelCode} · {line.warranty}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {line.brandName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {line.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {inr(line.unitPriceInr)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#0B1B36]">
                            {inr(line.lineTotalInr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals */}
                <div className="flex flex-col sm:flex-row justify-between gap-5">
                  <div className="flex-1 text-xs text-slate-600 space-y-1.5">
                    {activeQuotation.notes && (
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-slate-200 mb-3">
                        <p className="font-semibold text-[#0B1B36] mb-0.5">Site Notes</p>
                        <p>{activeQuotation.notes}</p>
                      </div>
                    )}
                    <p className="font-semibold text-[#0B1B36]">Terms &amp; Conditions</p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      {config.quotationTerms.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="w-full sm:w-72 shrink-0 p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Products Subtotal</span>
                      <span className="font-mono tabular-nums font-semibold">
                        {inr(calc.productSubtotalInr)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>
                        {calc.systemType} Installation ({calc.totalCameraCount} ×{' '}
                        {inr(calc.installationRatePerCameraInr)})
                      </span>
                      <span className="font-mono tabular-nums font-semibold">
                        {inr(calc.installationTotalInr)}
                      </span>
                    </div>
                    {calc.discountInr > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Discount ({calc.discountCode})</span>
                        <span className="font-mono tabular-nums">-{inr(calc.discountInr)}</span>
                      </div>
                    )}
                    {calc.taxEnabled && (
                      <div className="flex justify-between text-slate-700">
                        <span>
                          {calc.taxLabel} ({calc.taxRatePercent}%)
                        </span>
                        <span className="font-mono tabular-nums">{inr(calc.taxInr)}</span>
                      </div>
                    )}
                    <div className="pt-2.5 border-t border-slate-300 flex justify-between items-baseline text-base font-bold text-[#0B1B36]">
                      <span>Grand Total</span>
                      <span className="font-mono tabular-nums">{inr(calc.grandTotalInr)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      {calc.taxEnabled
                        ? `Includes ${calc.taxLabel} @ ${calc.taxRatePercent}%`
                        : 'Tax / GST not applied (as per current pricing configuration)'}
                    </p>
                  </div>
                </div>

                {/* Sign-off Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Generated via {settings.domain.replace(/^https?:\/\//, '')}</span>
                  <span>Authorized Signatory — {settings.businessName}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
