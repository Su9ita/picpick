import {
  DEFAULT_RULE_FILENAME_PRESETS,
  DEFAULT_SETTINGS,
  DEFAULT_SIZE_PRESETS,
  FilenamePreset,
  Settings,
  SizePreset,
} from '../types/settings';

const RULE_IDS = ['generic', 'patreon', 'pixiv_fanbox', 'x'];

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
  const existing = Array.isArray(saved) ? saved : [];
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

  for (const ruleId of RULE_IDS) {
    const session = settings.ruleSessionSettings?.[ruleId];
    if (session && !session.selectedFilenamePresetId) {
      session.selectedFilenamePresetId = session.namingMode === 'template' ? 'default' : 'manual';
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
