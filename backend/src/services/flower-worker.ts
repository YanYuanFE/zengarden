import { prisma } from '../lib/prisma.js';
import { generateFlower } from '../services/flower-generator.js';
import { uploadImage, uploadJson } from '../lib/r2.js';
import { mintNFT } from '../lib/nft.js';

const POLL_INTERVAL = 5000; // 5秒轮询一次
let isRunning = false;

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
  // 获取一个待处理的任务
  const task = await prisma.flowerTask.findFirst({
    where: {
      status: 'pending',
    },
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

  if (!task) return;

  console.log(`Processing task ${task.id}`);

  try {
    await processTask(task);
  } catch (error: any) {
    await handleTaskError(task.id, error);
  }
}

async function processTask(task: any) {
  const { flower } = task;

  // 步骤1: 生成图片
  await updateTaskStatus(task.id, 'generating');
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
    name: `Zen Flower #${Date.now()}`,
    description: `专注于「${flower.session.reason}」${Math.floor(flower.session.durationSeconds / 60)}分钟后收获的花朵`,
    image: imageUrl,
    attributes: [
      { trait_type: 'Focus Reason', value: flower.session.reason },
      { trait_type: 'Duration', value: `${flower.session.durationSeconds} seconds` },
      { trait_type: 'Date', value: new Date().toISOString().split('T')[0] },
    ],
  };

  const metadataFileName = `metadata/${flower.userId}/${Date.now()}.json`;
  const metadataUrl = await uploadJson(metadata, metadataFileName);

  // 步骤4: Mint NFT
  let txHash: string | null = null;
  let tokenId: number | null = null;

  if (flower.user?.address) {
    const mintResult = await mintNFT(flower.user.address as `0x${string}`, metadataUrl);
    txHash = mintResult.txHash;
    tokenId = mintResult.tokenId;

    await prisma.flower.update({
      where: { id: flower.id },
      data: { txHash, tokenId, metadataUrl, minted: true },
    });
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
