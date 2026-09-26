import React, { useState } from 'react';
import {
  X,
  Send,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  Navigation,
  Search,
  Loader2,
  Mic
} from 'lucide-react';
import { submitCitizenReport, reverseGeocode, searchLocations } from '../services/api';
import { VoiceRecorderWidget } from './VoiceRecorderWidget';

interface CitizenReportingModalProps {
  onClose: () => void;
  onReportSubmitted: () => void;
}

export const CitizenReportingModal: React.FC<CitizenReportingModalProps> = ({
  onClose,
  onReportSubmitted
}) => {
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('+91-');
  const [rawText, setRawText] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [voiceAudioBase64, setVoiceAudioBase64] = useState<string | undefined>(undefined);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [reportedAddress, setReportedAddress] = useState('Central Operations Grid, India');
  const [latitude, setLatitude] = useState(22.0);
  const [longitude, setLongitude] = useState(78.9629);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Auto-detect GPS location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
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
        console.warn('Geolocation notice:', err.message);
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

  const handleCoordsChange = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    try {
      const geo = await reverseGeocode(lat, lng);
      if (geo.displayName) {
        setReportedAddress(geo.displayName);
      }
    } catch (err) {
      // Keep existing address
    }
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await submitCitizenReport({
        reporterName: reporterName || 'Citizen Reporter',
        reporterContact: reporterContact || '+91-98000-00000',
        rawText,
        normalizedText: englishTranslation || undefined,
        detectedLanguage,
        reportedAddress,
        latitude,
        longitude,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
        submissionChannel: voiceAudioBase64 ? 'VOICE_PWA' : 'MOBILE_PWA',
        voiceAudioBase64
      });

      setSubmissionResult(res);
      onReportSubmitted();
    } catch (err: any) {
      showToast(`Submission notice: ${err.message || 'Error reaching emergency intake'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      className="modal-overlay"
    >
      <div
        className="modal-content vercel-card"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {toastMsg && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 50
            }}
          >
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                background: 'rgba(248, 81, 73, 0.15)',
                border: '1px solid rgba(248, 81, 73, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={16} color="#f85149" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  Report Emergency Incident
                </h3>
                <span className="badge badge-critical" style={{ fontSize: 9, padding: '1px 5px' }}>PRIORITY FEED</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Direct ingestion into State Disaster Management & 112 Triage Grid
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4, height: 28, width: 28 }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {submissionResult ? (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(46, 160, 67, 0.15)',
                  border: '1px solid #2ea043',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <CheckCircle2 size={28} color="#3fb950" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Incident Report Ingested & Verified
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                {submissionResult.message}
              </p>

              <div
                className="vercel-card"
                style={{
                  padding: 16,
                  textAlign: 'left',
                  marginBottom: 20,
                  background: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tracking ID</span>
                  <span className="num-tabular font-mono" style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                    {submissionResult.trackingId}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Severity Classification</span>
                  <span
                    className={`badge ${
                      submissionResult.incident?.severityLabel === 'CRITICAL' ? 'badge-critical' : 'badge-medium'
                    }`}
                  >
                    {submissionResult.incident?.severityLabel} ({submissionResult.incident?.severityScore}/100)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SLA Response Target</span>
                  <span className="num-tabular" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {submissionResult.incident?.slaTargetMinutes || 10} Minutes
                  </span>
                </div>
              </div>

              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '10px 16px', borderRadius: 6, fontWeight: 600 }}>
                Return to War Room
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Situation Description Header + Voice Toggle */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Emergency Situation *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    className="btn btn-secondary"
                    style={{
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      borderColor: showVoiceRecorder ? '#38bdf8' : undefined,
                      color: showVoiceRecorder ? '#38bdf8' : undefined
                    }}
                  >
                    <Mic size={12} color={showVoiceRecorder ? '#38bdf8' : 'var(--text-muted)'} />
                    <span>{showVoiceRecorder ? 'Close Voice AI' : 'Voice Input (12 Languages)'}</span>
                  </button>
                </div>

                {/* Bhashini Voice Recorder Widget */}
                {showVoiceRecorder && (
                  <div style={{ marginBottom: 10 }}>
                    <VoiceRecorderWidget
                      onTranscriptionComplete={handleVoiceTranscription}
                      latitude={latitude}
                      longitude={longitude}
                    />
                  </div>
                )}

                {/* Free Text Description */}
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what happened: incident type, trapped persons, injuries, urgent needs (e.g., water rescue boats, ambulance)..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />

                {englishTranslation && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: 'rgba(46, 160, 67, 0.1)',
                      border: '1px solid rgba(46, 160, 67, 0.3)',
                      borderRadius: 6,
                      fontSize: 11,
                      color: '#86efac',
                      lineHeight: 1.4
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>EOC Translation ({detectedLanguage.toUpperCase()}): </span>
                    {englishTranslation}
                  </div>
                )}
              </div>

              {/* Location Search & GPS Auto-detection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                    <MapPin size={12} color="#38bdf8" /> Incident Location *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isGeolocating}
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Navigation size={11} color="#38bdf8" />
                    <span>{isGeolocating ? 'Detecting GPS...' : 'My GPS'}</span>
                  </button>
                </div>

                {/* Search Bar with Nominatim Autocomplete */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Search landmark, street, city, pin code in India..."
                    value={searchQuery}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: 32 }}
                  />
                  <div style={{ position: 'absolute', right: 10, top: 8, color: 'var(--text-muted)' }}>
                    {searching ? <Loader2 size={13} className="spin-anim" /> : <Search size={13} />}
                  </div>

                  {searchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                        marginTop: 4,
                        maxHeight: 180,
                        overflowY: 'auto'
                      }}
                    >
                      {searchResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSearchResult(item)}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: 'var(--text-primary)',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card)')}
                          onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                        >
                          📍 {item.displayName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  required
                  placeholder="Resolved Street / Landmark Address"
                  value={reportedAddress}
                  onChange={(e) => setReportedAddress(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => handleCoordsChange(parseFloat(e.target.value) || 0, longitude)}
                    className="form-input num-tabular"
                  />
                </div>
                <div>
                  <label className="form-label">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => handleCoordsChange(latitude, parseFloat(e.target.value) || 0)}
                    className="form-input num-tabular"
                  />
                </div>
              </div>

              {/* Reporter Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} color="var(--text-muted)" /> Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sunil Deshmukh"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={11} color="var(--text-muted)" /> Contact Phone (+91)
                  </label>
                  <input
                    type="text"
                    placeholder="+91-98201-XXXXX"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="form-input num-tabular"
                  />
                </div>
              </div>

              {/* Photo Upload URL */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Camera size={11} color="var(--text-muted)" /> Scene Image URL (Computer Vision AI)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (optional)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-danger"
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {isSubmitting ? (
                  <span>Transmitting to AI Triage Pipeline...</span>
                ) : (
                  <>
                    <Send size={14} /> Submit Emergency Report
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
