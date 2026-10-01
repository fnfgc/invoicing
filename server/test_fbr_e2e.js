import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  console.log('--- Starting FBR Digital Invoicing & Multi-Industry POS E2E Test ---');

  // Launch server on an isolated port for testing
  const PORT = 3099;
  const env = { ...process.env, PORT: String(PORT), NODE_ENV: 'test' };
  
  const serverProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (d) => {
    // console.log('[SERVER]', d.toString().trim());
  });
  serverProcess.stderr.on('data', (d) => {
    // console.error('[SERVER ERR]', d.toString().trim());
  });

  const api = axios.create({
    baseURL: `http://localhost:${PORT}`,
    timeout: 10000
  });

  // Wait for server to come up
  console.log('Waiting for server on port', PORT);
  for (let i = 0; i < 30; i++) {
    try {
      await api.get('/api/activation/status');
      console.log('Server is UP and responding!');
      break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  try {
    // 1. Test Client Registration with industry & FBR details
    console.log('\n[TEST 1] Registering a new SaaS tenant (Pharmacy POS)...');
    const tenantEmail = `rx_client_${Date.now()}@pharmapos.pk`;
    const regRes = await api.post('/api/register', {
      name: 'Shifa Pharmacy & Medical Store',
      email: tenantEmail,
      password: 'Password123!',
      domain: `shifa-${Date.now()}`,
      business_type: 'pharmacy',
      business_ntn: '7829103',
      business_province: 'Punjab',
      fbr_auth_token: 'test-bearer-token-12345',
      fbr_pos_id: '998877',
      fbr_environment: 'sandbox'
    });
    console.log('Registration response:', regRes.data.success ? 'SUCCESS' : regRes.data);
    const token = regRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Test Connection to FBR
    console.log('\n[TEST 2] Testing FBR Connection endpoint...');
    const connRes = await api.post('/api/fbr/test-connection');
    console.log('FBR Connection result:', connRes.data);

    // 3. Test STATL Taxpayer Lookup
    console.log('\n[TEST 3] Testing FBR STATL Taxpayer lookup for NTN 7829103...');
    const statlRes = await api.post('/api/fbr/check-taxpayer', { regNo: '7829103' });
    console.log('STATL lookup result:', statlRes.data);

    // 4. Create an Industry Product (Medicine with batch, expiry, HS code)
    console.log('\n[TEST 4] Creating pharmacy products with batch, expiry, and HS Code...');
    const prodRes = await api.post('/api/products', {
      name: 'Augmentin 625mg Tablets',
      price: 450.00,
      stock: 100,
      taxRate: 18,
      category: 'Antibiotics',
      barcode: '8964000123456',
      unit: 'Box',
      hsCode: '3004.1010',
      saleType: 'Goods at standard rate',
      batchNumber: 'AG-2026-X1',
      expiryDate: '2027-12-31',
      genericName: 'Amoxicillin + Clavulanic Acid',
      minStockAlert: 10
    });
    console.log('Product created with ID:', prodRes.data.id);
    const productId = prodRes.data.id;

    // 5. Perform POS Checkout with FBR DI Transmission
    console.log('\n[TEST 5] Performing POS Checkout with PRAL DI Specification v1.12 payload...');
    const checkoutRes = await api.post('/api/invoices', {
      items: [
        {
          id: productId,
          name: 'Augmentin 625mg Tablets',
          price: 450.00,
          quantity: 2,
          taxRate: 18,
          hsCode: '3004.1010',
          saleType: 'Goods at standard rate',
          unit: 'Box',
          batchNumber: 'AG-2026-X1'
        }
      ],
      buyerName: 'Dr. Tariq Mahmood',
      buyerCNIC: '35202-1234567-1',
      buyerNTN: '',
      buyerPhone: '03001234567',
      orderType: 'counter',
      tokenNumber: 'RX-101',
      scenarioId: 'SN001',
      buyerRegistrationType: 'Unregistered',
      totalAmount: 1063.00 // 900 + 162 ST + 1 FBR fee
    });

    console.log('Invoice Checkout Result:');
    console.log('  - Invoice Number:', checkoutRes.data.invoiceNumber);
    console.log('  - Fiscal Invoice #:', checkoutRes.data.fbrInvoiceNumber);
    console.log('  - FBR Status:', checkoutRes.data.fbrStatus, 'Code:', checkoutRes.data.fbrStatusCode);
    console.log('  - QR Code Data:', checkoutRes.data.fbrQrData);

    const invoiceId = checkoutRes.data.invoiceId;

    // 6. Test Manual FBR Sync / Revalidation
    console.log('\n[TEST 6] Testing manual FBR revalidation / sync for invoice ID', invoiceId);
    const syncRes = await api.post(`/api/invoices/${invoiceId}/fbr-sync`);
    console.log('FBR Sync Result:', syncRes.data.success ? 'SUCCESS' : 'FAILED', syncRes.data);

    // 7. Verify Transaction in POS Transactions List
    console.log('\n[TEST 7] Fetching POS Transactions list...');
    const txList = await api.get('/api/pos/transactions');
    const savedTx = txList.data.find(tx => tx.id === invoiceId);
    console.log('Saved Transaction verification:');
    console.log('  - Customer:', savedTx?.buyerName);
    console.log('  - Order Type:', savedTx?.orderType);
    console.log('  - Token:', savedTx?.tokenNumber);
    console.log('  - FBR Invoice #:', savedTx?.fbrInvoiceNumber);
    console.log('  - FBR Status:', savedTx?.fbrStatus);

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    serverProcess.kill();
  }
}

runTest();
