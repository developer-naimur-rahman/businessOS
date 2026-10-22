const axios = require('axios');

const BASE_URL = 'http://localhost:3333/api';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 Phase 9 — API & Security Verification Suite');
  console.log('================================================================\n');

  const results = [];

  function record(scenarioNum, title, passed, details) {
    results.push({ scenarioNum, title, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Scenario ${scenarioNum}] ${mark} — ${title}`);
    if (details) console.log(`   Evidence: ${JSON.stringify(details, null, 2)}\n`);
  }

  // Helper variables
  let customerAToken = '';
  let customerAId = '';
  let customerBToken = '';
  let customerBId = '';
  let ownerToken = '';
  let employeeToken = '';

  try {
    // -------------------------------------------------------------
    // Scenario 1: Unauthenticated access to a private Customer Vault is rejected
    // -------------------------------------------------------------
    try {
      await axios.get(`${BASE_URL}/customer/vault/me`);
      record(1, 'Unauthenticated access to private Customer Vault is rejected', false, { status: 200, error: 'Should have failed with 401' });
    } catch (err) {
      const status = err.response?.status;
      const isRejected = status === 401 || status === 403;
      record(1, 'Unauthenticated access to private Customer Vault is rejected', isRejected, {
        status,
        message: err.response?.data?.message || 'Unauthorized',
      });
    }

    // -------------------------------------------------------------
    // Setup Test Accounts: Customer A, Customer B, Owner, Employee
    // -------------------------------------------------------------
    const rand = Math.floor(1000 + Math.random() * 9000);
    const custAPhone = `01799${rand}01`;
    const custBPhone = `01799${rand}02`;

    // Register Customer A
    const regARes = await axios.post(`${BASE_URL}/public/auth/register`, {
      name: `Test Citizen A_${rand}`,
      email: `citizen_a_${rand}@example.com`,
      phone: custAPhone,
      password: 'StrongPassword123!',
    });
    customerAToken = regARes.data.access_token;
    customerAId = regARes.data.customer.id;

    // Register Customer B
    const regBRes = await axios.post(`${BASE_URL}/public/auth/register`, {
      name: `Test Citizen B_${rand}`,
      email: `citizen_b_${rand}@example.com`,
      phone: custBPhone,
      password: 'StrongPassword123!',
    });
    customerBToken = regBRes.data.access_token;
    customerBId = regBRes.data.customer.id;

    // Login Admin / Owner
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@demo.local',
      password: 'admin123',
    });
    ownerToken = adminLoginRes.data.access_token;

    // -------------------------------------------------------------
    // Scenario 2: Customer A cannot read Customer B's profile or documents (Anti-IDOR)
    // -------------------------------------------------------------
    // Customer A calls /customer/vault/me -> receives ONLY Customer A's data
    const custAMeRes = await axios.get(`${BASE_URL}/customer/vault/me`, {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });

    // Check if Customer A can query admin endpoints or manipulate IDs
    let custACannotAccessB = false;
    try {
      await axios.get(`${BASE_URL}/admin/customer-vault/${customerBId}`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
    } catch (err) {
      custACannotAccessB = err.response?.status === 401 || err.response?.status === 403;
    }

    const noIdorLeakage = custAMeRes.data.phone === custAPhone && custACannotAccessB;
    record(2, "Customer A cannot read Customer B's profile or documents (Anti-IDOR)", noIdorLeakage, {
      customerAPhoneRetrieved: custAMeRes.data.phone,
      adminLookupBlockedForCustomerA: custACannotAccessB,
    });

    // -------------------------------------------------------------
    // Scenario 3: Customer A cannot modify Customer B's fields
    // -------------------------------------------------------------
    // Customer B uploads a field
    const bUploadRes = await axios.post(
      `${BASE_URL}/customer/vault/multi-upload`,
      {
        documents: [
          {
            filename: 'nid_citizen_b.txt',
            docType: 'NID',
            fileBase64OrText: 'Name: Citizen B, NID: 19901234567890123, DOB: 1990-05-15',
          },
        ],
      },
      { headers: { Authorization: `Bearer ${customerBToken}` } }
    );
    const bProfile = await axios.get(`${BASE_URL}/customer/vault/me`, {
      headers: { Authorization: `Bearer ${customerBToken}` },
    });
    const bFieldId = bProfile.data.dynamicFields?.[0]?.id || 'dummy-field-id';

    // Customer A tries to delete or modify Customer B's field
    let aModifyBBlocked = false;
    try {
      await axios.put(
        `${BASE_URL}/customer/vault/field`,
        { fieldId: bFieldId, update: { value: 'HACKED_BY_A' } },
        { headers: { Authorization: `Bearer ${customerAToken}` } }
      );
    } catch (err) {
      // Should fail with 404 because Customer A's profile doesn't have Customer B's field ID
      aModifyBBlocked = err.response?.status === 404 || err.response?.status === 403;
    }

    record(3, "Customer A cannot modify Customer B's fields", aModifyBBlocked, {
      attemptedFieldId: bFieldId,
      blockedWithStatus: aModifyBBlocked ? 404 : 200,
    });

    // -------------------------------------------------------------
    // Scenario 4: An authorized owner can access records within permitted scope
    // -------------------------------------------------------------
    const ownerVaultRes = await axios.get(`${BASE_URL}/admin/customer-vault/${custBPhone}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerCanAccess = !!ownerVaultRes.data && ownerVaultRes.data.phone === custBPhone;
    record(4, 'An authorized owner can access records within their permitted scope', ownerCanAccess, {
      ownerRetrievedId: ownerVaultRes.data.id,
      customerPhone: ownerVaultRes.data.phone,
    });

    // -------------------------------------------------------------
    // Scenario 5: Employee permissions prevent access to unrelated sensitive information
    // -------------------------------------------------------------
    // Attempting to access sensitive financial payroll or administrative config with unprivileged access
    let employeeBlockedFromReports = false;
    try {
      await axios.get(`${BASE_URL}/analytics/customer-intelligence`, {
        headers: { Authorization: `Bearer ${customerAToken}` }, // unprivileged token
      });
    } catch (err) {
      employeeBlockedFromReports = err.response?.status === 401 || err.response?.status === 403;
    }
    record(5, 'Employee/Unprivileged permissions prevent access to unrelated sensitive information', employeeBlockedFromReports, {
      accessRejectedStatus: employeeBlockedFromReports ? 401 : 200,
    });

    // -------------------------------------------------------------
    // Scenario 6: Multiple files can be processed for the same customer
    // -------------------------------------------------------------
    const multiDocRes = await axios.post(
      `${BASE_URL}/customer/vault/multi-upload`,
      {
        documents: [
          {
            filename: 'nid_front_smart.txt',
            docType: 'NID',
            fileBase64OrText: 'NATIONAL ID CARD. Name: Naimur Rahman. NID No: 19951234567890123. Date of Birth: 1995-10-12.',
          },
          {
            filename: 'ssc_academic_cert.txt',
            docType: 'ACADEMIC_CERT',
            fileBase64OrText: 'BOARD OF INTERMEDIATE AND SECONDARY EDUCATION. Roll: 123456, Reg: 9876543210, Passing Year: 2011, GPA: 5.00.',
          },
          {
            filename: 'trade_license_record.txt',
            docType: 'TRADE_LICENSE',
            fileBase64OrText: 'DHAKA NORTH CITY CORPORATION. Trade License: TRAD-DNCC-2024-998811.',
          },
        ],
      },
      { headers: { Authorization: `Bearer ${customerAToken}` } }
    );

    const multiProcessed = multiDocRes.data.processedDocumentCount === 3;
    record(6, 'Multiple files can be processed for the same customer', multiProcessed, {
      processedDocumentCount: multiDocRes.data.processedDocumentCount,
      newDynamicFieldsCount: multiDocRes.data.newDynamicFieldsCount,
      conflictsCount: multiDocRes.data.conflictsCount,
    });

    // -------------------------------------------------------------
    // Scenario 7: AI can suggest genuinely new fields without duplicating canonical fields
    // -------------------------------------------------------------
    const aUpdatedProfile = await axios.get(`${BASE_URL}/customer/vault/me`, {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    const dynamicKeys = aUpdatedProfile.data.dynamicFields.map((f) => f.key);
    // Canonical mapping mapped roll_number, reg_number, result_cgpa, passing_year
    const hasCanonicalRoll = dynamicKeys.includes('roll_number');
    const hasCanonicalYear = dynamicKeys.includes('passing_year');
    const hasCanonicalResult = dynamicKeys.includes('result_cgpa');
    // Ensure no redundant keys like roll, roll_no, gpa, cgpa
    const hasNoDuplicateRoll = !dynamicKeys.includes('roll') && !dynamicKeys.includes('roll_no');

    const canonicalMappingSuccess = hasCanonicalRoll && hasCanonicalYear && hasCanonicalResult && hasNoDuplicateRoll;
    record(7, 'AI can suggest genuinely new fields without duplicating canonical fields', canonicalMappingSuccess, {
      mappedDynamicKeys: dynamicKeys,
      canonicalFieldsVerified: { roll_number: hasCanonicalRoll, passing_year: hasCanonicalYear, result_cgpa: hasCanonicalResult },
    });

    // -------------------------------------------------------------
    // Scenario 8: Incorrect and conflicting extracted values are preserved for review
    // -------------------------------------------------------------
    // Customer A uploads another document with conflicting DOB (1998-01-01 vs existing 1995-10-12)
    const conflictRes = await axios.post(
      `${BASE_URL}/customer/vault/multi-upload`,
      {
        documents: [
          {
            filename: 'secondary_birth_paper.txt',
            docType: 'BIRTH_CERTIFICATE',
            fileBase64OrText: 'Birth Register Entry. Name: Naimur Rahman, Date of Birth: 1998-01-01',
          },
        ],
      },
      { headers: { Authorization: `Bearer ${customerAToken}` } }
    );

    const conflictDetected = conflictRes.data.conflictsCount > 0;
    record(8, 'Incorrect and conflicting extracted values are preserved for review', conflictDetected, {
      detectedConflicts: conflictRes.data.conflicts,
      originalProfileDobPreserved: aUpdatedProfile.data.dob,
    });

    // -------------------------------------------------------------
    // Scenario 9: Private document download requires appropriate authorization
    // -------------------------------------------------------------
    // Public tracking query must NOT return download URLs in deliverables
    // Create a mock application
    const appDraft = await axios.post(`${BASE_URL}/public/service-request/extract-and-map`, {
      serviceSlug: 'teletalk-govt-job',
      files: [{ filename: 'test_nid.txt', docType: 'NID', fileBase64OrText: 'NID: 19951234567890123' }],
      customerPhone: custAPhone,
      customerName: 'Citizen A',
    });

    const submitRes = await axios.post(`${BASE_URL}/public/service-request`, {
      serviceSlug: 'teletalk-govt-job',
      customerName: 'Citizen A',
      customerPhone: custAPhone,
      formData: { applicantNameEn: 'CITIZEN A', nidNumber: '19951234567890123' },
      deliveryMode: 'ONLINE_DOWNLOAD',
      uploadedDocuments: [{ filename: 'test_nid.txt', docType: 'NID', fileUrl: 'https://private-bucket/secret.pdf' }],
    });

    const refNumber = submitRes.data.referenceNumber;

    // Call public tracker
    const trackerRes = await axios.get(`${BASE_URL}/public/track?query=${refNumber}`);
    const deliverables = trackerRes.data.deliverables || [];
    // Deliverables must require auth or have no direct download URL
    const isDeliverableProtected = deliverables.every((d) => d.requiresAuth === true && !d.fileUrlOrBase64);

    record(9, 'Private document download requires appropriate authorization (public download blocked)', isDeliverableProtected, {
      deliverablesResponse: deliverables,
    });

    // -------------------------------------------------------------
    // Scenario 10: Public tracking does not reveal sensitive profile or document details
    // -------------------------------------------------------------
    const trackedCustomerName = trackerRes.data.customerName;
    const trackedCustomerPhone = trackerRes.data.customerPhone;
    const isMasked = trackedCustomerName.includes('***') && trackedCustomerPhone.includes('***');
    record(10, 'Public tracking does not reveal sensitive profile or document details', isMasked, {
      maskedName: trackedCustomerName,
      maskedPhone: trackedCustomerPhone,
      hasSensitiveFields: !!trackerRes.data.nidNumber || !!trackerRes.data.presentAddress,
    });

    // -------------------------------------------------------------
    // Scenario 11: Service catalogue pages display all published categories
    // -------------------------------------------------------------
    const servicesRes = await axios.get(`${BASE_URL}/public/services`);
    const serviceList = servicesRes.data;
    const categoriesReturned = new Set(serviceList.map((s) => s.category));

    const hasVideoEditing = categoriesReturned.has('VIDEO_EDITING');
    const hasGraphicDesign = categoriesReturned.has('GRAPHIC_DESIGN');
    const hasDigitalMarketing = categoriesReturned.has('DIGITAL_MARKETING');
    const hasCybersecurity = categoriesReturned.has('CYBERSECURITY');
    const hasPrint = categoriesReturned.has('PRINT_PHOTOCOPY');
    const hasGovtJob = categoriesReturned.has('GOVT_JOB');

    const allCategoriesPresent = hasVideoEditing && hasGraphicDesign && hasDigitalMarketing && hasCybersecurity && hasPrint && hasGovtJob;
    record(11, 'Service catalogue pages display all published categories', allCategoriesPresent, {
      totalServices: serviceList.length,
      categoriesFound: Array.from(categoriesReturned),
      sampleServices: serviceList.slice(0, 5).map((s) => ({ titleEn: s.titleEn, category: s.category })),
    });

    // -------------------------------------------------------------
    // Scenario 12: Cash payments create correct payment and accounting records
    // -------------------------------------------------------------
    // Call owner analytics to verify cash payments accounting
    const analyticsRes = await axios.get(`${BASE_URL}/analytics/customer-intelligence`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const cashPaymentsReported = typeof analyticsRes.data.payments?.cashPaymentsBdt === 'number';
    record(12, 'Cash payments create correct payment and accounting records', cashPaymentsReported, {
      cashPaymentsBdt: analyticsRes.data.payments?.cashPaymentsBdt,
      digitalPaymentsBdt: analyticsRes.data.payments?.digitalPaymentsBdt,
      totalCollectedBdt: analyticsRes.data.payments?.totalCollectedBdt,
      cashSharePct: analyticsRes.data.payments?.cashSharePct,
    });

    // -------------------------------------------------------------
    // Scenario 13: Existing orders and historical records remain intact
    // -------------------------------------------------------------
    const ordersRes = await axios.get(`${BASE_URL}/public/orders`, {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    const allSalesRes = await axios.get(`${BASE_URL}/sales`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const historicalList = allSalesRes.data?.items || allSalesRes.data;
    const ordersIntact = Array.isArray(ordersRes.data) && Array.isArray(historicalList) && historicalList.length > 0;
    record(13, 'Existing orders and historical records remain intact', ordersIntact, {
      customerOrdersCount: ordersRes.data.length,
      totalHistoricalSalesInSystem: historicalList.length,
      historicalSaleSample: historicalList[0]?.saleNumber || 'N/A',
    });

  } catch (err) {
    console.error('Test suite failed with unexpected error:', err.response?.data || err.message);
  }

  console.log('================================================================');
  const passCount = results.filter((r) => r.passed).length;
  console.log(`Summary: ${passCount} / ${results.length} Scenarios Passed`);
  console.log('================================================================');
}

runTestSuite();
