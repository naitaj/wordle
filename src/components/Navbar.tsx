import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/', label: 'HOME' },
  { path: '/download', label: 'DOWNLOAD' },
  { path: '/install', label: 'INSTALL' },
  { path: '/check', label: 'CHECK' },
  { path: '/faq', label: 'FAQ' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: '"Anton", sans-serif',
              fontSize: '24px',
              color: '#ffffff',
              lineHeight: 1,
              paddingTop: '2px',
            }}>W</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontFamily: '"Anton", sans-serif',
              fontSize: '16px',
              color: '#000000',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>WORDLE ENTROPY</span>
            <span style={{
              fontFamily: '"Roboto Condensed", sans-serif',
              fontSize: '9px',
              color: 'var(--text-muted)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}>SOLVER</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-accent)',
            color: '#000000',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" style={{
          borderTop: '1px solid var(--border-primary)',
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '8px 0',
        }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '18px',
                letterSpacing: '0.1em',
                color: location.pathname === link.path ? '#000000' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '12px 24px',
                borderLeft: location.pathname === link.path ? '3px solid #000000' : '3px solid transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
