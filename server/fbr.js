const axios = require('axios');

/**
 * FBR Digital Invoicing (DI) API Client
 * Technical Specification for DI API User Manual Version 1.12 (PRAL - 2025)
 */

// Official URLs from FBR / PRAL Technical Specification v1.12
const FBR_URLS = {
    sandbox: {
        post: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb',
        validate: 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb'
    },
    production: {
        post: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata',
        validate: 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata'
    },
    reference: {
        provinces: 'https://gw.fbr.gov.pk/pdi/v1/provinces',
        docTypes: 'https://gw.fbr.gov.pk/pdi/v1/doctypecode',
        itemCodes: 'https://gw.fbr.gov.pk/pdi/v1/itemdesccode',
        sroItemCode: 'https://gw.fbr.gov.pk/pdi/v1/sroitemcode',
        transTypes: 'https://gw.fbr.gov.pk/pdi/v1/transtypecode',
        uom: 'https://gw.fbr.gov.pk/pdi/v1/uom',
        sroSchedule: 'https://gw.fbr.gov.pk/pdi/v1/SroSchedule',
        saleTypeToRate: 'https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate',
        hsUom: 'https://gw.fbr.gov.pk/pdi/v2/HS_UOM',
        sroItemV2: 'https://gw.fbr.gov.pk/pdi/v2/SROItem',
        statl: 'https://gw.fbr.gov.pk/dist/v1/statl',
        regType: 'https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type'
    }
};

// Official Error Dictionary from FBR User Manual v1.12 (Pages 36-45)
const FBR_ERROR_CODES = {
    '0001': 'Seller is not registered for sales tax, please provide valid seller registration/NTN.',
    '0002': 'Buyer Registration Number or NTN is not in proper format, please provide 13 digits CNIC or 7/9 digits NTN.',
    '0003': 'Invoice type is not valid or empty, please provide valid invoice type.',
    '0005': 'Invoice date is not in proper format, please provide in "YYYY-MM-DD" format.',
    '0006': 'Sales invoice does not exist against STWH.',
    '0007': 'Selected invoice type is not associated with proper registration number.',
    '0008': 'ST withheld at source must either be zero or equal to sales tax.',
    '0009': 'Buyer Registration Number cannot be empty.',
    '0010': 'Buyer Name cannot be empty.',
    '0011': 'Invoice type cannot be empty.',
    '0012': 'Buyer Registration Type cannot be empty.',
    '0013': 'Sale type cannot be empty/null, please provide valid sale type.',
    '0018': 'Sales Tax/FED cannot be empty.',
    '0019': 'HS Code cannot be empty, please provide valid HS Code.',
    '0020': 'Rate field cannot be empty, please provide Rate.',
    '0021': 'Value of Sales Excl. ST / Quantity cannot be empty.',
    '0022': 'ST withheld at Source cannot be empty.',
    '0023': 'Sales Tax cannot be empty.',
    '0026': 'Invoice Reference No. is mandatory requirement for debit/credit note.',
    '0027': 'Reason is mandatory requirement for debit/credit note.',
    '0028': 'Reason remarks are required.',
    '0029': 'Debit/Credit note date should be equal or greater from original invoice date.',
    '0046': 'Rate cannot be empty, please provide valid rate as per selected Sales Type.',
    '0052': 'HS Code that does not match with provided sale type.',
    '0053': 'Buyer Registration Type is invalid.',
    '0058': 'Self-invoicing not allowed (Buyer and Seller Registration number are same).',
    '0073': 'Sale Origination Province of Supplier cannot be empty.',
    '0074': 'Destination of Supply cannot be empty.',
    '0077': 'SRO/Schedule Number cannot be empty.',
    '0078': 'Item serial number cannot be empty.',
    '0088': 'Invoice number is not valid, alphanumeric and (-) allowed.',
    '0096': 'For provided HS Code, only KWH UOM is allowed.',
    '0099': 'UOM is not valid. UOM must be according to given HS Code.',
    '0102': 'Calculated sales tax not calculated as per 3rd schedule calculation formula.',
    '0104': 'Calculated percentage of sales tax not matched with provided rate.',
    '0105': 'The calculated sales tax for the quantity is incorrect.',
    '0106': 'The Buyer is not registered for sales tax.',
    '0108': 'Seller Reg No. is not valid.',
    '0113': 'Date is not in proper format, please provide date in "YYYY-MM-DD" format.',
    '0300': 'Provided decimal value is not valid.',
    '0401': 'Unauthorized access: Provided seller registration number is not 13 digits (CNIC) or 7 digits (NTN) or the authorized token does not exist against seller registration number.',
    '0402': 'Unauthorized access: Provided buyer registration number is not 13 digits (CNIC) or 7 digits (NTN) or the authorized token does not exist against buyer registration number.'
};

