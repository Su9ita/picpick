import { ImageInfo } from '../types/image-info';
import { ImageMetadata } from '../types/image-info';
import { SiteRule, SiteContext } from '../types/site-rules';
import { DEFAULT_SITE_RULES } from './site-rules';

/**
 * テンプレート変数の解決エンジン
 *
 * サイトルールに基づいてテンプレート変数を解決し、
 * ファイル名を生成する際に使用される変数マッピングを返します。
 */
export class TemplateVariableResolver {
  private siteRules: Map<string, SiteRule>;

  constructor(siteRules: SiteRule[] = DEFAULT_SITE_RULES) {
    this.siteRules = new Map(siteRules.map(r => [r.siteId, r]));
  }

  /**
   * サイト別に必要な変数を解決
   *
   * @param template - テンプレート文字列（例：{date}_{title}_{index}）
   * @param imageInfo - 画像情報
   * @param siteId - サイトID（デフォルト：generic）
   * @param extWithDot - 拡張子（ドット付き、例：.jpg）
   * @param index - 連番
   * @param context - サイト固有のコンテキスト（オプション）
   * @returns テンプレート変数のマッピング
   */
  public resolveVariables(
    template: string,
    imageInfo: ImageInfo,
    siteId: string = 'generic',
    extWithDot: string = '.jpg',
    index: number = 1,
    context?: SiteContext
  ): Record<string, string> {
    const rule = this.siteRules.get(siteId) || this.siteRules.get('generic');
    if (!rule) {
      throw new Error(`Unknown site: ${siteId}`);
    }

    const vars: Record<string, string> = {};

    // 各変数を解決
    for (const variable of rule.availableVariables) {
      try {
        // インデックス変数の場合は特別処理
        if (variable.name === 'index') {
          vars[variable.name] = String(index).padStart(2, '0');
        } else {
          const value = variable.getValue(imageInfo.metadata, context);
          vars[variable.name] = value || variable.default;
        }
      } catch (err) {
        // エラーが発生した場合はデフォルト値を使用
        vars[variable.name] = variable.default;
      }
    }

    // 拡張子を追加（ドット付き）
    vars['ext'] = extWithDot.replace(/^\./, '');

    return vars;
  }

  /**
   * テンプレート文字列に変数を代入
   *
   * @param template - テンプレート文字列
   * @param variables - 変数マッピング
   * @returns 変数が代入されたテンプレート
   */
  public substituteVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return result;
  }

  /**
   * サイトルールの利用可能な変数一覧を取得
   *
   * @param siteId - サイトID
   * @returns 変数一覧
   */
  public getAvailableVariables(siteId: string = 'generic') {
    const rule = this.siteRules.get(siteId) || this.siteRules.get('generic');
    if (!rule) {
      return [];
    }

    return rule.availableVariables;
  }

  /**
   * サイトルールを追加または更新
   *
   * @param rule - サイトルール
   */
  public addRule(rule: SiteRule) {
    this.siteRules.set(rule.siteId, rule);
  }

  /**
   * 登録されているサイトルール一覧を取得
   *
   * @returns サイトルール配列
   */
  public getAllRules(): SiteRule[] {
    return Array.from(this.siteRules.values());
  }
}

// グローバルインスタンス（単一責任の原則に従い、デフォルトインスタンスを提供）
export const defaultResolver = new TemplateVariableResolver();

/**
 * 後方互換性のための関数
 * 既存のコードで使用されている buildVariables() の置き換え
 */
export function buildVariablesWithResolver(
  imageInfo: ImageInfo,
  index: number,
  siteId: string = 'generic',
  ext: string = 'jpg'
): Record<string, string> {
  return defaultResolver.resolveVariables(
    '{date}_{title}_{index}',
    imageInfo,
    siteId,
    `.${ext}`,
    index
  );
}
