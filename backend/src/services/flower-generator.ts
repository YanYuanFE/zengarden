const GEMINI_RELAY_URL = process.env.GEMINI_RELAY_URL || 'http://localhost:3001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface GenerateFlowerOptions {
  reason: string;
  duration: number;
}

export interface GenerateFlowerResult {
  imageBase64: string;
  mimeType: string;
  generatedPrompt: string;
}

export async function generateFlower(options: GenerateFlowerOptions): Promise<GenerateFlowerResult> {
  const { reason, duration } = options;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Step 1: 生成详细的花朵描述 Prompt
  const detailedPrompt = await generateFlowerPrompt(reason, duration);

  // Step 2: 使用详细 Prompt 生成图片
  const imageResult = await generateFlowerImage(detailedPrompt);

  return {
    ...imageResult,
    generatedPrompt: detailedPrompt,
  };
}

// Step 1: 调用文本生成 API 生成详细 Prompt
async function generateFlowerPrompt(reason: string, duration: number): Promise<string> {
  const metaPrompt = buildMetaPrompt(reason, duration);

  const response = await fetch(`${GEMINI_RELAY_URL}/generate/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: GEMINI_API_KEY,
      prompt: metaPrompt,
      modelId: 'gemini-3-flash-preview',
      thinkingBudget: 0,
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate prompt');
  }

  return data.text;
}

// Step 2: 调用图片生成 API
async function generateFlowerImage(prompt: string) {
  const response = await fetch(`${GEMINI_RELAY_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: GEMINI_API_KEY,
      prompt,
      modelId: 'gemini-3-pro-image-preview',
      aspectRatio: '1:1',
      imageSize: '1K',
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate image');
  }

  return {
    imageBase64: data.imageBase64,
    mimeType: data.mimeType,
  };
}

// Meta Prompt 模板
function buildMetaPrompt(reason: string, duration: number): string {
  return `You are a creative artist specializing in botanical illustrations.

Based on the following focus session, create a detailed image generation prompt for a unique flower:

Focus Reason: "${reason}"
Focus Duration: ${duration} seconds

Generate a detailed prompt (100-150 words) that describes:
1. A specific flower type that metaphorically relates to the focus theme
2. Color palette (2-3 main colors) that evokes the mood of the activity
3. Art style (watercolor, digital art, ink wash, etc.)
4. Background and composition details
5. Any subtle symbolic elements

Requirements for the output prompt:
- Single flower, centered composition
- Clean, minimal background
- Zen garden aesthetic
- Calming and rewarding visual feel
- Square format (1:1 aspect ratio)

Output ONLY the image generation prompt, no explanations.`;
}
