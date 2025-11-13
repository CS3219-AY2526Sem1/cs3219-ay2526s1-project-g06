/*
 * AI Assistance Disclosure:
 * Tool: GitHub Copilot + ChatGPT (Claude Sonnet 4.5), date: 2025-10-30
 * Scope: Generated initial form component structure with React state management.
 *        Suggested form validation and submission logic.
 *        Generated language selection options and form styling.
 * Author review: Modified to integrate with our PUT /auth/profile endpoint.
 *                Verified correctness of form state handling and submission flow.
 */

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { updateProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    language: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('ProfileSetup: Submitting profile data...');
      await updateProfile(formData);
      
      // Update user context with new profile data
      console.log('ProfileSetup: Refreshing user data...');
      await refreshUser();

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Logo */}
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

      <div style={{ maxWidth: 500, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          color: '#333', 
          marginBottom: '0.5rem',
          fontWeight: 'bold'
        }}>
          Complete Your Profile
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          color: '#666', 
          marginBottom: '2rem'
        }}>
          Tell us a bit about yourself to get started with PeerPrep!
        </p>
        
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Display Name:
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="How should others see your name?"
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Bio:
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself, your interests, or coding experience..."
              maxLength={500}
              rows={4}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
            <small style={{ color: '#666' }}>
              {formData.bio.length}/500 characters
            </small>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Preferred Programming Language:
            </label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              placeholder="e.g., JavaScript, Python, Java, C++..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.displayName}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: (loading || !formData.displayName) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loading || !formData.displayName) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Setting up profile...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}