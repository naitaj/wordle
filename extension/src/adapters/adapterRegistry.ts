import type { GameAdapter } from './types';
import { NytAdapter } from './nyt';
import { HelloWordlAdapter } from './hellowordl';
import { DordleAdapter } from './dordle';
import { QuordleAdapter } from './quordle';
import { OctordleAdapter } from './octordle';
import { SedecordleAdapter } from './sedecordle';
import { HurdleAdapter } from './hurdle';
import { AbsurdleAdapter } from './absurdle';
import { EvilWordleAdapter } from './evilwordle';
import { KilordleAdapter } from './kilordle';
import { LingleAdapter } from './lingle';

const ALL_ADAPTERS: GameAdapter[] = [
  new NytAdapter(),
  new HelloWordlAdapter(),
  new DordleAdapter(),
  new QuordleAdapter(),
  new OctordleAdapter(),
  new SedecordleAdapter(),
  new HurdleAdapter(),
  new AbsurdleAdapter(),
  new EvilWordleAdapter(),
  new KilordleAdapter(),
  new LingleAdapter(),
];

/**
 * Automatically detects and returns the matching GameAdapter for the current website.
 * Returns null if the website is not a supported Wordle clone.
 */
export function detectActiveAdapter(): GameAdapter | null {
  for (const adapter of ALL_ADAPTERS) {
    try {
      if (adapter.detectGame()) {
        return adapter;
      }
    } catch {
      // Continue checking next adapter if detection encounters non-fatal error
    }
  }
  return null;
}

export function getAllAdapters(): GameAdapter[] {
  return ALL_ADAPTERS;
}
