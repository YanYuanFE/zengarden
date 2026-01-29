import { prisma } from '../lib/prisma.js';
import { generateFlower } from '../services/flower-generator.js';
import { uploadImage, uploadJson } from '../lib/r2.js';
import { mintNFT } from '../lib/solana.js';

const POLL_INTERVAL = 5000; // 5秒轮询一次
let isRunning = false;
let isProcessing = false; // 防止并发处理

export async function startWorker() {
  if (isRunning) return;
  isRunning = true;
  console.log('🌸 Flower worker started');

  setInterval(async () => {
    try {
      await processNextTask();
    } catch (error) {
      console.error('Worker error:', error);
    }
  }, POLL_INTERVAL);
}

async function processNextTask() {
  // 防止并发处理
  if (isProcessing) {
    console.log('[Worker] Already processing, skipping...');
    return;
  }

  isProcessing = true;

  try {
    console.log('[Worker] Checking for pending tasks...');

    // 使用事务：查找并立即锁定任务
    const task = await prisma.$transaction(async (tx) => {
      const pendingTask = await tx.flowerTask.findFirst({
        where: { status: 'pending' },
        include: {
          flower: {
            include: {
              session: true,
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!pendingTask) return null;

      // 立即更新状态，防止其他进程拾取
      await tx.flowerTask.update({
        where: { id: pendingTask.id },
        data: { status: 'generating', startedAt: new Date() },
      });

      return pendingTask;
    });

    if (!task) {
      console.log('[Worker] No pending tasks found');
      return;
    }

    console.log(`Processing task ${task.id}`);

    try {
      await processTask(task);
    } catch (error: any) {
      await handleTaskError(task.id, error);
    }
  } finally {
    isProcessing = false;
  }
}

async function processTask(task: any) {
  const { flower } = task;

  // 步骤1: 生成图片 (状态已在 processNextTask 中更新为 generating)
  const result = await generateFlower({
    reason: flower.session.reason,
    duration: flower.session.durationSeconds,
  });

  // 步骤2: 上传到 R2
  await updateTaskStatus(task.id, 'uploading');
  const fileName = `flowers/${flower.userId}/${Date.now()}.png`;
  const imageUrl = await uploadImage(result.imageBase64, fileName, result.mimeType);

  // 更新花朵图片URL和prompt
  await prisma.flower.update({
    where: { id: flower.id },
    data: { imageUrl, prompt: result.generatedPrompt },
  });

  // 步骤3: 生成并上传 metadata JSON
  await updateTaskStatus(task.id, 'minting');

  const metadata = {
    name: `ZenGarden Flower #${Date.now()}`,
    symbol: 'ZENF',
    description: `A flower grown through ${Math.floor(flower.session.durationSeconds / 60)} minutes of focused "${flower.session.reason}"`,
    image: imageUrl,
    external_url: 'https://zengarden.pixstudio.art',
    attributes: [
      { trait_type: 'Focus Reason', value: flower.session.reason },
      { trait_type: 'Duration', value: `${Math.floor(flower.session.durationSeconds / 60)} minutes` },
      { trait_type: 'Date', value: new Date().toISOString().split('T')[0] },
    ],
    properties: {
      category: 'image',
      files: [{ uri: imageUrl, type: 'image/png' }],
    },
  };

  const metadataFileName = `metadata/${flower.userId}/${Date.now()}.json`;
  const metadataUrl = await uploadJson(metadata, metadataFileName);

  // 步骤4: Mint NFT (Solana)
  let txHash: string | null = null;
  let tokenId: string | null = null;

  console.log(`[Mint] User address: ${flower.user?.address || 'NOT FOUND'}`);
  console.log(`[Mint] User data:`, JSON.stringify(flower.user, null, 2));

  if (flower.user?.address) {
    try {
      console.log(`[Mint] Starting mint for ${flower.user.address}...`);
      const mintResult = await mintNFT(
        flower.user.address,
        metadataUrl,
        metadata.name
      );
      txHash = mintResult.signature;
      tokenId = mintResult.mint; // Solana 使用 mint address 作为 tokenId

      await prisma.flower.update({
        where: { id: flower.id },
        data: { txHash, tokenId, metadataUrl, minted: true },
      });
    } catch (error: any) {
      console.error(`❌ NFT mint failed for flower ${flower.id}:`, error.message);
      console.error(`   Full error:`, error);
      // 继续执行，图片已生成，只是 NFT 未 mint
      await prisma.flower.update({
        where: { id: flower.id },
        data: { metadataUrl, minted: false },
      });
    }
  }

  // 更新用户花朵数量
  await prisma.user.update({
    where: { id: flower.userId },
    data: { totalFlowers: { increment: 1 } },
  });

  // 完成任务
  await prisma.flowerTask.update({
    where: { id: task.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  console.log(`Task ${task.id} completed`);
}

async function updateTaskStatus(taskId: string, status: string) {
  await prisma.flowerTask.update({
    where: { id: taskId },
    data: {
      status: status as any,
      startedAt: status === 'generating' ? new Date() : undefined,
    },
  });
}

async function handleTaskError(taskId: string, error: any) {
  const task = await prisma.flowerTask.findUnique({
    where: { id: taskId },
  });

  if (!task) return;

  const newRetryCount = task.retryCount + 1;
  const shouldRetry = newRetryCount < task.maxRetries;

  await prisma.flowerTask.update({
    where: { id: taskId },
    data: {
      status: shouldRetry ? 'pending' : 'failed',
      retryCount: newRetryCount,
      error: error.message || 'Unknown error',
    },
  });

  if (shouldRetry) {
    console.log(`Task ${taskId} failed, will retry (${newRetryCount}/${task.maxRetries})`);
  } else {
    console.log(`Task ${taskId} failed after ${task.maxRetries} retries`);
  }
}
