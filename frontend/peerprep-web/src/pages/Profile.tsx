import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  // Debug: Log the photoURL
  console.log('👤 Profile: User data:', {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    photoURLLength: user.photoURL?.length
  });

  const showInitials = !user.photoURL || user.photoURL.trim() === '' || imageError;

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Logo in top right - same as Dashboard */}
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
              onClick={() => navigate('/dashboard')}
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
              ← Back to Dashboard
            </button>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0'
            }}>
              My Profile
            </h1>
          </div>
        </div>

        {/* Profile Content */}
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
            {/* Avatar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              {showInitials ? (
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
              ) : (
                <img 
                  src={user.photoURL} 
                  alt="Profile"
                  referrerPolicy="no-referrer"  
                  crossOrigin="anonymous"        
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #e5e7eb'
                  }}
                  onLoad={() => {
                    console.log('✅ Profile image loaded successfully!');
                    console.log('📸 Image URL:', user.photoURL);
                  }}
                  onError={(e) => {
                    console.error('❌ Profile image failed to load');
                    console.error('📸 Failed URL:', user.photoURL);
                    setImageError(true);
                  }}
                />
              )}
            </div>

            {/* Profile Information */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              marginBottom: '2rem'
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
                <div style={{
                  fontSize: '1rem',
                  color: '#111827',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  minHeight: '1.25rem'
                }}>
                  {user.displayName || 'Not set'}
                </div>
              </div>

              {/* Email */}
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
                  Email
                </label>
                <div style={{
                  fontSize: '1rem',
                  color: '#111827',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  minHeight: '1.25rem'
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
                <div style={{
                  fontSize: '1rem',
                  color: '#111827',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  minHeight: '1.25rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {user.bio || 'No bio set'}
                </div>
              </div>

              {/* Programming Language */}
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
                <div style={{
                  fontSize: '1rem',
                  color: '#111827',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  minHeight: '1.25rem'
                }}>
                  {user.language || 'Not specified'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button 
                onClick={() => navigate('/profile/edit')}
                style={{
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = '#5855eb';
                  target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = '#6366f1';
                  target.style.transform = 'translateY(0)';
                }}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;