# AI Wordle Auto-Solver 🤖🟩🟨

[![Wordle Auto-Solver](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](#)
[![GitHub Repository](https://img.shields.io/badge/GitHub-View_Repository-blue?logo=github)](https://github.com/naitaj/wordle)

An intelligent, autonomous auto-solver for the popular game Wordle. Built using advanced Information Theory (Entropy calculations) to deterministically solve puzzles, backed by a Large Language Model (Groq / LLaMA-3) fallback system to handle extreme edge cases and zero-candidate puzzle states. 

The solver visually types out its guesses, evaluates hints, and recalculates optimal paths in real-time within a beautiful, responsive UI.

---

## 🚀 Tech Stack

### Core Technologies
- **React 18** - Frontend UI library
- **TypeScript** - Strict static typing for resilient solver logic
- **Vite** - High-performance build tool and dev server
- **TailwindCSS** - Rapid utility-first styling and glassmorphic UI

### AI & Computational Algorithms
- **Information Theory Engine** - Calculates Shannon Entropy ($-\sum p \log_2 p$) for thousands of possible word permutations asynchronously.
- **Web Workers** - Dedicated multi-threading (`entropy.worker.ts`) to offload heavy $O(N^2)$ candidate ranking without blocking the UI thread.
- **Groq API (LLaMA-3)** - Fallback LLM generation using prompt injection to guarantee syntactically legal exploratory guesses when the solver hits impossible mathematical constraints.

---

## 🛠 Usage & Installation

### Prerequisites
- Node.js (v18+)
- A Groq API Key (required for LLM fallback capabilities)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/naitaj/wordle.git
   cd wordle
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
   *(Note: The `.env` file is git-ignored automatically to protect your secrets).*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🧠 Architecture

The auto-solver is designed around a strictly deterministic, non-blocking pipeline:

1. **State Management:** The game is driven by a custom React hook (`useAutoSolver.ts`) that manages an internal `SolverState` machine transitioning between `idle -> thinking -> typing -> evaluating -> won/lost`.
2. **Strict Filtering Pipeline:** `wordleRules.ts` implements exhaustive constraint checking (both positional bounds and absolute letter counts) against every candidate word.
3. **Asynchronous Entropy Worker:** The `entropy.worker.ts` computes the expected information gain of every legal dictionary word against the remaining candidate pool, running purely on a background thread.
4. **Deterministic Tie-Breaking:** Ties in entropy scores are broken via a rigid 4-step pipeline: Target Dictionary Inclusion $\rightarrow$ Max Unique Letters $\rightarrow$ Word Frequency Rank Proxy $\rightarrow$ Alphabetical Fallback.

---

## 🔄 The Solver Workflow

The engine executes the following logic loop for each guess:

1. **Guess 1:** Bypasses calculation and types a pre-configured optimal opening word (e.g., `ADIEU` or `CRANE`).
2. **Evaluate & Filter:** The guess is submitted, coloring logic applied, and the dictionary is aggressively filtered to remove mathematically impossible words.
3. **Entropy Ranking (Guesses 2-4):** The solver calculates Shannon entropy over the remaining pool. It prefers strict Hard Mode (valid candidates only) unless the marginal gain of exploring the full dictionary exceeds 0.15 bits with a low win probability.
4. **Dynamic Exploratory Breakout:** If the solver detects a trap (e.g., `ATCH` words), it intentionally breaks Hard Mode, picking a full-dictionary word to eliminate maximum consonants simultaneously.
5. **LLM Zero-Candidate Fallback:** If a user types a custom word that does *not* exist in the official Wordle dictionary, the solver's valid pool eventually drops to 0. In this invariant state, the solver injects the active puzzle constraints into the Groq API, forcing the LLM to hallucinate a "best effort" guess to keep the game alive.
6. **Victory:** The solver routinely converges on the correct answer within 3-4 guesses.

---

*Built with precision algorithms, Web Workers, and AI for the ultimate deterministic solving experience.*
