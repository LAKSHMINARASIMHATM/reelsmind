import { useState, useEffect } from 'react';
import api from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);

  useEffect(() => {
    // Load available demo users for easy 1-click testing
    api.getUsers()
      .then(d => setDemoUsers(d.users || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username || !email || !password) {
          throw new Error('Please fill in all required fields.');
        }
        const res = await api.register(username, email, password, fullName);
        setLoading(false);
        onLoginSuccess(res.user);
      } else {
        if (!username || !password) {
          throw new Error('Please enter your username/email and password.');
        }
        const res = await api.login(username, password);
        setLoading(false);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(demoUsername, 'password123');
      setLoading(false);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ig-black)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 850,
        width: '100%',
      }}>

        {/* Left Side: Mockup Phone Graphic */}
        <div style={{
          position: 'relative',
          width: 380,
          height: 520,
          display: 'none', // Shown on desktop
          '@media (min-width: 800px)': { display: 'block' },
        }} className="ig-desktop-phone">
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: 36,
            background: 'var(--ig-surface)',
            border: '2px solid var(--ig-border)',
            padding: 16,
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(139,92,246,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: 24,
              background: 'radial-gradient(circle at 50% 30%, #2b0b30 0%, #05030a 80%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 24, textCenter: 'center',
            }}>
              <div style={{ fontSize: 54, marginBottom: 12 }}>🎬</div>
              <div style={{ fontFamily: 'Grand Hotel, cursive', fontSize: 36, background: 'var(--ig-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
                Instagram
              </div>
              <div style={{ fontSize: 12, color: 'var(--ig-text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                AI Reel Recommendation Agent & TikTok-10M Behavioral Engine
              </div>

              <div style={{ marginTop: 24, width: '100%', background: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 12, border: '1px solid var(--ig-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ig-green)', fontWeight: 700, marginBottom: 4 }}>
                  ✓ Latent Interest Inference
                </div>
                <div style={{ fontSize: 11, color: 'var(--ig-cyan)', fontWeight: 700, marginBottom: 4 }}>
                  ✓ Java Trap Prevention (100%)
                </div>
                <div style={{ fontSize: 11, color: 'var(--ig-blue)', fontWeight: 700 }}>
                  ✓ 100% Hype Filter Rejection
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Instagram Auth Form */}
        <div style={{ width: '100%', maxWidth: 350, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Main Card */}
          <div style={{
            background: 'var(--ig-surface)',
            border: '1px solid var(--ig-border)',
            borderRadius: 12,
            padding: '32px 28px',
            textAlign: 'center',
          }}>
            {/* Instagram Logo Header */}
            <div style={{
              fontFamily: 'Grand Hotel, cursive',
              fontSize: 42,
              background: 'var(--ig-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 8,
              lineHeight: 1,
            }}>
              Instagram
            </div>

            <div style={{ fontSize: 11, color: 'var(--ig-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
              ReelMind AI Authentication
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                background: 'rgba(255,48,64,0.12)',
                border: '1px solid var(--ig-red)',
                color: 'var(--ig-red)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                marginBottom: 16,
                textAlign: 'left',
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6,
                    background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                    color: 'white', fontSize: 12, fontFamily: 'inherit',
                  }}
                />
              )}

              <input
                type="text"
                placeholder={isSignUp ? "Username" : "Phone number, username, or email"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                  color: 'white', fontSize: 12, fontFamily: 'inherit',
                }}
              />

              {isSignUp && (
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6,
                    background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                    color: 'white', fontSize: 12, fontFamily: 'inherit',
                  }}
                />
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6,
                    background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                    color: 'white', fontSize: 12, fontFamily: 'inherit',
                    paddingRight: 50,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--ig-text-secondary)',
                    fontSize: 11, cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8,
                  background: loading ? 'rgba(0,149,246,0.5)' : 'var(--ig-blue)',
                  border: 'none', color: 'white', fontWeight: 700, fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
                  transition: 'background 0.2s ease',
                }}
              >
                {loading ? "Authenticating..." : isSignUp ? "Sign Up" : "Log In"}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', opacity: 0.5 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--ig-border)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--ig-border)' }} />
            </div>

            {/* Demo Accounts Quick Login */}
            <div style={{ textAlign: 'left', marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ig-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Quick Demo User Authentication:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('alex_dev')}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ig-border)',
                    color: 'var(--ig-text)', fontSize: 11, textAlign: 'left',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>👨‍💻 <strong>Alex</strong> (Java Trap Profile)</span>
                  <span style={{ fontSize: 10, color: 'var(--ig-blue)' }}>Log in →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('priya_ai')}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ig-border)',
                    color: 'var(--ig-text)', fontSize: 11, textAlign: 'left',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>🤖 <strong>Priya</strong> (AI Enthusiast Profile)</span>
                  <span style={{ fontSize: 10, color: 'var(--ig-blue)' }}>Log in →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('sam_gamer')}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ig-border)',
                    color: 'var(--ig-text)', fontSize: 11, textAlign: 'left',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>🎮 <strong>Sam</strong> (Entertainment Profile)</span>
                  <span style={{ fontSize: 10, color: 'var(--ig-blue)' }}>Log in →</span>
                </button>
              </div>
            </div>

          </div>

          {/* Toggle Signup/Login Card */}
          <div style={{
            background: 'var(--ig-surface)',
            border: '1px solid var(--ig-border)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            fontSize: 13,
          }}>
            {isSignUp ? (
              <span>
                Have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--ig-blue)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--ig-blue)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign up
                </button>
              </span>
            )}
          </div>

          {/* Footer Copyright */}
          <div style={{ fontSize: 10, color: 'var(--ig-text-muted)', textAlign: 'center', marginTop: 12 }}>
            © 2026 INSTAGRAM FROM REELMIND AI
          </div>

        </div>

      </div>
    </div>
  );
}
