import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const InstallGuidePage = () => {
  const [activeStep, setActiveStep] = useState(1);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  interface Step {
    id: number;
    title: string;
    desc: string;
    code?: string;
    link?: {
      text: string;
      url: string;
    };
  }

  const steps: Step[] = [
    {
      id: 1,
      title: 'DOWNLOAD THE EXTENSION',
      desc: 'DOWNLOAD THE REPOSITORY AS A ZIP FILE OR CLONE IT USING GIT.',
      code: 'git clone https://github.com/naitaj/wordle.git\n# Or download ZIP from GitHub',
    },
    {
      id: 2,
      title: 'INSTALL DEPENDENCIES',
      desc: 'OPEN A TERMINAL IN THE PROJECT FOLDER AND INSTALL DEPENDENCIES.',
      code: 'npm install',
    },
    {
      id: 3,
      title: 'BUILD THE EXTENSION',
      desc: 'RUN THE BUILD SCRIPT TO COMPILE THE EXTENSION FILES.\nTHIS CREATES THE EXTENSION/DIST FOLDER WITH ALL COMPILED FILES.',
      code: 'node extension/build.js',
    },
    {
      id: 4,
      title: 'OPEN CHROME EXTENSIONS',
      desc: "OPEN YOUR BROWSER'S EXTENSION MANAGEMENT PAGE.",
      code: 'chrome://extensions',
    },
    {
      id: 5,
      title: 'ENABLE DEVELOPER MODE',
      desc: 'TOGGLE THE DEVELOPER MODE SWITCH IN THE TOP-RIGHT CORNER OF THE EXTENSIONS PAGE.',
    },
    {
      id: 6,
      title: 'LOAD THE EXTENSION',
      desc: 'CLICK "LOAD UNPACKED" AND SELECT THE EXTENSION/DIST FOLDER FROM THE PROJECT DIRECTORY.',
    },
    {
      id: 7,
      title: 'VERIFY INSTALLATION',
      desc: 'YOU SHOULD SEE THE WORDLE ENTROPY SOLVER APPEAR IN YOUR EXTENSIONS LIST WITH ITS GREEN ICON.',
      link: { text: 'CHECK INSTALLATION', url: '/check' },
    },
    {
      id: 8,
      title: 'OPEN A WORDLE WEBSITE',
      desc: 'NAVIGATE TO ONE OF THE SUPPORTED WEBSITES.',
      code: 'https://www.nytimes.com/games/wordle/index.html\nhttps://www.wordle.name',
    },
    {
      id: 9,
      title: 'CLICK THE EXTENSION ICON',
      desc: 'CLICK THE WORDLE ENTROPY SOLVER ICON IN YOUR BROWSER TOOLBAR TO OPEN THE POPUP.',
    },
    {
      id: 10,
      title: 'PRESS START',
      desc: 'SELECT AUTO SOLVE OR ASSIST MODE, THEN PRESS START SOLVING. THE EXTENSION READS THE BOARD AND CALCULATES THE BEST GUESS USING ENTROPY.',
    },
  ];

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
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      paddingTop: '96px',
      paddingBottom: '80px',
      color: '#ffffff'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="section-label">INSTALLATION</span>
          <h1 className="section-title" style={{ fontSize: '48px', marginTop: '8px' }}>
            STEP BY STEP GUIDE
          </h1>
          <p style={{
            color: '#a3a3a3',
            fontSize: '18px',
            marginTop: '16px',
            maxWidth: '600px',
            margin: '16px auto 0',
            lineHeight: 1.6
          }}>
            FOLLOW THESE STEPS TO INSTALL AND START USING THE WORDLE ENTROPY SOLVER BROWSER EXTENSION.
          </p>
        </div>

        {/* Progress Tracker */}
        <div style={{
          position: 'sticky',
          top: '80px',
          zIndex: 10,
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(12px)',
          padding: '20px',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          marginBottom: '48px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            {steps.map((step) => (
              <div 
                key={step.id} 
                style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: activeStep >= step.id ? '#22c55e' : '#2a2a2a',
                  transition: 'background-color 0.3s ease'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Steps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '100px' }}>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              ref={(el) => { stepRefs.current[index] = el; }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                display: 'flex',
                gap: '32px',
                backgroundColor: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '16px',
                padding: '40px',
                alignItems: 'flex-start'
              }}
              className="flex-col md:flex-row"
            >
              <div style={{
                flexShrink: 0,
                width: '64px',
                height: '64px',
                backgroundColor: '#2a2a2a',
                color: '#22c55e',
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
                <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '32px', margin: '0 0 16px 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {step.title}
                </h3>
                <p style={{ color: '#d4d4d4', fontSize: '16px', lineHeight: 1.6, margin: '0 0 24px 0', whiteSpace: 'pre-line' }}>
                  {step.desc}
                </p>
                
                {step.code && (
                  <pre style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    padding: '20px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    margin: 0,
                    color: '#f59e0b',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}>
                    {step.code}
                  </pre>
                )}
                
                {step.link && (
                  <Link 
                    to={step.link.url}
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#22c55e',
                      color: '#000000',
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
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <section style={{ textAlign: 'center', backgroundColor: '#161616', border: '1px solid #2a2a2a', borderRadius: '24px', padding: '60px 40px' }}>
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
                <span style={{ fontFamily: '"Roboto Condensed", sans-serif', fontSize: '16px', color: '#a3a3a3', textTransform: 'uppercase' }}>INSTALLATION COMPLETE?</span>
                <Link to="/check" style={{
                  backgroundColor: '#22c55e',
                  color: '#000000',
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
                <span style={{ fontFamily: '"Roboto Condensed", sans-serif', fontSize: '16px', color: '#a3a3a3', textTransform: 'uppercase' }}>HAVING TROUBLE?</span>
                <Link to="/faq" style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '2px solid #2a2a2a',
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

      </div>
    </div>
  );
};
