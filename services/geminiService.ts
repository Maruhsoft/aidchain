import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for the audit response
const auditSchema = {
  type: Type.OBJECT,
  properties: {
    trustScore: {
      type: Type.INTEGER,
      description: "A score from 0 to 100 indicating the trustworthiness of the campaign.",
    },
    riskAnalysis: {
      type: Type.STRING,
      description: "A brief analysis of potential risks or confirmation of validity based on the description.",
    },
    verificationSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Recommended steps for on-ground verification.",
    }
  },
  required: ["trustScore", "riskAnalysis", "verificationSteps"],
};

export const auditCampaign = async (campaignTitle: string, description: string, location: string): Promise<{ trustScore: number; riskAnalysis: string; verificationSteps: string[] } | null> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return {
      trustScore: 85,
      riskAnalysis: "Mock analysis: API Key missing. Campaign looks standard for aid distribution.",
      verificationSteps: ["Verify NGO registration", "Check local vendor contracts"]
    };
  }

  try {
    const prompt = `
      Act as an expert auditor for humanitarian aid campaigns on the Cardano blockchain. 
      Analyze the following campaign for potential fraud risks, logistical feasibility, and impact.
      
      Campaign Title: ${campaignTitle}
      Location: ${location}
      Description: ${description}
      
      Provide a trust score (0-100), a risk analysis summary, and 3 key verification steps an auditor should take before funds are released from the smart contract.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: auditSchema,
        temperature: 0.2, // Low temperature for more analytical/conservative results
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);

  } catch (error) {
    console.error("Error auditing campaign with Gemini:", error);
    return null;
  }
};
