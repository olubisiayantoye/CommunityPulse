import axios from 'axios';

const HF_API_URL = 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english';
const HF_TOKEN = process.env.HF_API_TOKEN;

/**
 * Analyze sentiment using Hugging Face API
 * @param {string} text - Message to analyze
 * @returns {Promise<{score: number, label: string}>}
 */
export async function analyzeSentiment(text) {
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: text.substring(0, 512) },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    const result = response.data?.[0];
    if (!result?.label || typeof result.score !== 'number') {
      throw new Error('Invalid AI response');
    }

    const label = result.label === 'POSITIVE' ? 'Positive' : 'Negative';
    const score = result.label === 'POSITIVE' ? result.score : (1 - result.score);
    
    // Categorize with thresholds
    let sentimentLabel;
    if (score > 0.7) sentimentLabel = 'Positive';
    else if (score < 0.3) sentimentLabel = 'Negative';
    else sentimentLabel = 'Neutral';

    return { score, label: sentimentLabel };
  } catch (error) {
    console.error('Sentiment analysis failed:', error.message);
    // Fallback to neutral on error
    return { score: 0.5, label: 'Neutral' };
  }
}