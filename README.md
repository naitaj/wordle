# Wordle Entropy Solver

This project is a browser extension that plays Wordle for you or helps you play better by suggesting words. It works on both the official New York Times Wordle page and the wordle.name clone. The solver uses information theory to calculate which guesses will reveal the most information, aiming to solve the game in the fewest moves possible.

## What it does

The extension runs in two modes:

* Auto Solve: The extension reads the board, chooses the best word, types it out, and presses enter. It repeats this until the game is won or lost.
* Assist Mode: The extension sits on the side and suggests the best word to play next. It updates its recommendations automatically as you enter guesses on the page.

To prevent the extension popup from covering the Wordle board or keyboard, the content script automatically shifts the webpage layout to the left. This creates a clear space on the right of the screen where the solver fits perfectly.

## How it calculates guesses

The core algorithm uses Shannon entropy to score every available word. The entropy represents the expected amount of information a guess will reveal by looking at how it splits the remaining possible answers into groups. 

The solver starts with an optimal opening word, usually ADIEU, to gather maximum initial data. For subsequent guesses, it filters the dictionary based on the green, yellow, and gray tile feedback. If the candidate pool is large, it may play an exploratory word to eliminate multiple letters at once. If the pool of words drops to zero due to custom words, it falls back to a LLaMA 3 model via the Groq API to suggest a best-effort guess.

The win probability indicator calculates your real chance of winning the game. Instead of a simple one-in-N fraction, it uses the remaining attempts and the entropy of the best guess to estimate how many guesses are needed to solve the remaining words.

## Interface design

The interface is built with a high-contrast, modernist layout inspired by industrial signage. It features:
* A compact width of 320 pixels and height of 600 pixels to fit comfortably on the screen.
* Global styling that hides scrollbars for a cleaner panel layout.
* Clear typography using the Oswald font.
* A centered attempts divider with status indicators aligned to the far right.
* Flat black action buttons with simple line icons.

## Setting it up

To build and run the extension locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/naitaj/wordle.git
   cd wordle
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   node extension/build.js
   ```
   This compiles the popup, background worker, and content scripts, outputting them to the `extension/dist` folder.

4. Load it in Chrome:
   * Open `chrome://extensions/` in your browser.
   * Turn on Developer Mode in the top right.
   * Click Load Unpacked in the top left.
   * Select the `extension/dist` directory.

5. Optional Groq configuration:
   If you want to use the LLaMA fallback, open the extension settings and paste your Groq API key.