// Official Scenarios from FBR User Manual v1.12 (Section 9 & 10)
const FBR_SCENARIOS = [
    { id: 'SN001', name: 'Goods at standard rate to registered buyers', saleType: 'Goods at Standard Rate (default)', sector: 'General' },
    { id: 'SN002', name: 'Goods at standard rate to unregistered buyers', saleType: 'Goods at Standard Rate (default)', sector: 'General' },
    { id: 'SN005', name: 'Reduced rate sale', saleType: 'Goods at Reduced Rate', sector: 'General' },
    { id: 'SN006', name: 'Exempt goods sale', saleType: 'Exempt Goods', sector: 'General' },
    { id: 'SN007', name: 'Zero rated sale', saleType: 'Goods at zero-rate', sector: 'General' },
    { id: 'SN008', name: 'Sale of 3rd schedule goods (FMCG / Grocery)', saleType: '3rd Schedule Goods', sector: 'FMCG' },
    { id: 'SN009', name: 'Cotton Spinners / Textile purchase', saleType: 'Cotton Ginners', sector: 'Textile' },
    { id: 'SN018', name: 'Services where FED is charged in ST mode', saleType: 'Services (FED in ST Mode)', sector: 'Services' },
    { id: 'SN019', name: 'Services rendered or provided (Takeaways / Hospitality / IT)', saleType: 'Services', sector: 'Services' },
    { id: 'SN025', name: 'Drugs sold at fixed ST rate (Pharmacy / Medical)', saleType: 'Non-Adjustable Supplies', sector: 'Pharmaceuticals' },
    { id: 'SN026', name: 'Sale to End Consumer by retailers (Standard Rate default for Retail POS)', saleType: 'Goods at Standard Rate (default)', sector: 'Retail' },
    { id: 'SN027', name: 'Sale to End Consumer by retailers (3rd Schedule Goods - Supermarket)', saleType: '3rd Schedule Goods', sector: 'Retail' },
    { id: 'SN028', name: 'Sale to End Consumer by retailers (Reduced Rate)', saleType: 'Goods at Reduced Rate', sector: 'Retail' }
];

// Fallback Provinces & UOMs if FBR Reference Server is offline
const DEFAULT_PROVINCES = [
    { code: 7, name: 'PUNJAB' },
    { code: 8, name: 'SINDH' },
    { code: 9, name: 'KHYBER PAKHTUNKHWA' },
    { code: 10, name: 'BALOCHISTAN' },
    { code: 11, name: 'ISLAMABAD CAPITAL TERRITORY' },
    { code: 12, name: 'AZAD JAMMU AND KASHMIR' },
    { code: 13, name: 'GILGIT-BALTISTAN' }
];

const DEFAULT_UOMS = [
    { id: 1, name: 'Numbers, pieces, units' },
    { id: 13, name: 'KG' },
    { id: 14, name: 'Gram' },
    { id: 15, name: 'Litre' },
    { id: 16, name: 'Milli-Litre' },
    { id: 17, name: 'Metre' },
    { id: 77, name: 'Square Metre' },
    { id: 101, name: 'Pack' },
    { id: 102, name: 'Box' },
    { id: 103, name: 'Strip' },
    { id: 104, name: 'Pair' },
    { id: 105, name: 'Bottle' }
];

/**
 * Normalizes an NTN or CNIC to pure digits.
 */
