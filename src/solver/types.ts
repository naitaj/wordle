export type TileStatus = "empty" | "absent" | "present" | "correct";

export interface Tile {
  letter: string;
  status: TileStatus;
}

export interface BoardRow {
  tiles: Tile[]; // always length 5
  status: "idle" | "active" | "evaluated";
}

export type LetterResult = "correct" | "present" | "absent";
export type GuessResult = [LetterResult, LetterResult, LetterResult, LetterResult, LetterResult];

export interface GuessRecord {
  word: string;
  result: GuessResult;
}

export interface ScoredWord {
  word: string;
  entropy: number; // bits — higher is better
  remainingCount: number;
}

export interface KeyboardState {
  [letter: string]: LetterResult | "empty";
}

export interface SolverState {
  board: BoardRow[];
  keyboardState: KeyboardState;
  currentRow: number;
  guessHistory: GuessRecord[];
  remainingWords: string[];
  targetWord: string;
  currentGuess: string;
  phase: "idle" | "typing" | "evaluating" | "thinking" | "won" | "lost";
  topCandidates: ScoredWord[];
  statusMessage: string;
  
  // Config
  hardMode: boolean;
  defaultOpener: string;
  llmFallbackEnabled: boolean;

  // Analytics
  expectedRemaining: number;
  winProbability: number;
}
