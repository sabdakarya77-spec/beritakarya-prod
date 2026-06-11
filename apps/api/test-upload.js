/**
 * Test Script untuk Upload Gambar
 * 
 * Cara menjalankan:
 * 1. Pastikan API server berjalan di http://localhost:3001
 * 2. Jalankan script ini: node test-upload.js
 * 3. Script akan membuat file test image dan menguploadnya
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Konfigurasi
const API_URL = 'http://localhost:3001';
const UPLOAD_ENDPOINT = '/api/v1/media/upload';

// Buat file test image sederhana (1x1 pixel PNG)
function createTestImage() {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit grayscale
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, // Compressed data
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, // 
    0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82                      // 
  ]);
  
  const testImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testImagePath, pngData);
  console.log('✅ Test image created:', testImagePath);
  return testImagePath;
}

// Test upload dengan valid token (perlu login dulu)
async function testUpload() {
  console.log('\n🧪 Starting Upload Test...\n');
  
  // 1. Buat test image
  const testImagePath = createTestImage();
  const imageBuffer = fs.readFileSync(testImagePath);
  
  // 2. Login untuk mendapatkan token
  console.log('📝 Step 1: Login to get token...');
  const loginData = JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#'
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  try {
    const loginResponse = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    if (loginResponse.statusCode !== 200 && loginResponse.statusCode !== 201) {
      console.log('⚠️  Login failed (this is expected if test user doesn\'t exist)');
      console.log('📝 Creating test user first...');
      
      // Buat test user
      const registerData = JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User'
      });
      
      const registerOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(registerData)
        }
      };
      
      const registerResponse = await new Promise((resolve, reject) => {
        const req = http.request(registerOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(registerData);
        req.end();
      });
      
      if (registerResponse.statusCode !== 201) {
        console.log('❌ Registration failed:', registerResponse.data);
        return;
      }
      
      console.log('✅ Test user created');
      
      // Login lagi
      const loginResponse2 = await new Promise((resolve, reject) => {
        const req = http.request(loginOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(loginData);
        req.end();
      });
      
      if (loginResponse2.statusCode !== 200) {
        console.log('❌ Login after registration failed:', loginResponse2.data);
        return;
      }
      
      var loginResult = JSON.parse(loginResponse2.data);
    } else {
      var loginResult = JSON.parse(loginResponse.data);
    }
    
    const token = loginResult.data?.token || loginResult.token;
    if (!token) {
      console.log('❌ No token received');
      return;
    }
    
    console.log('✅ Login successful, token received');
    
    // 3. Upload gambar
    console.log('\n📤 Step 2: Uploading image...');
    
    // Create multipart boundary
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    
    // Build multipart body
    const parts = [];
    
    // Add file
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="test-image.png"\r\n`);
    parts.push(`Content-Type: image/png\r\n\r\n`);
    parts.push(imageBuffer);
    parts.push(`\r\n`);
    
    // Add altText
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="altText"\r\n\r\n`);
    parts.push(`Test Image Alt Text\r\n`);
    
    // Add caption
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="caption"\r\n\r\n`);
    parts.push(`Test Image Caption\r\n`);
    
    parts.push(`--${boundary}--\r\n`);
    
    const body = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));
    
    const uploadOptions = {
      hostname: 'localhost',
      port: 3001,
      path: UPLOAD_ENDPOINT,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'X-Site-ID': 'pusat'
      }
    };
    
    const uploadResponse = await new Promise((resolve, reject) => {
      const req = http.request(uploadOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    
    console.log('📊 Upload Response Status:', uploadResponse.statusCode);
    console.log('📄 Upload Response Body:', uploadResponse.data);
    
    if (uploadResponse.statusCode === 201) {
      console.log('\n✅ UPLOAD TEST PASSED! Image uploaded successfully.');
      const result = JSON.parse(uploadResponse.data);
      console.log('📸 Image URL:', result.data.url);
      console.log('🖼️  Thumbnail URL:', result.data.thumbUrl);
      console.log('📐 Dimensions:', result.data.width, 'x', result.data.height);
    } else {
      console.log('\n❌ UPLOAD TEST FAILED!');
      console.log('Status:', uploadResponse.statusCode);
      console.log('Response:', uploadResponse.data);
    }
    
  } catch (error) {
    console.log('\n❌ Error during test:', error.message);
    console.log('💡 Make sure the API server is running on http://localhost:3001');
  } finally {
    // Cleanup test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Test image cleaned up');
    }
  }
}

// Jalankan test
testUpload();
