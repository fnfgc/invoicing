const axios = require('axios');
const path = require('path');
const masterDB = require('./master_db');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log("=== STARTING SAAS SINGLE PACKAGE, MULTI-USER ACCESS & FBR VERIFICATION TEST ===");

    // Wait for DB initialization
    await new Promise(r => setTimeout(r, 2000));

    // 1. Check Super Admin Login
    console.log("\n[TEST 1] Logging in as Super Admin...");
    let superAdminToken;
    try {
        const loginRes = await axios.post(`${BASE_URL}/api/login`, {
            email: 'superadmin@fnf.com',
            password: 'admin123'
        });
        superAdminToken = loginRes.data.token;
        console.log(" Super Admin Login Successful:", loginRes.data.role);
    } catch (e) {
        console.error("❌ Super Admin Login Failed:", e.response?.data || e.message);
        process.exit(1);
    }

    const superAdminHeaders = { headers: { Authorization: `Bearer ${superAdminToken}` } };

    // 2. Verify Single Unified Package
    console.log("\n[TEST 2] Verifying single unified package with single-user quota & $5/extra user...");
    let singlePkg;
    try {
        const pkgRes = await axios.get(`${BASE_URL}/api/packages`);
        const packages = pkgRes.data;
        console.log(` Retrieved ${packages.length} package(s).`);
        singlePkg = packages[0];
        console.log(" Single Package Details:", {
            name: singlePkg.name,
            price: singlePkg.price,
            max_users: singlePkg.max_users,
            extra_user_price: singlePkg.extra_user_price
        });
        if (Number(singlePkg.max_users) !== 1) {
            throw new Error(`Expected max_users = 1 (single user), got ${singlePkg.max_users}`);
        }
        if (Number(singlePkg.extra_user_price) !== 5.00) {
            throw new Error(`Expected extra_user_price = 5.00, got ${singlePkg.extra_user_price}`);
        }
        console.log(" ✅ Verified: Single Package includes 1 user seat and charges $5.00/month for extra users.");
    } catch (e) {
        console.error("❌ Packages check failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 3. Register a new tenant under the single unified package
    const tenantEmail = `tenant_${Date.now()}@teststore.com`;
    const tenantPassword = 'password123';
    console.log(`\n[TEST 3] Registering new tenant under single package: ${tenantEmail}`);
    let tenantToken;
    let tenantId;
    try {
        const regRes = await axios.post(`${BASE_URL}/api/register`, {
            business_name: "Apex Retail Mart",
            name: "Apex Owner",
            email: tenantEmail,
            password: tenantPassword,
            packageId: singlePkg.id,
            business_type: "grocery",
            business_ntn: "1234567-8",
            business_province: "Punjab",
            fbr_enabled: true,
            fbr_environment: "sandbox"
        });
        console.log(" Tenant registered successfully. Active status:", regRes.data.is_active);

        // Login as tenant
        const tLogin = await axios.post(`${BASE_URL}/api/login`, {
            email: tenantEmail,
            password: tenantPassword
        });
        tenantToken = tLogin.data.token;
        tenantId = tLogin.data.tenantId;
        console.log(" Tenant Login Successful. Plan:", tLogin.data.planName, "Base Price: $" + tLogin.data.planPrice);
    } catch (e) {
        console.error("❌ Tenant registration/login failed:", e.response?.data || e.message);
        process.exit(1);
    }

    const tenantHeaders = { headers: { Authorization: `Bearer ${tenantToken}` } };

    // 4. Test Single-User Included Seat & Extra Seat Tracking ($5.00/user)
    console.log("\n[TEST 4] Testing Single-User Quota and Extra Seat Tracking ($5.00/user)...");
    try {
        // Fetch initial users list
        const initialUsersRes = await axios.get(`${BASE_URL}/api/users`, tenantHeaders);
        console.log(" Initial Quota Info:", initialUsersRes.data.quota);
        if (initialUsersRes.data.quota.base_users !== 1) {
            throw new Error(`Expected 1 included user, got: ${initialUsersRes.data.quota.base_users}`);
        }

        // Add User 1 (The 1 included user seat)
        const u1 = await axios.post(`${BASE_URL}/api/users`, {
            name: "Cashier One",
            username: `cashier1_${Date.now()}`,
            password: "userpass123",
            role: "cashier"
        }, tenantHeaders);
        console.log(" Added User 1 (Included Seat):", u1.data.message, "(is_extra_user:", u1.data.is_extra_user, ")");
        if (u1.data.is_extra_user) {
            throw new Error("First user should be included in base package!");
        }

        // Add User 2 (Exceeds 1 included seat -> triggers $5.00 extra seat)
        const u2 = await axios.post(`${BASE_URL}/api/users`, {
            name: "Cashier Two (Extra Seat)",
            username: `cashier2_${Date.now()}`,
            password: "userpass123",
            role: "cashier"
        }, tenantHeaders);
        console.log(" Added User 2 (2nd user):", u2.data.message, "(Extra Fee: $" + u2.data.extra_fee + ")");

        if (!u2.data.is_extra_user || Number(u2.data.extra_fee) !== 5.0) {
            throw new Error(`Expected is_extra_user=true and extra_fee=5.0, got: ${JSON.stringify(u2.data)}`);
        }
        console.log(" ✅ Additional seat correctly flagged and priced at $5.00/month!");

        // Verify updated quota info
        const finalUsersRes = await axios.get(`${BASE_URL}/api/users`, tenantHeaders);
        console.log(" Updated Tenant Quota:", finalUsersRes.data.quota);
        if (finalUsersRes.data.quota.extra_users !== 1 || Number(finalUsersRes.data.quota.extra_amount) !== 5.0) {
            throw new Error(`Quota calculation mismatch: ${JSON.stringify(finalUsersRes.data.quota)}`);
        }
        console.log(" User list endpoint accurately reports 1 extra user and $5.00 extra monthly fee.");
    } catch (e) {
        console.error("❌ Multi-user test failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 5. Test Super Admin Tenants View (User Count and Billing Summary)
    console.log("\n[TEST 5] Checking Super Admin tenant overview for user seats & billing...");
    try {
        const adminTenantsRes = await axios.get(`${BASE_URL}/api/admin/tenants`, superAdminHeaders);
        const myTenant = adminTenantsRes.data.find(t => t.email === tenantEmail);
        console.log(" Super Admin view of tenant:", {
            business_name: myTenant.business_name,
            plan: myTenant.plan,
            user_count: myTenant.user_count,
            max_users: myTenant.max_users,
            extra_users: myTenant.extra_users,
            extra_user_fee: myTenant.extra_user_fee,
            total_monthly_due: myTenant.total_monthly_due
        });

        if (myTenant.extra_users !== 1 || myTenant.extra_user_fee !== 5.0) {
            throw new Error(`Superadmin tenant extra user calculation mismatch: ${JSON.stringify(myTenant)}`);
        }
        console.log(" Super Admin has full real-time visibility into extra user seats and billing!");
    } catch (e) {
        console.error("❌ Super Admin tenant overview test failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 6. Test SaaS Subscription Expiration & Super Admin Renewal
    console.log("\n[TEST 6] Testing SaaS Subscription Expiration & Super Admin Renewal...");
    try {
        const adminTenantsRes = await axios.get(`${BASE_URL}/api/admin/tenants`, superAdminHeaders);
        const myTenant = adminTenantsRes.data.find(t => t.email === tenantEmail);

        // Simulate expired subscription
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await new Promise((resolve, reject) => {
            masterDB.run("UPDATE tenants SET subscription_expiry = ? WHERE id = ?", [pastDate, myTenant.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Tenant tries an authenticated operation -> should be blocked by subscription check
        try {
            await axios.get(`${BASE_URL}/api/products`, tenantHeaders);
            throw new Error("Access was NOT blocked for expired tenant!");
        } catch (blockedErr) {
            console.log(" Expired tenant correctly blocked by auth middleware:", blockedErr.response?.data?.error || blockedErr.response?.status);
            if (blockedErr.response?.status !== 403) {
                throw new Error(`Expected status 403, got ${blockedErr.response?.status}`);
            }
        }

        // Superadmin renews the tenant's subscription
        console.log(" Super Admin clicking renew subscription for tenant...");
        const renewRes = await axios.put(`${BASE_URL}/api/admin/tenants/${myTenant.id}/renew`, {}, superAdminHeaders);
        console.log(" Renewal Response:", renewRes.data);

        // Tenant accesses again -> access restored!
        const productsRes = await axios.get(`${BASE_URL}/api/products`, tenantHeaders);
        console.log(" Access instantly restored for renewed tenant! Product count:", productsRes.data.length);
    } catch (e) {
        console.error("❌ SaaS subscription renewal test failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // Clean up test tenant
    try {
        await axios.delete(`${BASE_URL}/api/admin/tenants/${tenantId}`, superAdminHeaders);
        console.log(" Test tenant cleaned up successfully.");
    } catch (_) {}

    console.log("\n=======================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO ERRORS ENCOUNTERED.");
    console.log("=======================================================");
    process.exit(0);
}

runTests();
