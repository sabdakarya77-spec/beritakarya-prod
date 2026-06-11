const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Find the position to insert new KYC fields (after kycDataExpiresAt)
const searchString = `  kycDataExpiresAt DateTime?  // Auto-delete after X years (GDPR compliance)
`;

if (!content.includes(searchString)) {
  console.error('❌ Could not find the expected KYC fields in schema');
  process.exit(1);
}

// Replace with the new fields including the original one
const replacement = `  kycDataExpiresAt DateTime?  // Auto-delete after X years (GDPR compliance)
  kycAttempts      Int       @default(0)  // Number of failed KYC attempts (max 3)
  kycLockedUntil   DateTime?              // Account lock until this timestamp
`;

content = content.replace(searchString, replacement);

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('✅ Schema updated successfully');
console.log('   Added: kycAttempts, kycLockedUntil');