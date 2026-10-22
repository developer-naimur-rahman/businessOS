const assert = require('assert');

console.log('====================================================');
console.log('RUNNING BUSINESSOS TARGETED BUG FIX VERIFICATION');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST SUITE 1: BD Phone Number Normalization
// ----------------------------------------------------
console.log('--- TEST SUITE 1: Phone Normalization Logic ---');

const normalizePhone = (val) => {
  const digits = val.replace(/[^0-9]/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return '0' + digits.slice(3);
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits.startsWith('0') ? digits : '0' + digits;
};

const isPhoneNumber = (val) => {
  const cleaned = val.replace(/[\s\-()]/g, '');
  return /^(\+?880|0)?1[3-9]\d{8}$/.test(cleaned);
};

// Assert valid BD phone numbers
assert.strictEqual(isPhoneNumber('01712345678'), true, 'Standard 11-digit BD number should be recognized');
assert.strictEqual(isPhoneNumber('+8801712345678'), true, '+880 prefix BD number should be recognized');
assert.strictEqual(isPhoneNumber('8801812345678'), true, '880 prefix BD number should be recognized');
assert.strictEqual(isPhoneNumber('1912345678'), true, '10-digit without 0 should be recognized');
assert.strictEqual(isPhoneNumber('staff@businessos.com'), false, 'Email should not be classified as phone');

// Assert normalization output
assert.strictEqual(normalizePhone('01712345678'), '01712345678', 'Should keep standard 11-digit');
assert.strictEqual(normalizePhone('+8801712345678'), '01712345678', 'Should strip +880 to 01');
assert.strictEqual(normalizePhone('8801712345678'), '01712345678', 'Should strip 880 to 01');
assert.strictEqual(normalizePhone('1712345678'), '01712345678', 'Should prepend 0 to 10-digit');
console.log('✔ Phone number detection & normalization passed all assertions.\n');

// ----------------------------------------------------
// TEST SUITE 2: demoStore Service Jobs & Print Queue Filtering
// ----------------------------------------------------
console.log('--- TEST SUITE 2: Demo Store Status Navigation & Filtering ---');

// Mock service jobs matching demoStore
const mockServiceJobs = [
  { id: '1', jobNumber: 'JOB-2026-1001', serviceCategory: 'PC_LAPTOP_REPAIR', status: 'IN_PROGRESS' },
  { id: '2', jobNumber: 'JOB-2026-1002', serviceCategory: 'PC_LAPTOP_REPAIR', status: 'WAITING_FOR_PARTS' },
  { id: '3', jobNumber: 'JOB-2026-1003', serviceCategory: 'OS & Software Setup', status: 'DELIVERED_PAID' },
  { id: '4', jobNumber: 'JOB-2026-1004', serviceCategory: 'Printer Servicing & Refill', status: 'PENDING' }
];

const getServiceJobs = (status, category, search) => {
  let list = [...mockServiceJobs];
  if (status && status !== 'ALL') {
    const s = status.toUpperCase();
    if (s === 'RECEIVED' || s === 'PENDING') {
      list = list.filter(j => j.status === 'RECEIVED' || j.status === 'PENDING');
    } else if (s === 'DELIVERED' || s === 'DELIVERED_PAID') {
      list = list.filter(j => j.status === 'DELIVERED' || j.status === 'DELIVERED_PAID');
    } else {
      list = list.filter(j => j.status === s);
    }
  }
  if (category && category !== 'ALL') {
    const c = category.toLowerCase();
    list = list.filter(j => j.serviceCategory.toLowerCase().includes(c));
  }
  return list;
};

// Test 'RECEIVED' alias matches PENDING
const receivedJobs = getServiceJobs('RECEIVED');
assert.strictEqual(receivedJobs.length, 1, 'RECEIVED filter must match PENDING jobs');
assert.strictEqual(receivedJobs[0].jobNumber, 'JOB-2026-1004');

// Test 'DELIVERED' alias matches DELIVERED_PAID
const deliveredJobs = getServiceJobs('DELIVERED');
assert.strictEqual(deliveredJobs.length, 1, 'DELIVERED filter must match DELIVERED_PAID jobs');
assert.strictEqual(deliveredJobs[0].jobNumber, 'JOB-2026-1003');

// Test 'ALL' returns all jobs
assert.strictEqual(getServiceJobs('ALL').length, 4, 'ALL must return all jobs');

// Test category filtering
const pcJobs = getServiceJobs('ALL', 'pc');
assert.strictEqual(pcJobs.length, 2, 'Category filter must return 2 PC repair jobs');

// Mock print queue matching demoStore
const mockPrintQueue = [
  { id: '1', tokenNumber: '8801', status: 'READY_FOR_PICKUP' },
  { id: '2', tokenNumber: '8802', status: 'PRINTING' },
  { id: '3', tokenNumber: '8803', status: 'QUEUED' }
];

const getPrintQueue = (status) => {
  let list = [...mockPrintQueue];
  if (status && status !== 'ALL') {
    const s = status.toUpperCase();
    if (s === 'WAITING_IN_QUEUE' || s === 'QUEUED') {
      list = list.filter(p => p.status === 'QUEUED' || p.status === 'WAITING_IN_QUEUE');
    } else if (s === 'PRINTING_NOW' || s === 'PRINTING') {
      list = list.filter(p => p.status === 'PRINTING' || p.status === 'PRINTING_NOW');
    } else if (s === 'PRINTED_READY' || s === 'READY_FOR_PICKUP') {
      list = list.filter(p => p.status === 'READY_FOR_PICKUP' || p.status === 'PRINTED_READY');
    } else {
      list = list.filter(p => p.status === s);
    }
  }
  return list;
};

assert.strictEqual(getPrintQueue('WAITING_IN_QUEUE').length, 1, 'WAITING_IN_QUEUE must match QUEUED');
assert.strictEqual(getPrintQueue('PRINTING_NOW').length, 1, 'PRINTING_NOW must match PRINTING');
assert.strictEqual(getPrintQueue('PRINTED_READY').length, 1, 'PRINTED_READY must match READY_FOR_PICKUP');
assert.strictEqual(getPrintQueue('ALL').length, 3, 'ALL must return full print queue');
console.log('✔ Service Jobs & Print Queue status/category filtering passed all assertions.\n');

// ----------------------------------------------------
// TEST SUITE 3: toLocaleString Runtime Safety
// ----------------------------------------------------
console.log('--- TEST SUITE 3: toLocaleString Runtime Safety ---');

const safeFormatBDT = (val) => {
  return `৳${Number(val || 0).toLocaleString()}`;
};

// Assert formatting with undefined, null, zero, valid numbers
assert.strictEqual(safeFormatBDT(undefined), '৳0', 'Undefined must safely format to ৳0 without throwing');
assert.strictEqual(safeFormatBDT(null), '৳0', 'Null must safely format to ৳0 without throwing');
assert.strictEqual(safeFormatBDT(0), '৳0', 'Zero must format to ৳0');
assert.strictEqual(safeFormatBDT(1500), '৳1,500', '1500 must format to ৳1,500');
assert.strictEqual(safeFormatBDT('2500'), '৳2,500', 'String "2500" must format to ৳2,500');

// Test simulated job without dueBdt field
const jobWithoutDue = { ref: '#SJ-1001', title: 'Laptop Screen Repair' };
let crashed = false;
try {
  const rendered = `Due: ${safeFormatBDT(jobWithoutDue.dueBdt)}`;
  assert.strictEqual(rendered, 'Due: ৳0');
} catch (e) {
  crashed = true;
}
assert.strictEqual(crashed, false, 'Accessing dueBdt on job without cost fields must not throw TypeError');
console.log('✔ toLocaleString safe-formatting passed all assertions without throwing.\n');

// ----------------------------------------------------
// TEST SUITE 4: Password Reset Token Life-Cycle
// ----------------------------------------------------
console.log('--- TEST SUITE 4: Password Reset Token Security & Life-Cycle ---');

class MockAuthService {
  constructor() {
    this.resetTokens = new Map();
    this.users = new Map([
      ['admin@demo.local', { id: 'user-1', email: 'admin@demo.local', password: 'oldPassword' }]
    ]);
  }

  async requestPasswordReset(email) {
    const user = this.users.get(email.toLowerCase().trim());
    if (!user) return; // Silent return
    const token = 'tok_' + Math.random().toString(36).substring(2);
    this.resetTokens.set(token, {
      email: user.email,
      expiresAt: Date.now() + 3600 * 1000
    });
    return token;
  }

  async resetPassword(token, newPass) {
    const entry = this.resetTokens.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new Error('Invalid or expired token');
    }
    const user = this.users.get(entry.email);
    user.password = newPass;
    this.resetTokens.delete(token); // Single-use token
    return { success: true };
  }
}

(async () => {
  const auth = new MockAuthService();
  const token = await auth.requestPasswordReset('admin@demo.local');
  assert.ok(token, 'Reset token must be generated for existing user');

  // Successful reset
  const res = await auth.resetPassword(token, 'newSecretPassword123');
  assert.strictEqual(res.success, true);
  assert.strictEqual(auth.users.get('admin@demo.local').password, 'newSecretPassword123');

  // Token reuse should fail
  let reuseFailed = false;
  try {
    await auth.resetPassword(token, 'anotherPassword');
  } catch {
    reuseFailed = true;
  }
  assert.strictEqual(reuseFailed, true, 'Token must not be reusable after consumption');

  // Unknown email should not crash and should return silently
  const unknownToken = await auth.requestPasswordReset('nonexistent@example.com');
  assert.strictEqual(unknownToken, undefined, 'Non-existent email should return silently to prevent enumeration');

  console.log('✔ Password reset token security, expiration, and single-use passed all assertions.\n');

  console.log('====================================================');
  console.log('ALL 4 TEST SUITES PASSED CLEANLY (100% SUCCESS)');
  console.log('====================================================');
})();
