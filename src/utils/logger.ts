import { ImageCandidate } from '../extractors/enhanced-extractor';

const DEBUG = true;

export const logger = {
  group(label: string) {
    if (DEBUG) console.group(`[PicPick] ${label}`);
  },

  groupEnd() {
    if (DEBUG) console.groupEnd();
  },

  log(message: string, data?: unknown) {
    if (DEBUG) {
      if (data) {
        console.log(`[PicPick] ${message}`, data);
      } else {
        console.log(`[PicPick] ${message}`);
      }
    }
  },

  table(data: unknown[]) {
    if (DEBUG) console.table(data);
  },

  warn(message: string, data?: unknown) {
    console.warn(`[PicPick] ${message}`, data);
  },

  error(message: string, error?: unknown) {
    console.error(`[PicPick] ${message}`, error);
  },

  // 抽出結果のサマリを表示
  summarize(candidates: ImageCandidate[]) {
    if (!DEBUG) return;

    this.group('抽出結果サマリ');

    const bySource: Record<string, number> = {};
    const byScore: Record<string, number> = {
      'high (>50)': 0,
      'medium (20-50)': 0,
      'low (<20)': 0,
    };

    for (const c of candidates) {
      bySource[c.source] = (bySource[c.source] || 0) + 1;
      if (c.score > 50) byScore['high (>50)']++;
      else if (c.score >= 20) byScore['medium (20-50)']++;
      else byScore['low (<20)']++;
    }

    this.log('ソース別:', bySource);
    this.log('スコア分布:', byScore);
    this.table(candidates.slice(0, 10)); // 上位10件を表示

    this.groupEnd();
  },
};
