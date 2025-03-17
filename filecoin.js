export default class FilecoinWallet {
    static async generateKey(mnemonic) {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const hdwallet = hdkey.fromMasterSeed(seed);
        const wallet = hdwallet.derive("m/44'/461'/0'/0/0");
        const privateKey = wallet.privateKey.toString('hex');
        const publicKey = secp256k1.getPublicKey(wallet.privateKey, true);
        const address = this.generateFilecoinAddress(publicKey);
        return { privateKey, address };
    }

    static generateFilecoinAddress(publicKey) {
        const hash = sha256(publicKey);
        const payload = `01${Buffer.from(hash).toString('hex').substring(0, 40)}`;
        const checksum = sha256(Buffer.from(payload, 'hex')).toString('hex').substring(0, 8);
        const addressBytes = Buffer.from(`01${payload}${checksum}`, 'hex');
        return `f1${this.base32Encode(addressBytes)}`;
    }

    static base32Encode(data) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
        let bits = '';
        for (const byte of data) {
            bits += byte.toString(2).padStart(8, '0');
        }

        let encoded = '';
        while (bits.length >= 5) {
            const index = parseInt(bits.substring(0, 5), 2);
            encoded += alphabet[index];
            bits = bits.substring(5);
        }

        return encoded;
    }
}
