import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export const HomePage = () => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      paddingTop: '96px',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', paddingBottom: '100px' }}>
        
        {/* HERO SECTION */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '100px' }}
        >
          <motion.div variants={itemVariants} style={{
            width: '80px', height: '80px', backgroundColor: '#000000', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', fontFamily: '"Anton", sans-serif', marginBottom: '24px',
            borderRadius: '12px'
          }}>
            W
          </motion.div>
          
          <motion.h1 variants={itemVariants} style={{
            fontFamily: '"Anton", sans-serif', fontSize: 'clamp(60px, 8vw, 100px)',
            lineHeight: '1', margin: '0', textTransform: 'uppercase', letterSpacing: '0.02em'
          }}>
            WORDLE<br/>
            <span style={{ color: 'var(--accent-green)' }}>ENTROPY</span>
          </motion.h1>
          
          <motion.h2 variants={itemVariants} style={{
            fontFamily: '"Roboto Condensed", sans-serif', fontSize: '24px', letterSpacing: '0.35em',
            marginTop: '16px', marginBottom: '24px', color: 'var(--text-secondary)', textTransform: 'uppercase'
          }}>
            AUTONOMOUS SOLVER
          </motion.h2>
          
          <motion.p variants={itemVariants} style={{
            fontFamily: '"Inter", sans-serif', fontSize: '18px', maxWidth: '600px',
            color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px'
          }}>
            Solve Wordle using Information Theory. Uses entropy to maximize information gained from every guess. Helps solve Wordle efficiently. Works directly inside supported Wordle websites. Fast, intelligent and lightweight.
          </motion.p>
          
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/download" className="btn-primary">
              DOWNLOAD EXTENSION
            </Link>
            <Link to="/install" className="btn-secondary">
              HOW IT WORKS
            </Link>
          </motion.div>
        </motion.section>

        {/* FEATURES SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '100px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              FEATURES
            </div>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0', textTransform: 'uppercase' }}>
              BUILT FOR PRECISION
            </h2>
          </div>
          
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'
          }}>
            {[
              { title: 'ENTROPY-BASED SOLVER', desc: 'Uses Shannon entropy to score every possible guess', icon: 'M12 2v20m10-10H2' },
              { title: 'MAXIMUM INFORMATION GUESSES', desc: 'Each guess maximizes the information you gain', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { title: 'AUTOMATIC BOARD DETECTION', desc: 'Reads the Wordle board state automatically', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
              { title: 'WORKS ON NYT WORDLE', desc: 'Full compatibility with the official game', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
              { title: 'WORKS ON WORDLE UNLIMITED', desc: 'Supports the popular Wordle clone', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
              { title: 'ONE-CLICK START', desc: 'Press Start and the solver handles everything', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: 'LIGHTWEIGHT EXTENSION', desc: 'Minimal footprint, no bloat', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
              { title: 'FAST SOLVER', desc: 'Entropy calculations complete in milliseconds', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: 'CLEAN INTEGRATION', desc: 'Sits alongside the game without disruption', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' }
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} style={{
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                  <path d={feature.icon}></path>
                </svg>
                <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                  {feature.title}
                </h3>
                <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', fontSize: '15px', lineHeight: '1.5' }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* INTERACTIVE DEMO SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              DEMO
            </div>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0', textTransform: 'uppercase' }}>
              WATCH IT SOLVE
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            
            {/* Wordle Board Mock */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: '8px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
              {Array.from({ length: 6 }).map((_, rowIdx) => (
                <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {Array.from({ length: 5 }).map((_, colIdx) => {
                    const isFirstRow = rowIdx === 0;
                    const word = "CRANE";
                    const colors = ['#3a3a3c', '#b59f3b', '#538d4e', '#b59f3b', '#3a3a3c'];
                    
                    return (
                      <motion.div 
                        key={colIdx}
                        initial={isFirstRow ? { rotateX: 0, backgroundColor: 'transparent' } : false}
                        animate={isFirstRow ? { 
                          rotateX: [0, 90, 0], 
                          backgroundColor: ['transparent', colors[colIdx], colors[colIdx]],
                          borderColor: ['#3a3a3c', colors[colIdx], colors[colIdx]]
                        } : {}}
                        transition={isFirstRow ? { delay: colIdx * 0.2 + 1, duration: 0.6 } : {}}
                        style={{
                          width: '50px', height: '50px', border: '2px solid #3a3a3c', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                          fontFamily: 'sans-serif', fontWeight: 'bold', color: isFirstRow ? '#fff' : 'var(--text-primary)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {isFirstRow ? word[colIdx] : ""}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar Mock */}
            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '24px',
              minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div>
                <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', marginBottom: '4px' }}>Best Guess</div>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '32px', color: 'var(--text-primary)' }}>CRANE</div>
              </div>
              <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-primary)' }} />
              <div>
                <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', marginBottom: '4px' }}>Entropy</div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: 'var(--accent-amber)', letterSpacing: '0.05em' }}>5.74 BITS</div>
              </div>
              <div>
                <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', marginBottom: '4px' }}>Words Left</div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>2309</div>
              </div>
            </motion.div>

          </div>
        </motion.section>

        {/* SUPPORTED WEBSITES SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '100px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              COMPATIBILITY
            </div>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0', textTransform: 'uppercase' }}>
              SUPPORTED WEBSITES
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '32px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '32px', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>NEW YORK TIMES WORDLE</h3>
              <a href="https://www.nytimes.com/games/wordle/index.html" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: '"Inter", sans-serif', textDecoration: 'underline', display: 'block', marginBottom: '16px' }}>nytimes.com/games/wordle</a>
              <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', lineHeight: '1.6' }}>
                Full support for the official NYT Wordle. The solver seamlessly integrates alongside the game board, tracking your guesses and calculating entropy in real-time without interfering with the site.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '32px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '32px', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>WORDLE UNLIMITED</h3>
              <a href="https://wordleunlimited.org/" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: '"Inter", sans-serif', textDecoration: 'underline', display: 'block', marginBottom: '16px' }}>wordleunlimited.org</a>
              <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', lineHeight: '1.6' }}>
                Full support for the popular Wordle Unlimited alternative. Perfect for practice runs or unlimited play, the entropy solver works exactly as it does on the official site.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* HOW IT WORKS SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '80px', textAlign: 'center' }}
        >
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              GETTING STARTED
            </div>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0', textTransform: 'uppercase' }}>
              HOW IT WORKS
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px', textAlign: 'left' }}>
            {[
              { num: '1', title: 'DOWNLOAD', desc: 'Get the extension files from GitHub' },
              { num: '2', title: 'INSTALL', desc: 'Load it as an unpacked extension in Chrome' },
              { num: '3', title: 'OPEN WORDLE', desc: 'Navigate to NYT Wordle or wordleunlimited.org' },
              { num: '4', title: 'START SOLVING', desc: 'Click Start and watch the entropy solver work' }
            ].map((step, i) => (
              <motion.div key={i} variants={itemVariants} style={{
                position: 'relative', padding: '24px', border: '1px solid var(--border-primary)', borderRadius: '12px', backgroundColor: 'var(--bg-card)'
              }}>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '64px', color: 'var(--border-primary)', position: 'absolute', top: '10px', right: '20px', lineHeight: '1' }}>
                  {step.num}
                </div>
                <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', margin: '0 0 12px 0', letterSpacing: '0.05em', position: 'relative', zIndex: 1 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', fontSize: '15px', lineHeight: '1.5', position: 'relative', zIndex: 1 }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants}>
            <Link to="/install" className="btn-secondary">
              VIEW FULL INSTALLATION GUIDE
            </Link>
          </motion.div>

        </motion.section>

      </div>
    </div>
  );
};

export default HomePage;
