
import { createPublicClient, http, parseAbi } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';

const SPENDER = '0x0D5Ff322a648a6Ff62C5deA028ea222dFefc5225';

const client = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
});

const abi = parseAbi([
    'function nextLeafIndex() view returns (uint32)',
    'function merkleRoot() view returns (bytes32)'
]);

async function main() {
    try {
        const nextLeaf = await client.readContract({ address: SPENDER, abi, functionName: 'nextLeafIndex' });
        console.log(`Leaf Index: ${nextLeaf}`);
        const root = await client.readContract({ address: SPENDER, abi, functionName: 'merkleRoot' });
        console.log(`Root: ${root}`);
    } catch (e) {
        console.error(e);
    }
}

main();
