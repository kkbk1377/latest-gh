import { CheckCircle2, Loader2, PackageSearch, Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { CustomerEnquiry, OrderStatus, StoreOrder } from '../types.ts';

const ORDER_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'dispatched',
  'installed',
  'delivered',
];

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [refId, setRefId] = useState(searchParams.get('id') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    { kind: 'order'; record: StoreOrder } | { kind: 'enquiry'; record: CustomerEnquiry } | null
  >(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await api.trackReference(refId.trim(), phone.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to locate record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-[75vh]">
      <section className="bg-[#0B1B36] text-white py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#DFB85A] mb-2">Live Customer Portal</p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-3">
            Track Your Store Order or Service Request
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Enter your Order ID (<span className="font-mono text-white">ORD-...</span>) or Service
            Enquiry ID (<span className="font-mono text-white">ENQ-...</span>) along with your
            registered phone number for real-time status updates.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <form
          onSubmit={handleLookup}
          className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
        >
          <div className="sm:col-span-5">
            <label htmlFor="track-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Order or Enquiry ID *
            </label>
            <input
              id="track-id"
              type="text"
              required
              value={refId}
              onChange={(e) => setRefId(e.target.value.toUpperCase())}
              placeholder="e.g. ORD-XXXX or ENQ-XXXX"
              className="w-full px-3.5 py-2.5 text-sm font-mono uppercase rounded-lg border border-slate-300"
            />
          </div>

          <div className="sm:col-span-4">
            <label
              htmlFor="track-phone"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Registered Phone Number *
            </label>
            <input
              id="track-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9XXXXXXXXX"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-[#DFB85A]" />
              )}
              <span>Check Status</span>
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800"
          >
            {error}
          </div>
        )}

        {result?.kind === 'order' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs text-slate-500">Store Order Reference</p>
                <h2 className="font-mono font-bold text-xl text-[#0B1B36] mt-0.5">
                  {result.record.id}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(result.record.createdAt).toLocaleString('en-IN')} ·{' '}
                  {result.record.city}, {result.record.state}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Current Status</p>
                <p className="font-display font-bold text-base uppercase text-[#9E7216] mt-0.5">
                  {result.record.status}
                </p>
              </div>
            </div>

            {result.record.status !== 'cancelled' && (
              <div className="grid grid-cols-5 gap-2">
                {ORDER_STEPS.map((st, idx) => {
                  const currentIdx = ORDER_STEPS.indexOf(result.record.status);
                  const reached = idx <= currentIdx;
                  return (
                    <div key={st} className="text-center">
                      <div
                        className={`h-2 rounded-full mb-2 ${
                          reached ? 'bg-[#0B1B36]' : 'bg-slate-200'
                        }`}
                      />
                      <span
                        className={`text-[11px] capitalize font-medium ${
                          reached ? 'text-[#0B1B36] font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <h3 className="font-display font-semibold text-[#0B1B36]">Ordered Items</h3>
              {result.record.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between gap-4 py-2 border-b border-slate-100 text-xs text-slate-700"
                >
                  <span>
                    {item.brand} — {item.name} × {item.quantity}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#0B1B36]">
                    ₹{item.lineTotalInr.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm font-bold text-[#0B1B36]">
                <span>Total Amount ({result.record.paymentMethod.replace(/_/g, ' ')})</span>
                <span className="font-mono tabular-nums">
                  ₹{result.record.totalInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        {result?.kind === 'enquiry' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-slate-500">Service / Quotation Ticket</p>
                <h2 className="font-mono font-bold text-xl text-[#0B1B36] mt-0.5">
                  {result.record.id}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>{result.record.status}</span>
              </span>
            </div>
            <p className="font-display font-semibold text-base text-[#0B1B36]">
              {result.record.subject}
            </p>
            <p className="text-sm text-slate-600 whitespace-pre-line">{result.record.message}</p>
            <p className="text-xs text-slate-500">
              Location: {result.record.city}, {result.record.state} · Submitted{' '}
              {new Date(result.record.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        )}

        {!result && !error && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl text-center">
            <PackageSearch className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Your live status updates directly whenever our operations team updates your order or
              installation ticket.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
