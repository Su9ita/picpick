export interface Settings {
  filenameTemplate: string;
  minWidth: number;
  minHeight: number;
  enabledExtensions: string[];
  downloadFolder: string;
  skipDuplicates: boolean;
  creatorList: string[];      // 登録済みクリエイター名リスト
  lastSelectedCreator: string; // 前回選択したクリエイター名
}

export const DEFAULT_SETTINGS: Settings = {
  filenameTemplate: '{date}_{title}_{index}',
  minWidth: 400,
  minHeight: 400,
  enabledExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  downloadFolder: 'PicPick',
  skipDuplicates: true,
  creatorList: [],
  lastSelectedCreator: '',
};
