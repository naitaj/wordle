import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: "WHAT IS ENTROPY IN THE CONTEXT OF WORDLE?",
    answer: "In information theory, entropy measures the expected amount of information you gain from an event. When applied to Wordle, the solver calculates the entropy of each possible guess by looking at how it splits the remaining candidate words into groups based on the color pattern feedback. A guess with higher entropy means it divides the remaining words more evenly, giving you more information regardless of what the answer turns out to be. The solver picks the guess that maximizes this information gain."
  },
  {
    question: "DOES THIS SOLVE WORDLE AUTOMATICALLY?",
    answer: "Yes. In Auto Solve mode, the extension reads the current state of the Wordle board, calculates the best guess using entropy, types it into the game, and submits it. It repeats this process until the game is won or lost. You can also use Assist Mode, which only suggests the best word without typing it for you."
  },
  {
    question: "IS MY DATA COLLECTED?",
    answer: "No. The extension runs entirely in your browser. All entropy calculations happen locally on your machine. The extension does not send any data to external servers. The only exception is if you enable the optional Groq LLM fallback, which sends game context to the Groq API to get a word suggestion when the solver runs out of candidates."
  },
  {
    question: "WHICH BROWSERS ARE SUPPORTED?",
    answer: "The extension works on any Chromium-based browser, including Google Chrome, Microsoft Edge, and Brave. It does not work on Firefox or Safari because it uses Chrome Extension APIs (Manifest V3)."
  },
  {
    question: "DOES IT WORK ON EVERY WORDLE CLONE?",
    answer: "The extension is specifically built to work on two websites: the official New York Times Wordle (nytimes.com/games/wordle) and https://wordleunlimited.org/. Other Wordle clones may use different page structures that the extension cannot read."
  },
  {
    question: "WHY DO I NEED DEVELOPER MODE?",
    answer: "Chrome requires Developer Mode to be enabled in order to load unpacked extensions. This is a security feature that allows you to install extensions that are not published on the Chrome Web Store. The extension is open-source and safe to use."
  },
  {
    question: "WILL THIS AFFECT MY BROWSER PERFORMANCE?",
    answer: "No. The extension is lightweight and only activates when you visit a supported Wordle website. The entropy calculations run in a Web Worker, which means they happen in a background thread and do not block the browser's main thread. When you are not on a Wordle page, the extension uses zero resources."
  }
];

export const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', paddingTop: '96px', paddingBottom: '96px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '80px' }}
        >
          <div style={{ 
            fontFamily: '"Bebas Neue", sans-serif', 
            color: 'var(--accent-green)', 
            letterSpacing: '2px', 
            fontSize: '18px',
            marginBottom: '16px' 
          }}>
            SUPPORT
          </div>
          <h1 style={{ 
            fontFamily: '"Anton", sans-serif', 
            fontSize: '64px', 
            margin: '0 0 24px 0', 
            lineHeight: '1.1' 
          }}>
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p style={{ 
            fontFamily: '"Inter", sans-serif', 
            fontSize: '20px', 
            color: 'var(--text-secondary)', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Everything you need to know about the Wordle Entropy Solver
          </p>
        </motion.div>

        {/* FAQ Accordion Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ maxWidth: '800px', margin: '0 auto 100px auto' }}
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <button 
                  onClick={() => toggleOpen(index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    padding: '24px 0',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ 
                    fontFamily: '"Inter", sans-serif', 
                    fontWeight: 700, 
                    fontSize: '18px',
                    letterSpacing: '0.5px' 
                  }}>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      color: isOpen ? 'var(--accent-amber)' : 'var(--text-muted)'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ 
                        paddingBottom: '24px', 
                        fontFamily: '"Inter", sans-serif', 
                        fontSize: '16px', 
                        lineHeight: '1.6', 
                        color: 'var(--text-secondary)' 
                      }}>
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>

        {/* Bottom CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--border-primary)', 
            borderRadius: '16px', 
            padding: '48px', 
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <h2 style={{ 
            fontFamily: '"Anton", sans-serif', 
            fontSize: '36px', 
            margin: '0 0 16px 0',
            color: 'var(--text-primary)'
          }}>
            STILL HAVE QUESTIONS?
          </h2>
          <p style={{ 
            fontFamily: '"Inter", sans-serif', 
            fontSize: '16px', 
            color: 'var(--text-secondary)', 
            margin: '0 0 32px 0' 
          }}>
            Check out our GitHub issues or head back to the installation guide to get started.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            <a 
              href="https://github.com/naitaj/wordle/issues" 
              target="_blank" 
              rel="noreferrer"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '20px',
                letterSpacing: '1px',
                padding: '12px 24px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-accent)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GITHUB ISSUES
            </a>
            <Link 
              to="/install" 
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '20px',
                letterSpacing: '1px',
                padding: '12px 24px',
                backgroundColor: 'var(--accent-green)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              INSTALLATION GUIDE
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
