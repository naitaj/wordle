// ─── Original Solver Types (preserved exactly) ───

export type TileStatus = "empty" | "absent" | "present" | "correct";

export interface Tile {
  letter: string;
  status: TileStatus;
}

export interface BoardRow {
  tiles: Tile[];
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
  entropy: number;
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
  hardMode: boolean;
  defaultOpener: string;
  llmFallbackEnabled: boolean;
  expectedRemaining: number;
  winProbability: number;
}

// ─── Extension-Specific Types ───

export interface SolverConfig {
  hardMode: boolean;
  llmFallbackEnabled: boolean;
  typingDelay: number; // ms between keystrokes
  groqApiKey: string;
}

export type SolverMode = 'auto' | 'assist';

// Messages: Content Script <-> Background
export type ContentMessage =
  | { type: 'READ_BOARD' }
  | { type: 'TYPE_WORD'; word: string; delay: number }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'WAIT_REVEAL'; row: number }
  | { type: 'SET_TYPING_DELAY'; delay: number }
  | { type: 'UPDATE_BADGE'; text: string }
  | { type: 'PING' };

// Messages: Popup <-> Background
export type PopupMessage =
  | { type: 'START_SOLVER'; mode: SolverMode }
  | { type: 'STOP_SOLVER' }
  | { type: 'GET_STATE' }
  | { type: 'UPDATE_CONFIG'; config: Partial<SolverConfig> }
  | { type: 'GET_CONFIG' };

// Messages: Background -> Popup (state updates)
export interface SolverUpdate {
  type: 'SOLVER_UPDATE';
  state: Partial<SolverState>;
  mode: SolverMode;
  isRunning: boolean;
}
