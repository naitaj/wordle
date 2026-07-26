import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const InstallGuidePage = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const toggleStepExpanded = (stepId: number) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const stepInstructions: Record<number, ReactNode> = {
    1: (
      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>CLICK THIS CARD TO DOWNLOAD THE EXTENSION <code>ZIP</code> FILE DIRECTLY.</li>
        <li>LOCATE THE DOWNLOADED FILE (<code>wordle-main.zip</code>) IN YOUR DOWNLOADS FOLDER.</li>
        <li>RIGHT-CLICK THE FILE AND SELECT <strong>"EXTRACT ALL..."</strong> TO UNZIP IT.</li>
      </ol>
    ),
    2: (
      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>OPEN A NEW BROWSER TAB (<code>Ctrl + T</code> OR <code>Cmd + T</code>).</li>
        <li>PASTE THE COPIED ADDRESS (<code>chrome://extensions</code>) AND PRESS <strong>ENTER</strong>.</li>
        <li>OR GO TO CHROME MENU (<strong>⋮</strong>) → <strong>EXTENSIONS</strong> → <strong>MANAGE EXTENSIONS</strong>.</li>
      </ol>
    ),
    3: (
      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>LOOK AT THE TOP-RIGHT CORNER OF THE CHROME EXTENSIONS PAGE.</li>
        <li>FIND THE TOGGLE SWITCH LABELED <strong>"DEVELOPER MODE"</strong>.</li>
        <li>CLICK THE TOGGLE SWITCH TO TURN IT <strong>ON</strong>.</li>
        <li>A SUB-TOOLBAR WILL APPEAR WITH BUTTONS LIKE <em>"LOAD UNPACKED"</em>.</li>
      </ol>
    ),
    4: (
      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>CLICK THE <strong>"LOAD UNPACKED"</strong> BUTTON IN THE TOP-LEFT OF THE EXTENSIONS PAGE.</li>
        <li>BROWSE TO YOUR EXTRACTED DOWNLOAD FOLDER.</li>
        <li>SELECT THE <strong>"extension/dist"</strong> SUBFOLDER AND CLICK <strong>"SELECT FOLDER"</strong>.</li>
        <li>THE QUICK WORDLE SOLVER EXTENSION ICON WILL APPEAR IN YOUR TOOLBAR!</li>
      </ol>
    ),
    5: (
      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>NAVIGATE TO <strong>WORDLE UNLIMITED</strong> OR <strong>NYT WORDLE</strong>.</li>
        <li>CLICK THE FLOATING SOLVER BADGE ON THE PAGE.</li>
        <li>GET INSTANT WORD RECOMMENDATIONS, GREEN/YELLOW FILTERING, AND AUTO-SOLVING!</li>
      </ol>
    )
  };

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fallbackCopy = (text: string, successMessage: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        showToast(successMessage);
      } else {
        showToast('❌ COPY FAILED. PLEASE SELECT AND COPY MANUALLY.');
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
      showToast('❌ COPY FAILED. PLEASE SELECT AND COPY MANUALLY.');
    }
  };

  const copyText = (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => showToast(successMessage))
          .catch((err) => {
            console.warn('Clipboard write failed, trying fallback', err);
            fallbackCopy(text, successMessage);
          });
      } else {
        fallbackCopy(text, successMessage);
      }
    } catch (e) {
      fallbackCopy(text, successMessage);
    }
  };

  interface Step {
    id: number;
    title: string;
    desc: string;
    code?: string;
    link?: {
      text: string;
      url: string;
    };
    actionLabel?: string;
  }

  const steps: Step[] = [
    {
      id: 1,
      title: 'DOWNLOAD THE EXTENSION',
      desc: '',
      code: 'Click this card to download ZIP directly\nOr clone: git clone https://github.com/naitaj/wordle.git',
      actionLabel: 'DOWNLOAD ZIP FILE'
    },
    {
      id: 2,
      title: 'OPEN CHROME EXTENSIONS',
      desc: 'CLICK THIS CARD TO COPY THE EXTENSIONS ADDRESS.',
      code: 'chrome://extensions',
      actionLabel: 'COPY'
    },
    {
      id: 3,
      title: 'ENABLE DEVELOPER MODE',
      desc: 'TOGGLE THE DEVELOPER MODE SWITCH IN THE TOP-RIGHT CORNER OF THE EXTENSIONS PAGE.'
    },
    {
      id: 4,
      title: 'LOAD THE EXTENSION',
      desc: 'CLICK "LOAD UNPACKED" AND SELECT THE "EXTENSION/DIST" FOLDER FROM THE EXTRACTED DIRECTORY.'
    },
    {
      id: 5,
      title: 'START SOLVING!',
      desc: 'NAVIGATE TO ONE OF THE SUPPORTED WEBSITES AND CLICK THE BADGE TO START THE SOLVER.',
      code: 'https://www.nytimes.com/games/wordle/index.html\nhttps://wordleunlimited.org/',
      link: { text: 'CHECK INSTALLATION', url: '/check' }
    },
  ];

  const handleCardClick = (stepId: number) => {
    switch (stepId) {
      case 1:
        showToast('🚀 DOWNLOADING EXTENSION ZIP FILE...');
        break;
      case 2:
        copyText('chrome://extensions', '📋 COPIED "chrome://extensions" TO CLIPBOARD!');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = stepRefs.current.findIndex((ref) => ref === entry.target);
            if (index !== -1) {
              setActiveStep(index + 1);
            }
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      minHeight: '100vh',
      paddingTop: '96px',
      paddingBottom: '80px',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="section-label">INSTALLATION</span>
          <h1 className="section-title" style={{ fontSize: '48px', marginTop: '8px' }}>
            STEP BY STEP GUIDE
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '18px',
            marginTop: '16px',
            maxWidth: '600px',
            margin: '16px auto 0',
            lineHeight: 1.6
          }}>
            FOLLOW THESE SIMPLE STEPS TO INSTALL AND START USING THE WORDLE ENTROPY SOLVER BROWSER EXTENSION.
          </p>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            padding: '12px 24px',
            color: 'var(--accent-green)',
            fontFamily: '"Roboto Condensed", sans-serif',
            fontSize: '14px',
            letterSpacing: '0.1em',
            fontWeight: 600,
            textTransform: 'uppercase',
            maxWidth: '600px',
            margin: '24px auto 0',
            textAlign: 'center'
          }}>
            💡 Tip: Clicking any step card below automatically triggers its task (Download ZIP, copy paths, or launch pages).
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{
          position: 'sticky',
          top: '80px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          padding: '20px',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          marginBottom: '48px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            {steps.map((step) => (
              <div 
                key={step.id} 
                onClick={() => {
                  stepRefs.current[step.id - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  handleCardClick(step.id);
                }}
                title={`Go to Step ${step.id}: ${step.title}`}
                style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: activeStep >= step.id ? 'var(--accent-green)' : 'var(--border-primary)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }} 
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontFamily: '"Bebas Neue", sans-serif', fontSize: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            STEP {activeStep} OF {steps.length} — {steps[activeStep - 1]?.title}
          </div>
        </div>

        {/* Steps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '100px' }}>
          {steps.map((step, index) => (
            <motion.a
              key={step.id}
              ref={(el) => { stepRefs.current[index] = el; }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              href={
                step.id === 1 ? 'https://github.com/naitaj/wordle/archive/refs/heads/main.zip' : undefined
              }
              target={step.id === 1 ? '_blank' : undefined}
              rel={step.id === 1 ? 'noopener noreferrer' : undefined}
              onClick={() => {
                if (step.id === 1 || step.id === 2) {
                  handleCardClick(step.id);
                }
              }}
              whileHover={step.id === 1 || step.id === 2 ? { scale: 1.01 } : undefined}
              style={{
                display: 'flex',
                gap: '32px',
                backgroundColor: 'var(--bg-card)',
                border: step.id === activeStep ? '1.5px solid var(--accent-green)' : '1px solid var(--border-primary)',
                borderRadius: '16px',
                padding: '40px',
                alignItems: 'flex-start',
                cursor: step.id === 1 || step.id === 2 ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                color: 'inherit'
              }}
              className="flex-col md:flex-row"
            >
              <div style={{
                flexShrink: 0,
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Anton", sans-serif',
                fontSize: '32px',
                borderRadius: '12px'
              }}>
                {step.id}
              </div>
              <div style={{ flex: 1, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', width: '100%', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '32px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {step.title}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleStepExpanded(step.id);
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      backgroundColor: expandedSteps[step.id] ? 'var(--accent-green)' : 'var(--bg-secondary)',
                      color: expandedSteps[step.id] ? '#ffffff' : 'var(--accent-green)',
                      border: '1.5px solid var(--accent-green)',
                      fontFamily: '"Roboto Condensed", sans-serif',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSteps[step.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    {expandedSteps[step.id] ? 'COLLAPSE' : 'INSTRUCTIONS'}
                  </button>
                </div>

                {step.desc && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, margin: '0 0 24px 0', whiteSpace: 'pre-line' }}>
                    {step.desc}
                  </p>
                )}
                
                {step.id === 5 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    margin: '16px 0 0 0'
                  }}>
                    <a
                      href="https://www.nytimes.com/games/wordle/index.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--accent-amber)',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        textDecoration: 'underline',
                        padding: '14px 18px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        wordBreak: 'break-all',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🔗 https://www.nytimes.com/games/wordle/index.html ↗
                    </a>
                    <a
                      href="https://wordleunlimited.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--accent-amber)',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        textDecoration: 'underline',
                        padding: '14px 18px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        wordBreak: 'break-all',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🔗 https://wordleunlimited.org/ ↗
                    </a>
                  </div>
                ) : step.code && (
                  <pre style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    padding: '20px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    margin: 0,
                    color: 'var(--accent-amber)',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}>
                    {step.code}
                  </pre>
                )}
                
                {step.link && (
                  step.link.url.startsWith('/') ? (
                    <Link 
                      to={step.link.url}
                      onClick={(e) => e.stopPropagation()} // Prevent double firing click handler
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--accent-green)',
                        color: '#ffffff',
                        padding: '12px 24px',
                        textDecoration: 'none',
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: '20px',
                        borderRadius: '8px',
                        marginTop: '16px'
                      }}
                    >
                      {step.link.text}
                    </Link>
                  ) : (
                    <a 
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(step.id);
                      }}
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--accent-green)',
                        color: '#ffffff',
                        padding: '12px 24px',
                        textDecoration: 'none',
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: '20px',
                        borderRadius: '8px',
                        marginTop: '16px'
                      }}
                    >
                      {step.link.text}
                    </a>
                  )
                )}

                {expandedSteps[step.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      marginTop: '20px',
                      padding: '20px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderLeft: '4px solid var(--accent-green)',
                      borderRadius: '8px',
                      fontSize: '15px',
                      lineHeight: '1.7',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--accent-green)', fontFamily: '"Bebas Neue", sans-serif', fontSize: '20px', letterSpacing: '1px' }}>
                      INSTRUCTIONS:
                    </div>
                    {stepInstructions[step.id]}
                  </motion.div>
                )}

                {step.actionLabel && (
                  <div style={{
                    marginTop: '16px',
                    fontFamily: '"Roboto Condensed", sans-serif',
                    fontSize: '12px',
                    color: 'var(--accent-green)',
                    letterSpacing: '0.15em',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {step.actionLabel}
                  </div>
                )}
              </div>
            </motion.a>
          ))}
        </div>

        {/* Bottom CTA */}
        <section style={{ textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '24px', padding: '60px 40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0 0 40px 0', textTransform: 'uppercase' }}>
              WHAT'S NEXT?
            </h2>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: '"Roboto Condensed", sans-serif', fontSize: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>INSTALLATION COMPLETE?</span>
                <Link to="/check" style={{
                  backgroundColor: 'var(--accent-green)',
                  color: '#ffffff',
                  padding: '16px 32px',
                  textDecoration: 'none',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '24px',
                  borderRadius: '8px',
                  letterSpacing: '1px',
                  minWidth: '200px',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}>
                  CHECK INSTALLATION
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: '"Roboto Condensed", sans-serif', fontSize: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>HAVING TROUBLE?</span>
                <Link to="/faq" style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-accent)',
                  padding: '14px 32px',
                  textDecoration: 'none',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '24px',
                  borderRadius: '8px',
                  letterSpacing: '1px',
                  minWidth: '200px',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}>
                  VIEW FAQ
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
        {/* Floating Toast Notification */}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              right: '40px',
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '18px',
              letterSpacing: '1px',
              zIndex: 1000,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            {toastMessage}
          </motion.div>
        )}

      </div>
    </div>
  );
};