function cleanTaxNumber(number) {
    if (!number) return '';
    return String(number).replace(/[^0-9]/g, '');
}

/**
 * Validates and formats the invoice according to FBR DI API v1.12 specs.
 * @param {Object} invoiceData - Input POS invoice data
 * @param {Object} settings - Tenant settings (credentials, seller details, etc.)
 * @returns {Object} FBR DI API Payload
 */
function formatInvoiceForFBR(invoiceData, settings = {}) {
    if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error("Invoice must have at least one item.");
    }

    const isSandbox = settings.fbr_environment !== 'production';

    // Invoice Date in YYYY-MM-DD
    let invoiceDate = invoiceData.date ? new Date(invoiceData.date) : new Date();
    if (isNaN(invoiceDate.getTime())) invoiceDate = new Date();
    const formattedDate = invoiceDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Seller Details
    const rawSellerTax = settings.fbr_ntn_cnic || settings.business_ntn || '0786909';
    const sellerNTNCNIC = cleanTaxNumber(rawSellerTax);
    const sellerBusinessName = settings.business_name || settings.fbr_business_name || 'Business Name';
    const sellerProvince = settings.fbr_province || settings.business_province || 'Punjab';
    const sellerAddress = settings.business_address || settings.fbr_address || 'Pakistan';

    // Buyer Details
    const rawBuyerTax = cleanTaxNumber(invoiceData.buyerNTN || invoiceData.buyerCNIC || '');
    let buyerRegistrationType = 'Unregistered';
    let buyerNTNCNIC = '1000000000000'; // Default unreg CNIC format accepted by FBR DI

    if (rawBuyerTax) {
        if (rawBuyerTax.length === 7 || rawBuyerTax.length === 9 || rawBuyerTax.length === 13) {
            buyerNTNCNIC = rawBuyerTax;
            if (invoiceData.buyerRegistrationType) {
                buyerRegistrationType = invoiceData.buyerRegistrationType;
            } else {
                buyerRegistrationType = (rawBuyerTax.length === 7 || rawBuyerTax.length === 9) ? 'Registered' : 'Unregistered';
            }
        }
    }

    const buyerBusinessName = invoiceData.buyerName || 'Walk-in Customer';
    const buyerProvince = invoiceData.buyerProvince || sellerProvince;
    const buyerAddress = invoiceData.buyerAddress || sellerAddress;

    // Industry & Scenario Determination
    const businessType = settings.business_type || 'general';
    let defaultScenario = 'SN026'; // Standard Retail End Consumer
    let defaultSaleType = 'Goods at Standard Rate (default)';
    let defaultHsCode = '0101.2100';

    if (businessType === 'pharmacy') {
        defaultScenario = 'SN025';
        defaultSaleType = 'Non-Adjustable Supplies';
        defaultHsCode = '3004.9099';
    } else if (businessType === 'grocery') {
        defaultScenario = 'SN027';
        defaultSaleType = '3rd Schedule Goods';
        defaultHsCode = '2106.9090';
    } else if (businessType === 'clothing' || businessType === 'shoes') {
        defaultScenario = 'SN026';
        defaultSaleType = 'Goods at Standard Rate (default)';
        defaultHsCode = businessType === 'shoes' ? '6403.9900' : '6203.4200';
    } else if (businessType === 'takeaways') {
        defaultScenario = 'SN019';
        defaultSaleType = 'Services';
        defaultHsCode = '9801.2000';
    }

    const scenarioId = settings.fbr_scenario_id || invoiceData.scenarioId || defaultScenario;

    // Items array mapping
    const items = invoiceData.items.map((item, index) => {
        const quantity = parseFloat(item.quantity) || 1.0000;
        const unitPrice = parseFloat(item.price) || 0.00;
        const discount = parseFloat(item.discount || 0.00);

        // Sales value excluding sales tax
        const valueSalesExcludingST = Math.max(0, parseFloat((unitPrice * quantity - discount).toFixed(2)));

        // Tax rate (parse percentage or number)
        let rateNum = 18;
        if (item.taxRate !== undefined && item.taxRate !== null) {
            rateNum = parseFloat(String(item.taxRate).replace('%', '')) || 0;
        } else if (settings.fbr_default_tax_rate !== undefined) {
            rateNum = parseFloat(String(settings.fbr_default_tax_rate).replace('%', '')) || 18;
        }

        const rateStr = `${rateNum}%`;
        const salesTaxApplicable = parseFloat((valueSalesExcludingST * (rateNum / 100)).toFixed(2));
        const extraTax = parseFloat((item.extraTax || 0).toFixed(2));
        const furtherTax = parseFloat((item.furtherTax || 0).toFixed(2));
        const fedPayable = parseFloat((item.fedPayable || 0).toFixed(2));
        const fixedRetailPrice = parseFloat((item.fixedNotifiedValueOrRetailPrice || 0).toFixed(2));

        // Total sales value including tax
        const totalValues = parseFloat((valueSalesExcludingST + salesTaxApplicable + extraTax + furtherTax + fedPayable).toFixed(2));

        const itemHsCode = item.hsCode || item.pctCode || settings.fbr_default_hs_code || defaultHsCode;
        const uoM = item.uoM || item.unit || settings.fbr_default_uom || 'Numbers, pieces, units';
        const saleType = item.saleType || settings.fbr_default_sale_type || defaultSaleType;

        // Rich product description with variant/batch/size if present
        let desc = item.name || item.productDescription || `Item ${index + 1}`;
        if (item.size) desc += ` - Size ${item.size}`;
        if (item.color) desc += ` (${item.color})`;
        if (item.batchNumber) desc += ` [Batch: ${item.batchNumber}]`;

        return {
            hsCode: String(itemHsCode).trim(),
            productDescription: desc.substring(0, 150),
            rate: rateStr,
            uoM: uoM,
            quantity: parseFloat(quantity.toFixed(4)),
            totalValues: totalValues,
            valueSalesExcludingST: valueSalesExcludingST,
            fixedNotifiedValueOrRetailPrice: fixedRetailPrice,
            salesTaxApplicable: salesTaxApplicable,
            salesTaxWithheldAtSource: 0.00,
            extraTax: extraTax,
            furtherTax: furtherTax,
            sroScheduleNo: item.sroScheduleNo || '',
            fedPayable: fedPayable,
            discount: discount,
            saleType: saleType,
            sroItemSerialNo: item.sroItemSerialNo || ''
        };
    });

    const payload = {
        invoiceType: invoiceData.invoiceType || 'Sale Invoice',
        invoiceDate: formattedDate,
        sellerNTNCNIC: sellerNTNCNIC,
        sellerBusinessName: sellerBusinessName,
        sellerProvince: sellerProvince,
        sellerAddress: sellerAddress,
        buyerNTNCNIC: buyerNTNCNIC,
        buyerBusinessName: buyerBusinessName,
        buyerProvince: buyerProvince,
        buyerAddress: buyerAddress,
        buyerRegistrationType: buyerRegistrationType,
        invoiceRefNo: invoiceData.invoiceRefNo || '',
        items: items
    };

    // Scenario ID is required for Sandbox testing as per spec Section 4.1.1
    if (isSandbox || scenarioId) {
        payload.scenarioId = scenarioId;
    }

    return payload;
}

