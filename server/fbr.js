const axios = require('axios');

// FBR Configuration (from environment variables)
const FBR_API_URL = process.env.FBR_API_URL || 'https://esp.fbr.gov.pk:8243/FBR/v1/api/Live/PostData'; // Example URL, verify with docs
const POS_ID = process.env.POS_ID || 123456; // Your POS ID
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'Bearer mock-token';

/**
 * Validates and formats the invoice data according to FBR specifications.
 * @param {Object} invoiceData - The invoice data from the POS.
 * @returns {Object} - Formatted payload for FBR.
 */
function formatInvoiceForFBR(invoiceData) {
    // Basic validation
    if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error("Invoice must have at least one item.");
    }

    const totalSaleValue = invoiceData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalTaxCharged = invoiceData.items.reduce((sum, item) => sum + ((item.price * item.quantity) * (item.taxRate / 100)), 0);
    const totalQuantity = invoiceData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = totalSaleValue + totalTaxCharged - (invoiceData.discount || 0);

    // Generate a unique USIN if not provided (normally logic would be strictly sequential per POS)
    // Format: POSID-DateTime-SequentialNumber
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
    const usin = invoiceData.usin || `${POS_ID}-${dateStr}-${Math.floor(Math.random() * 10000)}`;

    const payload = {
        InvoiceNumber: "", // Empty for new invoice, filled by FBR response usually or internal ID
        POSID: parseInt(POS_ID),
        USIN: usin,
        DateTime: now.toISOString(), // Check if FBR requires specific format like 'yyyy-MM-dd HH:mm:ss'
        BuyerNTN: invoiceData.buyerNTN || "",
        BuyerCNIC: invoiceData.buyerCNIC || "99999-9999999-9", // Default dummy CNIC if consumer
        BuyerName: invoiceData.buyerName || "Walk-in Customer",
        BuyerPhoneNumber: invoiceData.buyerPhone || "",
        TotalSaleValue: parseFloat(totalSaleValue.toFixed(2)),
        TotalTaxCharged: parseFloat(totalTaxCharged.toFixed(2)),
        Discount: parseFloat((invoiceData.discount || 0).toFixed(2)),
        TotalQuantity: parseFloat(totalQuantity.toFixed(2)),
        Items: invoiceData.items.map(item => ({
            ItemCode: item.code || "0000",
            ItemName: item.name,
            Quantity: parseFloat(item.quantity.toFixed(2)),
            PCTCode: item.pctCode || "00000000", // HS Code
            TaxRate: parseFloat(item.taxRate.toFixed(2)),
            SaleValue: parseFloat((item.price * item.quantity).toFixed(2)),
            TaxAmount: parseFloat(((item.price * item.quantity) * (item.taxRate / 100)).toFixed(2)),
            TotalAmount: parseFloat(((item.price * item.quantity) * (1 + item.taxRate / 100)).toFixed(2)),
            InvoiceType: 1, // 1 for New, 2 for Return? Check specs.
            RefUSIN: ""
        })),
        PaymentMode: 1, // 1: Cash, 2: Card
        AmountPaid: parseFloat(totalAmount.toFixed(2)),
        RefUSIN: ""
    };

    return payload;
}

/**
 * Sends the invoice to FBR.
 * @param {Object} invoiceData 
 */
async function sendToFBR(invoiceData) {
    const payload = formatInvoiceForFBR(invoiceData);

    try {
        // In a real scenario, you would make the actual HTTP request:
        // const response = await axios.post(FBR_API_URL, payload, {
        //     headers: { 'Authorization': AUTH_TOKEN, 'Content-Type': 'application/json' }
        // });
        // return response.data;

        // MOCK RESPONSE for development
        console.log("Sending to FBR:", JSON.stringify(payload, null, 2));
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return a mock success response similar to FBR's
        return {
            Code: "100",
            Response: "Invoice posted successfully",
            InvoiceNumber: `FBR-${payload.USIN}`, // Fiscal Invoice Number
            USIN: payload.USIN
        };

    } catch (error) {
        console.error("FBR Integration Error:", error);
        throw error;
    }
}

module.exports = { sendToFBR };
