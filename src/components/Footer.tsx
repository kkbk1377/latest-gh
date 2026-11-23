import { Mail, MapPin, MessageCircle, Phone, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { formatTelUrl, formatWhatsAppUrl } from '../data/catalogData.ts';
import { BrandLogo } from './BrandLogo.tsx';

export function Footer() {
  const { settings } = useBusiness();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#061022] text-slate-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link to="/" aria-label="TRINETRA CCTV SOLUTIONS Home">
              <BrandLogo variant="light" />
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed">
              {settings.businessName} provides end-to-end CCTV online store sales, structured
              installation, DVR/NVR configuration, hardware replacement, and annual maintenance
              across {settings.serviceAreas.join(' & ')}.
            </p>
            <p className="text-xs text-[#DFB85A] font-medium">
              Official Domain: {settings.domain.replace(/^https?:\/\//, '')}
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h3 className="font-display font-semibold text-sm text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/solutions" className="hover:text-[#DFB85A] transition-colors">
                  Smart CCTV &amp; ELV Solutions
                </Link>
              </li>
              <li>
                <Link to="/store" className="hover:text-[#DFB85A] transition-colors">
                  Online CCTV Store (23 Sub-Categories)
                </Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-[#DFB85A] transition-colors">
                  HD &amp; IP CCTV Package Builder
                </Link>
              </li>
              <li>
                <Link to="/guides" className="hover:text-[#DFB85A] transition-colors">
                  CCTV Buyer Guides &amp; Policies
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#DFB85A] transition-colors">
                  Installation &amp; Repair Services
                </Link>
              </li>
              <li>
                <Link to="/coverage" className="hover:text-[#DFB85A] transition-colors">
                  AP &amp; Telangana Coverage Map
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-[#DFB85A] transition-colors">
                  Track Order / Service Ticket
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#DFB85A] transition-colors">
                  Contact &amp; Site Survey
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Core Services */}
          <div>
            <h3 className="font-display font-semibold text-sm text-white mb-4">Core Services</h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>CCTV Camera Installation</li>
              <li>DVR &amp; NVR Setup</li>
              <li>CCTV Repair &amp; Troubleshooting</li>
              <li>Surveillance Hard Disk Replacement</li>
              <li>Network &amp; PoE Configuration</li>
              <li>Annual Maintenance Contracts (AMC)</li>
            </ul>
          </div>

          {/* Column 4: Live Editable Contact Details */}
          <div>
            <h3 className="font-display font-semibold text-sm text-white mb-4">
              Contact &amp; Service Desk
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={formatTelUrl(settings.phone)}
                  className="inline-flex items-center gap-2.5 hover:text-[#DFB85A] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#C99B2E] shrink-0" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{settings.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={formatWhatsAppUrl(
                    settings.whatsapp,
                    `Hello ${settings.businessName}, I need assistance with CCTV sales or installation.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-[#DFB85A] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#C99B2E] shrink-0" aria-hidden="true" />
                  <span>WhatsApp Support ({settings.whatsapp})</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex items-center gap-2.5 hover:text-[#DFB85A] transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-[#C99B2E] shrink-0" aria-hidden="true" />
                  <span>{settings.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-[#C99B2E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{settings.address}</span>
              </li>
            </ul>
            <p className="text-xs text-slate-400 mt-4">{settings.businessHours}</p>
          </div>
        </div>

        {/* Bottom Legal & Admin Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {year} {settings.businessName}. Serving Andhra Pradesh &amp; Telangana, India.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/guides#policy-shipping" className="text-slate-400 hover:text-[#DFB85A] transition-colors">
              Shipping Policy
            </Link>
            <Link to="/guides#policy-warranty" className="text-slate-400 hover:text-[#DFB85A] transition-colors">
              Warranty &amp; Returns
            </Link>
            <Link to="/guides#policy-privacy" className="text-slate-400 hover:text-[#DFB85A] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/track" className="text-slate-400 hover:text-[#DFB85A] transition-colors">
              Order Tracker
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-slate-200 font-medium hover:text-[#DFB85A] transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#C99B2E]" aria-hidden="true" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
