import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createNft,
  verifyCollectionV1,
  findMetadataPda,
  mplTokenMetadata
} from '@metaplex-foundation/mpl-token-metadata';
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

// 环境变量
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const MINTER_PRIVATE_KEY = process.env.SOLANA_MINTER_PRIVATE_KEY;
const COLLECTION_MINT = process.env.SOLANA_COLLECTION_MINT;

// 初始化 Umi
let umi: ReturnType<typeof createUmi> | null = null;

function getUmi() {
  if (!umi) {
    if (!MINTER_PRIVATE_KEY) {
      throw new Error('SOLANA_MINTER_PRIVATE_KEY not configured');
    }

    umi = createUmi(RPC_URL).use(mplTokenMetadata());

    // 从 Base58 私钥创建 Keypair
    const secretKey = bs58.decode(MINTER_PRIVATE_KEY);
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    umi.use(keypairIdentity(keypair));
  }
  return umi;
}

export interface MintResult {
  signature: string;
  mint: string;
}

/**
 * Mint NFT 到指定地址
 * @param to 接收者 Solana 地址 (Base58)
 * @param uri Metadata JSON URL
 * @param name NFT 名称
 */
export async function mintNFT(
  to: string,
  uri: string,
  name: string = 'ZenGarden Flower'
): Promise<MintResult> {
  const umi = getUmi();

  if (!COLLECTION_MINT) {
    throw new Error('SOLANA_COLLECTION_MINT not configured');
  }

  // 生成新的 mint 账户
  const mint = generateSigner(umi);
  const collectionMintPubkey = publicKey(COLLECTION_MINT);

  try {
    // 创建 NFT 并验证 Collection (合并为一个交易)
    const { signature } = await transactionBuilder()
      .add(
        createNft(umi, {
          mint,
          name,
          symbol: 'ZENF',
          uri,
          sellerFeeBasisPoints: percentAmount(0), // 0% 版税
          tokenOwner: publicKey(to),
          collection: {
            key: collectionMintPubkey,
            verified: false,
          },
          creators: [
            {
              address: umi.identity.publicKey,
              verified: true,
              share: 100,
            },
          ],
        })
      )
      .add(
        verifyCollectionV1(umi, {
          metadata: findMetadataPda(umi, { mint: mint.publicKey }),
          collectionMint: collectionMintPubkey,
          authority: umi.identity,
        })
      )
      .sendAndConfirm(umi, {
        confirm: { commitment: 'confirmed' },
      });

    console.log(`✅ NFT minted: ${mint.publicKey.toString()}`);
    console.log(`   Signature: ${bs58.encode(signature)}`);

    return {
      signature: bs58.encode(signature),
      mint: mint.publicKey.toString(),
    };
  } catch (error: any) {
    console.error('❌ Mint failed:', error);
    throw new Error(`NFT mint failed: ${error.message}`);
  }
}

/**
 * 验证 Solana 签名 (用于登录认证)
 */
export function verifySignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
