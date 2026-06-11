#!/usr/bin/env node

/**
 * Manual Test Script for requireSiteAccess Middleware
 * 
 * Prerequisites:
 * - API server running on http://localhost:3000
 * - Have test tokens for different user roles
 * - Database seeded with test users from different sites
 * 
 * Usage:
 * node scripts/test-site-scoping.mjs <access_token>
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000'

// Test scenarios
const tests = [
  {
    name: 'Wapimred tries to access another site\'s users',
    role: 'wapimred',
    setup: async () => {
      // Create two wapimred users from different sites
      const siteA = 'site_a_id'
      const siteB = 'site_b_id'
      
      return {
        tokenSiteA: '<wapimred_token_site_A>',
        tokenSiteB: '<wapimred_token_site_B>',
        targetSiteId: siteB
      }
    },
    test: async (token, targetSiteId) => {
      const res = await fetch(`${BASE_URL}/api/user?siteId=${targetSiteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 403,
      errorCode: 'FORBIDDEN',
      message: 'Akses ditolak: tidak memiliki izin untuk situs ini'
    }
  },
  {
    name: 'Superadmin accesses any site',
    role: 'superadmin',
    setup: async () => {
      return {
        token: '<superadmin_token>',
        targetSiteId: 'any_site_id'
      }
    },
    test: async (token, targetSiteId) => {
      const res = await fetch(`${BASE_URL}/api/user?siteId=${targetSiteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 200,
      success: true
    }
  },
  {
    name: 'Wapimred without siteId query (should use their own site automatically)',
    role: 'wapimred',
    setup: async () => {
      return {
        token: '<wapimred_token_no_site_query>',
        userSiteId: 'user_site_id'
      }
    },
    test: async (token) => {
      const res = await fetch(`${BASE_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 200,
      success: true
    }
  },
  {
    name: 'Journalist tries to access admin user endpoint',
    role: 'journalist',
    setup: async () => {
      return {
        token: '<journalist_token>'
      }
    },
    test: async (token) => {
      const res = await fetch(`${BASE_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 403,
      errorCode: 'FORBIDDEN',
      message: 'Role tidak memiliki akses admin'
    }
  },
  {
    name: 'Reader tries to access admin user endpoint',
    role: 'reader',
    setup: async () => {
      return {
        token: '<reader_token>'
      }
    },
    test: async (token) => {
      const res = await fetch(`${BASE_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 403,
      errorCode: 'FORBIDDEN',
      message: 'Role tidak memiliki akses admin'
    }
  },
  {
    name: 'Wapimred creates user in their own site - should succeed',
    role: 'wapimred',
    setup: async () => {
      return {
        token: '<wapimred_token_site_A>',
        userSiteId: 'site_a_id',
        newUser: {
          email: 'newuser@test.com',
          password: 'password123',
          name: 'Test User',
          role: 'journalist'
        }
      }
    },
    test: async (token, newUser) => {
      const res = await fetch(`${BASE_URL}/api/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 201,
      success: true
    }
  },
  {
    name: 'Wapimred tries to create superadmin - should be blocked',
    role: 'wapimred',
    setup: async () => {
      return {
        token: '<wapimred_token_site_A>',
        maliciousUser: {
          email: 'hacker@test.com',
          password: 'password123',
          name: 'Hacker',
          role: 'superadmin'
        }
      }
    },
    test: async (token, maliciousUser) => {
      const res = await fetch(`${BASE_URL}/api/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(maliciousUser)
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 403,
      errorCode: 'FORBIDDEN',
      message: 'Wapimred hanya bisa membuat journalist atau reader'
    }
  },
  {
    name: 'Wapimred updates user from another site - should be blocked',
    role: 'wapimred',
    setup: async () => {
      return {
        token: '<wapimred_token_site_A>',
        targetUserId: '<user_from_site_B>',
        roleUpdate: { role: 'journalist' }
      }
    },
    test: async (token, targetUserId, roleUpdate) => {
      const res = await fetch(`${BASE_URL}/api/user/${targetUserId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleUpdate)
      })
      return { status: res.status, body: await res.json() }
    },
    expected: {
      status: 403,
      errorCode: 'FORBIDDEN',
      message: 'Tidak memiliki izin untuk mengubah user dari site lain'
    }
  }
]

// Run tests
async function runTests() {
  console.log('🧪 Starting Site-Scoping Middleware Tests\n')
  console.log('='.repeat(60))
  
  let passed = 0
  let failed = 0
  
  for (const testCase of tests) {
    console.log(`\n📋 Test: ${testCase.name}`)
    console.log(`   Role: ${testCase.role}`)
    
    try {
      const { token, ...rest } = await testCase.setup()
      const result = await testCase.test(token, ...Object.values(rest))
      
      // Check status
      if (result.status !== testCase.expected.status) {
        console.log(`   ❌ FAILED: Expected status ${testCase.expected.status}, got ${result.status}`)
        console.log(`   Response:`, JSON.stringify(result.body, null, 2))
        failed++
        continue
      }
      
      // Check success field if expected
      if (testCase.expected.success !== undefined) {
        if (result.body.success !== testCase.expected.success) {
          console.log(`   ❌ FAILED: Expected success=${testCase.expected.success}, got ${result.body.success}`)
          failed++
          continue
        }
      }
      
      // Check error code if expected
      if (testCase.expected.errorCode) {
        if (result.body.error?.code !== testCase.expected.errorCode) {
          console.log(`   ❌ FAILED: Expected error.code=${testCase.expected.errorCode}, got ${result.body.error?.code}`)
          failed++
          continue
        }
      }
      
      // Check message if expected
      if (testCase.expected.message) {
        const messageMatch = result.body.error?.message?.includes(testCase.expected.message)
        if (!messageMatch) {
          console.log(`   ❌ FAILED: Expected message to include "${testCase.expected.message}", got "${result.body.error?.message}"`)
          failed++
          continue
        }
      }
      
      console.log('   ✅ PASSED')
      passed++
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`)
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} total`)
  console.log('='.repeat(60))
  
  if (failed === 0) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Review the output above.')
    process.exit(1)
  }
}

// Check if token provided via command line
const userToken = process.argv[2]
if (!userToken) {
  console.log('⚠️  Warning: No access token provided via command line.')
  console.log('   Tests are using placeholder tokens. Replace them with real tokens in the script.')
  console.log('   Or run: node scripts/test-site-scoping.mjs <your_access_token>\n')
  // We'll still run with placeholder tokens to show the structure
}

runTests().catch(console.error)