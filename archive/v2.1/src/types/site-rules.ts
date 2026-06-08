import { ImageMetadata } from './image-info';

/**
 * サイト固有のコンテキスト情報
 */
export interface SiteContext {
  site: 'patreon' | 'pixiv' | 'fanbox' | 'generic' | string;
  siteMetadata?: Record<string, any>;
}

/**
 * テンプレート変数の単一定義
 */
export interface RuleVariable {
  // 変数名（テンプレートで使用）
  name: string;

  // UI表示用ラベル
  label: string;

  // 説明文（UIでの補足説明）
  description: string;

  // 値を取得する関数
  // metadata: 画像メタデータ
  // context: サイト固有のコンテキスト
  getValue: (metadata: ImageMetadata, context?: SiteContext) => string;

  // 値がない場合のデフォルト値
  default: string;
}

/**
 * サイト別の命名ルール定義
 */
export interface SiteRule {
  // ルールID（一意の識別子）
  siteId: string;

  // UI表示用ラベル
  label: string;

  // 説明文
  description: string;

  // デフォルトのファイル名テンプレート
  defaultTemplate: string;

  // このルールで利用可能な変数一覧
  availableVariables: RuleVariable[];

  // サイトアイコン（オプション）
  icon?: string;
}
