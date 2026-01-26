import { createWalletClient, createPublicClient, http, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { ZenGardenFlowerABI } from './abi.js';

const privateKey = process.env['MINTER_PRIVATE_KEY'] as `0x${string}`;
const contractAddress = process.env['NFT_CONTRACT_ADDRESS'] as `0x${string}`;

const account = privateKey ? privateKeyToAccount(privateKey) : null;

const rpc = 'https://bsc-mainnet.infura.io/v3/95b2ca9cb5ed49bf990acb59beaaedf1'
const publicClient = createPublicClient({
  chain: bsc,
  transport: http(rpc),
});

const walletClient = account
  ? createWalletClient({
    account,
    chain: bsc,
    transport: http(rpc),
  })
  : null;

export interface MintResult {
  txHash: string;
  tokenId: number;
}

export async function mintNFT(to: `0x${string}`, uri: string): Promise<MintResult> {
  if (!walletClient || !contractAddress) {
    throw new Error('NFT minting not configured');
  }

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: ZenGardenFlowerABI,
    functionName: 'mint',
    args: [to, uri],
  });

  // 等待交易确认
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // 从 Transfer 事件中解析 tokenId
  let tokenId = 0;
  for (const log of receipt.logs) {
    try {
      const event = decodeEventLog({
        abi: ZenGardenFlowerABI,
        data: log.data,
        topics: log.topics,
      });
      if (event.eventName === 'Transfer') {
        tokenId = Number((event.args as any).tokenId);
        break;
      }
    } catch {
      // 忽略非 Transfer 事件
    }
  }

  return { txHash: hash, tokenId };
}
