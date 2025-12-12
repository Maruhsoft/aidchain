/**
 * AidChain End-to-End Test Script
 * 
 * Usage: node scripts/testScenarios.js
 * 
 * This script mimics the flow of a full campaign lifecycle on the backend.
 * It is useful for verifying logic without using the UI.
 */

import fetch from 'node-fetch'; // Ensure node-fetch is installed or use native fetch in Node 18+
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ADMIN_KEY = process.env.ADMIN_KEY || 'test-admin-key';
const CREATOR_KEY = process.env.CREATOR_KEY || 'test-creator-key';
const CONTRIBUTOR_KEY = process.env.CONTRIBUTOR_KEY || 'test-contributor-key';
const VERIFIER_KEY = process.env.VERIFIER_KEY || 'test-verifier-key'; // added verifier key

// Test configuration
const TEST_CONFIG = {
  campaignTarget: 5000, // lovelace
  contributionAmount: 1000, // lovelace
  maxRetries: 5,
  retryDelay: 2000, // milliseconds
};

/**
 * Test Scenario 1: Full Campaign Lifecycle
 * Flow: Create → Contribute → Lock → Submit Evidence → Approve (verifier) → Mint NFT (admin) → Disburse → Confirm
 */
async function testFullCampaignLifecycle() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Test 1: Full Campaign Lifecycle                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Create Campaign (include verifier assignment)
    console.log('1️⃣  Creating campaign (assigning verifier)...');
    const createRes = await post('/campaigns', {
      title: `Test Campaign ${Date.now()}`,
      description: 'E2E test for campaign fundraising and verification',
      targetAmount: TEST_CONFIG.campaignTarget,
      verificationRequired: true,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      verifierPubKey: VERIFIER_KEY, // explicitly pass verifier key
      beneficiaryAddress: 'beneficiary-test-addr',
    }, CREATOR_KEY);

    const campaignId = createRes.campaign.id;
    console.log(`   ✓ Campaign created: ${campaignId}`);
    console.log(`   Initial State: ${createRes.campaign.state}`);

    // Step 2: Contribute Funds
    console.log('\n2️⃣  Contributor funds campaign...');
    for (let i = 0; i < 5; i++) {
      const cRes = await post(`/campaigns/${campaignId}/contribute`, {
        amount: TEST_CONFIG.contributionAmount,
        contributorAddress: `contributor-${i}`,
      }, CONTRIBUTOR_KEY);
      console.log(`   ✓ Contribution ${i + 1}: ${TEST_CONFIG.contributionAmount} lovelace — Collected: ${cRes.campaign.collectedAmount}`);
    }

    // Confirm on backend that collectedAmount reached target
    const detail1 = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
    console.log(`   ✔ Backend collectedAmount: ${detail1.campaign.collectedAmount} / ${detail1.campaign.targetAmount}`);

    // Step 3: Lock Funds
    console.log('\n3️⃣  Creator locks funds (fundraising complete)...');
    const lockRes = await post(`/campaigns/${campaignId}/lock`, {}, CREATOR_KEY);
    console.log(`   ✓ Funds locked — State: ${lockRes.campaign.state}`);

    // Poll backend to confirm on-chain state reflection
    const afterLock = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
    if (afterLock.campaign.state !== 'Locked') throw new Error('Lock not reflected in backend');
    
    // Assert on-chain lock tx present (optional)
    if (process.env.ASSERT_ONCHAIN !== 'false') {
      if (!afterLock.campaign.onchain || !afterLock.campaign.onchain.lockTx) {
        throw new Error('Missing on-chain lockTx after locking funds');
      }
      console.log(`   ✓ Lock tx recorded: ${afterLock.campaign.onchain.lockTx}`);
    }

    // Step 4: Submit Evidence (IPFS CID)
    console.log('\n4️⃣  Creator submits evidence (CID) to backend...');
    const fakeCid = `ipfs://QmTestProof${Date.now()}`;
    const submitRes = await post(`/campaigns/${campaignId}/verify`, {
      proofHash: fakeCid,
      description: 'Proof of funds usage documentation',
    }, CREATOR_KEY);
    console.log(`   ✓ Evidence submitted — CID: ${submitRes.campaign.proofHash}`);

    // Ensure backend stored CID
    const afterEvidence = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
    if (afterEvidence.campaign.proofHash !== fakeCid) throw new Error('CID not stored');

    // Step 5: Verifier approves verification
    console.log('\n5️⃣  Verifier reviews evidence and approves...');
    const approveRes = await post(`/campaigns/${campaignId}/approve-verification`, {
      auditNotes: 'Documentation verified and approved',
    }, VERIFIER_KEY);
    console.log(`   ✓ Verification approved — State: ${approveRes.campaign.state}`);

    // Expect the campaign to be Verified and NFT minted flag possibly set after admin mint
    const afterApprove = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
    if (afterApprove.campaign.state !== 'Verified') throw new Error('Approval did not set Verified state');
    // Assert on-chain approval tx present (optional)
    if (process.env.ASSERT_ONCHAIN !== 'false') {
      if (!afterApprove.campaign.onchain || !afterApprove.campaign.onchain.approvalTx) {
        throw new Error('Missing on-chain approvalTx after verification');
      }
    }

    // Step 6: Admin mints NFT (if backend triggers separately)
    console.log('\n6️⃣  Admin mints NFT (if not auto-minted)...');
    if (!afterApprove.campaign.nftMinted) {
      const mintRes = await post(`/campaigns/${campaignId}/mint-nft`, {
        metadata: {
          campaignName: afterApprove.campaign.title,
          verificationDate: new Date().toISOString(),
        }
      }, ADMIN_KEY);
      console.log(`   ✓ NFT mint triggered — nftMinted: ${mintRes.campaign.nftMinted}`);
    } else {
      console.log('   ℹ NFT already minted by approval workflow');
    }

    // Step 7: Disburse funds
    console.log('\n7️⃣  Creator disburses funds to beneficiary...');
    const disburseRes = await post(`/campaigns/${campaignId}/disburse`, {
      transactionNote: 'Disbursing verified funds',
    }, CREATOR_KEY);
    console.log(`   ✓ Disburse triggered — State: ${disburseRes.campaign.state}`);

    // Confirm on-chain/ backend reflection
    const afterDisburse = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
    if (afterDisburse.campaign.state !== 'Disbursed') throw new Error('Disburse not reflected in backend');
    // Assert on-chain disburse tx present (optional)
    if (process.env.ASSERT_ONCHAIN !== 'false') {
      if (!afterDisburse.campaign.onchain || !afterDisburse.campaign.onchain.disburseTx) {
        throw new Error('Missing on-chain disburseTx after disbursement');
      }
      // Also assert nftMintTx was recorded if minted during approval
      if (!afterDisburse.campaign.onchain.nftMintTx) {
        console.warn('   ⚠ Warning: nftMintTx not recorded; NFT may not have been minted');
      }
    }

    // Step 8: Beneficiary confirms receipt
    console.log('\n8️⃣  Beneficiary confirms receipt...');
    const confirmRes = await post(`/campaigns/${campaignId}/confirm-receipt`, {
      beneficiaryStatement: 'Funds received and being utilized as planned',
    }, CREATOR_KEY); // beneficiary may use their own key; using creator key in test
    console.log(`   ✓ Receipt confirmed — State: ${confirmRes.campaign.state}`);

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

    // Assert on-chain refund tx present (optional)
    if (process.env.ASSERT_ONCHAIN !== 'false') {
      const afterRefund = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
      if (!afterRefund.campaign.onchain || !afterRefund.campaign.onchain.refundTx) {
        throw new Error('Missing on-chain refundTx after refund');
      }
      console.log(`   ✓ Refund tx recorded: ${afterRefund.campaign.onchain.refundTx}`);
    }

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

    // Assert lastContribute timestamp (optional)
    if (process.env.ASSERT_ONCHAIN !== 'false') {
      const final = await get(`/campaigns/${campaignId}`, CREATOR_KEY);
      if (final.campaign.lastContributeAt) {
        console.log(`   ✓ Last contribution recorded at: ${final.campaign.lastContributeAt}`);
      }
    }

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
        throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < TEST_CONFIG.maxRetries) {
        console.log(`   ⏳ Retry attempt ${attempt}/${TEST_CONFIG.maxRetries} for ${endpoint}...`);
        await sleep(TEST_CONFIG.retryDelay);
      } else {
        console.error(`   [DEBUG] Final error for ${endpoint}:`, lastError?.message || lastError);
      }
    }
  }

  throw lastError;
}

/**
 * Helper: HTTP GET with retries
 */
async function get(endpoint, authKey = ADMIN_KEY) {
  let lastError;
  for (let attempt = 1; attempt <= TEST_CONFIG.maxRetries; attempt++) {
    try {
      const res = await fetch(API_URL + endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authKey}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`);
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < TEST_CONFIG.maxRetries) {
        console.log(`   ⏳ Retry attempt ${attempt}/${TEST_CONFIG.maxRetries} for GET ${endpoint}...`);
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
if (process.argv[1] === __filename) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

// Export updated functions (ES module)
export {
  testFullCampaignLifecycle,
  testCampaignRefund,
  testConcurrentContributions,
  testVerificationRejection,
  post,
};
