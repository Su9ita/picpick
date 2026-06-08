const fs = require('fs');
let content = fs.readFileSync('popup.ts', 'utf-8');

// 単純な置換
const pattern = `minHeightInput.addEventListener('input', () => {
  sizePresetSelect.value = '';
  currentSettings.selectedPreset = '';
});`;

const replacement = `minHeightInput.addEventListener('input', () => {
  sizePresetSelect.value = '';
  currentSettings.selectedPreset = '';
  updateFilteredCount();
});`;

if (content.includes(pattern)) {
  content = content.replace(pattern, replacement);
  fs.writeFileSync('popup.ts', content, 'utf-8');
  console.log('Success: Added updateFilteredCount to minHeightInput');
} else {
  console.log('Pattern not found');
}
