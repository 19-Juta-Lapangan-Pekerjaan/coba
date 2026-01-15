
import { createPublicClient, createWalletClient, http, parseAbi, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';

const PRIVATE_KEY = '0xc87fee765cb8d1cc0ac91a59e47b630bc153cd4f3c6e9c4bafe978fa63773644';
const TOKEN = '0x0A7853C1074722A766a27d4090986bF8A74DA39f' as const;
const SHIELD = '0x0D5Ff322a648a6Ff62C5deA028ea222dFefc5225' as const;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
});

const walletClient = createWalletClient({
    account,
    chain: mantleSepoliaTestnet,
    transport: http(),
});

const shieldAbi = parseAbi([
    'function deposit(address token, uint256 amount, bytes32 commitment, bytes encryptedMemo) external',
]);

async function main() {
    console.log('Account:', account.address);

    const depositAmount = 1000000000000000000n; // 1 mUSDT
    const commitment = '0x1234567890123456789012345678901234567890123456789012345678901234' as `0x${string}`;

    console.log('Attempting eth_call simulation first...');
    try {
        await publicClient.call({
            account: account.address,
            to: SHIELD,
            data: '0x' as `0x${string}`, // Will encode below
        });
    } catch (e) {
        console.log('eth_call basic test done');
    }

    console.log('Simulating deposit via simulateContract...');
    try {
        const { request } = await publicClient.simulateContract({
            account,
            address: SHIELD,
            abi: shieldAbi,
            functionName: 'deposit',
            args: [TOKEN, depositAmount, commitment, '0x'],
        });
        console.log('Simulation SUCCESS, gas:', request.gas);

        console.log('Sending real transaction...');
        const tx = await walletClient.writeContract(request);
        console.log('TX sent:', tx);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log('TX confirmed! Status:', receipt.status, 'Block:', receipt.blockNumber);

    } catch (e: any) {
        console.log('=== ERROR DETAILS ===');
        console.log('Name:', e.name);
        console.log('Message:', e.message);
        console.log('Short:', e.shortMessage);
        console.log('Details:', e.details);
        if (e.cause) {
            console.log('Cause name:', e.cause.name);
            console.log('Cause message:', e.cause.message);
            console.log('Cause data:', e.cause.data);
        }
        if (e.metaMessages) {
            console.log('Meta:', e.metaMessages);
        }
    }
}

main().catch(e => {
    console.log('Unhandled error:', e);
});
