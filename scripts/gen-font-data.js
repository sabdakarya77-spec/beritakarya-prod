const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, '..', 'apps', 'api', 'src', 'utils', 'inter-bold.woff2');
const outputPath = path.join(__dirname, '..', 'apps', 'api', 'src', 'utils', 'font-data.ts');

const data = fs.readFileSync(fontPath);
const b64 = data.toString('base64');

// Verify magic bytes: wOFF2 = 0x774F4632
const magic = data.slice(0, 4);
console.log('Font magic bytes (hex):', magic.toString('hex'), '(should be 774f4632 for woff2)');
console.log('Font size:', data.length, 'bytes');
console.log('Base64 length:', b64.length, 'chars');

const content = "export const INTER_BOLD_BASE64 = '" + b64 + "'\n";
fs.writeFileSync(outputPath, content, 'utf8');
console.log('font-data.ts generated at:', outputPath);
