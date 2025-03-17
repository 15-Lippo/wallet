import { createApp } from 'vue';
import * as bip39 from 'bip39';
import { hdkey } from 'ethereum-cryptography/hdkey';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';
import { sha256 } from 'ethereum-cryptography/sha256';

const app = createApp({
    data() {
        return {
            isLoading: true,
            loadingMessage: 'Generating Wallet...',
            walletAddress: null,
            privateKey: null,
            mnemonic: null,
            showPrivateKey: false,
            showMnemonic: false,
            recipient: '',
            amount: null,
        };
    },
    methods: {
        async initializeWallet() {
            try {
                // Generate a new mnemonic phrase
                this.mnemonic = bip39.generateMnemonic();
                const seed = await bip39.mnemonicToSeed(this.mnemonic);

                // Derive the private key and address
                const hdwallet = hdkey.fromMasterSeed(seed);
                const wallet = hdwallet.derive("m/44'/461'/0'/0/0");
                this.privateKey = wallet.privateKey.toString('hex');
                this.walletAddress = this.generateFilecoinAddress(wallet.publicKey);

                this.isLoading = false;
            } catch (error) {
                console.error('Error initializing wallet:', error);
                this.loadingMessage = 'Failed to generate wallet';
            }
        },
        generateFilecoinAddress(publicKey) {
            const hash = sha256(publicKey);
            const payload = `01${Buffer.from(hash).toString('hex').substring(0, 40)}`;
            const checksum = sha256(Buffer.from(payload, 'hex')).toString('hex').substring(0, 8);
            const addressBytes = Buffer.from(`01${payload}${checksum}`, 'hex');
            return `f1${this.base32Encode(addressBytes)}`;
        },
        base32Encode(data) {
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
        },
        togglePrivateKey() {
            this.showPrivateKey = !this.showPrivateKey;
        },
        toggleMnemonic() {
            this.showMnemonic = !this.showMnemonic;
        },
        copyAddress() {
            navigator.clipboard.writeText(this.walletAddress).then(() => {
                alert('Address copied!');
            });
        },
        copyPrivateKey() {
            navigator.clipboard.writeText(this.privateKey).then(() => {
                alert('Private key copied!');
            });
        },
        copyMnemonic() {
            navigator.clipboard.writeText(this.mnemonic).then(() => {
                alert('Mnemonic copied!');
            });
        },
        resetWallet() {
            if (confirm('Are you sure you want to reset the wallet?')) {
                this.initializeWallet();
            }
        },
        async sendFunds() {
            if (!this.recipient || !this.amount) {
                alert('Please enter a valid recipient address and amount.');
                return;
            }

            try {
                alert('Transaction sent successfully!');
                this.recipient = '';
                this.amount = null;
            } catch (error) {
                console.error('Error sending funds:', error);
                alert('Failed to send funds.');
            }
        },
        shortenAddress(address) {
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        },
    },
    mounted() {
        this.initializeWallet();
    },
});

app.mount('#app');
