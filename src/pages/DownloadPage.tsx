import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const DownloadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const WindowsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="#0078d7">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
  </svg>
);

const MacIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.36 13.92C16.39 10.22 19.38 8.44 19.5 8.35C17.76 5.8 15.02 5.42 14.07 5.3C11.83 5.07 9.68 6.64 8.54 6.64C7.4 6.64 5.64 5.33 3.78 5.36C1.34 5.39 -0.91 6.78 -2.19 8.99C-4.78 13.48 -3.11 20.08 -0.58 23.75C0.66 25.55 2.1 27.56 4.02 27.5C5.88 27.44 6.59 26.31 8.84 26.31C11.08 26.31 11.74 27.5 13.68 27.47C15.68 27.44 16.92 25.64 18.15 23.85C19.61 21.72 20.21 19.66 20.24 19.56C20.17 19.53 16.33 18.06 16.36 13.92ZM13.88 3.53C14.9 2.3 15.58 0.58 15.39 -1.13C13.93 -0.54 12.08 0.38 11.02 1.6C10.08 2.68 9.27 4.45 9.5 6.13C11.13 6.26 12.87 5.35 13.88 3.53Z" transform="scale(0.8) translate(3, 3)"/>
  </svg>
);

const LinuxIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C7 2 4 6 4 11s2.5 11 8 11 8-6 8-11-3-9-8-9zm0 18c-4.41 0-6-4.93-6-9s2.02-7 6-7 6 2.93 6 7-1.59 9-6 9zm-2-9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-4 4c0 1.1.9 2 2 2s2-.9 2-2h-4z" />
  </svg>
);

const ChromeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="4"></circle>
    <line x1="21.17" y1="8" x2="12" y2="8"></line>
    <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
    <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
  </svg>
);

const EdgeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 12a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" opacity="0.3"/>
    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5c0 1.1-.19 2.16-.54 3.16-1.8-1.52-4.14-2.52-6.72-2.8a6.5 6.5 0 0 0-4.63-2.1c-2.3 0-4.32 1.18-5.5 3A9.45 9.45 0 0 1 12 2.5z"/>
  </svg>
);

const BraveIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

