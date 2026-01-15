
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';

const TOKEN = '0x0A7853C1074722A766a27d4090986bF8A74DA39f';
const SHIELD = '0x0D5Ff322a648a6Ff62C5deA028ea222dFefc5225';
const USER = '0x9D33851ce072d49BdDb056B2091d64f6b61F7E2f';

const client = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
});

const tokenAbi = parseAbi([
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address, address) view returns (uint256)',
]);

async function main() {
    console.log('=== TOKEN INFO ===');

    const decimals = await client.readContract({ address: TOKEN, abi: tokenAbi, functionName: 'decimals' });
    const symbol = await client.readContract({ address: TOKEN, abi: tokenAbi, functionName: 'symbol' });
    console.log(`Token: ${symbol}`);
    console.log(`Decimals: ${decimals}`);

    const balance = await client.readContract({ address: TOKEN, abi: tokenAbi, functionName: 'balanceOf', args: [USER] });
    console.log(`User Balance: ${formatUnits(balance, decimals)} ${symbol} (raw: ${balance})`);

    const allowance = await client.readContract({ address: TOKEN, abi: tokenAbi, functionName: 'allowance', args: [USER, SHIELD] });
    console.log(`Allowance: ${formatUnits(allowance, decimals)} ${symbol} (raw: ${allowance})`);

    console.log('\n=== FAILED DEPOSIT AMOUNT ===');
    const failedAmount = 100000000000000000000n; // 100 mUSDT
    console.log(`Amount: ${formatUnits(failedAmount, decimals)} ${symbol} (raw: ${failedAmount})`);

    console.log(`\nCan afford? ${balance >= failedAmount ? 'YES' : 'NO - INSUFFICIENT BALANCE'}`);
    console.log(`Allowance OK? ${allowance >= failedAmount ? 'YES' : 'NO - INSUFFICIENT ALLOWANCE'}`);

    console.log('\n=== SUCCESSFUL DEPOSIT AMOUNT ===');
    const successAmount = 1000000000000000000n; // 1 mUSDT (script test)
    console.log(`Amount: ${formatUnits(successAmount, decimals)} ${symbol} (raw: ${successAmount})`);
}

main().catch(console.error);
