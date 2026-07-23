# Wordle Entropy Solver

Wordle Entropy Solver is a browser extension and companion website that helps users solve Wordle puzzles using information theory. The extension calculates Shannon entropy to find the guess that eliminates the most remaining words. It works on the official New York Times Wordle page and the wordle.name clone.

## Overview

The extension runs in two modes:

* **Auto Solve:** Reads the game board, selects the optimal guess, types it in, and submits it. It repeats this until the game ends.
* **Assist Mode:** Suggests the highest-information words on the side, updating recommendations in real time as you enter guesses manually.

The companion website acts as the central hub for the project, allowing users to learn how the extension works, download it, and verify that it is correctly installed.

## Extension Features

* **Entropy Calculations:** Evaluates guesses by how evenly they partition the remaining possible answers.
* **Exploratory Guesses:** Automatically plays search words when appropriate to eliminate multiple letters quickly.
* **LLM Fallback:** Integrates with the Groq API using LLaMA 3 to handle custom word scenarios where the solver is left with zero candidate words.
* **Industrial Design:** Compact 320x600px sidebar user interface matching the NYT branding and Braun industrial aesthetics.

## Browser Compatibility

The extension is designed for Chromium-based desktop browsers:

* Google Chrome
* Microsoft Edge
* Brave Browser

It does not support mobile browsers directly, which is why the companion website provides a verification check to confirm successful desktop installation.

## Website Structure

The project includes a multi-page React application at the root directory:

* **Home:** Details the solver mechanics with an animated walkthrough of the solving process.
* **Download:** Direct link to the extension build files.
* **Install Guide:** A step-by-step walkthrough covering dependency setup and loading unpacked extension files.
* **Check Installation:** Uses Chrome runtime messaging to verify if the extension has been loaded and is active in the user's browser.
* **FAQ:** Explanations of entropy, browser limitations, and offline privacy details.

## Setting Up and Running the Project

### Installation Instructions

To install and run the extension locally:

1. Clone this repository.
   ```bash
   git clone https://github.com/naitaj/wordle.git
   cd wordle
   ```

2. Install the package dependencies.
   ```bash
   npm install
   ```

3. Build the extension.
   ```bash
   node extension/build.js
   ```
   This generates the compiled content scripts and popup inside the `extension/dist` folder.

4. Load the unpacked extension in your browser:
   * Open `chrome://extensions/` in Chrome or the equivalent in Edge or Brave.
   * Enable "Developer Mode" in the top-right corner.
   * Click "Load unpacked" in the top-left corner.
   * Select the `extension/dist` directory.

### Development and Website Instructions

To run the companion website locally for development:

```bash
npm run dev
```

This starts the Vite local server (usually at `http://localhost:5173` or `http://localhost:5174`).

To build the website for production:

```bash
npm run build
```

This compiles the website assets into the root `dist` folder.

## License

This project is licensed under the MIT License.
