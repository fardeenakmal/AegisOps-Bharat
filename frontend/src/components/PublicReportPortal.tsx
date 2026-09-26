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
  ArrowRight,
  Mic,
  X
} from 'lucide-react';
import { submitCitizenReport, reverseGeocode, searchLocations } from '../services/api';
import { VoiceRecorderWidget } from './VoiceRecorderWidget';

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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [voiceAudioBase64, setVoiceAudioBase64] = useState<string | undefined>(undefined);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setPortalNotice(msg);
    setTimeout(() => setPortalNotice(null), 4000);
  };

  const handleVoiceTranscription = (data: {
    transcript: string;
    englishTranslation: string;
    detectedLanguage: string;
    audioBase64?: string;
    nlpTriage?: any;
  }) => {
    setRawText(data.transcript);
    setEnglishTranslation(data.englishTranslation);
    setDetectedLanguage(data.detectedLanguage);
    if (data.audioBase64) setVoiceAudioBase64(data.audioBase64);
    if (data.nlpTriage?.estimatedTrapped) setTrappedCount(String(data.nlpTriage.estimatedTrapped));
    if (data.nlpTriage?.estimatedCasualties) setCasualtiesCount(String(data.nlpTriage.estimatedCasualties));
    if (data.nlpTriage?.incidentType) {
      if (['FLOOD', 'FIRE', 'EARTHQUAKE', 'GAS_LEAK'].includes(data.nlpTriage.incidentType)) {
        setCategory(data.nlpTriage.incidentType as any);
      }
    }
  };

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
      showNotice('Geolocation is not supported by your browser.');
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
        showNotice(`Location access notice: ${err.message}. Please enter address manually.`);
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
      showNotice('Please describe what is happening in the incident description box.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullText = `[Category: ${category}] ${rawText} ${trappedCount ? `Trapped: ${trappedCount}` : ''} ${casualtiesCount ? `Casualties: ${casualtiesCount}` : ''}`.trim();

      const res = await submitCitizenReport({
        rawText: fullText,
        normalizedText: englishTranslation ? `[Category: ${category}] ${englishTranslation}` : undefined,
        detectedLanguage,
        latitude,
        longitude,
        reportedAddress,
        reporterName: reporterName || undefined,
        reporterContact: reporterContact !== '+91-' ? reporterContact : undefined,
        submissionChannel: voiceAudioBase64 ? 'VOICE_PWA' : 'MOBILE_PWA',
        zoneId: 'zone-ndma-in',
        voiceAudioBase64
      });

      setSubmissionResult(res);
      onReportSubmitted();
    } catch (err: any) {
      showNotice(`Submission notice: ${err.message || 'Server error'}`);
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
      {portalNotice && (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}
        >
          <span>{portalNotice}</span>
          <button onClick={() => setPortalNotice(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Public Emergency Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: 'rgba(248, 81, 73, 0.15)',
                border: '1px solid rgba(248, 81, 73, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} color="#f85149" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc', letterSpacing: '-0.01em', margin: 0 }}>
                  112 Citizen Emergency Portal
                </h1>
                <span className="badge badge-critical" style={{ fontSize: 9, padding: '1px 5px' }}>PUBLIC INGEST</span>
              </div>
              <p style={{ fontSize: 11, color: '#8b949e', margin: '2px 0 0' }}>
                Direct Dispatch &bull; NDMA &bull; Police &bull; Fire &bull; 108 Ambulance
              </p>
            </div>
          </div>

          <a
            href="tel:112"
            className="btn-danger"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 6
            }}
          >
            <Phone size={13} />
            <span>Call 112 Helpline</span>
          </a>
        </div>
      </div>

      {submissionResult ? (
        /* Report Successfully Submitted Card */
        <div style={{ padding: 20, background: '#161b22', border: '1px solid #30363d', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(46, 160, 67, 0.15)',
              border: '1px solid #2ea043',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}
          >
            <CheckCircle2 size={26} color="#3fb950" />
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f0f6fc', margin: '0 0 4px' }}>
              Emergency Incident Dispatched
            </h2>
            <p style={{ fontSize: 12, color: '#8b949e', margin: 0, lineHeight: 1.4 }}>
              Your report has been analyzed by AI Multilingual Triage and routed to regional first responders.
            </p>
          </div>

          {/* Tracking Ticket */}
          <div
            style={{
              padding: 14,
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                DISASTER TRACKING ID
              </span>
              <span className="badge badge-critical" style={{ fontSize: 9 }}>HIGH PRIORITY DISPATCH</span>
            </div>

            <div className="num-tabular" style={{ fontSize: 18, fontWeight: 700, color: '#58a6ff', fontFamily: 'monospace' }}>
              {submissionResult.report?.trackingId || 'TRK-IND-2026-LIVE'}
            </div>

            <div style={{ fontSize: 12, color: '#c9d1d9' }}>
              📍 <b style={{ color: '#f0f6fc' }}>Location:</b> {submissionResult.incident?.address || reportedAddress}
            </div>

            <div style={{ fontSize: 11, color: '#8b949e' }}>
              🕒 <b style={{ color: '#c9d1d9' }}>Timestamp:</b> {new Date().toLocaleTimeString()} &bull; <b>Status:</b> Live in National Command Matrix
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {onNavigateToWarRoom && (
              <button
                onClick={onNavigateToWarRoom}
                className="btn-primary"
                style={{ padding: '8px 16px', width: '100%', justifyContent: 'center', borderRadius: 6 }}
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
              className="btn-secondary"
              style={{ padding: '8px 16px', width: '100%', justifyContent: 'center', borderRadius: 6 }}
            >
              Report Another Emergency
            </button>
          </div>
        </div>
      ) : (
        /* Public Reporting Form */
        <form
          onSubmit={handleSubmit}
          style={{ padding: 16, background: '#161b22', border: '1px solid #30363d', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Step 1: Emergency Category Selector */}
          <div>
            <label className="form-label" style={{ color: '#f0f6fc', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              1. Select Emergency Type (आपातकाल का प्रकार चुनें)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6 }}>
              {[
                { id: 'FLOOD', label: 'Flood / Rain', sub: 'जलभराव / बाढ़', icon: <Droplets size={14} color="#58a6ff" /> },
                { id: 'FIRE', label: 'Fire / Smoke', sub: 'आग / धुआं', icon: <Flame size={14} color="#f85149" /> },
                { id: 'EARTHQUAKE', label: 'Earthquake', sub: 'भूकंप / मलबे', icon: <Zap size={14} color="#d29922" /> },
                { id: 'GAS_LEAK', label: 'Gas Leak', sub: 'गैस रिसाव', icon: <AlertTriangle size={14} color="#f85149" /> },
                { id: 'MEDICAL', label: 'Medical Trauma', sub: 'चिकित्सा आपातकाल', icon: <Activity size={14} color="#3fb950" /> }
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: category === cat.id ? '1px solid #58a6ff' : '1px solid #30363d',
                    background: category === cat.id ? 'rgba(56, 139, 253, 0.15)' : '#0d1117',
                    minHeight: 52,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cat.icon}
                    <span style={{ fontSize: 11, fontWeight: 600, color: category === cat.id ? '#58a6ff' : '#c9d1d9' }}>{cat.label}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>{cat.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Location with One-Tap GPS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
              <label className="form-label" style={{ color: '#f0f6fc', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                2. Location (स्थान)
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isGeolocating}
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {isGeolocating ? <Loader2 size={11} className="spin-anim" /> : <Navigation size={11} color="#58a6ff" />}
                <span>{isGeolocating ? 'Detecting GPS...' : 'Use GPS Location'}</span>
              </button>
            </div>

            {/* Location Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#8b949e" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search landmark, street, colony, or city..."
                value={searchQuery || reportedAddress}
                onChange={(e) => handleLocationSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, fontSize: 12 }}
              />

              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 25,
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                  }}
                >
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #21262d',
                        fontSize: 11,
                        cursor: 'pointer',
                        color: '#c9d1d9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#21262d')}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                    >
                      <MapPin size={11} color="#58a6ff" style={{ display: 'inline', marginRight: 5 }} />
                      {item.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="num-tabular" style={{ fontSize: 10, color: '#8b949e', marginTop: 4, fontFamily: 'monospace' }}>
              GPS: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E (OSM Verified)
            </div>
          </div>

          {/* Step 3: Situation Description & Vernacular Voice Assistant */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ color: '#f0f6fc', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                3. Describe Situation (विवरण लिखें - 12 Indian Languages)
              </label>
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                className="btn-secondary"
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderColor: showVoiceRecorder ? '#58a6ff' : '#30363d',
                  color: showVoiceRecorder ? '#58a6ff' : '#c9d1d9'
                }}
              >
                <Mic size={12} color={showVoiceRecorder ? '#58a6ff' : '#8b949e'} />
                {showVoiceRecorder ? 'Hide Voice Assistant' : 'Speak (Bhashini AI)'}
              </button>
            </div>

            {/* Bhashini Voice Recorder Component */}
            {showVoiceRecorder && (
              <VoiceRecorderWidget
                onTranscriptionComplete={handleVoiceTranscription}
                latitude={latitude}
                longitude={longitude}
              />
            )}

            <textarea
              required
              rows={3}
              placeholder="Explain what is happening (e.g. water level, trapped victims, fire, hazards)... Or tap 'Speak (Bhashini AI)' above."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical', fontSize: 12, lineHeight: 1.4 }}
            />

            {/* Real-time English EOC Translation preview */}
            {englishTranslation && (
              <div
                style={{
                  marginTop: 6,
                  padding: '8px 12px',
                  background: 'rgba(46, 160, 67, 0.1)',
                  border: '1px solid rgba(46, 160, 67, 0.3)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#3fb950',
                  lineHeight: 1.4
                }}
              >
                <span style={{ fontWeight: 600, color: '#f0f6fc' }}>EOC English Translation: </span>
                {englishTranslation}
              </div>
            )}

            {/* Quick Templates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: '#8b949e' }}>Quick presets (click to insert):</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {situationPresets.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setRawText(preset.text)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 10,
                      background: '#0d1117',
                      border: '1px solid #30363d',
                      borderRadius: 4,
                      color: '#c9d1d9',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.borderColor = '#58a6ff')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.borderColor = '#30363d')}
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
                className="form-input num-tabular"
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
                className="form-input num-tabular"
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
              className="form-input num-tabular"
              style={{ fontSize: 12 }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-danger"
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              borderRadius: 6
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="spin-anim" />
                <span>Processing AI Triage & Dispatching...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Transmit 112 Emergency Report (आपातकालीन रिपोर्ट भेजें)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
