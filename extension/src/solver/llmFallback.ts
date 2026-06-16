import type { GuessRecord } from './types';

interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmChoice {
  message: { content: string };
}

interface LlmResponse {
  choices: LlmChoice[];
}

function buildPrompt(
  guessHistory: GuessRecord[],
  targetHint: string,
  validWords: string[],
): string {
  const guessLines = guessHistory
    .map((g, i) => {
      const feedback = g.result
        .map((r, j) => {
          const letter = g.word[j];
          if (r === 'correct') return `${letter}=GREEN`;
          if (r === 'present') return `${letter}=YELLOW`;
          return `${letter}=GRAY`;
        })
        .join(', ');
      return `Guess ${i + 1}: ${g.word} → [${feedback}]`;
    })
    .join('\n');

  const knownPositions: string[] = ['', '', '', '', ''];
  const presentLetters = new Set<string>();
  const absentLetters = new Set<string>();
  const badPositions: Record<string, Set<number>> = {};

  for (const g of guessHistory) {
    for (let i = 0; i < 5; i++) {
      const char = g.word[i];
      const res = g.result[i];
      if (res === 'correct') {
        knownPositions[i] = char;
      } else if (res === 'present') {
        presentLetters.add(char);
        if (!badPositions[char]) badPositions[char] = new Set();
        badPositions[char].add(i);
      } else if (res === 'absent') {
        absentLetters.add(char);
      }
    }
  }

  const trueAbsent = Array.from(absentLetters).filter(c => !presentLetters.has(c) && !knownPositions.includes(c));
  
  const explicitConstraints = [
    ...knownPositions.map((c, i) => c ? `- Position ${i + 1} MUST be ${c}` : '').filter(Boolean),
    ...Array.from(presentLetters).map(c => {
      const bad = Array.from(badPositions[c] || []).map(n => n + 1);
      return `- MUST contain ${c}, but NOT in position(s) ${bad.join(', ')}`;
    }),
    `- CANNOT contain: ${trueAbsent.length > 0 ? trueAbsent.join(', ') : 'None'}`
  ].join('\n');

  return `You are an expert Wordle player. I am playing Wordle and my entropy-based solver has run out of candidate words. I need you to suggest the best next 5-letter word guess.

Here is everything I know:

TARGET HINT: ${targetHint}

VALID WORDS REMAINING:
The ONLY dictionary words that perfectly match all Green/Yellow/Gray clues are:
[ ${validWords.length > 0 ? validWords.join(', ') : 'NONE - guess any word to gather clues'} ]
You MUST pick your guess from the valid words list above if it is not empty.

GUESS HISTORY:
${guessLines || '(no guesses yet)'}

EXPLICIT LOGICAL CONSTRAINTS (You MUST follow these exactly):
${explicitConstraints}

RULES REMINDER:
- GREEN means the letter is in the correct position.
- YELLOW means the letter is in the word but in the wrong position.
- GRAY means the letter is not in the word (or all instances are accounted for).
- DO NOT guess any word that is already in the GUESS HISTORY.
- You MUST guess a real, valid dictionary word. Do not invent fake words.
- Do not guess insect, plant, or similar names. Use only Wordle-appropriate words.

FORBIDDEN WORDS:
${guessHistory.length > 0 ? guessHistory.map(g => g.word).join(', ') : 'None'}

IMPORTANT: Respond with ONLY the 5-letter word in uppercase, nothing else.`;
}

/**
 * Get the Groq API key from chrome.storage.
 */
async function getApiKey(): Promise<string | null> {
  return new Promise(resolve => {
    chrome.storage.local.get(['groqApiKey'], (result) => {
      resolve(result.groqApiKey || null);
    });
  });
}

/**
 * Call the Groq API to get a word suggestion.
 * API key is retrieved from chrome.storage.local.
 */
export async function askGrokForGuess(
  guessHistory: GuessRecord[],
  targetHint: string,
  validWords: string[],
): Promise<{ word: string; source: 'grok' } | { error: string }> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return { error: 'Groq API key not configured. Set it in the extension settings.' };
  }

  const messages: LlmMessage[] = [
    {
      role: 'system',
      content: 'You are a Wordle-solving assistant. You respond with exactly one 5-letter uppercase dictionary word. No explanations, no formatting, just the word.'
    },
    {
      role: 'user',
      content: buildPrompt(guessHistory, targetHint, validWords)
    }
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Groq API error (${response.status}): ${errorText}` };
    }

    const data: LlmResponse = await response.json();
    if (!data.choices || data.choices.length === 0) {
      return { error: 'Groq returned no choices.' };
    }

    const raw = data.choices[0].message.content.trim().toUpperCase();
    const match = raw.match(/[A-Z]{5}/);
    if (!match) {
      return { error: `Groq returned invalid response: "${raw}"` };
    }

    return { word: match[0], source: 'grok' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Groq API call failed: ${message}` };
  }
}
