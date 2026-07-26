/**
 * Game Adapter Interface for Wordle Entropy Solver.
 * Each supported Wordle clone implements this interface.
 */

export type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface TileData {
  letter: string;
  state: TileState;
}

export interface BoardState {
  rows: TileData[][];
  currentRow: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

export interface KeyboardState {
  [letter: string]: 'correct' | 'present' | 'absent' | 'empty';
}

export interface GameInfo {
  id: string;
  name: string;
  boardCount: number; // 1 for single, 2 for Dordle, 4 for Quordle, 8 for Octordle, 16 for Sedecordle
  isMultiBoard: boolean;
  isMultiRound: boolean; // True for Hurdle
  isSequential: boolean; // True for Kilordle
  supportsAutoPlay: boolean;
}

export interface GameAdapter {
  info: GameInfo;
  
  /** Returns true if this adapter matches the current webpage URL & DOM structure */
  detectGame(): boolean;
  
  /** Reads the board state for a specific board index (0 to boardCount - 1) */
  readBoard(boardIndex?: number): BoardState;

  /** Reads the current board states for all boards */
  readAllBoards(): BoardState[];
  
  /** Submits a guess by typing letters and pressing Enter across active boards */
  submitGuess(word: string, delay: number): Promise<void>;
  
  /** Waits for reveal animation on a specified board row */
  waitForReveal(boardIndex: number, rowIndex: number): Promise<TileData[]>;
  
  /** Reads current on-screen keyboard button states */
  getKeyboardState(): KeyboardState;
  
  /** Checks if all active boards are completed */
  isGameFinished(): boolean;
  
  /** Optional reset method for sequential/multi-round games */
  reset?(): Promise<void>;
}
