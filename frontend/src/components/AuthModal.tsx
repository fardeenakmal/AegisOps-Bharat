import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User,
  Shield,
  Key,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/demo-tokens')
      .then((r) => r.json())
      .then((data) => setDemoAccounts(data))
      .catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('aegisops_jwt', data.token);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc: any) => {
    localStorage.setItem('aegisops_jwt', acc.token);
    onLoginSuccess(
      {
        username: acc.username,
        fullName: acc.fullName,
        role: acc.role,
        zoneId: acc.zoneId
      },
      acc.token
    );
    onClose();
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
        zIndex: 2300,
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
          maxWidth: 540,
          borderRadius: 16,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} color="#ef4444" />
            <h3 style={{ fontSize: 16, color: '#f8fafc' }}>AegisOps Authentication & RBAC</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Demo 1-Click Role Accounts */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} color="#06b6d4" /> 1-Click Role-Based Quick Access (Pre-Signed JWT)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: 11,
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#67e8f9' }}>{acc.role}</span>
                  <span style={{ color: '#94a3b8', fontSize: 10 }}>{acc.fullName}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: '#64748b', fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
            <span>OR SIGN IN WITH CREDENTIALS</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator1"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: 12 }}>
              <Key size={15} /> {loading ? 'Verifying Credentials...' : 'Authenticate & Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
