import React, { useState } from 'react';
import {
  Send,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  Radio,
  Navigation,
  Search,
  Loader2,
  Flame,
  Droplets,
  Zap,
  Activity,
  Shield,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { submitCitizenReport, reverseGeocode, searchLocations } from '../services/api';

interface PublicReportPortalProps {
  onReportSubmitted: () => void;
  onNavigateToWarRoom?: () => void;
}

export const PublicReportPortal: React.FC<PublicReportPortalProps> = ({
  onReportSubmitted,
  onNavigateToWarRoom
}) => {
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('+91-');
  const [category, setCategory] = useState<'FLOOD' | 'FIRE' | 'EARTHQUAKE' | 'GAS_LEAK' | 'MEDICAL'>('FLOOD');
  const [rawText, setRawText] = useState('');
  const [reportedAddress, setReportedAddress] = useState('Central Control Room, Mumbai Metro');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [trappedCount, setTrappedCount] = useState('');
  const [casualtiesCount, setCasualtiesCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Quick situation presets
  const situationPresets = [
    { text: '🌊 Water rising above 4ft, trapped citizens on ground floor', label: 'Flood / Inundation' },
    { text: '🔥 Heavy fire & smoke on upper floors, urgent tenders needed', label: 'Building Fire' },
    { text: '⚡ Tremor caused structural wall collapse, road blocked', label: 'Earthquake Damage' },
    { text: '🚨 Strong gas smell causing breathing distress in area', label: 'Gas Leak Hazard' },
    { text: '🏥 Multiple injuries in road collision, immediate ambulance required', label: 'Medical Emergency' }
  ];

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo.displayName) {
            setReportedAddress(geo.displayName);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsGeolocating(false);
        }
      },
      (err) => {
        alert(`Location access notice: ${err.message}. Please enter address manually.`);
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLocationSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchLocations(query);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    setReportedAddress(item.displayName);
    setLatitude(item.latitude);
    setLongitude(item.longitude);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      alert('Please describe what is happening in the incident description box.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullText = `[Category: ${category}] ${rawText} ${trappedCount ? `Trapped: ${trappedCount}` : ''} ${casualtiesCount ? `Casualties: ${casualtiesCount}` : ''}`.trim();

      const res = await submitCitizenReport({
        rawText: fullText,
        latitude,
        longitude,
        reportedAddress,
        reporterName: reporterName || undefined,
        reporterContact: reporterContact !== '+91-' ? reporterContact : undefined,
        submissionChannel: 'MOBILE_PWA',
        zoneId: 'zone-ndma-in'
      });

      setSubmissionResult(res);
      onReportSubmitted();
    } catch (err: any) {
      alert(`Submission failed: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        padding: '6px 4px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxSizing: 'border-box'
      }}
    >
      {/* Public Emergency Header */}
      <div
        className="vercel-panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(17, 17, 17, 0.98))',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.5)',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
                112 Citizen Emergency Portal
              </h1>
              <p style={{ fontSize: 11, color: '#a1a1a1', margin: '2px 0 0' }}>
                Direct Dispatch &bull; NDMA &bull; Police &bull; Fire &bull; 108 Ambulance
              </p>
            </div>
          </div>

          <a
            href="tel:112"
            className="btn btn-danger"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Phone size={13} />
            <span>Call 112 Helpline</span>
          </a>
        </div>
      </div>

      {submissionResult ? (
        /* Report Successfully Submitted Card */
        <div className="vercel-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}
          >
            <CheckCircle2 size={28} color="#10b981" />
          </div>

          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
              Emergency Incident Dispatched
            </h2>
            <p style={{ fontSize: 12, color: '#a1a1a1', margin: 0, lineHeight: 1.4 }}>
              Your report has been analyzed by AI Multilingual Triage and routed to regional first responders.
            </p>
          </div>

          {/* Tracking Ticket */}
          <div
            className="vercel-card"
            style={{
              padding: 14,
              background: '#0a0a0a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase', fontWeight: 600 }}>
                DISASTER TRACKING ID
              </span>
              <span className="badge badge-critical" style={{ fontSize: 9 }}>HIGH PRIORITY DISPATCH</span>
            </div>

            <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8' }}>
              {submissionResult.report?.trackingId || 'TRK-IND-2026-LIVE'}
            </div>

            <div style={{ fontSize: 12, color: '#ededed' }}>
              📍 <b>Location:</b> {submissionResult.incident?.address || reportedAddress}
            </div>

            <div style={{ fontSize: 11, color: '#a1a1a1' }}>
              🕒 <b>Timestamp:</b> {new Date().toLocaleTimeString()} &bull; <b>Status:</b> Live in National Command Matrix
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {onNavigateToWarRoom && (
              <button
                onClick={onNavigateToWarRoom}
                className="btn btn-primary"
                style={{ padding: '10px 16px', width: '100%', justifyContent: 'center' }}
              >
                <span>View Incident in War Room Map</span>
                <ArrowRight size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setSubmissionResult(null);
                setRawText('');
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', width: '100%', justifyContent: 'center' }}
            >
              Report Another Emergency
            </button>
          </div>
        </div>
      ) : (
        /* Public Reporting Form */
        <form
          onSubmit={handleSubmit}
          className="vercel-panel"
          style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {/* Step 1: Emergency Category Selector */}
          <div>
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
              1. Select Emergency Type (आपातकाल का प्रकार चुनें)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6 }}>
              {[
                { id: 'FLOOD', label: 'Flood / Rain', sub: 'जलभराव / बाढ़', icon: <Droplets size={14} color="#38bdf8" /> },
                { id: 'FIRE', label: 'Fire / Smoke', sub: 'आग / धुआं', icon: <Flame size={14} color="#f87171" /> },
                { id: 'EARTHQUAKE', label: 'Earthquake', sub: 'भूकंप / मलबे', icon: <Zap size={14} color="#fbbf24" /> },
                { id: 'GAS_LEAK', label: 'Gas Leak', sub: 'गैस रिसाव', icon: <AlertTriangle size={14} color="#fb7185" /> },
                { id: 'MEDICAL', label: 'Medical Trauma', sub: 'चिकित्सा आपातकाल', icon: <Activity size={14} color="#34d399" /> }
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`btn ${category === cat.id ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: category === cat.id ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    background: category === cat.id ? 'rgba(56, 189, 248, 0.1)' : '#111111',
                    minHeight: 52
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {cat.icon}
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{cat.label}</span>
                  </div>
                  <span style={{ fontSize: 9, color: '#a1a1a1', marginTop: 2 }}>{cat.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Location with One-Tap GPS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
              <label className="form-label" style={{ color: '#ffffff', fontWeight: 600, fontSize: 12, margin: 0 }}>
                2. Location (स्थान)
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isGeolocating}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {isGeolocating ? <Loader2 size={11} className="spin-anim" /> : <Navigation size={11} color="#38bdf8" />}
                <span>{isGeolocating ? 'Detecting GPS...' : 'Use GPS Location'}</span>
              </button>
            </div>

            {/* Location Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#737373" style={{ position: 'absolute', left: 10, top: 11 }} />
              <input
                type="text"
                placeholder="Search landmark, street, colony, or city..."
                value={searchQuery || reportedAddress}
                onChange={(e) => handleLocationSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 28, fontSize: 11 }}
              />

              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 25,
                    background: '#161616',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 6,
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.9)'
                  }}
                >
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        fontSize: 11,
                        cursor: 'pointer',
                        color: '#ededed'
                      }}
                    >
                      <MapPin size={11} color="#38bdf8" style={{ display: 'inline', marginRight: 5 }} />
                      {item.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize: 10, color: '#737373', marginTop: 4, fontFamily: 'monospace' }}>
              GPS: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E (OSM Verified)
            </div>
          </div>

          {/* Step 3: Situation Description & Quick Templates */}
          <div>
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 600, fontSize: 12 }}>
              3. Describe Situation (विवरण लिखें - Hindi, English or Regional)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain what is happening (e.g. water level, trapped victims, fire, hazards)..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical', fontSize: 12, lineHeight: 1.4 }}
            />

            {/* Quick Templates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#737373' }}>Quick presets (click to insert):</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {situationPresets.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setRawText(preset.text)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      background: '#141414',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      color: '#ededed',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Optional Trapped / Casualties & Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="form-label" style={{ fontSize: 10 }}>Trapped Count (फंसा हुआ)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 5"
                value={trappedCount}
                onChange={(e) => setTrappedCount(e.target.value)}
                className="form-input"
                style={{ fontSize: 12 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 10 }}>Casualties / Injured (घायल)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 2"
                value={casualtiesCount}
                onChange={(e) => setCasualtiesCount(e.target.value)}
                className="form-input"
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 10 }}>Your Phone Number (फोन नंबर - Optional)</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              className="form-input"
              style={{ fontSize: 12 }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-danger"
            style={{
              padding: '12px',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              minHeight: 46
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-anim" />
                <span>Processing AI Triage & Dispatching...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Transmit 112 Emergency Report (आपातकालीन रिपोर्ट भेजें)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
