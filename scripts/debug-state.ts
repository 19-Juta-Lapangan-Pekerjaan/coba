
import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';

const USER = '0x9D33851ce072d49BdDb056B2091d64f6b61F7E2f';
const TOKEN = '0x0A7853C1074722A766a27d4090986bF8A74DA39f';
const SPENDER = '0x0D5Ff322a648a6Ff62C5deA028ea222dFefc5225';

const client = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
});

const shieldAbi = parseAbi([
    'function deposit(address,uint256,bytes32,bytes) external'
]);

async function main() {
    console.log('--- Debugging Gas ---');

    try {
        // 1. Check Block Gas Limit
        const block = await client.getBlock();
        console.log(`Block Gas Limit: ${block.gasLimit}`);

        // 2. Estimate Gas
        console.log('--- Estimating Gas for Deposit ---');
        try {
            const gasEstimate = await client.estimateContractGas({
                account: USER as `0x${string}`,
                address: SPENDER,
                abi: shieldAbi,
                functionName: 'deposit',
                args: [TOKEN, 1000000000000000000n, '0x1234567890123456789012345678901234567890123456789012345678901234', '0x'],
            });
            console.log(`✅ Gas Estimate: ${gasEstimate}`);
        } catch (estError: any) {
            console.error('❌ Estimation FAILED:', estError.shortMessage || estError.message);
            if (estError.cause) console.error('Cause:', estError.cause);
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

main().catch(console.error);
