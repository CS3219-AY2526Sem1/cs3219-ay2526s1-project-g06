import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Password validation function
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null; // Password is valid
};

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState(''); // New state for password validation
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Real-time password validation
  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    const validationError = validatePassword(password);
    setPasswordError(validationError || '');
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before submitting
    const passwordValidationError = validatePassword(formData.password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      setUser({ sub: userCredential.user.uid, email: userCredential.user.email! });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser({ sub: userCredential.user.uid, email: userCredential.user.email! });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Logo in top right */}
      <img 
        src="/peerprep_logo.png" 
        alt="PeerPrep Logo" 
        style={{
          position: 'absolute',
          top: '0.25rem',
          right: '1rem',
          width: '60px',
          height: 'auto',
          zIndex: 10
        }}
      />

      <div style={{ maxWidth: 400, margin: '2rem auto', padding: '0 1rem' }}>
        {/* Main Header */}
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          color: '#333', 
          marginBottom: '0.5rem',
          fontWeight: 'bold'
        }}>
          PeerPrep
        </h1>
        
        {/* Subheader */}
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '1.5rem', 
          color: '#666', 
          marginTop: '0',
          marginBottom: '2rem',
          fontWeight: 'normal'
        }}>
          Register
        </h2>
        
        {error && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}

        {/* Google Register Button */}
        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '1rem',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Creating account...' : 'Sign up with Google'}
        </button>

        <div style={{ 
          textAlign: 'center', 
          margin: '1rem 0', 
          color: '#666',
          position: 'relative'
        }}>
          <span style={{ 
            backgroundColor: 'white', 
            padding: '0 1rem',
            position: 'relative',
            zIndex: 1
          }}>
            or
          </span>
          <hr style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            right: 0, 
            margin: 0, 
            zIndex: 0 
          }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailRegister}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                marginTop: '0.25rem',
                border: `1px solid ${passwordError ? '#dc3545' : '#ccc'}`,
                borderRadius: '4px'
              }}
            />
            
            {/* Password requirements */}
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#666' }}>
              Password must contain:
              <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                <li style={{ color: formData.password.length >= 8 ? '#28a745' : '#dc3545' }}>
                  At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(formData.password) ? '#28a745' : '#dc3545' }}>
                  One uppercase letter
                </li>
                <li style={{ color: /[0-9]/.test(formData.password) ? '#28a745' : '#dc3545' }}>
                  One number
                </li>
                <li style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '#28a745' : '#dc3545' }}>
                  One special character
                </li>
              </ul>
            </div>

            {passwordError && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#dc3545', 
                marginTop: '0.25rem' 
              }}>
                {passwordError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Confirm Password:</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!passwordError}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: (loading || passwordError) ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loading || passwordError) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}