/**
 * Sends the invoice payload directly to the FBR Digital Invoicing API.
 * @param {Object} invoiceData - Invoice details
 * @param {Object} settings - Tenant settings
 * @returns {Promise<Object>} FBR response
 */
async function sendToFBR(invoiceData, settings = {}) {
    const isSandbox = settings.fbr_environment !== 'production';
    const targetUrl = isSandbox ? FBR_URLS.sandbox.post : FBR_URLS.production.post;
    const rawToken = settings.fbr_auth_token || '';

    // Clean Bearer token format
    const authToken = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken.trim()}`;
    const payload = formatInvoiceForFBR(invoiceData, settings);

    // Determine if token is a valid live token or mock
    const isMock = !rawToken || rawToken.includes('mock') || rawToken.includes('test') || rawToken.startsWith('test-') || rawToken.length < 15;

    if (!isMock) {
        console.log(`[FBR DI] Submitting Invoice to ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}: ${targetUrl}`);
        try {
            const response = await axios.post(targetUrl, payload, {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            const data = response.data;
            const isValid = data?.validationResponse?.statusCode === '00';

            return {
                success: isValid,
                statusCode: data?.validationResponse?.statusCode || '00',
                status: data?.validationResponse?.status || (isValid ? 'Valid' : 'Invalid'),
                invoiceNumber: data?.invoiceNumber || null,
                fbrInvoiceId: data?.invoiceNumber || null,
                dated: data?.dated || new Date().toISOString(),
                error: data?.validationResponse?.error || (isValid ? '' : 'FBR validation failed'),
                errorCode: data?.validationResponse?.errorCode || null,
                errorDescription: FBR_ERROR_CODES[data?.validationResponse?.errorCode] || data?.validationResponse?.error || '',
                invoiceStatuses: data?.validationResponse?.invoiceStatuses || [],
                raw: data,
                mode: isSandbox ? 'sandbox' : 'production'
            };
        } catch (error) {
            console.error('[FBR DI] Transmission Error:', error.response?.data || error.message);
            const errData = error.response?.data;
            const errCode = errData?.validationResponse?.errorCode || (error.response?.status === 401 ? '0401' : 'TRANSMIT_ERR');
            
            return {
                success: false,
                statusCode: errData?.validationResponse?.statusCode || '01',
                status: 'Invalid',
                invoiceNumber: null,
                errorCode: errCode,
                error: errData?.validationResponse?.error || error.message,
                errorDescription: FBR_ERROR_CODES[errCode] || errData?.validationResponse?.error || error.message,
                raw: errData || null,
                mode: isSandbox ? 'sandbox' : 'production'
            };
        }
    }

    // High-fidelity Simulator for Development / Sandbox preview when token is pending
    console.log(`[FBR DI] Using Simulator for ${payload.sellerBusinessName} (${isSandbox ? 'Sandbox' : 'Production'})`);
    const mockFiscalNumber = `${payload.sellerNTNCNIC}DI${Date.now()}`;
    const mockDated = new Date().toISOString().replace('T', ' ').slice(0, 19);

    return {
        success: true,
        statusCode: '00',
        status: 'Valid',
        invoiceNumber: mockFiscalNumber,
        fbrInvoiceId: mockFiscalNumber,
        dated: mockDated,
        error: '',
        errorCode: '',
        errorDescription: '',
        invoiceStatuses: payload.items.map((item, idx) => ({
            itemSNo: String(idx + 1),
            statusCode: '00',
            status: 'Valid',
            invoiceNo: `${mockFiscalNumber}-${idx + 1}`,
            errorCode: '',
            error: ''
        })),
        mode: 'simulator',
        raw: {
            invoiceNumber: mockFiscalNumber,
            dated: mockDated,
            validationResponse: {
                statusCode: '00',
                status: 'Valid',
                error: ''
            }
        }
    };
}

/**
 * Validates invoice data with FBR without saving or posting.
 * Uses validateinvoicedata endpoint (Section 4.2 of User Manual).
 */
async function validateInvoiceWithFBR(invoiceData, settings = {}) {
    const isSandbox = settings.fbr_environment !== 'production';
    const validateUrl = isSandbox ? FBR_URLS.sandbox.validate : FBR_URLS.production.validate;
    const rawToken = settings.fbr_auth_token || '';
    const authToken = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken.trim()}`;
    const payload = formatInvoiceForFBR(invoiceData, settings);

    if (rawToken && !rawToken.includes('mock') && rawToken.length >= 15) {
        try {
            const response = await axios.post(validateUrl, payload, {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            const data = response.data;
            const isValid = data?.validationResponse?.statusCode === '00';
            return {
                valid: isValid,
                statusCode: data?.validationResponse?.statusCode,
                status: data?.validationResponse?.status,
                error: data?.validationResponse?.error,
                errorCode: data?.validationResponse?.errorCode,
                errorDescription: FBR_ERROR_CODES[data?.validationResponse?.errorCode] || data?.validationResponse?.error,
                invoiceStatuses: data?.validationResponse?.invoiceStatuses,
                raw: data
            };
        } catch (err) {
            const errData = err.response?.data;
            return {
                valid: false,
                error: errData?.validationResponse?.error || err.message,
                errorCode: errData?.validationResponse?.errorCode || 'VALIDATE_ERROR',
                errorDescription: FBR_ERROR_CODES[errData?.validationResponse?.errorCode] || err.message
            };
        }
    }

    // Local / simulated validation check against FBR rules
    const errors = [];
    if (!payload.sellerNTNCNIC || (payload.sellerNTNCNIC.length !== 7 && payload.sellerNTNCNIC.length !== 13)) {
        errors.push({ code: '0001', message: FBR_ERROR_CODES['0001'] });
    }
    payload.items.forEach((item, i) => {
        if (!item.hsCode) errors.push({ code: '0019', message: `Item ${i+1}: ${FBR_ERROR_CODES['0019']}` });
        if (!item.rate) errors.push({ code: '0020', message: `Item ${i+1}: ${FBR_ERROR_CODES['0020']}` });
    });

    return {
        valid: errors.length === 0,
        statusCode: errors.length === 0 ? '00' : '01',
        status: errors.length === 0 ? 'Valid' : 'Invalid',
        errors: errors,
        mode: 'simulator'
    };
}

/**
 * Checks taxpayer registration and status via FBR STATL endpoint (Section 5.11 & 5.12).
 * @param {string} regNo - NTN or CNIC
 * @param {string} token - FBR Auth token
 */
async function checkTaxpayerStatus(regNo, token = '') {
    const cleaned = cleanTaxNumber(regNo);
    if (!cleaned) throw new Error("Registration Number (NTN/CNIC) is required");

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token.trim()}`;

    // Try FBR Get_Reg_Type endpoint
    if (token && !token.includes('mock') && token.length >= 15) {
        try {
            const response = await axios.get(FBR_URLS.reference.regType, {
                headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
                data: { Registration_No: cleaned },
                timeout: 10000
            });
            return response.data;
        } catch (err) {
            console.warn('[FBR STATL] API lookup failed, falling back to local verification:', err.message);
        }
    }

    // Fallback format validator
    const isNTN = cleaned.length === 7 || cleaned.length === 9;
    const isCNIC = cleaned.length === 13;
    
    return {
        statuscode: (isNTN || isCNIC) ? '00' : '01',
        REGISTRATION_NO: cleaned,
        REGISTRATION_TYPE: (isNTN || isCNIC) ? 'Registered' : 'unregistered',
        mode: 'format_check'
    };
}

/**
 * Fetches Reference Data (Provinces, UOMs, etc.) from FBR API with offline defaults.
 */
async function getReferenceData(type, token = '') {
    if (type === 'provinces') {
        if (token && token.length > 15) {
            try {
                const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token.trim()}`;
                const res = await axios.get(FBR_URLS.reference.provinces, {
                    headers: { 'Authorization': authToken },
                    timeout: 8000
                });
                if (Array.isArray(res.data) && res.data.length > 0) return res.data;
            } catch (e) {}
        }
        return DEFAULT_PROVINCES;
    }

    if (type === 'uom') {
        if (token && token.length > 15) {
            try {
                const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token.trim()}`;
                const res = await axios.get(FBR_URLS.reference.uom, {
                    headers: { 'Authorization': authToken },
                    timeout: 8000
                });
                if (Array.isArray(res.data) && res.data.length > 0) return res.data;
            } catch (e) {}
        }
        return DEFAULT_UOMS;
    }

    if (type === 'scenarios') {
        return FBR_SCENARIOS;
    }

    return [];
}

module.exports = {
    FBR_URLS,
    FBR_ERROR_CODES,
    FBR_SCENARIOS,
    DEFAULT_PROVINCES,
    DEFAULT_UOMS,
    formatInvoiceForFBR,
    sendToFBR,
    validateInvoiceWithFBR,
    checkTaxpayerStatus,
    getReferenceData
};
