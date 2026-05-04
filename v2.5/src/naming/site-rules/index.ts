import { SiteRule } from '../../types/site-rules';
import { genericRule } from './generic-rule';
import { patreonRule } from './patreon-rule';
import { pixivFanboxRule } from './pixiv-fanbox-rule';
import { xRule } from './x-rule';

/**
 * デフォルトで組み込まれるサイトルール一覧
 */
export const DEFAULT_SITE_RULES: SiteRule[] = [
  genericRule,
  patreonRule,
  pixivFanboxRule,
  xRule,
];

export { genericRule, patreonRule, pixivFanboxRule, xRule };
