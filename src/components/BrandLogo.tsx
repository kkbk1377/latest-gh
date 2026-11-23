import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
}

/**
 * Renders the owner-uploaded custom logo when configured in Admin Settings,
 * or defaults to the original TRINETRA CCTV-aperture geometric SVG emblem.
 */
export function BrandLogo({ variant = 'dark', compact = false }: BrandLogoProps) {
  const { settings } = useBusiness();
  const [imgFailed, setImgFailed] = useState(false);
  const isLightText = variant === 'light';
  const showCustomLogo = Boolean(settings.logoUrl && !imgFailed);

  const shortTitle =
    settings.businessName.toUpperCase().startsWith('TRINETRA')
      ? 'TRINETRA'
      : settings.businessName.split(' ')[0] || 'TRINETRA';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      {showCustomLogo ? (
        <img
          src={settings.logoUrl}
          alt={settings.businessName}
          onError={() => setImgFailed(true)}
          className={`${compact ? 'h-7' : 'h-8'} w-auto max-w-[130px] object-contain rounded-sm shrink-0`}
        />
      ) : (
        <svg
          width={compact ? 28 : 32}
          height={compact ? 28 : 32}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect
            x="2"
            y="2"
            width="32"
            height="32"
            rx="7"
            fill={isLightText ? '#13294E' : '#0B1B36'}
            stroke="#C99B2E"
            strokeWidth="1.5"
          />
          <path
            d="M18 6.5L28 15.2C25.2 12.6 21.8 11.2 18 11.2C14.2 11.2 10.8 12.6 8 15.2L18 6.5Z"
            fill="#C99B2E"
            fillOpacity="0.28"
          />
          <path
            d="M7.5 18.5C10.3 14.2 14 12.2 18 12.2C22 12.2 25.7 14.2 28.5 18.5C25.7 22.8 22 24.8 18 24.8C14 24.8 10.3 22.8 7.5 18.5Z"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="18.5" r="4.3" stroke="#C99B2E" strokeWidth="1.7" />
          <circle cx="18" cy="18.5" r="1.7" fill="#FFFFFF" />
          <circle cx="19.5" cy="17.1" r="0.65" fill="#DFB85A" />
        </svg>
      )}
      <span
        className={`font-display font-bold tracking-tight text-base sm:text-lg ${
          isLightText ? 'text-white' : 'text-[#0B1B36]'
        }`}
      >
        {shortTitle}
      </span>
    </span>
  );
}
