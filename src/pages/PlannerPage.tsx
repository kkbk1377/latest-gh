import {
  ArrowRight,
  Calculator,
  HardDrive,
  MessageCircle,
  Printer,
  Router,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';

type PremisesKey = 'home' | 'shop' | 'office' | 'apartment' | 'warehouse';
type SystemArchitecture = 'ip-nvr' | 'hd-dvr';
type ResolutionKey = '2MP' | '4MP' | '5MP' | '8MP';
type CodecKey = 'H.265+' | 'H.264';
type RecordingMode = 'continuous' | 'motion';

const PREMISES_PRESETS: Record<
  PremisesKey,
  {
    label: string;
    outdoorCount: number;
    indoorCount: number;
    arch: SystemArchitecture;
    resolution: ResolutionKey;
    retentionDays: number;
    avgCablePerCamMeters: number;
  }
> = {
  home: {
    label: 'Home / Villa',
    outdoorCount: 3,
    indoorCount: 1,
    arch: 'hd-dvr',
    resolution: '2MP',
    retentionDays: 15,
    avgCablePerCamMeters: 22,
  },
  shop: {
    label: 'Retail Shop / Showroom',
    outdoorCount: 2,
    indoorCount: 4,
    arch: 'hd-dvr',
    resolution: '4MP',
    retentionDays: 30,
    avgCablePerCamMeters: 20,
  },
  office: {
    label: 'Corporate Office',
    outdoorCount: 2,
    indoorCount: 6,
    arch: 'ip-nvr',
    resolution: '4MP',
    retentionDays: 30,
    avgCablePerCamMeters: 28,
  },
  apartment: {
    label: 'Apartment / Gated Society',
    outdoorCount: 10,
    indoorCount: 6,
    arch: 'ip-nvr',
    resolution: '4MP',
    retentionDays: 30,
    avgCablePerCamMeters: 40,
  },
  warehouse: {
    label: 'Warehouse / Factory',
    outdoorCount: 12,
    indoorCount: 12,
    arch: 'ip-nvr',
    resolution: '5MP',
    retentionDays: 45,
    avgCablePerCamMeters: 50,
  },
};

// Typical realistic camera bitrates in Mbps per camera under H.265+ vs H.264 at 15-20 fps
const BITRATE_MBPS: Record<ResolutionKey, Record<CodecKey, number>> = {
  '2MP': { 'H.265+': 1.2, 'H.264': 2.5 },
  '4MP': { 'H.265+': 2.2, 'H.264': 4.2 },
  '5MP': { 'H.265+': 2.8, 'H.264': 5.2 },
  '8MP': { 'H.265+': 4.5, 'H.264': 8.5 },
};

function recommendHddSpec(requiredTb: number): string {
  if (requiredTb <= 0.9) return '1 TB Surveillance SATA HDD';
  if (requiredTb <= 1.85) return '2 TB Surveillance SATA HDD';
  if (requiredTb <= 3.7) return '4 TB Surveillance SATA HDD';
  if (requiredTb <= 5.6) return '6 TB Surveillance SATA HDD';
  if (requiredTb <= 7.5) return '8 TB Surveillance SATA HDD';
  if (requiredTb <= 11.2) return '2 × 6 TB Surveillance HDDs (Dual-Bay Recorder)';
  if (requiredTb <= 15.0) return '2 × 8 TB Surveillance HDDs (Dual-Bay Recorder)';
  const bays = Math.ceil(requiredTb / 7.5);
  return `${bays} × 8 TB Surveillance HDDs (Multi-Bay Enterprise NVR)`;
}

function recommendRecorderChannels(totalCameras: number): number {
  if (totalCameras <= 4) return 4;
  if (totalCameras <= 8) return 8;
  if (totalCameras <= 16) return 16;
  if (totalCameras <= 32) return 32;
  return 64;
}

export function PlannerPage() {
  const { settings, openQuoteModal } = useBusiness();

  const [premises, setPremises] = useState<PremisesKey>('shop');
  const [outdoorCount, setOutdoorCount] = useState<number>(2);
  const [indoorCount, setIndoorCount] = useState<number>(4);
  const [arch, setArch] = useState<SystemArchitecture>('ip-nvr');
  const [resolution, setResolution] = useState<ResolutionKey>('4MP');
  const [codec, setCodec] = useState<CodecKey>('H.265+');
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('continuous');
  const [retentionDays, setRetentionDays] = useState<number>(30);

  const applyPreset = (key: PremisesKey) => {
    const preset = PREMISES_PRESETS[key];
    setPremises(key);
    setOutdoorCount(preset.outdoorCount);
    setIndoorCount(preset.indoorCount);
    setArch(preset.arch);
    setResolution(preset.resolution);
    setRetentionDays(preset.retentionDays);
  };

  const plan = useMemo(() => {
    const totalCameras = Math.max(1, outdoorCount + indoorCount);
    const bitratePerCam = BITRATE_MBPS[resolution][codec];
    const dutyFactor = recordingMode === 'continuous' ? 1.0 : 0.55;
    const totalBandwidthMbps = Number((totalCameras * bitratePerCam).toFixed(1));
    // GB per day = Mbps * 86400s / 8 / 1024
    const gbPerDay = totalCameras * bitratePerCam * dutyFactor * 10.546875;
    const totalTb = Number(((gbPerDay * retentionDays) / 1024).toFixed(2));
    const channels = recommendRecorderChannels(totalCameras);
    const hddSpec = recommendHddSpec(totalTb);
    const avgMeters = PREMISES_PRESETS[premises].avgCablePerCamMeters;
    const estimatedCableMeters = Math.ceil((totalCameras * avgMeters) / 10) * 10;
    const cableRolls =
      arch === 'ip-nvr'
        ? `${Math.ceil(estimatedCableMeters / 305)} × 305m Cat6 Pure Copper Box (~${estimatedCableMeters}m est.)`
        : `${Math.ceil(estimatedCableMeters / 90)} × 90m Coaxial 3+1 Rolls (~${estimatedCableMeters}m est.)`;

    const powerSpec =
      arch === 'ip-nvr'
        ? totalCameras <= 8
          ? '1 × 8-Port Gigabit PoE Switch (with Uplink)'
          : totalCameras <= 16
            ? '1 × 16-Port Gigabit PoE Switch (or 2 × 8-Port PoE)'
            : `${Math.ceil(totalCameras / 16)} × 16-Port Gigabit PoE Switches`
        : totalCameras <= 4
          ? '1 × 4-Channel 12V SMPS Power Supply'
          : totalCameras <= 8
            ? '1 × 8-Channel 12V 10A SMPS Power Supply'
            : `${Math.ceil(totalCameras / 16)} × 16-Channel 12V 20A SMPS Power Supply`;

    const rackSize = channels <= 8 ? '2U / 4U Wall-Mount Lockable Rack' : '6U / 9U Network & Recorder Rack';
    const connectors =
      arch === 'ip-nvr'
        ? `${totalCameras * 2 + 4} × Cat6 RJ45 Modular Connectors`
        : `${totalCameras * 2} × Copper BNC Connectors + ${totalCameras} × 12V DC Pins`;

    const summaryText = [
      `TRINETRA CCTV System Plan (${PREMISES_PRESETS[premises].label})`,
      `- Architecture: ${arch === 'ip-nvr' ? 'PoE Network IP + NVR' : 'HD Analog + DVR'} (${resolution}, ${codec})`,
      `- Cameras: ${totalCameras} total (${outdoorCount} Outdoor Bullet + ${indoorCount} Indoor Dome)`,
      `- Recorder: ${channels}-Channel ${arch === 'ip-nvr' ? 'NVR' : 'DVR'}`,
      `- Storage: ${totalTb} TB required for ${retentionDays} days (${recordingMode}) → ${hddSpec}`,
      `- Power/Network: ${powerSpec}`,
      `- Cabling: ${cableRolls}`,
      `- Accessories: ${totalCameras} × PVC Junction Boxes, ${connectors}, ${rackSize}`,
    ].join('\n');

    return {
      totalCameras,
      totalBandwidthMbps,
      gbPerDay: Math.round(gbPerDay),
      totalTb,
      channels,
      hddSpec,
      cableRolls,
      powerSpec,
      rackSize,
      connectors,
      summaryText,
    };
  }, [premises, outdoorCount, indoorCount, arch, resolution, codec, recordingMode, retentionDays]);

  return (
    <div className="bg-[#F8FAFC] min-h-[80vh]">
      {/* Header */}
      <section className="bg-[#0B1B36] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#DFB85A] mb-2">
            Interactive Security Engineering Tool
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-3">
            CCTV System Planner &amp; Storage Calculator
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Configure your premises below to compute exact surveillance hard disk capacity, recorder
            channels, PoE/SMPS power requirements, cabling, and a complete Bill of Quantities (BoQ)
            before purchasing.
          </p>
        </div>
      </section>

      {/* Interactive Calculator Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Controls */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2.5">
                01. Select Premises Preset
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PREMISES_PRESETS) as PremisesKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      premises === key
                        ? 'bg-[#0B1B36] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {PREMISES_PRESETS[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <label htmlFor="outdoor-slider">Outdoor Bullet Cameras</label>
                  <span className="font-mono tabular-nums text-[#0B1B36] text-sm">
                    {outdoorCount}
                  </span>
                </div>
                <input
                  id="outdoor-slider"
                  type="range"
                  min={0}
                  max={32}
                  value={outdoorCount}
                  onChange={(e) => setOutdoorCount(Number(e.target.value))}
                  className="w-full accent-[#0B1B36]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <label htmlFor="indoor-slider">Indoor Dome Cameras</label>
                  <span className="font-mono tabular-nums text-[#0B1B36] text-sm">
                    {indoorCount}
                  </span>
                </div>
                <input
                  id="indoor-slider"
                  type="range"
                  min={0}
                  max={32}
                  value={indoorCount}
                  onChange={(e) => setIndoorCount(Number(e.target.value))}
                  className="w-full accent-[#0B1B36]"
                />
              </div>
            </div>

            {/* Architecture & Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">System Architecture</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setArch('ip-nvr')}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      arch === 'ip-nvr'
                        ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    PoE IP + NVR
                  </button>
                  <button
                    type="button"
                    onClick={() => setArch('hd-dvr')}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      arch === 'hd-dvr'
                        ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    HD Analog + DVR
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Camera Resolution</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['2MP', '4MP', '5MP', '8MP'] as ResolutionKey[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`py-2.5 text-xs font-mono font-semibold rounded-lg border cursor-pointer ${
                        resolution === res
                          ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Codec & Recording Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Compression Codec</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['H.265+', 'H.264'] as CodecKey[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCodec(c)}
                      className={`py-2 px-3 text-xs font-mono font-semibold rounded-lg border cursor-pointer ${
                        codec === c
                          ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Recording Schedule</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordingMode('continuous')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      recordingMode === 'continuous'
                        ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    24×7 Continuous
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordingMode('motion')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      recordingMode === 'motion'
                        ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Motion Triggered
                  </button>
                </div>
              </div>
            </div>

            {/* Retention Days */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <label htmlFor="retention-slider">Footage Retention Target</label>
                <span className="font-mono tabular-nums text-[#0B1B36] text-sm">
                  {retentionDays} Days
                </span>
              </div>
              <input
                id="retention-slider"
                type="range"
                min={7}
                max={90}
                step={1}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full accent-[#0B1B36]"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>7d</span>
                <span>15d</span>
                <span>30d</span>
                <span>60d</span>
                <span>90d</span>
              </div>
            </div>
          </div>

          {/* Right Live Technical Specification & BoQ Output */}
          <div className="lg:col-span-6 space-y-5">
            {/* Key Computed Numbers */}
            <div className="bg-[#0B1B36] text-white rounded-xl p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-medium text-[#DFB85A]">Computed Engineering Spec</p>
                  <h2 className="font-display font-bold text-xl mt-0.5">
                    {plan.totalCameras}-Camera {arch === 'ip-nvr' ? 'IP PoE' : 'HD Analog'} Blueprint
                  </h2>
                </div>
                <Calculator className="w-6 h-6 text-[#DFB85A] shrink-0" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15">
                <div>
                  <p className="text-xs text-slate-300">Storage Needed</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#DFB85A] mt-0.5">
                    {plan.totalTb} TB
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ~{plan.gbPerDay} GB / day
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-300">Recorder Size</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-0.5">
                    {plan.channels} Ch
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {arch === 'ip-nvr' ? 'Network NVR' : 'Turbo HD DVR'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-300">Video Bitrate</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-0.5">
                    {plan.totalBandwidthMbps} Mbps
                  </p>
                  <p className="text-[11px] text-slate-400">Aggregate stream</p>
                </div>
              </div>
            </div>

            {/* Itemized Bill of Quantities */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-4">
              <h3 className="font-display font-bold text-base text-[#0B1B36]">
                Recommended Bill of Quantities (BoQ)
              </h3>

              <dl className="divide-y divide-slate-100 text-sm">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Cameras</dt>
                  <dd className="font-medium text-[#0B1B36] text-right">
                    {outdoorCount} Outdoor Bullet + {indoorCount} Indoor Dome ({resolution})
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500 inline-flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#9E7216]" />
                    <span>Surveillance HDD</span>
                  </dt>
                  <dd className="font-semibold text-[#0B1B36] text-right">{plan.hddSpec}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Recorder</dt>
                  <dd className="font-medium text-[#0B1B36] text-right">
                    1 × {plan.channels}-Channel {arch === 'ip-nvr' ? '4K IP NVR' : 'HD DVR'} ({codec})
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500 inline-flex items-center gap-1.5">
                    <Router className="w-3.5 h-3.5 text-[#9E7216]" />
                    <span>Power / PoE</span>
                  </dt>
                  <dd className="font-medium text-[#0B1B36] text-right">{plan.powerSpec}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Cabling</dt>
                  <dd className="font-medium text-[#0B1B36] text-right">{plan.cableRolls}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Enclosures &amp; Connectors</dt>
                  <dd className="font-medium text-[#0B1B36] text-right">
                    {plan.totalCameras} × PVC Boxes · {plan.connectors} · {plan.rackSize}
                  </dd>
                </div>
              </dl>

              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    openQuoteModal({
                      subject: `Custom ${plan.totalCameras}-Camera ${resolution} CCTV BoQ Quote`,
                      cameraCount: `${plan.totalCameras} Cameras (${resolution})`,
                      message: plan.summaryText,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                >
                  <span>Get Exact Price Quote</span>
                  <ArrowRight className="w-4 h-4 text-[#DFB85A]" />
                </button>

                <a
                  href={formatWhatsAppUrl(
                    settings.whatsapp,
                    `Hello ${settings.businessName}, please share a quote for this planned CCTV system:\n\n${plan.summaryText}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:border-[#0B1B36]"
                >
                  <MessageCircle className="w-4 h-4 text-[#9E7216]" />
                  <span>Send Plan on WhatsApp</span>
                </a>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0B1B36] font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Technical BoQ</span>
                </button>
                <Link
                  to="/store"
                  className="font-semibold text-[#9E7216] hover:underline"
                >
                  Shop Cameras &amp; Recorders in Store →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
