import {
  DEFAULT_RULE_FILENAME_PRESETS,
  DEFAULT_SETTINGS,
  DEFAULT_SIZE_PRESETS,
  DownloadFolderPreset,
  FilenamePreset,
  Settings,
  SizePreset,
} from '../types/settings';

const RULE_IDS = ['generic', 'patreon', 'pixiv_fanbox', 'x'];
// チェックボックス導入前のデフォルトIDプリセットから {date}_ を除去するマイグレーション対象
const DEFAULT_PRESET_IDS = new Set(['default', 'manual', 'custom-index']);
const REMOVED_DEFAULT_SIZE_PRESET_NAMES = new Set([
  '小サイズ除外 (200px)',
  '標準 (400px)',
  '大きめ (800px)',
  '1000×500',
  '1200×600',
  'HD以上 (1280px)',
  'Full HD (1920px)',
  '2K (2560px)',
  '4K (3840px)',
  '4K Ultrawide (5120px)',
  '5K (5120px)',
  '8K (7680px)',
]);

function cloneFilenamePresets(source: { [ruleId: string]: FilenamePreset[] }): { [ruleId: string]: FilenamePreset[] } {
  return Object.fromEntries(
    Object.entries(source).map(([ruleId, presets]) => [
      ruleId,
      presets.map((preset) => normalizeFilenamePreset(preset)),
    ])
  );
}

function ensureIndexInTemplate(template: string): string {
  const trimmed = template.trim();
  if (!trimmed || trimmed.includes('{index}')) return trimmed;
  return `${trimmed.replace(/_+$/, '')}_{index}`;
}

function normalizeFilenamePreset(preset: FilenamePreset): FilenamePreset {
  return {
    ...preset,
    template: ensureIndexInTemplate(preset.template),
  };
}

function makePresetId(prefix: string, value: string, index: number): string {
  return `${prefix}-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset'}`;
}

function legacyNameToTemplate(value: string): string {
  return value.includes('{') ? value : `{date}_${value}_{index}`;
}

function addUniquePreset(presets: FilenamePreset[], preset: FilenamePreset): void {
  const normalizedPreset = normalizeFilenamePreset(preset);
  if (presets.some((existing) => existing.id === normalizedPreset.id || existing.template === normalizedPreset.template)) {
    return;
  }
  presets.push(normalizedPreset);
}

function mergeSizePresets(saved: SizePreset[] | undefined): SizePreset[] {
  const existing = Array.isArray(saved)
    ? saved
      .filter((preset) => !REMOVED_DEFAULT_SIZE_PRESET_NAMES.has(preset.name))
      .map((preset) => ({
        ...preset,
        name: `${preset.minWidth}px`,
        minHeight: 0,
      }))
    : [];
  const existingNames = new Set(existing.map((preset) => preset.name));
  return [
    ...existing,
    ...DEFAULT_SIZE_PRESETS.filter((preset) => !existingNames.has(preset.name)),
  ];
}

