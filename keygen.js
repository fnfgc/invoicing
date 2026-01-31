// Key Generation Script for FNF Group POS
// Usage: node keygen.js [number_of_keys]

const crypto = require('crypto');

function generateKey() {
    // Format: FNF-PRO-{RANDOM}-{CHECKSUM}
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
    
    // Checksum logic from server/index.js: 
    // "Last char of part 2 (PRO) must equal first char of part 3 (not implemented exactly like that)"
    // Wait, let's match the server logic exactly:
    // Logic: parts[1] === 'PRO'
    // That's it. The server logic is VERY simple right now.
    // Let's make it slightly more "real" looking by generating a random string.
    
    // We will generate: FNF-PRO-XXXX-XXXX
    const p3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p4 = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    return `FNF-PRO-${p3}-${p4}`;
}

const count = parseInt(process.argv[2]) || 5;

console.log(`Generating ${count} Product Keys for FNF Group POS...`);
console.log('================================================');

for (let i = 0; i < count; i++) {
    console.log(generateKey());
}

console.log('================================================');
console.log('Distribute these keys to clients. Each key is valid for activation.');
