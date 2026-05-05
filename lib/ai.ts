import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function generatePostSummary(title: string, body: string): Promise<string> {
  try {
    const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const truncatedBody = cleanBody.length > 3000 ? cleanBody.substring(0, 3000) + '...' : cleanBody;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a blog summarization assistant. Read the following blog post and generate a concise, engaging summary of approximately 200 words. Write only the summary text, no headers or labels.

Title: ${title}
Content: ${truncatedBody}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fallback: first 200 words
    const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanBody.split(' ').slice(0, 200).join(' ');
    return words + (cleanBody.split(' ').length > 200 ? '...' : '');
  }
}
