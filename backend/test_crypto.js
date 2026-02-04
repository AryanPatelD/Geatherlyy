const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read keys from keys.json if available
let keys;
try {
    keys = JSON.parse(fs.readFileSync(path.join(__dirname, 'keys.json'), 'utf8'));
    console.log('Keys loaded from keys.json');
} catch (e) {
    console.error('Failed to load keys.json');
    process.exit(1);
}

const privateKeyPem = Buffer.from(keys.private, 'base64').toString('utf8');
const publicKeyPem = Buffer.from(keys.public, 'base64').toString('utf8');

const message = 'password123';

try {
    // Test 1: Encrypt with Public Key (PKCS1)
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKeyPem,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(message)
    );
    console.log('Encryption (PKCS1) success. Ciphertext length:', encrypted.length);

    // Test 2: Decrypt with Private Key (PKCS1)
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKeyPem,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        encrypted
    );
    console.log('Decryption (PKCS1) success. Result:', decrypted.toString());

} catch (e) {
    console.error('PKCS1 Test Failed:', e.message);
}

try {
    // Test 3: Encrypt with Public Key (OAEP)
    const encryptedOAEP = crypto.publicEncrypt(
        {
            key: publicKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(message)
    );
    console.log('Encryption (OAEP) success. Ciphertext length:', encryptedOAEP.length);

    // Test 4: Decrypt with Private Key (OAEP)
    const decryptedOAEP = crypto.privateDecrypt(
        {
            key: privateKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedOAEP
    );
    console.log('Decryption (OAEP) success. Result:', decryptedOAEP.toString());
} catch (e) {
    console.error('OAEP Test Failed:', e.message);
}
