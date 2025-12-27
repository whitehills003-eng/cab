
import { GoogleGenAI, Type } from "@google/genai";

// Using a lazy initialization to prevent top-level ReferenceErrors on process in the browser
const getAI = () => {
  const env = (globalThis as any).process?.env || {};
  const apiKey = env.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const verifyDriverDocument = async (license: string, bio: string, vehicle: string, documents?: any) => {
  try {
    const ai = getAI();
    const docSummary = documents ? Object.entries(documents).map(([k, v]) => `${k}: ${v}`).join(', ') : 'No additional docs provided';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following driver application for a taxi service. 
      Name/Bio: ${bio}
      License Number: ${license}
      Vehicle: ${vehicle}
      Submitted Documents Status: ${docSummary}
      
      Assess the professionalism and potential risks. Provide a JSON response with 'rating' (1-100), 'recommendation' (APPROVE, REJECT, or MANUAL_REVIEW), and a 'summary' explaining why. Focus on consistency between vehicle info and license logic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.NUMBER },
            recommendation: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["rating", "recommendation", "summary"]
        }
      }
    });

    return JSON.parse(response.text ?? "{}");
  } catch (error) {
    console.error("AI Verification failed:", error);
    return { rating: 0, recommendation: "MANUAL_REVIEW", summary: "AI Verification service unavailable." };
  }
};

export const dispatchOTP = async (name: string, target: string, code: string, type: 'email' | 'phone') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, professional ${type === 'email' ? 'email body' : 'SMS message'} for a taxi app called "InRide".
      Recipient Name: ${name}
      Recipient ${type}: ${target}
      Verification Code: ${code}
      
      The message should be concise and clearly state that this code is for account verification. Do not include subject lines if it's an SMS.`,
    });
    return {
      success: true,
      message: response.text ?? `Your InRide code is ${code}`,
      target
    };
  } catch (error) {
    return {
      success: true,
      message: `Your InRide verification code is ${code}. Do not share this with anyone.`,
      target
    };
  }
};

export const estimateFareReasoning = async (pickup: string, destination: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a realistic fare estimate for a taxi ride from ${pickup} to ${destination} in a typical metropolitan area. Explain factors like distance, potential traffic, and time of day. Keep it concise.`,
    });
    return response.text ?? "Fare calculation unavailable.";
  } catch (error) {
    return "Unable to calculate detailed fare reasoning at this moment.";
  }
};

export const resolveLocation = async (query: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a geocoding service. Convert the user's location query into specific coordinates and a professional address.
      Query: "${query}"
      
      Return a JSON object with:
      - address: (string) A clean, professional address name
      - lat: (number) A latitude around 40.7 to 40.8 (NYC simulation)
      - lng: (number) A longitude around -74.0 to -73.9 (NYC simulation)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            address: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["address", "lat", "lng"]
        }
      }
    });

    return JSON.parse(response.text ?? "{}");
  } catch (error) {
    console.error("AI Geocoding failed:", error);
    return null;
  }
};

export const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify the address, city, and country for these coordinates.
      Lat: ${lat}, Lng: ${lng}
      
      Return a JSON object with:
      - address: (string) A realistic landmark or street address.
      - city: (string) The name of the city.
      - country: (string) The name of the country.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            address: { type: Type.STRING },
            city: { type: Type.STRING },
            country: { type: Type.STRING }
          },
          required: ["address", "city", "country"]
        }
      }
    });
    return JSON.parse(response.text ?? "{}");
  } catch (error) {
    return {
      address: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: "Unknown",
      country: "Unknown"
    };
  }
};

export const searchLocations = async (query: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 5 realistic location suggestions for a taxi app in a big city based on this partial query: "${query}"
      
      Return a JSON array of objects with:
      - title: (string) Name of the place
      - subtitle: (string) Area/Neighborhood
      - lat: (number)
      - lng: (number)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ["title", "subtitle", "lat", "lng"]
          }
        }
      }
    });
    return JSON.parse(response.text ?? "[]");
  } catch (error) {
    return [];
  }
};
