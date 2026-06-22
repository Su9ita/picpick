import { SiteRule } from './site-rules';

export interface SizePreset {
  name: string;
  minWidth: number;
  minHeight: number;
}

export interface FilenamePreset {
  id: string;
  label: string;
  template: string;
}

export interface DownloadFolderPreset {
  id: string;
  label: string;
  folder: string;
}

/**
 * ルール別の実行時設定（スキャン時に変更する項目）
 * 各ルール（Patreon、Pixiv Fanbox、汎用など）ごとに個別に保存される
 */
export interface RuleSessionSettings {
  customName: string;           // 今回のカスタム名
  selectedPreset: string;       // 今回選択したプリセット
  namingMode: 'custom' | 'template';  // 今回の命名モード
  selectedFilenamePresetId?: string;  // 今回選択した保存名プリセット
}

export interface Settings {
  // グローバル設定（全ルール共通）
  filenameTemplate: string;
  minWidth: number;
  minHeight: number;
  enabledExtensions: string[];
  downloadFolder: string;
  defaultDownloadFolderLabel?: string;
  defaultDownloadFolderPath?: string;
  downloadFolderPresets?: DownloadFolderPreset[];
  selectedDownloadFolderPresetId?: string;
  scanScrollEnabled: boolean;  // スキャン時にスクロールしてLazy Loadを発火
  skipDuplicates: boolean;
  overlayEnabled: boolean;  // オーバーレイの表示/非表示
  includeDateInFilename: boolean;  // ファイル名に日付を含めるか
  xInlineDatePrefix: boolean;      // Xインラインボタン保存時に日付を強制付与
  advancedImageFiltersEnabled: boolean;  // ルールベースの追加除外を使う
  aspectRatioFilterEnabled: boolean;  // 極端な縦横比を除外する
  minAspectRatio: number;  // width / height の下限
  maxAspectRatio: number;  // width / height の上限
  keywordFilterEnabled: boolean;  // sample/thanks などのファイル名・タイトル除外
  positionHeuristicFilterEnabled: boolean;  // 投稿先頭/末尾のカード系画像を除外
  pHashDuplicateFilterEnabled: boolean;  // 近似重複を除外する
  pHashDistanceThreshold: number;  // pHash のハミング距離しきい値
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

  // ルール別の保存名プリセット（新しい命名モデル）
  ruleFilenamePresets?: {
    [ruleId: string]: FilenamePreset[];
  }
}

export const DEFAULT_SIZE_PRESETS: SizePreset[] = [
  { name: '500px', minWidth: 500, minHeight: 0 },
  { name: '800px', minWidth: 800, minHeight: 0 },
  { name: '1000px', minWidth: 1000, minHeight: 0 },
  { name: '1200px', minWidth: 1200, minHeight: 0 },
  { name: '1600px', minWidth: 1600, minHeight: 0 },
  { name: '2500px', minWidth: 2500, minHeight: 0 },
  { name: '3500px', minWidth: 3500, minHeight: 0 },
];

export const DEFAULT_RULE_FILENAME_PRESETS: { [ruleId: string]: FilenamePreset[] } = {
  generic: [
    { id: 'default', label: '標準', template: '{title}_{index}' },
    { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
    { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
  ],
  patreon: [
    { id: 'default', label: 'Patreon 標準', template: '{creator}_{title}_{index}' },
    { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
    { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
  ],
  pixiv_fanbox: [
    { id: 'default', label: 'Fanbox 標準', template: '{creator}_{title}_{index}' },
    { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
    { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
  ],
  x: [
    { id: 'default', label: 'X 標準', template: '{creator}_{index}' },
    { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
    { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
  ],
};

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
  minWidth: 800,
  minHeight: 0,
  enabledExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  downloadFolder: '',
  defaultDownloadFolderLabel: 'ダウンロードフォルダ',
  defaultDownloadFolderPath: '',
  downloadFolderPresets: [
    { id: 'picpick', label: 'picpick', folder: 'picpick' },
  ],
  selectedDownloadFolderPresetId: 'downloads',
  scanScrollEnabled: false,
  skipDuplicates: true,
  overlayEnabled: true,  // デフォルトでオーバーレイを表示
  includeDateInFilename: true,  // デフォルトで日付を含める
  xInlineDatePrefix: false,     // Xインラインボタンの日付強制付与はデフォルトOFF
  advancedImageFiltersEnabled: true,
  aspectRatioFilterEnabled: true,
  minAspectRatio: 0.35,
  maxAspectRatio: 3.2,
  keywordFilterEnabled: true,
  positionHeuristicFilterEnabled: true,
  pHashDuplicateFilterEnabled: true,
  pHashDistanceThreshold: 6,
  creatorList: [],
  lastSelectedCreator: '',
  sizePresets: DEFAULT_SIZE_PRESETS,
  selectedPreset: '800px',
  namingMode: 'custom',
  customNameTemplates: [],

  // ルール別の実行時設定（デフォルト値）
  ruleSessionSettings: {
    'generic': {
      customName: '',
      selectedPreset: '800px',
      namingMode: 'custom',
      selectedFilenamePresetId: 'manual',
    },
    'patreon': {
      customName: '',
      selectedPreset: '800px',
      namingMode: 'custom',
      selectedFilenamePresetId: 'default',
    },
    'pixiv_fanbox': {
      customName: '',
      selectedPreset: '800px',
      namingMode: 'custom',
      selectedFilenamePresetId: 'default',
    },
    'x': {
      customName: '',
      selectedPreset: '800px',
      namingMode: 'custom',
      selectedFilenamePresetId: 'default',
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
  ruleFilenamePresets: DEFAULT_RULE_FILENAME_PRESETS,
};
