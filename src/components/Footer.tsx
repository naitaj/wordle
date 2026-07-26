import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-primary)',
      background: 'var(--bg-secondary)',
      padding: '48px 24px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '32px',
      }}>
        {/* Brand */}
        <div style={{ maxWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px', height: '40px', background: '#000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '26px', color: '#fff', paddingTop: '1px' }}>W</span>
            </div>
            <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '20px', color: '#000000', letterSpacing: '0.05em' }}>WORDLE ENTROPY</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Solve Wordle using Information Theory. An open-source browser extension built with Shannon entropy.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '48px', flex: 1, marginLeft: '32px' }}>
          <div>
            <h4 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}>PAGES</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { path: '/', label: 'Home' },
                { path: '/download', label: 'Download' },
                { path: '/install', label: 'Install Guide' },
                { path: '/check', label: 'Check Installation' },
                { path: '/faq', label: 'FAQ' },
              ].map(link => (
                <Link key={link.path} to={link.path} style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'color 0.15s',
                }}>{link.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}>LINKS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="https://github.com/naitaj/wordle" target="_blank" rel="noopener noreferrer" style={{
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px',
              }}>GitHub</a>
              <a href="https://www.linkedin.com/in/naila-s-a112b2374/" target="_blank" rel="noopener noreferrer" style={{
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px',
              }}>LinkedIn</a>
            </div>
          </div>

          <div>
            <h4 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}>SUPPORTED WEBSITES</h4>
            <div style={{ columns: 2, columnGap: '32px' }}>
              {[
                { label: 'NYT Wordle', url: 'https://www.nytimes.com/games/wordle/index.html' },
                { label: 'Wordle Unlimited', url: 'https://wordleunlimited.org/' },
                { label: 'Hello Wordl', url: 'https://hellowordl.net/' },
                { label: 'Quordle', url: 'https://www.merriam-webster.com/games/quordle/' },
                { label: 'Octordle', url: 'https://octordle.com/' },
                { label: 'Dordle', url: 'https://zaratustra.itch.io/dordle' },
                { label: 'Sedecordle', url: 'https://www.sedecordle.com/' },
                { label: 'Hurdle', url: 'https://hurdle.me/' },
                { label: 'Absurdle', url: 'https://qntm.org/absurdle' },
                { label: 'Evil Wordle', url: 'https://swag.github.io/evil-wordle/' },
                { label: 'WordGuessr', url: 'https://wordguessr.com/' },
              ].map(site => (
                <a key={site.url} href={site.url} target="_blank" rel="noopener noreferrer" style={{
                  color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', display: 'block', marginBottom: '8px', breakInside: 'avoid',
                }}>{site.label}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '32px auto 0',
        paddingTop: '24px',
        borderTop: '1px solid var(--border-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span style={{
          fontFamily: '"Roboto Condensed", sans-serif',
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>
          v1.0.0 — MIT License
        </span>
        <a 
          href="https://www.linkedin.com/in/naila-s-a112b2374/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Built by Naila
        </a>
      </div>
    </footer>
  );
}
