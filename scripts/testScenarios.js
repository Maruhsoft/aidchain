/**
 * AidChain End-to-End Test Script
 * 
 * Usage: node scripts/testScenarios.js
 * 
 * This script mimics the flow of a full campaign lifecycle on the backend.
 * It is useful for verifying logic without using the UI.
 */

const fetch = require('node-fetch'); // Ensure node-fetch is installed or use native fetch in Node 18+

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ADMIN_KEY = process.env.ADMIN_KEY || 'test-admin-key';
const CREATOR_KEY = process.env.CREATOR_KEY || 'test-creator-key';
const CONTRIBUTOR_KEY = process.env.CONTRIBUTOR_KEY || 'test-contributor-key';

// Test configuration
const TEST_CONFIG = {
  campaignTarget: 5000, // lovelace
  contributionAmount: 1000, // lovelace
  maxRetries: 3,
  retryDelay: 2000, // milliseconds
};

/**
 * Test Scenario 1: Full Campaign Lifecycle
 * Flow: Create → Contribute → Lock → Verify → Disburse → Confirm
 */
async function testFullCampaignLifecycle() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Test 1: Full Campaign Lifecycle                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Create Campaign (Backend: POST /campaigns)
    console.log('1️⃣  Creating campaign...');
    const createRes = await post('/campaigns', {
      title: `Test Campaign ${Date.now()}`,
      description: 'E2E test for campaign fundraising and verification',
      targetAmount: TEST_CONFIG.campaignTarget,
      category: 'Education',
      location: 'Test City',
      beneficiariesCount: 150,
      imageUrl: 'https://example.com/campaign.jpg',
      verificationRequired: true,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, CREATOR_KEY);

    const campaignId = createRes.campaign.id;
    console.log(`   ✓ Campaign created: ${campaignId}`);
    console.log(`   State: ${createRes.campaign.state}`);
    console.log(`   Target: ${createRes.campaign.targetAmount} lovelace`);

    // Step 2: Contribute Funds (Backend: POST /campaigns/{id}/contribute)
    console.log('\n2️⃣  Contributor funds campaign...');
    let contributionCount = 0;
    for (let i = 0; i < 5; i++) {
      const contributeRes = await post(`/campaigns/${campaignId}/contribute`, {
        amount: TEST_CONFIG.contributionAmount,
        contributorAddress: `contributor-${i}`,
      }, CONTRIBUTOR_KEY);
      contributionCount++;
      console.log(`   ✓ Contribution ${i + 1}: ${TEST_CONFIG.contributionAmount} lovelace`);
      console.log(`   Collected: ${contributeRes.campaign.collectedAmount}/${contributeRes.campaign.targetAmount}`);
    }

    // Step 3: Lock Funds (Backend: POST /campaigns/{id}/lock)
    console.log('\n3️⃣  Creator locks funds (fundraising complete)...');
    const lockRes = await post(`/campaigns/${campaignId}/lock`, {}, CREATOR_KEY);
    console.log(`   ✓ Funds locked`);
    console.log(`   State: ${lockRes.campaign.state}`);
    console.log(`   Total Collected: ${lockRes.campaign.collectedAmount} lovelace`);

    // Step 4: Submit Verification (Backend: POST /campaigns/{id}/verify)
    console.log('\n4️⃣  Creator submits verification proof...');
    const verifyRes = await post(`/campaigns/${campaignId}/verify`, {
      proofHash: 'ipfs://QmTestProof' + Date.now(),
      description: 'Proof of funds usage documentation',
    }, CREATOR_KEY);
    console.log(`   ✓ Verification submitted`);
    console.log(`   State: ${verifyRes.campaign.state}`);
    console.log(`   Proof Hash: ${verifyRes.campaign.proofHash}`);

    // Step 5: Admin Approves Verification (Backend: POST /campaigns/{id}/approve-verification)
    console.log('\n5️⃣  Admin auditor approves verification...');
    const approveRes = await post(`/campaigns/${campaignId}/approve-verification`, {
      auditNotes: 'Documentation verified and approved',
      nftMetadata: {
        campaignName: createRes.campaign.title,
        verificationDate: new Date().toISOString(),
      },
    }, ADMIN_KEY);
    console.log(`   ✓ Verification approved`);
    console.log(`   State: ${approveRes.campaign.state}`);
    console.log(`   NFT Minted: ${approveRes.campaign.nftMinted}`);

    // Step 6: Disburse Funds (Backend: POST /campaigns/{id}/disburse)
    console.log('\n6️⃣  Funds disbursed to beneficiary...');
    const disburseRes = await post(`/campaigns/${campaignId}/disburse`, {
      transactionHash: `tx_${Date.now()}`,
    }, CREATOR_KEY);
    console.log(`   ✓ Funds disbursed`);
    console.log(`   State: ${disburseRes.campaign.state}`);
    console.log(`   Transaction: ${disburseRes.campaign.onChainTxHash}`);

    // Step 7: Confirm Receipt (Backend: POST /campaigns/{id}/confirm-receipt)
    console.log('\n7️⃣  Beneficiary confirms receipt...');
    const confirmRes = await post(`/campaigns/${campaignId}/confirm-receipt`, {
      beneficiaryStatement: 'Funds received and being utilized as planned',
    }, CREATOR_KEY);
    console.log(`   ✓ Receipt confirmed`);
    console.log(`   State: ${confirmRes.campaign.state}`);

    console.log('\n✅ Test 1 PASSED: Full campaign lifecycle completed\n');
    return { success: true, campaignId };

  } catch (error) {
    console.error(`\n❌ Test 1 FAILED: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Scenario 2: Campaign Refund (Target Not Reached)
 * Flow: Create → Contribute (partial) → Deadline → Refund
 */
async function testCampaignRefund() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Test 2: Campaign Refund (Insufficient Funds)      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    console.log('1️⃣  Creating campaign with short deadline...');
    const createRes = await post('/campaigns', {
      title: `Refund Test Campaign ${Date.now()}`,
      description: 'Campaign that will not reach target',
      targetAmount: TEST_CONFIG.campaignTarget,
      category: 'Healthcare',
      location: 'Test City',
      beneficiariesCount: 50,
      imageUrl: 'https://example.com/refund-test.jpg',
      deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min deadline
    }, CREATOR_KEY);

    const campaignId = createRes.campaign.id;
    console.log(`   ✓ Campaign created: ${campaignId}`);

    console.log('\n2️⃣  Making single contribution (below target)...');
    const contributeRes = await post(`/campaigns/${campaignId}/contribute`, {
      amount: TEST_CONFIG.contributionAmount,
      contributorAddress: 'test-contributor',
    }, CONTRIBUTOR_KEY);
    console.log(`   ✓ Contributed: ${TEST_CONFIG.contributionAmount} lovelace`);
    console.log(`   Collected: ${contributeRes.campaign.collectedAmount}/${contributeRes.campaign.targetAmount}`);

    console.log('\n3️⃣  Waiting for deadline to pass...');
    await sleep(6000); // Wait 6 seconds

    console.log('\n4️⃣  Initiating refund...');
    const refundRes = await post(`/campaigns/${campaignId}/refund`, {
      reason: 'Campaign deadline expired without reaching target',
    }, CREATOR_KEY);
    console.log(`   ✓ Refund processed`);
    console.log(`   State: ${refundRes.campaign.state}`);

    console.log('\n✅ Test 2 PASSED: Campaign refund successful\n');
    return { success: true, campaignId };

  } catch (error) {
    console.error(`\n❌ Test 2 FAILED: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Scenario 3: Concurrent Contributions
 * Tests race condition handling with multiple contributors
 */
async function testConcurrentContributions() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Test 3: Concurrent Contributions                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    console.log('1️⃣  Creating campaign...');
    const createRes = await post('/campaigns', {
      title: `Concurrent Test ${Date.now()}`,
      description: 'Testing concurrent contributions',
      targetAmount: TEST_CONFIG.campaignTarget * 2,
      category: 'Emergency',
      location: 'Test City',
      beneficiariesCount: 100,
      imageUrl: 'https://example.com/concurrent.jpg',
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, CREATOR_KEY);

    const campaignId = createRes.campaign.id;
    console.log(`   ✓ Campaign created: ${campaignId}`);

    console.log('\n2️⃣  Submitting 10 concurrent contributions...');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        post(`/campaigns/${campaignId}/contribute`, {
          amount: TEST_CONFIG.contributionAmount,
          contributorAddress: `contributor-${i}`,
        }, CONTRIBUTOR_KEY)
      );
    }

    const results = await Promise.all(promises);
    const finalRes = results[results.length - 1];
    console.log(`   ✓ All contributions processed`);
    console.log(`   Total Collected: ${finalRes.campaign.collectedAmount} lovelace`);

    console.log('\n✅ Test 3 PASSED: Concurrent contributions handled\n');
    return { success: true, campaignId };

  } catch (error) {
    console.error(`\n❌ Test 3 FAILED: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Scenario 4: Verification Failure & Appeal
 * Tests rejection and resubmission of verification
 */
async function testVerificationRejection() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Test 4: Verification Rejection & Resubmission     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Setup: Create and lock campaign
    console.log('1️⃣  Creating and funding campaign...');
    const createRes = await post('/campaigns', {
      title: `Verification Test ${Date.now()}`,
      description: 'Testing verification workflow',
      targetAmount: TEST_CONFIG.campaignTarget,
      category: 'Education',
      location: 'Test City',
      beneficiariesCount: 100,
      imageUrl: 'https://example.com/verify.jpg',
      verificationRequired: true,
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, CREATOR_KEY);

    const campaignId = createRes.campaign.id;
    console.log(`   ✓ Campaign created: ${campaignId}`);

    // Fund campaign
    for (let i = 0; i < 5; i++) {
      await post(`/campaigns/${campaignId}/contribute`, {
        amount: TEST_CONFIG.contributionAmount,
        contributorAddress: `contributor-${i}`,
      }, CONTRIBUTOR_KEY);
    }

    // Lock funds
    await post(`/campaigns/${campaignId}/lock`, {}, CREATOR_KEY);
    console.log(`   ✓ Funds locked`);

    console.log('\n2️⃣  Submitting verification (will be rejected)...');
    const verifyRes = await post(`/campaigns/${campaignId}/verify`, {
      proofHash: 'ipfs://QmInsufficientProof',
      description: 'Incomplete documentation',
    }, CREATOR_KEY);
    console.log(`   ✓ Verification submitted`);

    console.log('\n3️⃣  Admin rejects verification...');
    const rejectRes = await post(`/campaigns/${campaignId}/reject-verification`, {
      rejectionReason: 'Documentation incomplete - requires more detail',
    }, ADMIN_KEY);
    console.log(`   ✓ Verification rejected`);
    console.log(`   Reason: ${rejectRes.campaign.rejectionReason}`);

    console.log('\n4️⃣  Creator resubmits improved verification...');
    const resubmitRes = await post(`/campaigns/${campaignId}/verify`, {
      proofHash: 'ipfs://QmImprovedProof' + Date.now(),
      description: 'Complete documentation with all required attachments',
    }, CREATOR_KEY);
    console.log(`   ✓ Verification resubmitted`);

    console.log('\n5️⃣  Admin approves resubmitted verification...');
    const approveRes = await post(`/campaigns/${campaignId}/approve-verification`, {
      auditNotes: 'Resubmitted documentation is satisfactory',
    }, ADMIN_KEY);
    console.log(`   ✓ Verification approved`);

    console.log('\n✅ Test 4 PASSED: Verification rejection and resubmission\n');
    return { success: true, campaignId };

  } catch (error) {
    console.error(`\n❌ Test 4 FAILED: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: HTTP POST request with retry logic
 */
async function post(endpoint, body, authKey = ADMIN_KEY) {
  let lastError;

  for (let attempt = 1; attempt <= TEST_CONFIG.maxRetries; attempt++) {
    try {
      const res = await fetch(API_URL + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`${res.status}: ${data.error || 'Request failed'}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < TEST_CONFIG.maxRetries) {
        console.log(`   ⏳ Retry attempt ${attempt}/${TEST_CONFIG.maxRetries}...`);
        await sleep(TEST_CONFIG.retryDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Helper: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   AidChain End-to-End Test Suite                   ║');
  console.log('║   Testing Campaign Lifecycle & Smart Contracts     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`API URL: ${API_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = [];

  // Run all test scenarios
  results.push(await testFullCampaignLifecycle());
  results.push(await testCampaignRefund());
  results.push(await testConcurrentContributions());
  results.push(await testVerificationRejection());

  // Summary
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║             Test Execution Summary                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(2)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.forEach((result, idx) => {
      if (!result.success) {
        console.log(`  Test ${idx + 1}: ${result.error}`);
      }
    });
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testFullCampaignLifecycle,
  testCampaignRefund,
  testConcurrentContributions,
  testVerificationRejection,
  post,
};
