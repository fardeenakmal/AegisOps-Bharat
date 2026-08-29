import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User,
  Shield,
  Key,
  CheckCircle2,
  Sparkles,
  UserPlus,
  LogIn,
  Phone,
  Mail,
  MapPin,
  Loader2,
  LogOut,
  Radio,
  Building,
  Globe,
  Activity
} from 'lucide-react';
import { UserRole } from '../types';
import { loginUser, registerCitizen, fetchDemoTokens } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'quick' | 'signin' | 'register'>('quick');
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Sign In Form State
  const [username, setUsername] = useState('');
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

  useEffect(() => {
    setLoadingDemo(true);
    fetchDemoTokens()
      .then((data) => setDemoAccounts(data))
      .catch((err) => console.error('Failed to load demo roles:', err))
      .finally(() => setLoadingDemo(false));
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setSignInError('Please enter a username or email');
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);
    try {
      const data = await loginUser({ username: username.trim(), password });
      localStorage.setItem('aegisops_jwt', data.token);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setSignInError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setRegError('Full Name is required for citizen emergency registration');
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
      alert(`Welcome ${data.user.fullName}! Citizen profile registered and active.`);
      onClose();
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSelectDemo = (acc: any) => {
    localStorage.setItem('aegisops_jwt', acc.token);
    onLoginSuccess(
      {
        username: acc.username,
        fullName: acc.fullName,
        role: acc.role,
        zoneId: acc.zoneId,
        phoneNumber: acc.phoneNumber
      },
      acc.token
    );
    onClose();
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'NATIONAL_COMMANDER':
        return <Globe size={15} color="#38bdf8" />;
      case 'CONTROL_ROOM_OPERATOR':
        return <Activity size={15} color="#fbbf24" />;
      case 'RESCUE_RESPONDER':
        return <Radio size={15} color="#f87171" />;
      case 'HOSPITAL_ADMIN':
        return <Building size={15} color="#34d399" />;
      default:
        return <Shield size={15} color="#a855f7" />;
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
          maxWidth: 520,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
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
                AegisOps Authentication & RBAC
              </h3>
              <p style={{ fontSize: 10, color: '#737373', margin: 0 }}>
                Role-Based Access Control & Citizen Identity Portal
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Current User Session Pill */}
        {currentUser && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(56, 189, 248, 0.06)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#737373' }}>Signed in as:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{currentUser.fullName}</span>
              <span className="badge badge-cyan" style={{ fontSize: 9, padding: '1px 5px' }}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('aegisops_jwt');
                onLoginSuccess(
                  {
                    username: 'anonymous_citizen',
                    fullName: 'Public Citizen',
                    role: 'CITIZEN',
                    zoneId: 'zone-ndma-in'
                  },
                  ''
                );
              }}
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
              onClick={() => setActiveTab('quick')}
              className={`segmented-btn ${activeTab === 'quick' ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '6px 8px' }}
            >
              🔐 Quick Roles
            </button>
            <button
              onClick={() => setActiveTab('signin')}
              className={`segmented-btn ${activeTab === 'signin' ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '6px 8px' }}
            >
              🔑 Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`segmented-btn ${activeTab === 'register' ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '6px 8px' }}
            >
              📝 Register Citizen
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {/* TAB 1: QUICK DEMO ROLES */}
          {activeTab === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#a1a1a1', lineHeight: 1.4 }}>
                Select an operational role below for 1-click simulation with verified credentials and cryptographic JWT tokens:
              </div>

              {loadingDemo ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#737373' }}>
                  <Loader2 size={18} className="spin-anim" style={{ margin: '0 auto 6px' }} />
                  <span>Loading RBAC profiles...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {demoAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectDemo(acc)}
                      className="vercel-card"
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderColor: currentUser?.username === acc.username ? '#38bdf8' : 'var(--border-subtle)',
                        background: currentUser?.username === acc.username ? 'rgba(56, 189, 248, 0.08)' : '#111111',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: '#161616',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {getRoleIcon(acc.role)}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                            {acc.fullName}
                          </div>
                          <div style={{ fontSize: 10, color: '#737373' }}>
                            @{acc.username} &bull; Zone: {acc.zoneId}
                          </div>
                        </div>
                      </div>

                      <span className="badge badge-low" style={{ fontSize: 9 }}>
                        {acc.role}
                      </span>
                    </div>
                  ))}

                  {/* Public Citizen Quick Role */}
                  <div
                    onClick={() =>
                      handleSelectDemo({
                        username: 'aarav_sharma',
                        fullName: 'Aarav Sharma (Citizen)',
                        role: 'CITIZEN',
                        zoneId: 'zone-mh-mum',
                        token: ''
                      })
                    }
                    className="vercel-card"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: '#111111'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: '#161616',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <User size={15} color="#34d399" />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                          Aarav Sharma (Citizen)
                        </div>
                        <div style={{ fontSize: 10, color: '#737373' }}>
                          Verified Citizen &bull; Mumbai Resident
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: 9 }}>
                      CITIZEN
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIGN IN */}
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
                    color: '#fca5a5'
                  }}
                >
                  {signInError}
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Username or Email</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. operator_mumbai or your email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={14} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
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
                  marginTop: 4
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

              <div style={{ textAlign: 'center', fontSize: 11, color: '#737373', marginTop: 4 }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Register as Citizen
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CITIZEN REGISTRATION */}
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
                    color: '#fca5a5'
                  }}
                >
                  {regError}
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Full Name (पूरा नाम) *</label>
                <div style={{ position: 'relative' }}>
                  <User size={13} color="#737373" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Mobile Phone</label>
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
                  <label className="form-label" style={{ fontSize: 11 }}>City / Region</label>
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
                <label className="form-label" style={{ fontSize: 11 }}>Email Address (Optional)</label>
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
                    placeholder="Create a password"
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
                  marginTop: 4
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
