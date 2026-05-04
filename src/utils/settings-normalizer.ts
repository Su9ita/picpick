import {
  DEFAULT_RULE_FILENAME_PRESETS,
  DEFAULT_SETTINGS,
  DEFAULT_SIZE_PRESETS,
  FilenamePreset,
  Settings,
  SizePreset,
} from '../types/settings';

const RULE_IDS = ['generic', 'patreon', 'pixiv_fanbox', 'x'];
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
      presets.map((preset) => ({ ...preset })),
    ])
  );
}

function makePresetId(prefix: string, value: string, index: number): string {
  return `${prefix}-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset'}`;
}

function legacyNameToTemplate(value: string): string {
  return value.includes('{') ? value : `{date}_${value}_{index}`;
}

function addUniquePreset(presets: FilenamePreset[], preset: FilenamePreset): void {
  if (presets.some((existing) => existing.id === preset.id || existing.template === preset.template)) {
    return;
  }
  presets.push(preset);
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
    ruleFilenamePresets,
  };

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

  return settings;
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
