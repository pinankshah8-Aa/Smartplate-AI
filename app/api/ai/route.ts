import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback Mock Logic if no API key
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          optimalPortions: Math.floor(data.stats.attending * 0.9),
          wasteAvoidedKg: data.stats.predictedWasteSavedKg,
          suggestedMenu: "Paneer Butter Masala & Naan",
          confidenceScore: 92,
          menuReason: "Fallback suggestion: 40% negative sentiment on Dal Khichdi. Paneer Butter Masala historically scores 90% positive on weekends.",
          analysis: data.whatIfQuery 
            ? `Simulated analysis for: "${data.whatIfQuery}". Attendance typically drops by 15% in this scenario.`
            : "Deterministic fallback analysis: High likelihood of waste today due to repetitive menu. Suggest changing to a student favorite."
        }
      });
    }

    // Gemini API Logic
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are SmartPlate AI, an expert college PG mess food waste intelligence engine.
Your goal is to analyze attendance stats and student sentiment to prevent food waste and suggest better menus.
CRITICAL RULE: The PG mess is STRICTLY VEGETARIAN. You must ONLY suggest pure vegetarian Indian dishes (e.g., Paneer Butter Masala, Dal Tadka, Aloo Gobi, Rajma Chawal). Absolutely NO meat, chicken, egg, or fish.

Input Data:
- Total Students: ${data.stats.total}
- Students Attending Today: ${data.stats.attending}
- Current Menu: ${data.menu}
- Sentiment: ${data.sentiment}
${data.whatIfQuery ? `- WHAT-IF SCENARIO: ${data.whatIfQuery}` : ''}

Provide a JSON output strictly in this format:
{
  "optimalPortions": number,
  "wasteAvoidedKg": number,
  "suggestedMenu": "string (Strictly Vegetarian)",
  "confidenceScore": number (1-100),
  "menuReason": "string (1-2 sentences)",
  "analysis": "string (2-3 sentences explaining your prediction)"
}
Do not include Markdown blocks (\`\`\`json). Just return the raw JSON object.`;

    const result = await model.generateContent(prompt);
    let resultText = result.response.text().trim();
    
    // Clean up markdown if model disobeys
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ success: true, data: JSON.parse(resultText) });

  } catch (error) {
    console.error('AI Insights Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate AI insights' }, { status: 500 });
  }
}
