import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  Radio,
  Navigation,
  Search,
  Loader2
} from 'lucide-react';
import { submitCitizenReport, reverseGeocode, searchLocations } from '../services/api';

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
  const [reportedAddress, setReportedAddress] = useState('Central Control Room, Mumbai Metro');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Auto-detect GPS location on mount if permitted
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
        console.warn('Geolocation warning:', err.message);
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
      // Keep existing address if reverse geocoding fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText) return;

    setIsSubmitting(true);
    try {
      const res = await submitCitizenReport({
        reporterName: reporterName || 'Citizen Reporter',
        reporterContact: reporterContact || '+91-98000-00000',
        rawText,
        reportedAddress,
        latitude,
        longitude,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
        submissionChannel: 'MOBILE_PWA'
      });

      setSubmissionResult(res);
      onReportSubmitted();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
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
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      className="modal-overlay"
    >
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                112 Emergency Citizen Incident Reporting
              </h3>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>
                Direct ingestion into NDMA & State Emergency Operations Centre (EOC)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {submissionResult ? (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <CheckCircle2 size={32} color="#10b981" />
              </div>
              <h3 style={{ fontSize: 18, color: '#f8fafc', marginBottom: 6 }}>
                Emergency Report Ingested & Verified
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 460, margin: '0 auto 20px' }}>
                {submissionResult.message}
              </p>

              <div
                className="glass-panel"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: 16,
                  borderRadius: 10,
                  textAlign: 'left',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>TRACKING ID</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#06b6d4' }}>
                    {submissionResult.trackingId}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>AI SEVERITY CLASSIFICATION</span>
                  <span
                    className={`badge ${
                      submissionResult.incident?.severityLabel === 'CRITICAL' ? 'badge-critical' : 'badge-medium'
                    }`}
                  >
                    {submissionResult.incident?.severityLabel} ({submissionResult.incident?.severityScore}/100)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>SLA RESPONSE TARGET</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                    {submissionResult.incident?.slaTargetMinutes || 10} Minutes
                  </span>
                </div>
              </div>

              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                Return to Live Operations Console
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Reporter Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} color="#94a3b8" /> Reporter Full Name
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
                    <Phone size={12} color="#94a3b8" /> 10-Digit Mobile (+91)
                  </label>
                  <input
                    type="text"
                    placeholder="+91-98201-XXXXX"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Free Text Description */}
              <div>
                <label className="form-label">
                  Incident Description (English / Hindi / Regional Transliteration) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Heavy waterlogging near railway subway! People trapped in submerged vehicle, send rescue boats and ambulance immediately."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Location Search & GPS Auto-detection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                    <MapPin size={12} color="#06b6d4" /> Real-World Incident Location *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isGeolocating}
                    className="btn btn-secondary"
                    style={{ fontSize: 10, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Navigation size={11} color="#06b6d4" />
                    {isGeolocating ? 'Detecting GPS...' : 'Detect My GPS'}
                  </button>
                </div>

                {/* Search Bar with Nominatim Autocomplete */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Search place, landmark, street, city..."
                    value={searchQuery}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: 30 }}
                  />
                  <div style={{ position: 'absolute', right: 10, top: 10, color: '#64748b' }}>
                    {searching ? <Loader2 size={14} className="spin-anim" /> : <Search size={14} />}
                  </div>

                  {searchResults.length > 0 && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: '#0f172a',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        borderRadius: 8,
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
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: '#cbd5e1'
                          }}
                          onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'rgba(6, 182, 212, 0.15)')}
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
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => handleCoordsChange(latitude, parseFloat(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Photo Upload URL */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Camera size={12} color="#94a3b8" /> Photo / Scene Image URL (Computer Vision Triage)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}
              >
                {isSubmitting ? (
                  <span>Ingesting via AI Verification Pipeline...</span>
                ) : (
                  <>
                    <Send size={16} /> Submit 112 Emergency Report
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
