import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/', label: 'HOME' },
  { path: '/download', label: 'DOWNLOAD' },
  { path: '/install', label: 'INSTALL' },
  { path: '/check', label: 'CHECK' },
  { path: '/faq', label: 'FAQ' },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-primary)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: '"Anton", sans-serif',
              fontSize: '32px',
              color: '#ffffff',
              lineHeight: 1,
              paddingTop: '2px',
            }}>W</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontFamily: '"Anton", sans-serif',
              fontSize: '24px',
              color: '#000000',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>WORDLE ENTROPY</span>
            <span style={{
              fontFamily: '"Roboto Condensed", sans-serif',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginTop: '4px',
            }}>SOLVER</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '15px',
                letterSpacing: '0.1em',
                color: location.pathname === link.path ? '#000000' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '8px 16px',
                borderBottom: location.pathname === link.path ? '2px solid #000000' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
