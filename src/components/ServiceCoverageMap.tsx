import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { COVERAGE_HUBS } from '../data/catalogData.ts';
import type { CoverageHub } from '../types.ts';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

interface MapMarkerPoint {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  lat: number;
  lng: number;
  isHeadquarters?: boolean;
}

function HubAdvancedMarker({
  point,
  isSelected,
  onSelect,
  onClose,
}: {
  point: MapMarkerPoint;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: point.lat, lng: point.lng }}
        title={point.title}
        onClick={onSelect}
      >
        <Pin
          background={point.isHeadquarters ? '#B8860B' : '#0B1B36'}
          borderColor={point.isHeadquarters ? '#785607' : '#C99B2E'}
          glyphColor="#FFFFFF"
          scale={point.isHeadquarters ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={270} onCloseClick={onClose}>
          <div className="p-1 text-left">
            <p className="text-[11px] font-medium text-[#9E7216] mb-0.5">{point.subtitle}</p>
            <h4 className="font-display font-bold text-sm text-[#0B1B36] mb-1">
              {point.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{point.description}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function CameraController({
  focusPoint,
  zoom,
}: {
  focusPoint: { lat: number; lng: number } | null;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focusPoint) return;
    map.panTo(focusPoint);
    map.setZoom(zoom);
  }, [map, focusPoint, zoom]);

  return null;
}

function MapStatusGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B1B36] text-white p-8 text-center">
        <MapPin className="w-8 h-8 text-[#C99B2E] mb-3" />
        <p className="font-display font-semibold text-base mb-1">
          Interactive Map Temporarily Unavailable
        </p>
        <p className="text-sm text-slate-300 max-w-md">
          TRINETRA CCTV SOLUTIONS serves all major districts across Andhra Pradesh and Telangana.
          Contact us directly by phone or WhatsApp for on-site installation scheduling.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

interface ServiceCoverageMapProps {
  mode?: 'coverage' | 'office';
  selectedHubId?: string | null;
  onSelectHub?: (hubId: string | null) => void;
  heightClass?: string;
}

export function ServiceCoverageMap({
  mode = 'coverage',
  selectedHubId = null,
  onSelectHub,
  heightClass = 'h-[400px] sm:h-[460px]',
}: ServiceCoverageMapProps) {
  const { settings } = useBusiness();
  const [internalSelected, setInternalSelected] = useState<string | null>(
    mode === 'office' ? 'hq' : null,
  );

  const activeId = selectedHubId !== null ? selectedHubId : internalSelected;

  const hqPoint: MapMarkerPoint = {
    id: 'hq',
    title: settings.officeLocationName || settings.businessName,
    subtitle: 'Configurable Office Location',
    description: `${settings.address} · ${settings.phone}`,
    lat: settings.officeLat,
    lng: settings.officeLng,
    isHeadquarters: true,
  };

  const hubPoints: MapMarkerPoint[] = COVERAGE_HUBS.map((hub: CoverageHub) => ({
    id: hub.id,
    title: `${hub.city}, ${hub.state}`,
    subtitle: hub.regionLabel,
    description: `Districts served: ${hub.districtsCovered.join(', ')}`,
    lat: hub.lat,
    lng: hub.lng,
  }));

  const points = mode === 'office' ? [hqPoint] : [hqPoint, ...hubPoints];
  const focusedPoint = activeId ? points.find((p) => p.id === activeId) ?? null : null;

  const defaultCenter =
    mode === 'office'
      ? { lat: settings.officeLat, lng: settings.officeLng }
      : { lat: 16.65, lng: 79.85 };
  const defaultZoom = mode === 'office' ? 12 : 6;

  const handleSelect = (id: string) => {
    setInternalSelected(id);
    onSelectHub?.(id);
  };

  const handleClose = () => {
    setInternalSelected(null);
    onSelectHub?.(null);
  };

  if (!MAPS_API_KEY) {
    return (
      <div
        className={`w-full ${heightClass} rounded-xl border border-slate-200 bg-[#0B1B36] text-white flex flex-col items-center justify-center p-8 text-center`}
      >
        <MapPin className="w-8 h-8 text-[#C99B2E] mb-3" />
        <h3 className="font-display font-semibold text-lg mb-1">
          Andhra Pradesh &amp; Telangana Coverage Map
        </h3>
        <p className="text-sm text-slate-300 max-w-md mb-4">
          Google Maps Platform API key is not configured in this environment. Our service teams
          cover Hyderabad, Warangal, Karimnagar, Khammam, Vijayawada, Visakhapatnam, Rajahmundry,
          Tirupati, and Kurnool.
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${settings.officeLat},${settings.officeLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-[#C99B2E] text-[#0B1B36] text-sm font-semibold hover:bg-[#DFB85A] transition-colors"
        >
          Open Location in Google Maps
        </a>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative`}
    >
      <APIProvider
        apiKey={MAPS_API_KEY}
        libraries={['marker']}
        language="en"
        region="IN"
      >
        <MapStatusGuard>
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            gestureHandling="cooperative"
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <CameraController
              focusPoint={focusedPoint ? { lat: focusedPoint.lat, lng: focusedPoint.lng } : null}
              zoom={mode === 'office' ? 13 : 8}
            />
            {points.map((pt) => (
              <HubAdvancedMarker
                key={pt.id}
                point={pt}
                isSelected={activeId === pt.id}
                onSelect={() => handleSelect(pt.id)}
                onClose={handleClose}
              />
            ))}
          </GoogleMap>
        </MapStatusGuard>
      </APIProvider>
    </div>
  );
}
