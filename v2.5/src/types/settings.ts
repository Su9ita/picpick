import { SiteRule } from './site-rules';

export interface SizePreset {
  name: string;
  minWidth: number;
  minHeight: number;
}

/**
 * ルール別の実行時設定（スキャン時に変更する項目）
 * 各ルール（Patreon、Pixiv Fanbox、汎用など）ごとに個別に保存される
 */
export interface RuleSessionSettings {
  customName: string;           // 今回のカスタム名
  selectedPreset: string;       // 今回選択したプリセット
  namingMode: 'custom' | 'template';  // 今回の命名モード
}

export interface Settings {
  // グローバル設定（全ルール共通）
  filenameTemplate: string;
  minWidth: number;
  minHeight: number;
  enabledExtensions: string[];
  downloadFolder: string;
  scanScrollEnabled: boolean;  // スキャン時にスクロールしてLazy Loadを発火
  skipDuplicates: boolean;
  overlayEnabled: boolean;  // オーバーレイの表示/非表示
  creatorList: string[];      // 登録済みクリエイター名リスト
  lastSelectedCreator: string; // 前回選択したクリエイター名

  // サイズプリセット（全ルール共通）
  sizePresets: SizePreset[];  // サイズプリセットリスト
  selectedPreset: string;      // 選択中のプリセット名（空 = カスタム）

  // 命名関連（互換性のため）
  namingMode: 'template' | 'custom';  // ファイル命名モード
  customNameTemplates: string[];       // カスタム名テンプレートリスト

  // 【新規】ルール別の実行時設定（スキャン時に変更する項目）
  // ルール（Patreon、Pixiv Fanbox、汎用など）ごとに個別に保存される
  ruleSessionSettings?: {
    [key: string]: RuleSessionSettings | undefined;  // ルールID（patreon, pixiv_fanbox, generic, ユーザー定義）
  }

  // 【新規】現在選んでいるサイトルール
  activeRuleId?: string;               // 現在選択中のルールID（例：'patreon'）

  // サイトルール関連（新規）
  siteRules?: SiteRule[];              // デフォルト＋ユーザー定義ルール
  userDefinedRules?: SiteRule[];       // ユーザーが追加したカスタムルール

  // ルール別テンプレート・プリセット（新規）
  ruleSpecificTemplates?: {
    [ruleId: string]: string[];        // ルール別カスタムテンプレート
  }
  ruleSpecificPresets?: {
    [ruleId: string]: SizePreset[];    // ルール別サイズプリセット
  }
}

export const DEFAULT_SIZE_PRESETS: SizePreset[] = [
  { name: '小サイズ除外 (200px)', minWidth: 200, minHeight: 200 },
  { name: '標準 (400px)', minWidth: 400, minHeight: 400 },
  { name: '大きめ (800px)', minWidth: 800, minHeight: 800 },
  { name: 'HD以上 (1280px)', minWidth: 1280, minHeight: 720 },
  { name: 'Full HD (1920px)', minWidth: 1920, minHeight: 1080 },
  { name: '2K (2560px)', minWidth: 2560, minHeight: 1440 },
  { name: '4K (3840px)', minWidth: 3840, minHeight: 2160 },
  { name: '4K Ultrawide (5120px)', minWidth: 5120, minHeight: 1440 },
  { name: '5K (5120px)', minWidth: 5120, minHeight: 2880 },
  { name: '8K (7680px)', minWidth: 7680, minHeight: 4320 },
];

// デフォルトサイトルールをインポート（循環参照を避けるため遅延インポート）
let defaultSiteRulesInitialized = false;
let cachedDefaultSiteRules: SiteRule[] = [];

function getDefaultSiteRules(): SiteRule[] {
  if (!defaultSiteRulesInitialized) {
    try {
      const { DEFAULT_SITE_RULES } = require('../naming/site-rules');
      cachedDefaultSiteRules = DEFAULT_SITE_RULES;
      defaultSiteRulesInitialized = true;
    } catch {
      // サイトルールの読み込みに失敗した場合は空配列を返す
      cachedDefaultSiteRules = [];
      defaultSiteRulesInitialized = true;
    }
  }
  return cachedDefaultSiteRules;
}

export const DEFAULT_SETTINGS: Settings = {
  // グローバル設定
  filenameTemplate: '{date}_{title}_{index}',
  minWidth: 400,
  minHeight: 400,
  enabledExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  downloadFolder: 'PicPick',
  scanScrollEnabled: false,
  skipDuplicates: true,
  overlayEnabled: true,  // デフォルトでオーバーレイを表示
  creatorList: [],
  lastSelectedCreator: '',
  sizePresets: DEFAULT_SIZE_PRESETS,
  selectedPreset: '標準 (400px)',
  namingMode: 'custom',
  customNameTemplates: [],

  // ルール別の実行時設定（デフォルト値）
  ruleSessionSettings: {
    'generic': {
      customName: '',
      selectedPreset: '標準 (400px)',
      namingMode: 'custom',
    },
    'patreon': {
      customName: '',
      selectedPreset: '標準 (400px)',
      namingMode: 'custom',
    },
    'pixiv_fanbox': {
      customName: '',
      selectedPreset: '標準 (400px)',
      namingMode: 'custom',
    },
    'x': {
      customName: '',
      selectedPreset: '標準 (400px)',
      namingMode: 'custom',
    },
  },

  // サイトルール関連
  activeRuleId: 'generic',
  siteRules: getDefaultSiteRules(),
  userDefinedRules: [],

  // ルール別テンプレート・プリセット
  ruleSpecificTemplates: {
    'generic': [],
    'patreon': [],
    'pixiv_fanbox': [],
    'x': [],
  },
  ruleSpecificPresets: {
    'generic': [],
    'patreon': [],
    'pixiv_fanbox': [],
    'x': [],
  },
};
