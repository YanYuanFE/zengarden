import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createNft,
  mplTokenMetadata
} from '@metaplex-foundation/mpl-token-metadata';
import {
  generateSigner,
  keypairIdentity,
  percentAmount
} from '@metaplex-foundation/umi';
import bs58 from 'bs58';

// ============ 配置 ============
const RPC_URL = 'https://palpable-sleek-cloud.solana-mainnet.quiknode.pro/8addb656f4aa7d9e526d0284275a6fbbbe0faa08/';
const COLLECTION_METADATA_URI = 'https://pub-c194b99328794beabf61c62a51e74fdb.r2.dev/collection.json';

// ⚠️ 填入你的钱包私钥 (Base58 格式)
// 可以从 Phantom 导出，或使用 solana-keygen 生成
const WALLET_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY || '';

async function createCollection() {
  if (!WALLET_PRIVATE_KEY) {
    console.error('❌ 请设置 SOLANA_PRIVATE_KEY 环境变量');
    console.log('');
    console.log('方法 1: 导出 Phantom 私钥');
    console.log('  Phantom -> Settings -> Security -> Export Private Key');
    console.log('');
    console.log('方法 2: 生成新钱包');
    console.log('  solana-keygen new --outfile wallet.json');
    console.log('  然后转换为 Base58 格式');
    console.log('');
    console.log('运行方式:');
    console.log('  SOLANA_PRIVATE_KEY=你的私钥 npx ts-node scripts/create-collection.ts');
    process.exit(1);
  }

  console.log('🚀 创建 ZenGarden Collection NFT...');
  console.log('');

  // 1. 初始化 Umi
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());

  // 2. 设置钱包
  const secretKey = bs58.decode(WALLET_PRIVATE_KEY);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  console.log('📍 钱包地址:', keypair.publicKey.toString());

  // 3. 生成 Collection Mint
  const collectionMint = generateSigner(umi);

  console.log('📍 Collection Mint:', collectionMint.publicKey.toString());
  console.log('');

  try {
    // 4. 创建 Collection NFT
    console.log('⏳ 正在创建 Collection NFT...');

    const { signature } = await createNft(umi, {
      mint: collectionMint,
      name: 'ZenGarden Flowers',
      symbol: 'ZENF',
      uri: COLLECTION_METADATA_URI,
      sellerFeeBasisPoints: percentAmount(0), // 0% 版税
      isCollection: true,
    }).sendAndConfirm(umi);

    console.log('');
    console.log('✅ Collection NFT 创建成功!');
    console.log('');
    console.log('========================================');
    console.log('Collection Mint Address (保存到环境变量):');
    console.log(collectionMint.publicKey.toString());
    console.log('========================================');
    console.log('');
    console.log('Transaction:', bs58.encode(signature));
    console.log('');
    console.log('查看: https://solscan.io/token/' + collectionMint.publicKey.toString());
    console.log('');
    console.log('📝 请将以下内容添加到 .env 文件:');
    console.log(`SOLANA_COLLECTION_MINT=${collectionMint.publicKey.toString()}`);

  } catch (error) {
    console.error('❌ 创建失败:', error);
    process.exit(1);
  }
}

createCollection();
