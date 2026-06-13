const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, '..', 'apps', 'api', 'src', 'assets', 'fonts', 'Inter-Bold.ttf');
const outputPath = path.join(__dirname, '..', 'apps', 'api', 'src', 'utils', 'font-data.ts');

const data = fs.readFileSync(fontPath);
const b64 = data.toString('base64');

// Verify magic bytes: TTF = 0x00010000
const magic = data.slice(0, 4);
console.log('Font magic bytes (hex):', magic.toString('hex'), '(should be 00010000 for ttf)');
console.log('Font size:', data.length, 'bytes');
console.log('Base64 length:', b64.length, 'chars');

const content = "export const INTER_BOLD_BASE64 = '" + b64 + "'\n";
fs.writeFileSync(outputPath, content, 'utf8');
console.log('font-data.ts generated at:', outputPath);