export const DownloadPage = () => {
  return (
    <div style={{ paddingTop: '96px', paddingBottom: '96px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px', color: '#fff', backgroundColor: '#0a0a0a' }}>
      
      {/* 1. HEADER */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeIn}
        style={{ textAlign: 'center', marginBottom: '80px' }}
      >
        <span className="section-label font-bebas" style={{ color: '#22c55e', fontSize: '24px', display: 'block', marginBottom: '16px', letterSpacing: '2px' }}>
          DOWNLOAD
        </span>
        <h1 className="font-anton" style={{ fontSize: '72px', margin: '0 0 24px 0', lineHeight: '1.1' }}>
          GET THE EXTENSION
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', color: '#a3a3a3', maxWidth: '600px', margin: '0 auto' }}>
          DOWNLOAD THE UNPACKED EXTENSION TO RUN THE WORDLE ENTROPY SOLVER DIRECTLY IN YOUR BROWSER.
        </p>
      </motion.div>

      {/* 2. DOWNLOAD CARD */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeIn}
        className="card"
        style={{ 
          backgroundColor: '#161616', 
          border: '1px solid #2a2a2a', 
          borderRadius: '16px', 
          padding: '48px', 
          textAlign: 'center',
          marginBottom: '100px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h2 className="font-bebas" style={{ fontSize: '40px', marginBottom: '16px' }}>WORDLE ENTROPY SOLVER V1.0.0</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: '#a3a3a3', marginBottom: '40px' }}>
          DOWNLOAD THE UNPACKED EXTENSION AND LOAD IT INTO YOUR BROWSER TO GET STARTED IMMEDIATELY.
        </p>
        
        <a 
          href="https://github.com/naitaj/wordle/archive/refs/heads/main.zip"
          className="btn-primary font-bebas"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#22c55e', 
            color: '#000', 
            padding: '16px 40px', 
            borderRadius: '8px', 
            fontSize: '24px', 
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '40px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
        >
          <DownloadIcon />
          DOWNLOAD .ZIP
        </a>

        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
          <p className="font-condensed" style={{ color: '#a3a3a3', marginBottom: '12px', textTransform: 'uppercase' }}>OR CLONE THE REPOSITORY:</p>
          <div style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #2a2a2a', 
            borderRadius: '8px', 
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <code style={{ fontFamily: 'monospace', color: '#22c55e', fontSize: '16px' }}>
              git clone https://github.com/naitaj/wordle.git
            </code>
          </div>
        </div>
      </motion.div>

      {/* 3. OPERATING SYSTEMS */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeIn}
        style={{ marginBottom: '100px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="section-label font-bebas" style={{ color: '#f59e0b', fontSize: '20px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PLATFORM SUPPORT</span>
          <h2 className="section-title font-anton" style={{ fontSize: '48px', margin: 0 }}>WORKS ON ANY OS</h2>
        </div>

        <motion.div 
          variants={staggerContainer}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}
        >
          {[
            { name: 'WINDOWS', icon: <WindowsIcon /> },
            { name: 'MACOS', icon: <MacIcon /> },
            { name: 'LINUX', icon: <LinuxIcon /> }
          ].map((os) => (
            <motion.div 
              key={os.name}
              variants={fadeIn}
              className="card"
              style={{
                backgroundColor: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ color: '#fff', marginBottom: '8px' }}>{os.icon}</div>
              <h3 className="font-bebas" style={{ fontSize: '28px', margin: 0 }}>{os.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
                <CheckIcon />
                <span className="font-condensed" style={{ textTransform: 'uppercase', fontSize: '16px' }}>SUPPORTED</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* 4. SUPPORTED BROWSERS */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeIn}
        style={{ marginBottom: '100px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="section-label font-bebas" style={{ color: '#f59e0b', fontSize: '20px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>BROWSER SUPPORT</span>
          <h2 className="section-title font-anton" style={{ fontSize: '48px', margin: 0 }}>CHROMIUM BROWSERS</h2>
        </div>

        <motion.div 
          variants={staggerContainer}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}
        >
          {[
            { name: 'GOOGLE CHROME', icon: <ChromeIcon />, note: 'FULLY SUPPORTED' },
            { name: 'MICROSOFT EDGE', icon: <EdgeIcon />, note: 'FULLY SUPPORTED' },
            { name: 'BRAVE BROWSER', icon: <BraveIcon />, note: 'FULLY SUPPORTED' }
          ].map((browser) => (
            <motion.div 
              key={browser.name}
              variants={fadeIn}
              className="card"
              style={{
                backgroundColor: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ color: '#fff', marginBottom: '8px' }}>{browser.icon}</div>
              <h3 className="font-bebas" style={{ fontSize: '28px', margin: 0 }}>{browser.name}</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', color: '#a3a3a3', margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>{browser.note}</p>
            </motion.div>
          ))}
        </motion.div>
        
        <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#a3a3a3', fontSize: '16px', textTransform: 'uppercase' }}>
          REQUIRES ANY CHROMIUM-BASED BROWSER WITH DEVELOPER MODE ENABLED.
        </p>
      </motion.div>

      {/* 5. WHAT'S INCLUDED */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeIn}
        style={{ marginBottom: '100px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="section-label font-bebas" style={{ color: '#f59e0b', fontSize: '20px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PACKAGE CONTENTS</span>
          <h2 className="section-title font-anton" style={{ fontSize: '48px', margin: 0 }}>WHAT'S INCLUDED</h2>
        </div>

        <div style={{ 
          backgroundColor: '#161616', 
          border: '1px solid #2a2a2a', 
          borderRadius: '12px', 
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              { name: 'POPUP UI', desc: 'INTERACTIVE INTERFACE FOR CONTROLLING THE SOLVER.', type: 'folder' },
              { name: 'BACKGROUND SERVICE WORKER', desc: 'MANAGES STATE AND ORCHESTRATES THE SOLVING PROCESS.', type: 'file' },
              { name: 'CONTENT SCRIPTS', desc: 'INTERFACES DIRECTLY WITH THE WORDLE GAME BOARD.', type: 'file' },
              { name: 'ENTROPY SOLVER ENGINE', desc: 'CORE ALGORITHM CALCULATING INFORMATION GAIN.', type: 'folder' },
              { name: 'WORD DICTIONARY', desc: '2,309 ANSWERS + 12,000+ VALID GUESSES INCLUDED.', type: 'file' }
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ color: '#22c55e', marginTop: '4px' }}>
                  {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                </div>
                <div>
                  <h4 className="font-bebas" style={{ fontSize: '24px', margin: '0 0 4px 0', color: '#fff' }}>{item.name}</h4>
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#a3a3a3', margin: 0, fontSize: '16px' }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* 6. CTA */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeIn}
        style={{ textAlign: 'center', marginBottom: '80px', paddingTop: '40px', borderTop: '1px solid #2a2a2a' }}
      >
        <h2 className="font-anton" style={{ fontSize: '48px', marginBottom: '24px' }}>READY TO INSTALL?</h2>
        <Link 
          to="/install" 
          className="btn-secondary font-bebas"
          style={{ 
            display: 'inline-block',
            backgroundColor: 'transparent', 
            color: '#fff', 
            border: '2px solid #fff',
            padding: '16px 40px', 
            borderRadius: '8px', 
            fontSize: '24px', 
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#fff'; }}
        >
          VIEW INSTALLATION GUIDE
        </Link>
      </motion.div>

    </div>
  );
};
