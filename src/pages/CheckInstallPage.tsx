import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const CheckInstallPage = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'found' | 'not-found'>('idle');

  const checkExtension = () => {
    setStatus('checking');
    
    // Timeout fallback if no response is received
    const timeoutId = setTimeout(() => {
      setStatus('not-found');
    }, 2000);

    try {
      const globalChrome = (window as any).chrome;
      if (globalChrome && globalChrome.runtime && globalChrome.runtime.sendMessage) {
        // Attempting to message the extension.
        // Requires the page to be in "externally_connectable" in manifest.json.
        globalChrome.runtime.sendMessage('extension_id_placeholder', { message: 'ping' }, (response: any) => {
          clearTimeout(timeoutId);
          if (globalChrome.runtime.lastError) {
            setStatus('not-found');
          } else if (response) {
            setStatus('found');
          } else {
            setStatus('not-found');
          }
        });
      } else {
        // If chrome API is not available, we wait for timeout to set not-found to show the checking state
      }
    } catch (e) {
      // Will fall back to timeout
    }
  };

  return (
    <div style={{ paddingTop: '96px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
        >
          <div className="section-label" style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--accent-green)', letterSpacing: '2px', fontSize: '1.25rem', marginBottom: '16px' }}>
            VERIFY
          </div>
          <h1 className="section-title font-anton" style={{ fontFamily: 'Anton, sans-serif', fontSize: '4rem', textTransform: 'uppercase', margin: '0 0 16px 0', letterSpacing: '1px' }}>
            CHECK INSTALLATION
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            VERIFY THAT THE EXTENSION IS INSTALLED AND WORKING CORRECTLY.
          </p>
        </motion.div>

        {/* DETECTION CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '48px',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <AnimatePresence mode="wait">
            
            {/* IDLE STATE */}
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '2.5rem', margin: '0 0 16px 0', letterSpacing: '1px' }}>
                  READY TO CHECK
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px' }}>
                  CLICK THE BUTTON BELOW TO DETECT IF THE WORDLE ASSISTANT EXTENSION IS INSTALLED IN YOUR BROWSER.
                </p>
                <button 
                  onClick={checkExtension}
                  className="btn-primary"
                  style={{
                    padding: '16px 32px',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  CHECK NOW
                </button>
              </motion.div>
            )}

            {/* CHECKING STATE */}
            {status === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ marginBottom: '24px', color: 'var(--accent-amber)' }}
                >
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                </motion.div>
                <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '2rem', margin: '0', color: 'var(--accent-amber)', letterSpacing: '1px' }}>
                  CHECKING...
                </h2>
              </motion.div>
            )}

            {/* FOUND STATE */}
            {status === 'found' && (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ color: 'var(--accent-green)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="font-anton" style={{ fontFamily: 'Anton, sans-serif', fontSize: '3rem', margin: '0 0 32px 0', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  EXTENSION INSTALLED
                </h2>
                
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 24px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--accent-green)', fontSize: '1.2rem' }}>EXTENSION DETECTED</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 24px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--accent-green)', fontSize: '1.2rem' }}>READY TO USE</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 24px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--accent-green)', fontSize: '1.2rem' }}>COMPATIBLE BROWSER</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a 
                    href="https://www.nytimes.com/games/wordle/index.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      padding: '12px 24px',
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: '1.2rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      letterSpacing: '1px'
                    }}
                  >
                    OPEN NYT WORDLE
                  </a>
                  <a 
                    href="https://www.wordle.name" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{
                      padding: '12px 24px',
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: '1.2rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      letterSpacing: '1px'
                    }}
                  >
                    OPEN WORDLE.NAME
                  </a>
                </div>
              </motion.div>
            )}

            {/* NOT FOUND STATE */}
            {status === 'not-found' && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ color: '#ef4444', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h2 className="font-anton" style={{ fontFamily: 'Anton, sans-serif', fontSize: '3rem', margin: '0 0 32px 0', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  EXTENSION NOT FOUND
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px', textAlign: 'left' }}>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '8px', letterSpacing: '1px' }}>DEVELOPER MODE NOT ENABLED</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>MAKE SURE DEVELOPER MODE IS TOGGLED ON IN CHROME://EXTENSIONS</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '8px', letterSpacing: '1px' }}>EXTENSION NOT LOADED</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CLICK LOAD UNPACKED AND SELECT THE EXTENSION/DIST FOLDER</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '8px', letterSpacing: '1px' }}>WRONG BROWSER</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>THE EXTENSION REQUIRES A CHROMIUM-BASED BROWSER (CHROME, EDGE, OR BRAVE)</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '8px', letterSpacing: '1px' }}>EXTENSION DISABLED</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CHECK THAT THE EXTENSION IS NOT DISABLED IN YOUR BROWSER'S EXTENSION LIST</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <Link 
                    to="/install" 
                    className="btn-primary"
                    style={{
                      padding: '12px 24px',
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: '1.2rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    VIEW INSTALLATION GUIDE
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <button 
                    onClick={checkExtension}
                    className="btn-secondary"
                    style={{
                      padding: '12px 24px',
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: '1.2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      letterSpacing: '1px'
                    }}
                  >
                    TRY AGAIN
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
};
