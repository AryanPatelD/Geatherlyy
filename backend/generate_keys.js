const NodeRSA = require('node-rsa');
const key = new NodeRSA({b: 2048});

const fs = require('fs');

const privateKey = key.exportKey('private');
const publicKey = key.exportKey('public');

const keys = {
    private: Buffer.from(privateKey).toString('base64'),
    public: Buffer.from(publicKey).toString('base64')
};

fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
console.log('Keys written to keys.json');
