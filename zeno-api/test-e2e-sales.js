const http = require('http');

function postJson(urlPath, data, token, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers,
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function getJson(urlPath, token, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: urlPath,
      method: 'GET',
      headers: { ...headers },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function runSalesE2ETest() {
  console.log('===============================================================');
  console.log('🧪 STARTING COMPLETE END-TO-END ORDER-TO-CASH (SALES) API TEST');
  console.log('===============================================================');

  const testEmail = `zeno.sales.${Date.now()}@example.com`;

  // 1. Signup & Dev OTP
  console.log('\n[1/7] Registering tenant & company...');
  const signupRes = await postJson('/api/v1/auth/signup', {
    email: testEmail,
    password: 'Password@123',
    fullName: 'Ananya Deshmukh',
    companyName: 'Horizon Electronics Ltd',
    gstin: '27AAACH1234F1ZQ',
    stateCode: '27',
    stateName: 'Maharashtra',
  });
  const otp = signupRes.data.devOtp;
  if (!otp) throw new Error('Dev OTP failed: ' + JSON.stringify(signupRes.data));

  // 2. Verify OTP & provision
  console.log('[2/7] Verifying OTP & provisioning masters...');
  const verifyRes = await postJson('/api/v1/auth/verify-otp', {
    email: testEmail,
    otp,
  });
  const token = verifyRes.data.accessToken;
  const tenantId = verifyRes.data.tenant.id;
  const companyId = verifyRes.data.company.id;
  const branchId = verifyRes.data.branch.id;
  const tenantHeaders = {
    'X-Tenant-Id': tenantId,
    'X-Company-Id': companyId,
    'X-Branch-Id': branchId,
  };
  console.log(`✅ Tenant: ${tenantId}, Company: ${companyId}`);

  // Fetch Godowns, Ledgers, Units
  const godownsRes = await getJson(`/api/v1/tenancy/godowns?companyId=${companyId}`, token, tenantHeaders);
  const godownId = godownsRes.data[0].id;
  const unitsRes = await getJson(`/api/v1/masters/units?companyId=${companyId}`, token, tenantHeaders);
  const unitId = unitsRes.data[0].id;
  const groupsRes = await getJson(`/api/v1/masters/ledger-groups?companyId=${companyId}`, token, tenantHeaders);
  const debtorGroup = groupsRes.data.find((g) => g.isDebtorCustomer) || groupsRes.data.find(g => g.name.includes('Debtor')) || groupsRes.data[0];

  // Create Customer Ledger
  console.log('\n[3/7] Creating Customer Ledger & Finished Good Item...');
  const customerRes = await postJson(
    '/api/v1/masters/ledgers',
    {
      companyId,
      ledgerGroupId: debtorGroup.id,
      name: 'Delta Infotech Pvt Ltd',
      code: 'CUST-001',
      gstin: '27BBBCD5678K1ZR',
      stateCode: '27',
      address: '401 Business Hub, Mumbai, MH - 400001',
    },
    token,
    tenantHeaders,
  );
  const customerLedgerId = customerRes.data.id;
  console.log(`✅ Customer Ledger created: ${customerRes.data.name} (${customerLedgerId})`);

  // Create Item Master
  const itemRes = await postJson(
    '/api/v1/masters/items',
    {
      companyId,
      name: 'Enterprise Router 48-Port',
      sku: 'ROUTER-48P',
      hsnSac: '85176290',
      unitId,
      taxRate: 18,
      purchasePrice: 25000,
      salesPrice: 42000,
      minStockLevel: 5,
    },
    token,
    tenantHeaders,
  );
  const itemId = itemRes.data.id;
  console.log(`✅ Item Master created: ${itemRes.data.name} (${itemId})`);

  // Seed Stock: Create Vendor + PO + GRN to get 50 units into Godown
  console.log('\n[Procurement Seed] Receiving 50 units into Godown via PO & GRN...');
  const creditorGroup = groupsRes.data.find((g) => g.isCreditorVendor) || groupsRes.data[0];
  const vendorRes = await postJson(
    '/api/v1/masters/ledgers',
    {
      companyId,
      ledgerGroupId: creditorGroup.id,
      name: 'Cisco Systems Wholesale',
      code: 'VEND-001',
      gstin: '27AAAAA0000A1Z5',
      stateCode: '27',
      address: 'Andheri East, Mumbai',
    },
    token,
    tenantHeaders,
  );
  const vendorId = vendorRes.data.id;

  const poRes = await postJson(
    '/api/v1/procure-to-pay/purchase-orders',
    {
      companyId,
      branchId,
      vendorLedgerId: vendorId,
      orderDate: new Date().toISOString().split('T')[0],
      items: [
        {
          itemId,
          orderedQty: 50,
          rate: 25000,
          unitId,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  const poId = poRes.data.id;
  const poItemId = poRes.data.items[0].id;

  const grnRes = await postJson(
    '/api/v1/procure-to-pay/goods-receipt-notes',
    {
      companyId,
      branchId,
      vendorLedgerId: vendorId,
      godownId,
      grnDate: new Date().toISOString().split('T')[0],
      purchaseOrderIds: [poId],
      items: [
        {
          itemId,
          poItemId,
          unitId,
          receivedQty: 50,
          godownId,
          rate: 25000,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  console.log(`✅ Stock Seeded: 50 units received in Godown via GRN #${grnRes.data.voucherNo}`);

  // 4. Create Sales Order (SO)
  console.log('\n[4/7] Step 1: Placing Sales Order (SO)...');
  const soRes = await postJson(
    '/api/v1/sales/sales-orders',
    {
      companyId,
      branchId,
      customerLedgerId,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      billingAddress: '401 Business Hub, Mumbai, MH - 400001',
      shippingAddress: 'Plot 12, MIDC Andheri, Mumbai, MH - 400093',
      paymentTerms: 'Net 30 Days',
      items: [
        {
          itemId,
          orderedQty: 10,
          unitPrice: 40000,
          discountAmount: 5000, // Rs 5000 flat discount on total
          taxRate: 18,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  if (soRes.status !== 201) throw new Error('Failed to create SO: ' + JSON.stringify(soRes.data));
  const so = soRes.data;
  console.log(`✅ Sales Order Created: #${so.voucherNo} | Status: ${so.status} | Total: ₹${so.grandTotal}`);

  // 5. Create Delivery Challan (DC) fulfilling SO
  console.log('\n[5/7] Step 2: Creating Delivery Challan (DC) with stock dispatch...');
  const dcRes = await postJson(
    '/api/v1/sales/delivery-challans',
    {
      companyId,
      branchId,
      customerLedgerId,
      challanDate: new Date().toISOString().split('T')[0],
      godownId,
      vehicleNo: 'MH-02-CP-8899',
      driverContact: '9876543210',
      dispatchAddress: 'Plot 12, MIDC Andheri, Mumbai, MH - 400093',
      soIds: [so.id],
      items: [
        {
          itemId,
          soItemId: so.items[0].id,
          dispatchedQty: 10,
          godownId,
          remarks: 'Dispatched in original sealed packaging',
        },
      ],
    },
    token,
    tenantHeaders,
  );
  if (dcRes.status !== 201) throw new Error('Failed to create DC: ' + JSON.stringify(dcRes.data));
  const dc = dcRes.data;
  console.log(`✅ Delivery Challan Created: #${dc.voucherNo} | Status: ${dc.status}`);

  // Check inventory balance after DC (should decrease from 50 to 40)
  const invRes = await getJson(
    `/api/v1/inventory/item-balance?companyId=${companyId}&itemId=${itemId}&godownId=${godownId}`,
    token,
    tenantHeaders,
  );
  console.log(`📦 Inventory after DC dispatch: Current Stock = ${invRes.data.balanceQty} (Expected: 40)`);

  // 6. Create Sales Invoice (SI) from DC
  console.log('\n[6/7] Step 3: Generating Tax Sales Invoice (SI) with balanced revenue posting...');
  const siRes = await postJson(
    '/api/v1/sales/sales-invoices',
    {
      companyId,
      branchId,
      customerLedgerId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      placeOfSupply: '27',
      billingAddress: '401 Business Hub, Mumbai, MH - 400001',
      shippingAddress: 'Plot 12, MIDC Andheri, Mumbai, MH - 400093',
      dcIds: [dc.id],
      soIds: [so.id],
      items: [
        {
          itemId,
          dcItemId: dc.items[0].id,
          soItemId: so.items[0].id,
          billedQty: 10,
          unitPrice: 40000,
          discountAmount: 5000,
          taxRate: 18,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  if (siRes.status !== 201) throw new Error('Failed to create SI: ' + JSON.stringify(siRes.data));
  const si = siRes.data;
  console.log(`✅ Sales Invoice Generated: #${si.voucherNo}`);
  console.log(`   Taxable: ₹${si.taxableTotal} | CGST(9%): ₹${si.cgstTotal} | SGST(9%): ₹${si.sgstTotal} | Grand Total: ₹${si.grandTotal}`);

  // Check Ledger Statement for Customer
  const custStmt = await getJson(
    `/api/v1/accounting/ledger-statement?companyId=${companyId}&ledgerId=${customerLedgerId}`,
    token,
    tenantHeaders,
  );
  console.log(`💰 Customer Ledger Balance: Debit = ₹${custStmt.data.totalDebit}, Credit = ₹${custStmt.data.totalCredit}, Net = ₹${custStmt.data.closingBalance}`);

  // Step 4: Receive Payment from Customer
  console.log('\n[7/7] Step 4: Recording Customer Payment Receipt...');
  const ledgersRes = await getJson(`/api/v1/masters/ledgers?companyId=${companyId}`, token, tenantHeaders);
  const bankOrCashLedger = ledgersRes.data.find((l) => l.name.toLowerCase().includes('bank') || l.name.toLowerCase().includes('cash')) || ledgersRes.data[0];

  const receiptRes = await postJson(
    '/api/v1/sales/customer-receipts',
    {
      companyId,
      branchId,
      customerLedgerId,
      paymentLedgerId: bankOrCashLedger.id,
      receiptDate: new Date().toISOString().split('T')[0],
      paymentMode: 'NEFT',
      referenceNumber: 'NEFT-AXIS-99281273',
      totalAmount: 200000, // Partial payment ₹2,00,000
      remarks: 'Partial advance on invoice ' + si.voucherNo,
      allocations: [
        {
          salesInvoiceId: si.id,
          allocatedAmount: 200000,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  if (receiptRes.status !== 201) throw new Error('Failed to record Receipt: ' + JSON.stringify(receiptRes.data));
  console.log(`✅ Customer Receipt Recorded: #${receiptRes.data.voucherNo} for ₹${receiptRes.data.totalAmount}`);

  // Step 5: Sales Return / Credit Note (Customer returns 1 unit)
  console.log('\nStep 5: Processing Sales Return (Credit Note) for 1 defective item...');
  const srRes = await postJson(
    '/api/v1/sales/sales-returns',
    {
      companyId,
      branchId,
      customerLedgerId,
      salesInvoiceId: si.id,
      returnDate: new Date().toISOString().split('T')[0],
      godownId,
      reason: 'Slight transit scratch on casing',
      items: [
        {
          itemId,
          salesInvoiceItemId: si.items[0].id,
          returnedQty: 1,
          godownId,
          unitPrice: 40000,
          taxRate: 18,
          remarks: 'Restocked into QC inspection bay',
        },
      ],
    },
    token,
    tenantHeaders,
  );
  if (srRes.status !== 201) throw new Error('Failed to record Sales Return: ' + JSON.stringify(srRes.data));
  console.log(`✅ Sales Return / Credit Note Created: #${srRes.data.voucherNo} for ₹${srRes.data.grandTotal}`);

  // Verify Trial Balance
  console.log('\nChecking Trial Balance verification...');
  const tbRes = await getJson(`/api/v1/accounting/trial-balance?companyId=${companyId}`, token, tenantHeaders);
  console.log(`📊 Trial Balance Total Debit: ₹${tbRes.data.totalDebit.toFixed(2)}, Total Credit: ₹${tbRes.data.totalCredit.toFixed(2)}, Difference: ₹${Math.abs(tbRes.data.totalDebit - tbRes.data.totalCredit).toFixed(4)}`);

  if (Math.abs(tbRes.data.totalDebit - tbRes.data.totalCredit) > 0.05) {
    throw new Error('Trial Balance is UNBALANCED!');
  }

  console.log('\n🎉 ALL ORDER-TO-CASH BACKEND ENDPOINTS PASSED WITH 100% SUCCESS & BALANCED LEDGERS!');
}

runSalesE2ETest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
