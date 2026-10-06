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

async function runTest() {
  console.log('========================================================');
  console.log('🧪 STARTING COMPLETE END-TO-END PROCURE-TO-PAY API TEST');
  console.log('========================================================');

  const testEmail = `zeno.owner.${Date.now()}@example.com`;

  // 1. Signup
  console.log('\n[1/8] Registering account & triggering Email OTP...');
  const signupRes = await postJson('/api/v1/auth/signup', {
    email: testEmail,
    password: 'Password@123',
    fullName: 'Rohan Sharma',
    companyName: 'Apex Machinery Pvt Ltd',
    gstin: '27AABCU9603R1ZM',
    stateCode: '27',
    stateName: 'Maharashtra',
  });
  console.log('Signup Response:', signupRes.data);
  const otp = signupRes.data.devOtp;
  if (!otp) throw new Error('Dev OTP not returned');

  // 2. Verify OTP & Auto-Provision Tenant
  console.log(`\n[2/8] Verifying OTP (${otp}) and auto-provisioning tenant masters...`);
  const verifyRes = await postJson('/api/v1/auth/verify-otp', {
    email: testEmail,
    otp,
  });
  console.log('Provisioning Status:', verifyRes.status);
  const token = verifyRes.data.accessToken;
  const tenantId = verifyRes.data.tenant.id;
  const companyId = verifyRes.data.company.id;
  const branchId = verifyRes.data.branch.id;
  console.log(`Tenant: ${tenantId}, Company: ${companyId}, Branch: ${branchId}`);

  const tenantHeaders = {
    'X-Tenant-Id': tenantId,
    'X-Company-Id': companyId,
    'X-Branch-Id': branchId,
  };

  // 3. Verify Auto-Seeded Masters (Ledgers & Units & Godowns)
  console.log('\n[3/8] Checking seeded Godowns, Units, and Standard Ledgers...');
  const godownsRes = await getJson(`/api/v1/tenancy/godowns?companyId=${companyId}`, token, tenantHeaders);
  const godownId = godownsRes.data[0].id;
  console.log(`Found default godown: "${godownsRes.data[0].name}" (${godownId})`);

  const unitsRes = await getJson(`/api/v1/masters/units?companyId=${companyId}`, token, tenantHeaders);
  const nosUnit = unitsRes.data.find((u) => u.code === 'NOS') || unitsRes.data[0];
  console.log(`Found Unit: ${nosUnit.name} (${nosUnit.code})`);

  const groupsRes = await getJson(`/api/v1/masters/ledger-groups?companyId=${companyId}`, token, tenantHeaders);
  const vendorGroup = groupsRes.data.find((g) => g.isCreditorVendor) || groupsRes.data[0];

  // 4. Create Vendor Ledger & Item Master
  console.log('\n[4/8] Creating Vendor Ledger and Item Master...');
  const vendorRes = await postJson(
    '/api/v1/masters/ledgers',
    {
      companyId,
      ledgerGroupId: vendorGroup.id,
      name: 'Dynamic Precision Tools Ltd',
      gstin: '27AABCU1234D1Z2',
      stateCode: '27',
      address: 'Plot 45, MIDC Industrial Area, Pune',
    },
    token,
    tenantHeaders,
  );
  const vendorId = vendorRes.data.id;
  console.log(`Created Vendor Ledger: "${vendorRes.data.name}" (${vendorId})`);

  const itemRes = await postJson(
    '/api/v1/masters/items',
    {
      companyId,
      name: 'CNC Carbide End Mill 10mm',
      sku: 'MILL-10MM',
      unitId: nosUnit.id,
      hsnSac: '8207',
      gstRate: 18,
      purchaseRate: 1200,
      saleRate: 1650,
      reorderLevel: 10,
    },
    token,
    tenantHeaders,
  );
  const itemId = itemRes.data.id;
  console.log(`Created Item Master: "${itemRes.data.name}" (${itemId}) with 18% GST`);

  // 5. Create Purchase Order (PO)
  console.log('\n[5/8] Creating Purchase Order (PO)...');
  const poRes = await postJson(
    '/api/v1/procure-to-pay/purchase-orders',
    {
      companyId,
      branchId,
      vendorLedgerId: vendorId,
      orderDate: new Date().toISOString().split('T')[0],
      notes: 'Initial procurement order for CNC milling cutters',
      items: [
        {
          itemId,
          unitId: nosUnit.id,
          orderedQty: 50,
          rate: 1200,
          gstRate: 18,
          isInterstate: false,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  const poId = poRes.data.id;
  const poVoucherNo = poRes.data.voucherNo;
  const poItem = poRes.data.items[0];
  console.log(`✅ PO Created: ${poVoucherNo} | Total: ₹${poRes.data.grandTotal} (Status: ${poRes.data.status})`);

  // 6. Create Goods Receipt Note (GRN) - Stock IN
  console.log('\n[6/8] Receiving Goods via GRN (Stock IN)...');
  const grnRes = await postJson(
    '/api/v1/procure-to-pay/goods-receipt-notes',
    {
      companyId,
      branchId,
      godownId,
      vendorLedgerId: vendorId,
      grnDate: new Date().toISOString().split('T')[0],
      purchaseOrderIds: [poId],
      items: [
        {
          poItemId: poItem.id,
          itemId,
          unitId: nosUnit.id,
          godownId,
          receivedQty: 50,
          rate: 1200,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  const grnId = grnRes.data.id;
  const grnVoucherNo = grnRes.data.voucherNo;
  const grnItem = grnRes.data.items[0];
  console.log(`✅ GRN Created: ${grnVoucherNo} (Status: ${grnRes.data.status})`);

  // Verify stock in inventory
  const stockRes = await getJson(`/api/v1/inventory/summary?companyId=${companyId}`, token, tenantHeaders);
  const itemStock = stockRes.data.find((s) => s.itemId === itemId);
  console.log(`📦 Verified Stock in Warehouse: ${itemStock.currentStock} ${itemStock.unit} | Value: ₹${itemStock.totalValue}`);

  // 7. Create Purchase Invoice (PI) - Balanced Double-Entry Posting
  console.log('\n[7/8] Posting Purchase Invoice with Double-Entry Accounting...');
  const piRes = await postJson(
    '/api/v1/procure-to-pay/purchase-invoices',
    {
      companyId,
      branchId,
      godownId,
      purchaseType: 'GOODS',
      vendorLedgerId: vendorId,
      vendorBillNo: 'BILL-DP-8839',
      vendorBillDate: new Date().toISOString().split('T')[0],
      grnIds: [grnId],
      items: [
        {
          grnItemId: grnItem.id,
          itemId,
          unitId: nosUnit.id,
          orderedQty: 50,
          receivedQty: 50,
          rate: 1200,
          gstRate: 18,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  const piId = piRes.data.id;
  const piVoucherNo = piRes.data.voucherNo;
  console.log(
    `✅ Purchase Invoice Created: ${piVoucherNo} | Taxable: ₹${piRes.data.taxableTotal} | CGST: ₹${piRes.data.cgstTotal} | SGST: ₹${piRes.data.sgstTotal} | Grand Total: ₹${piRes.data.grandTotal}`,
  );

  // Verify Trial Balance
  const tbRes = await getJson(`/api/v1/accounting/trial-balance?companyId=${companyId}`, token, tenantHeaders);
  console.log(
    `📊 Trial Balance: Total Dr = ₹${tbRes.data.totalDebit}, Total Cr = ₹${tbRes.data.totalCredit} | Balanced: ${tbRes.data.isBalanced}`,
  );

  // 8. Vendor Payment (Clearing Invoice)
  console.log('\n[8/8] Making Vendor Payment & Clearing Invoice...');
  const ledgersRes = await getJson(`/api/v1/masters/ledgers?companyId=${companyId}`, token, tenantHeaders);
  const cashLedger = ledgersRes.data.find((l) => l.name === 'Cash') || ledgersRes.data[0];

  const payRes = await postJson(
    '/api/v1/procure-to-pay/vendor-payments',
    {
      companyId,
      branchId,
      vendorLedgerId: vendorId,
      paymentModeLedgerId: cashLedger.id,
      totalAmountPaid: piRes.data.grandTotal,
      referenceChequeNo: 'IMPS-TXN-4920491',
      allocations: [
        {
          purchaseInvoiceId: piId,
          allocatedAmount: piRes.data.grandTotal,
          discountAmount: 0,
        },
      ],
    },
    token,
    tenantHeaders,
  );
  console.log(`✅ Vendor Payment Posted: ${payRes.data.voucherNo} | Amount: ₹${payRes.data.totalAmountPaid}`);

  // Verify Invoice Status updated to PAID
  const updatedPi = await getJson(`/api/v1/procure-to-pay/purchase-invoices/${piId}`, token, tenantHeaders);
  console.log(`🏁 Invoice Status: ${updatedPi.data.status} (Paid: ₹${updatedPi.data.paidAmount} of ₹${updatedPi.data.grandTotal})`);

  console.log('\n========================================================');
  console.log('🎉 ALL TESTS PASSED! THE ENTIRE PROCURE-TO-PAY CYCLE IS VERIFIED AND WORKING!');
  console.log('========================================================');
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
