/*
 * AI Assistance Disclosure:
 * Tool: GitHub Copilot, date: 2025-10-30
 * Scope: Generated initial form structure and state management for profile editing.
 *        Suggested fetch API call structure and error handling patterns.
 *        Generated inline styling for form components and buttons.
 * Author review: Modified API endpoint integration with our backend.
 *                Verfied correctness of state management and form submission logic.
 */

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [language, setLanguage] = useState(user?.language || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          language: language.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Update user in AuthContext
      await refreshUser();

      // Navigate back to profile
      navigate('/profile');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
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
          top: '1rem',
          right: '1rem',
          width: '60px',  
          height: 'auto',
          zIndex: 10
        }}
      />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button 
              onClick={() => navigate('/profile')}
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#374151',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.background = '#e5e7eb'}
              onMouseOut={(e) => (e.target as HTMLElement).style.background = '#f3f4f6'}
            >
              ← Back to Profile
            </button>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0'
            }}>
              Edit Profile
            </h1>
          </div>
        </div>

        {/* Edit Form */}
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            width: '100%',
            maxWidth: '500px'
          }}>
            {/* Avatar (read-only) */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              {user.photoURL && user.photoURL.trim() !== '' ? (
                <img 
                  src={user.photoURL} 
                  referrerPolicy="no-referrer"
                  crossOrigin='anonymous'
                  alt="Profile" 
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #e5e7eb'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: 'white',
                  border: '3px solid #e5e7eb'
                }}>
                  {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {/* Display Name */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  style={{
                    fontSize: '1rem',
                    color: '#111827',
                    padding: '0.75rem',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Email (read-only) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Email (Cannot be changed yet)
                </label>
                <div style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  {user.email}
                </div>
              </div>

              {/* Bio */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  style={{
                    fontSize: '1rem',
                    color: '#111827',
                    padding: '0.75rem',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Programming Language - Changed from select to input */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Preferred Programming Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g., JavaScript, Python, Java, C++..."
                  style={{
                    fontSize: '1rem',
                    color: '#111827',
                    padding: '0.75rem',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  disabled={isLoading}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      const target = e.target as HTMLElement;
                      target.style.background = '#374151';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      const target = e.target as HTMLElement;
                      target.style.background = '#6b7280';
                    }
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      const target = e.target as HTMLElement;
                      target.style.background = '#5855eb';
                      target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      const target = e.target as HTMLElement;
                      target.style.background = '#6366f1';
                      target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;