function sanitizeDownloadFolder(folder: string): string {
  return folder
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim().replace(/[<>:"\\|?*\x00-\x1f]/g, '_'))
    .filter(Boolean)
    .join('/');
}

function makeFolderPresetId(folder: string, index: number): string {
  return `folder-${index}-${folder.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'downloads'}`;
}

function mergeDownloadFolderPresets(saved: DownloadFolderPreset[] | undefined): DownloadFolderPreset[] {
  const defaults = (DEFAULT_SETTINGS.downloadFolderPresets || []).map((preset) => ({ ...preset }));
  const result = [...defaults];
  const seenFolders = new Set(result.map((preset) => preset.folder));

  for (const [index, preset] of (saved || []).entries()) {
    const folder = sanitizeDownloadFolder(preset?.folder || '');
    if (!folder || seenFolders.has(folder)) continue;
    result.push({
      id: preset.id || makeFolderPresetId(folder, index),
      label: preset.label || folder,
      folder,
    });
    seenFolders.add(folder);
  }

  return result;
}

export function normalizeSettings(input?: Partial<Settings> | null): Settings {
  const saved = input || {};
  const ruleFilenamePresets = cloneFilenamePresets(DEFAULT_RULE_FILENAME_PRESETS);

  if (saved.ruleFilenamePresets) {
    for (const [ruleId, presets] of Object.entries(saved.ruleFilenamePresets)) {
      if (!ruleFilenamePresets[ruleId]) {
        ruleFilenamePresets[ruleId] = [];
      }
      for (const preset of presets || []) {
        if (!preset?.label || !preset?.template) continue;
        addUniquePreset(ruleFilenamePresets[ruleId], { ...preset });
      }
    }
  }

  for (const ruleId of RULE_IDS) {
    if (!ruleFilenamePresets[ruleId]) {
      ruleFilenamePresets[ruleId] = [];
    }

    const legacyRuleTemplates = saved.ruleSpecificTemplates?.[ruleId] || [];
    legacyRuleTemplates.forEach((value, index) => {
      addUniquePreset(ruleFilenamePresets[ruleId], {
        id: makePresetId('legacy-rule', value, index),
        label: value,
        template: legacyNameToTemplate(value),
      });
    });

    const legacyGlobalTemplates = saved.customNameTemplates || [];
    legacyGlobalTemplates.forEach((value, index) => {
      addUniquePreset(ruleFilenamePresets[ruleId], {
        id: makePresetId('legacy-global', value, index),
        label: value,
        template: legacyNameToTemplate(value),
      });
    });
  }

  // デフォルトIDのプリセットから {date}_ を除去（チェックボックス導入マイグレーション）
  for (const ruleId of RULE_IDS) {
    if (ruleFilenamePresets[ruleId]) {
      ruleFilenamePresets[ruleId] = ruleFilenamePresets[ruleId].map((preset) => {
        if (DEFAULT_PRESET_IDS.has(preset.id) && preset.template.startsWith('{date}_')) {
          return { ...preset, template: preset.template.replace(/^\{date\}_/, '') };
        }
        return preset;
      });
    }
  }

  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...saved,
    minHeight: 0,
    sizePresets: mergeSizePresets(saved.sizePresets),
    customNameTemplates: saved.customNameTemplates || [],
    ruleSessionSettings: {
      ...DEFAULT_SETTINGS.ruleSessionSettings,
      ...(saved.ruleSessionSettings || {}),
    },
    ruleSpecificTemplates: {
      ...DEFAULT_SETTINGS.ruleSpecificTemplates,
      ...(saved.ruleSpecificTemplates || {}),
    },
    ruleSpecificPresets: {
      ...DEFAULT_SETTINGS.ruleSpecificPresets,
      ...(saved.ruleSpecificPresets || {}),
    },
    downloadFolderPresets: mergeDownloadFolderPresets(saved.downloadFolderPresets),
    selectedDownloadFolderPresetId: saved.selectedDownloadFolderPresetId || DEFAULT_SETTINGS.selectedDownloadFolderPresetId,
    includeDateInFilename: saved.includeDateInFilename !== undefined ? saved.includeDateInFilename : DEFAULT_SETTINGS.includeDateInFilename,
    advancedImageFiltersEnabled: saved.advancedImageFiltersEnabled !== undefined ? saved.advancedImageFiltersEnabled : DEFAULT_SETTINGS.advancedImageFiltersEnabled,
    aspectRatioFilterEnabled: saved.aspectRatioFilterEnabled !== undefined ? saved.aspectRatioFilterEnabled : DEFAULT_SETTINGS.aspectRatioFilterEnabled,
    minAspectRatio: normalizeNumber(saved.minAspectRatio, DEFAULT_SETTINGS.minAspectRatio, 0.05, 20),
    maxAspectRatio: normalizeNumber(saved.maxAspectRatio, DEFAULT_SETTINGS.maxAspectRatio, 0.05, 20),
    keywordFilterEnabled: saved.keywordFilterEnabled !== undefined ? saved.keywordFilterEnabled : DEFAULT_SETTINGS.keywordFilterEnabled,
    positionHeuristicFilterEnabled: saved.positionHeuristicFilterEnabled !== undefined ? saved.positionHeuristicFilterEnabled : DEFAULT_SETTINGS.positionHeuristicFilterEnabled,
    pHashDuplicateFilterEnabled: saved.pHashDuplicateFilterEnabled !== undefined ? saved.pHashDuplicateFilterEnabled : DEFAULT_SETTINGS.pHashDuplicateFilterEnabled,
    pHashDistanceThreshold: Math.round(normalizeNumber(saved.pHashDistanceThreshold, DEFAULT_SETTINGS.pHashDistanceThreshold, 0, 32)),
    ruleFilenamePresets,
  };

  if (settings.minAspectRatio > settings.maxAspectRatio) {
    const min = settings.maxAspectRatio;
    settings.maxAspectRatio = settings.minAspectRatio;
    settings.minAspectRatio = min;
  }

  const presetNames = new Set(settings.sizePresets.map((preset) => preset.name));
  if (settings.selectedPreset && !presetNames.has(settings.selectedPreset)) {
    settings.selectedPreset = DEFAULT_SETTINGS.selectedPreset;
    settings.minWidth = DEFAULT_SETTINGS.minWidth;
  } else if (settings.selectedPreset) {
    settings.minWidth = settings.sizePresets.find((preset) => preset.name === settings.selectedPreset)?.minWidth || settings.minWidth;
  }

  for (const ruleId of RULE_IDS) {
    const session = settings.ruleSessionSettings?.[ruleId];
    if (session && !session.selectedFilenamePresetId) {
      session.selectedFilenamePresetId = session.namingMode === 'template' ? 'default' : 'manual';
    }
    if (session && session.selectedPreset && !presetNames.has(session.selectedPreset)) {
      session.selectedPreset = DEFAULT_SETTINGS.selectedPreset;
    }
  }

  const folderPresetIds = new Set([
    'downloads',
    ...(settings.downloadFolderPresets || []).map((preset) => preset.id),
  ]);
  if (settings.selectedDownloadFolderPresetId && !folderPresetIds.has(settings.selectedDownloadFolderPresetId)) {
    settings.selectedDownloadFolderPresetId = DEFAULT_SETTINGS.selectedDownloadFolderPresetId;
  }

  return settings;
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function getSelectedDownloadFolder(settings: Settings): string {
  const selectedId = settings.selectedDownloadFolderPresetId || 'downloads';
  if (selectedId === 'downloads') return '';
  return settings.downloadFolderPresets?.find((preset) => preset.id === selectedId)?.folder || '';
}

export function getRuleFilenamePresets(settings: Settings, ruleId: string): FilenamePreset[] {
  return settings.ruleFilenamePresets?.[ruleId] || settings.ruleFilenamePresets?.generic || [];
}

export function getSelectedFilenamePreset(settings: Settings, ruleId: string): FilenamePreset {
  const presets = getRuleFilenamePresets(settings, ruleId);
  const selectedId = settings.ruleSessionSettings?.[ruleId]?.selectedFilenamePresetId;
  return presets.find((preset) => preset.id === selectedId) || presets[0] || {
    id: 'fallback',
    label: '標準',
    template: settings.filenameTemplate || DEFAULT_SETTINGS.filenameTemplate,
  };
}
