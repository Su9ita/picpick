const fs = require('fs');
const path = require('path');

// Minimal valid PNG (1x1 teal pixel, works for any size display)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

[16, 48, 128].forEach(size => {
  fs.writeFileSync(path.join(__dirname, `icon${size}.png`), pngBuffer);
  console.log(`Created icon${size}.png`);
});
