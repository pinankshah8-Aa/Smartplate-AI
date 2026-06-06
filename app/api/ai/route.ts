import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, query } = body;

    // Helper to generate mock fallback responses
    const getMockResponse = (act: string, q?: string) => {
      if (act === 'get_insights') {
        return {
          predictedPortions: 46,
          estimatedWasteKg: 3.8,
          costSavingsINR: 1240,
          wasteReductionPercent: 62.5,
          menuSuggestions: [
            "Prepare 45-47 servings instead of 55 based on Friday attendance trends (53 attending today, but average is lower).",
            "Serve Chicken Biryani with smaller rice mounds first, offering seconds on demand; rice accounts for 75% of wastage.",
            "Substitute heavy Friday desserts with light raita to decrease total plate leftovers."
          ],
          generalInsight: "Optimized preparation today. Student sentiment is positive (+78%), but starch wastage remains the primary source of food volume loss. Reducing rice batch size by 15% is recommended."
        };
      } else if (act === 'what_if') {
        const lowerQ = q?.toLowerCase() || '';
        if (lowerQ.includes('rice') || lowerQ.includes('brown')) {
          return {
            wasteImpactKg: -1.5,
            costImpactINR: 450,
            adjustmentSuggestion: "Replace white rice with high-fiber brown rice or offer smaller basmati portions.",
            scenarioSummary: "Switching to brown rice typically reduces individual plate portion consumption by 15% due to higher satiety index, reducing overall plate waste."
          };
        }
        if (lowerQ.includes('attend') || lowerQ.includes('drop') || lowerQ.includes('students')) {
          return {
            wasteImpactKg: -6.2,
            costImpactINR: 1800,
            adjustmentSuggestion: "Scale down raw procurement batches for the next 48 hours immediately.",
            scenarioSummary: "A drop of 10-15 students shifts the cooking requirements to the minimum batch threshold, saving substantial raw material and utility costs."
          };
        }
        return {
          wasteImpactKg: -0.8,
          costImpactINR: 320,
          adjustmentSuggestion: "Adjust prep levels by -5% and monitor initial student attendance within first 30 mins.",
          scenarioSummary: `Evaluating: "${q}". AI indicates this change will optimize portion delivery, saving about 0.8kg of plate wastage and ₹320 in food cost.`
        };
      }
      return null;
    };

    // If API key is not present, return mock data
    if (!genAI) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Falling back to high-fidelity mock AI responses.");
      const mockData = getMockResponse(action, query);
      if (mockData) {
        // Add a delay to simulate real API call
        await new Promise(resolve => setTimeout(resolve, 800));
        return NextResponse.json({ ...mockData, isMock: true });
      }
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    if (action === 'get_insights') {
      const prompt = `
        You are an AI food optimization consultant for a college PG mess (hostel mess) called "SmartPlate AI".
        There are 55 total students in the PG.
        Today's menu is: Chicken Biryani / Paneer Biryani.
        Today's expected attendance is: 48 out of 55 students.
        Historical data shows that on Fridays, average attendance is high (53/55) but food waste is usually around 4.1kg.
        
        Analyze the setup and generate:
        1. predictedPortions: The optimized food portions to cook (number).
        2. estimatedWasteKg: Expected food waste in kg (number) if this optimization is implemented.
        3. costSavingsINR: Projected savings in Indian Rupees (number).
        4. wasteReductionPercent: The percentage reduction in waste compared to a standard 55-portion preparation (number).
        5. menuSuggestions: List of 3 actionable, bulleted menu suggestions or operational changes to reduce waste (string[]).
        6. generalInsight: A short 2-3 sentence overview of the current status (string).

        Respond with ONLY a JSON object that matches this schema:
        {
          "predictedPortions": number,
          "estimatedWasteKg": number,
          "costSavingsINR": number,
          "wasteReductionPercent": number,
          "menuSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
          "generalInsight": "string"
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json(JSON.parse(text));

    } else if (action === 'what_if') {
      if (!query) {
        return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }

      const prompt = `
        You are an AI food optimization consultant for a college PG mess called "SmartPlate AI".
        Evaluate the following hypothetical operational change or student scenario: "${query}".
        
        Generate a projection of the impact:
        1. wasteImpactKg: The estimated change in waste in kg (positive for increase, negative for decrease).
        2. costImpactINR: The estimated financial impact in Indian Rupees (positive for savings, negative for increased cost).
        3. adjustmentSuggestion: A clear actionable guideline for the mess staff (string).
        4. scenarioSummary: A 2-sentence explanation of why the AI projects this outcome (string).

        Respond with ONLY a JSON object matching this schema:
        {
          "wasteImpactKg": number,
          "costImpactINR": number,
          "adjustmentSuggestion": "string",
          "scenarioSummary": "string"
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json(JSON.parse(text));
    }

    return NextResponse.json({ error: "Action not supported" }, { status: 400 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Gemini API Error: ", error);
    return NextResponse.json({ 
      error: "Failed to generate AI insights. Check API keys and network connectivity.", 
      details: error.message 
    }, { status: 500 });
  }
}
