import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Shield,
  Key,
  CheckCircle2,
  UserPlus,
  LogIn,
  Phone,
  Mail,
  MapPin,
  Loader2,
  LogOut,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { loginUser, registerCitizen } from '../services/api';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
  currentUser?: any;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Citizen Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('+91-');
  const [regEmail, setRegEmail] = useState('');
  const [regZoneId, setRegZoneId] = useState('zone-mh-mum');
  const [regPassword, setRegPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setSignInError('Please enter your email or username');
      return;
    }
    if (!password) {
      setSignInError('Please enter your password');
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);
    try {
      const data = await loginUser({ username: identifier.trim(), password });
      localStorage.setItem('aegisops_jwt', data.token);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setSignInError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setRegError('Full Name is required for registration');
      return;
    }

    setIsRegistering(true);
    setRegError(null);
    try {
      const data = await registerCitizen({
        fullName: regFullName.trim(),
        email: regEmail.trim() || undefined,
        phoneNumber: regPhone !== '+91-' ? regPhone.trim() : undefined,
        zoneId: regZoneId,
        password: regPassword || undefined,
        role: 'CITIZEN'
      });

      localStorage.setItem('aegisops_jwt', data.token);
      onLoginSuccess(data.user, data.token);
      alert(`Welcome ${data.user.fullName}! Your Citizen account has been registered.`);
      onClose();
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('aegisops_jwt');
    onLoginSuccess(
      {
        username: 'guest_citizen',
        fullName: 'Public Citizen (Guest)',
        role: 'CITIZEN',
        zoneId: 'zone-ndma-in'
      },
      ''
    );
    onClose();
  };

  const handleAdminPrefill = () => {
    setIdentifier('fardeenakmal123@gmail.com');
    setPassword('Akmal@1974');
    setSignInError(null);
  };

  const isGuest = !currentUser || currentUser.username === 'guest_citizen' || !localStorage.getItem('aegisops_jwt');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
      }}
      className="modal-overlay"
    >
      <div
        className="vercel-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#111111'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={14} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                AegisOps Authentication
              </h3>
              <p style={{ fontSize: 10, color: '#737373', margin: 0 }}>
                Administrator & Citizen Secure Portal
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Current Active User Status */}
        {!isGuest && currentUser && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(56, 189, 248, 0.08)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#737373' }}>Logged in as:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{currentUser.fullName}</span>
              <span className={`badge ${currentUser.role === 'NATIONAL_COMMANDER' ? 'badge-critical' : 'badge-cyan'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                {currentUser.role === 'NATIONAL_COMMANDER' ? 'ADMIN' : 'CITIZEN'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-ghost"
              style={{ fontSize: 10, padding: '2px 6px', color: '#f87171' }}
              title="Sign Out"
            >
              <LogOut size={11} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Segmented Tab Switcher */}
        <div style={{ padding: '8px 12px 0', background: '#0a0a0a' }}>
          <div className="segmented-control" style={{ width: '100%' }}>
            <button
              onClick={() => setActiveTab('signin')}
              className={`segmented-btn ${activeTab === 'signin' ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '7px 8px' }}
            >
              🔑 Sign In (लॉग इन)
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`segmented-btn ${activeTab === 'register' ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '7px 8px' }}
            >
              📝 Citizen Registration (नागरिक पंजीकरण)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {signInError && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <AlertTriangle size={13} color="#f87171" />
                  <span>{signInError}</span>
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Email or Username (ईमेल / उपयोगकर्ता नाम)</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. fardeenakmal123@gmail.com or citizen username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Password (पासवर्ड)</label>
                <div style={{ position: 'relative' }}>
                  <Key size={14} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Admin Shortcut Helper */}
              <div
                style={{
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 11
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={13} color="#38bdf8" />
                  <span style={{ color: '#a1a1a1' }}>System Administrator:</span>
                </div>
                <button
                  type="button"
                  onClick={handleAdminPrefill}
                  className="btn btn-ghost"
                  style={{ fontSize: 10, padding: '2px 6px', color: '#38bdf8' }}
                >
                  Fill Admin Credentials
                </button>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="btn btn-primary"
                style={{
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 2
                }}
              >
                {isSigningIn ? (
                  <>
                    <Loader2 size={14} className="spin-anim" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    <span>Sign In to AegisOps</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: 11, color: '#737373', marginTop: 2 }}>
                Public citizen?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Register here for citizen services
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CITIZEN REGISTRATION */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {regError && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <AlertTriangle size={13} color="#f87171" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Full Name (पूरा नाम) *</label>
                <div style={{ position: 'relative' }}>
                  <User size={13} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Mobile Phone (फोन नंबर)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={13} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 30, fontSize: 11 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>City / State</label>
                  <select
                    value={regZoneId}
                    onChange={(e) => setRegZoneId(e.target.value)}
                    className="form-select"
                    style={{ fontSize: 11 }}
                  >
                    <option value="zone-mh-mum">Mumbai Metro</option>
                    <option value="zone-dl-ncr">Delhi NCR</option>
                    <option value="zone-ka-blr">Bengaluru Urban</option>
                    <option value="zone-tn-chn">Chennai Metro</option>
                    <option value="zone-od-bbs">Odisha Coastal</option>
                    <option value="zone-wb-kol">Kolkata Municipal</option>
                    <option value="zone-ndma-in">All India / NDMA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Email Address (ईमेल)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Create Password (पासवर्ड)</label>
                <div style={{ position: 'relative' }}>
                  <Key size={13} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="password"
                    placeholder="Create a secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="btn btn-danger"
                style={{
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 2
                }}
              >
                {isRegistering ? (
                  <>
                    <Loader2 size={14} className="spin-anim" />
                    <span>Registering Citizen Profile...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Complete Citizen Registration (पंजीकरण करें)</span>
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
