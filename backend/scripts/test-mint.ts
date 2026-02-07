import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import 'dotenv/config';

const ZenGardenFlowerABI = [
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'uri', type: 'string' }],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const privateKey = process.env['MINTER_PRIVATE_KEY'] as `0x${string}`;
const contractAddress = process.env['NFT_CONTRACT_ADDRESS'] as `0x${string}`;

// 测试参数
const testTo = '0xf05bab4f74e46560edde2a970e6d9b1981549ae5' as `0x${string}`; // 替换为你的测试地址
const testUri = 'https://pub-c194b99328794beabf61c62a51e74fdb.r2.dev/flowers/cmkuj0ah70001621scqp4rifm/1769395830308.png';

async function main() {
  console.log('=== NFT Mint 测试脚本 ===\n');

  // 检查环境变量
  console.log('1. 检查配置...');
  if (!privateKey) {
    console.error('❌ MINTER_PRIVATE_KEY 未设置');
    process.exit(1);
  }
  console.log('✅ MINTER_PRIVATE_KEY 已设置');

  if (!contractAddress) {
    console.error('❌ NFT_CONTRACT_ADDRESS 未设置');
    process.exit(1);
  }
  console.log(`✅ NFT_CONTRACT_ADDRESS: ${contractAddress}`);

  // 创建客户端
  const rpc = 'https://bsc-mainnet.infura.io/v3/95b2ca9cb5ed49bf990acb59beaaedf1';
  const account = privateKeyToAccount(privateKey);
  console.log(`✅ Minter 地址: ${account.address}\n`);

  const publicClient = createPublicClient({
    chain: bsc,
    transport: http(rpc),
  });

  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport: http(rpc),
  });

  // 检查余额
  console.log('2. 检查 BNB 余额...');
  const balance = await publicClient.getBalance({ address: account.address });
  const balanceBNB = Number(balance) / 1e18;
  console.log(`✅ 余额: ${balanceBNB.toFixed(4)} BNB\n`);

  if (balanceBNB < 0.001) {
    console.error('❌ BNB 余额不足，需要至少 0.001 BNB 支付 gas');
    process.exit(1);
  }

  // 检查合约
  console.log('3. 检查合约...');

  // // 先检查地址是否有代码
  // const bytecode = await publicClient.getCode({ address: contractAddress });
  // console.log(bytecode)
  // if (!bytecode || bytecode === '0x') {
  //   console.error('❌ 该地址没有合约代码，可能不是合约地址');
  //   console.log('   请检查 NFT_CONTRACT_ADDRESS 是否正确');
  //   console.log(`   BscScan: https://bscscan.com/address/${contractAddress}`);
  //   process.exit(1);
  // }
  // console.log(`✅ 合约代码存在，长度: ${bytecode.length} 字符`);

  try {
    const totalSupply = await publicClient.readContract({
      address: contractAddress,
      abi: ZenGardenFlowerABI,
      functionName: 'totalSupply',
    });
    console.log(`✅ 当前 totalSupply: ${totalSupply}\n`);
  } catch (error: any) {
    console.error('❌ 读取 totalSupply 失败:', error.message);
    console.log('   合约可能没有 totalSupply 函数，继续尝试 mint...\n');
  }

  // 执行 mint
  console.log('4. 执行 mint...');
  console.log(`   To: ${testTo}`);
  console.log(`   URI: ${testUri}\n`);

  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: ZenGardenFlowerABI,
      functionName: 'mint',
      args: [testTo, testUri],
    });

    console.log(`✅ 交易已发送: ${hash}`);
    console.log('   等待确认...\n');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ 交易已确认!`);
    console.log(`   区块: ${receipt.blockNumber}`);
    console.log(`   Gas 使用: ${receipt.gasUsed}`);
    console.log(`   状态: ${receipt.status === 'success' ? '成功' : '失败'}`);
    console.log(`\n   BscScan: https://bscscan.com/tx/${hash}`);
  } catch (error: any) {
    console.error('❌ Mint 失败:', error.message);
    if (error.cause) {
      console.error('   原因:', error.cause);
    }
    process.exit(1);
  }
}

main().catch(console.error);
