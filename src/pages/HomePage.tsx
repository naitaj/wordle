import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Demo simulation data: multiple puzzles to cycle through
const DEMO_PUZZLES = [
  {
    guesses: [
      { word: 'CRANE', colors: ['absent', 'absent', 'present', 'absent', 'correct'] },
      { word: 'STALE', colors: ['correct', 'absent', 'present', 'absent', 'correct'] },
      { word: 'SHAPE', colors: ['correct', 'correct', 'correct', 'absent', 'correct'] },
      { word: 'SHADE', colors: ['correct', 'correct', 'correct', 'correct', 'correct'] },
    ],
    stats: [
      { guess: 'CRANE', entropy: '5.74', wordsLeft: '2309' },
      { guess: 'STALE', entropy: '4.12', wordsLeft: '84' },
      { guess: 'SHAPE', entropy: '2.58', wordsLeft: '6' },
      { guess: 'SHADE', entropy: '0.00', wordsLeft: '1' },
    ],
  },
  {
    guesses: [
      { word: 'SALET', colors: ['absent', 'absent', 'absent', 'absent', 'absent'] },
      { word: 'CORGI', colors: ['correct', 'absent', 'correct', 'absent', 'correct'] },
      { word: 'CURVI', colors: ['correct', 'absent', 'correct', 'absent', 'correct'] },
      { word: 'CRIMP', colors: ['correct', 'correct', 'correct', 'correct', 'correct'] },
    ],
    stats: [
      { guess: 'SALET', entropy: '5.88', wordsLeft: '2309' },
      { guess: 'CORGI', entropy: '3.91', wordsLeft: '121' },
      { guess: 'CURVI', entropy: '2.32', wordsLeft: '8' },
      { guess: 'CRIMP', entropy: '0.00', wordsLeft: '1' },
    ],
  },
  {
    guesses: [
      { word: 'TRACE', colors: ['absent', 'absent', 'absent', 'absent', 'absent'] },
      { word: 'LOUSY', colors: ['absent', 'absent', 'present', 'absent', 'absent'] },
      { word: 'WHUNG', colors: ['absent', 'absent', 'correct', 'absent', 'absent'] },
      { word: 'BLUNT', colors: ['correct', 'correct', 'correct', 'correct', 'correct'] },
    ],
    stats: [
      { guess: 'TRACE', entropy: '5.63', wordsLeft: '2309' },
      { guess: 'LOUSY', entropy: '4.08', wordsLeft: '97' },
      { guess: 'WHUNG', entropy: '2.14', wordsLeft: '5' },
      { guess: 'BLUNT', entropy: '0.00', wordsLeft: '1' },
    ],
  },
  {
    guesses: [
      { word: 'RAISE', colors: ['absent', 'absent', 'absent', 'absent', 'correct'] },
      { word: 'CONTE', colors: ['absent', 'present', 'absent', 'absent', 'correct'] },
      { word: 'GOUGE', colors: ['absent', 'correct', 'absent', 'absent', 'correct'] },
      { word: 'FORGE', colors: ['correct', 'correct', 'correct', 'correct', 'correct'] },
    ],
    stats: [
      { guess: 'RAISE', entropy: '5.88', wordsLeft: '2309' },
      { guess: 'CONTE', entropy: '3.45', wordsLeft: '68' },
      { guess: 'GOUGE', entropy: '1.58', wordsLeft: '4' },
      { guess: 'FORGE', entropy: '0.00', wordsLeft: '1' },
    ],
  },
  {
    guesses: [
      { word: 'SLATE', colors: ['absent', 'present', 'absent', 'absent', 'absent'] },
      { word: 'CURLY', colors: ['absent', 'present', 'absent', 'present', 'absent'] },
      { word: 'PLUMB', colors: ['correct', 'correct', 'correct', 'correct', 'correct'] },
    ],
    stats: [
      { guess: 'SLATE', entropy: '5.82', wordsLeft: '2309' },
      { guess: 'CURLY', entropy: '3.67', wordsLeft: '42' },
      { guess: 'PLUMB', entropy: '0.00', wordsLeft: '1' },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent: '#3a3a3c',
  empty: 'transparent',
};

const TYPING_DELAY = 120;    // ms per letter typed
const FLIP_DELAY = 250;      // ms between each tile flip
const FLIP_DURATION = 500;   // ms for one tile flip
const PAUSE_AFTER_ROW = 600; // ms pause after a row is revealed
const PAUSE_AFTER_WIN = 3000; // ms pause before replay

const WordleDemo = () => {
  // Board state: 6 rows x 5 cols, each tile has { letter, color, revealed }
  const emptyBoard = () =>
    Array.from({ length: 6 }, () =>
      Array.from({ length: 5 }, () => ({ letter: '', color: 'empty' as string, revealed: false }))
    );

  const [board, setBoard] = useState(emptyBoard());
  const [currentStats, setCurrentStats] = useState({ guess: '—', entropy: '—', wordsLeft: '2309' });
  const [solvedMsg, setSolvedMsg] = useState(false);
  const [demoKey, setDemoKey] = useState(0);
  const puzzleIndexRef = useRef(0);

  const runDemo = useCallback(async () => {
    setSolvedMsg(false);
    const newBoard = emptyBoard();
    setBoard([...newBoard]);
    setCurrentStats({ guess: '—', entropy: '—', wordsLeft: '2309' });

    const puzzle = DEMO_PUZZLES[puzzleIndexRef.current % DEMO_PUZZLES.length];
    const DEMO_GUESSES = puzzle.guesses;
    const DEMO_STATS = puzzle.stats;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await sleep(800); // initial pause

    for (let row = 0; row < DEMO_GUESSES.length; row++) {
      const { word, colors } = DEMO_GUESSES[row];
      const stats = DEMO_STATS[row];

      // Update sidebar to show current best guess before typing
      setCurrentStats({ guess: stats.guess, entropy: stats.entropy, wordsLeft: row === 0 ? '2309' : DEMO_STATS[row - 1].wordsLeft });

      // Type letters one by one
      for (let col = 0; col < 5; col++) {
        newBoard[row][col] = { letter: word[col], color: 'empty', revealed: false };
        setBoard(newBoard.map((r) => [...r]));
        await sleep(TYPING_DELAY);
      }

      await sleep(300); // brief pause before flipping

      // Flip tiles one by one
      for (let col = 0; col < 5; col++) {
        newBoard[row][col] = { letter: word[col], color: colors[col], revealed: true };
        setBoard(newBoard.map((r) => [...r]));
        await sleep(FLIP_DELAY);
      }

      // Update sidebar words left after reveal
      setCurrentStats({ guess: stats.guess, entropy: stats.entropy, wordsLeft: stats.wordsLeft });

      await sleep(PAUSE_AFTER_ROW);
    }

    // Show solved message
    setSolvedMsg(true);
    await sleep(PAUSE_AFTER_WIN);

    // Advance to next puzzle and restart
    puzzleIndexRef.current = (puzzleIndexRef.current + 1) % DEMO_PUZZLES.length;
    setDemoKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await runDemo();
    };
    run();
    return () => { cancelled = true; };
  }, [demoKey, runDemo]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>

      {/* Wordle Board */}
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: '6px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
        {board.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {row.map((tile, colIdx) => {
              const bgColor = tile.revealed ? COLOR_MAP[tile.color] : '#121213';
              const borderColor = tile.letter && !tile.revealed ? '#565758' : tile.revealed ? COLOR_MAP[tile.color] : '#3a3a3c';

              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}-${demoKey}`}
                  animate={
                    tile.revealed
                      ? { rotateX: [0, 90, 0], backgroundColor: bgColor, borderColor }
                      : tile.letter
                      ? { scale: [1, 1.1, 1], borderColor }
                      : {}
                  }
                  transition={
                    tile.revealed
                      ? { duration: FLIP_DURATION / 1000, ease: 'easeInOut' }
                      : tile.letter
                      ? { duration: 0.1 }
                      : {}
                  }
                  style={{
                    width: '52px',
                    height: '52px',
                    border: `2px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 'bold',
                    color: tile.letter ? '#fff' : 'var(--text-primary)',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                  }}
                >
                  {tile.letter}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Stats */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '28px',
          minWidth: '260px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
        }}
      >
        <div>
          <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Best Guess</div>
          <motion.div
            key={currentStats.guess}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: '"Anton", sans-serif', fontSize: '32px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}
          >
            {currentStats.guess}
          </motion.div>
        </div>
        <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-primary)' }} />
        <div>
          <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Entropy</div>
          <motion.div
            key={currentStats.entropy}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: 'var(--accent-amber)', letterSpacing: '0.05em' }}
          >
            {currentStats.entropy === '—' ? '—' : `${currentStats.entropy} BITS`}
          </motion.div>
        </div>
        <div>
          <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Words Left</div>
          <motion.div
            key={currentStats.wordsLeft}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}
          >
            {currentStats.wordsLeft}
          </motion.div>
        </div>

        <AnimatePresence>
          {solvedMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                marginTop: '8px',
                padding: '12px 16px',
                backgroundColor: 'rgba(83, 141, 78, 0.15)',
                border: '1px solid #538d4e',
                borderRadius: '8px',
                textAlign: 'center',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '20px',
                color: '#538d4e',
                letterSpacing: '0.1em',
              }}
            >
              ✓ SOLVED IN 4 GUESSES
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
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

        {/* INTERACTIVE DEMO SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontSize: '24px', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              DEMO
            </div>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0', textTransform: 'uppercase' }}>
              WATCH IT SOLVE
            </h2>
          </div>

          <WordleDemo />
        </motion.section>

        {/* FEATURES SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '100px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontSize: '24px', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
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
              { title: 'OFFICIAL NYT WORDLE SUPPORT', desc: 'Full compatibility with the official New York Times game', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
              { title: '11+ SUPPORTED WORDLE CLONES', desc: 'Full compatibility with Quordle, Octordle, Dordle, Sedecordle, Hurdle, Absurdle & more', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
              { title: 'ENTROPY-BASED SOLVER', desc: 'Uses Shannon entropy to score every possible guess', icon: 'M12 2v20m10-10H2' },
              { title: 'MAXIMUM INFORMATION GUESSES', desc: 'Each guess maximizes the information you gain', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
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

        {/* SUPPORTED WEBSITES SECTION */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{ marginBottom: '100px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontSize: '24px', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              COMPATIBILITY
            </div>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '48px', margin: '0', textTransform: 'uppercase' }}>
              SUPPORTED WEBSITES
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '32px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '12px', fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.15em' }}>CLASSIC WORDLE</span>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', margin: '4px 0 8px 0', letterSpacing: '0.05em' }}>NYT WORDLE & WORDLE UNLIMITED</h3>
              <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
                Full support for official NYT Wordle, Wordle Unlimited, and Hello Wordl. Evaluates entropy in real-time alongside standard 5-letter game boards.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '32px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '12px', fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.15em' }}>MULTI-BOARD GAMES</span>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', margin: '4px 0 8px 0', letterSpacing: '0.05em' }}>QUORDLE, OCTORDLE & SEDECORDLE</h3>
              <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
                Simultaneous multi-grid solving for Dordle (2x), Quordle (4x), Octordle (8x), and Sedecordle (16x). Calculates combined Shannon entropy across all remaining active boards.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '32px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '12px', fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.15em' }}>MULTI-ROUND & SEQUENTIAL</span>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', margin: '4px 0 8px 0', letterSpacing: '0.05em' }}>HURDLE & KILORDLE</h3>
              <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
                Multi-round transition tracking for Hurdle and sequential 1000-word progression for Kilordle with automatic solver state resetting between rounds.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '32px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '12px', fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.15em' }}>ADVERSARIAL WORDLE</span>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', margin: '4px 0 8px 0', letterSpacing: '0.05em' }}>ABSURDLE, EVIL WORDLE & LINGLE</h3>
              <p style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
                Handles adversarial feedback loops in Absurdle and Evil Wordle, continuously filtering live candidate spaces after adaptive tile responses.
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
            <div style={{ fontFamily: '"Roboto Condensed", sans-serif', color: 'var(--accent-green)', fontSize: '24px', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
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
              { num: '3', title: 'OPEN WORDLE', desc: 'Navigate to NYT Wordle or https://wordleunlimited.org/' },
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
