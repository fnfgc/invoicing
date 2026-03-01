const fs = require('fs');

async function getInsights(db) {
    try {
        const insights = {
            stockAlerts: [],
            salesTrend: null,
            bundling: [],
            pricingTips: []
        };

        // 1. Stock Alerts (Low Stock)
        // Simple heuristic: Stock < 10
        const lowStock = await new Promise((resolve, reject) => {
            db.all("SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 5", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        insights.stockAlerts = lowStock.map(p => ({
            type: 'critical',
            message: `Low stock alert: ${p.name} has only ${p.stock} units left.`,
            action: 'Restock Now'
        }));

        // 2. Sales Trend (This Week vs Last Week)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(today.getDate() - 14);

        const thisWeekSales = await new Promise((resolve, reject) => {
            db.get("SELECT SUM(totalAmount) as total FROM invoices WHERE date >= ?", [sevenDaysAgo.toISOString()], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.total || 0 : 0);
            });
        });

        const lastWeekSales = await new Promise((resolve, reject) => {
            db.get("SELECT SUM(totalAmount) as total FROM invoices WHERE date >= ? AND date < ?", 
                [fourteenDaysAgo.toISOString(), sevenDaysAgo.toISOString()], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.total || 0 : 0);
            });
        });

        let trendPercent = 0;
        if (lastWeekSales > 0) {
            trendPercent = ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100;
        } else if (thisWeekSales > 0) {
            trendPercent = 100;
        }

        insights.salesTrend = {
            message: `Sales are ${Math.abs(trendPercent).toFixed(1)}% ${trendPercent >= 0 ? 'higher' : 'lower'} than last week.`,
            trend: trendPercent >= 0 ? 'up' : 'down',
            value: `${trendPercent.toFixed(1)}%`
        };

        // 3. Bundling Opportunities (Association Rules)
        // Fetch last 200 invoices to analyze patterns
        const invoices = await new Promise((resolve, reject) => {
            db.all("SELECT items FROM invoices ORDER BY date DESC LIMIT 200", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const pairCounts = {};
        const productNames = {};

        invoices.forEach(inv => {
            try {
                const items = JSON.parse(inv.items);
                if (!Array.isArray(items) || items.length < 2) return;

                // Unique product IDs in this invoice
                const productIds = [...new Set(items.map(i => {
                    productNames[i.id || i.product_id] = i.name;
                    return i.id || i.product_id;
                }))].sort();

                // Generate pairs
                for (let i = 0; i < productIds.length; i++) {
                    for (let j = i + 1; j < productIds.length; j++) {
                        const key = `${productIds[i]}|${productIds[j]}`;
                        pairCounts[key] = (pairCounts[key] || 0) + 1;
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        });

        // Find top bundle
        let topPair = null;
        let maxCount = 0;

        Object.entries(pairCounts).forEach(([key, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topPair = key;
            }
        });

        if (topPair && maxCount > 2) { // Minimum threshold
            const [id1, id2] = topPair.split('|');
            const name1 = productNames[id1] || 'Item A';
            const name2 = productNames[id2] || 'Item B';
            
            insights.bundling.push({
                message: `Frequent pair: ${name1} & ${name2} bought together often.`,
                suggestion: `Bundle ${name1} + ${name2} for a 5% discount to boost sales.`
            });
        }

        // 4. Pricing Tips (High Velocity)
        // Find product sold most in last 7 days
        // (Simplified: just look at global stock vs movement if we had movement logs, but here we use invoices)
        
        // Let's count item frequency in the fetched invoices (last 200)
        const itemFrequency = {};
        invoices.forEach(inv => {
            try {
                const items = JSON.parse(inv.items);
                items.forEach(i => {
                    const id = i.id || i.product_id;
                    itemFrequency[id] = (itemFrequency[id] || 0) + (i.quantity || 1);
                });
            } catch (e) {}
        });

        let topSellingId = null;
        let maxFreq = 0;
        Object.entries(itemFrequency).forEach(([id, freq]) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                topSellingId = id;
            }
        });

        if (topSellingId && maxFreq > 10) { // Threshold
            const topProdName = productNames[topSellingId] || 'Unknown';
            insights.pricingTips.push({
                message: `High demand: ${topProdName} is flying off the shelves.`,
                suggestion: `Consider increasing price of ${topProdName} by 5% to maximize margin.`
            });
        }

        return insights;

    } catch (error) {
        console.error("AI Insights Error:", error);
        return { error: "Failed to generate insights" };
    }
}

module.exports = { getInsights };
