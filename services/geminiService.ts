import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GroundingChunk, BrandKitData, MarketingCopy } from '../types';
import { FEATURE_DESCRIPTIONS } from './featureDescriptions';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string"));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const applyVectorToMockup = async (
    mockupImage: File, 
    designImage: File | null, 
    applicationType: 'Print' | 'Embroidery' = 'Print',
    customInstruction?: string
): Promise<string> => {
    const mockupPart = await fileToGenerativePart(mockupImage);
    const parts: (typeof mockupPart | { text: string })[] = [mockupPart];
    
    if (designImage) {
        const designPart = await fileToGenerativePart(designImage);
        parts.push(designPart);
    }

    let applicationInstruction = "Apply the design flat onto the print area as a high-quality DTG (Direct-to-Garment) print.";
    if (applicationType === 'Embroidery') {
        applicationInstruction = "Apply the design to the mockup, simulating a realistic, high-quality embroidery texture with visible stitching and slight elevation.";
    }
    
    // Custom instruction overrides default behavior
    if (customInstruction) {
        applicationInstruction = customInstruction;
    }

    const prompt = `You are an expert at applying graphics to apparel mockups. You will receive a blank mockup image and a user's design graphic.
    Your task is to apply the user's design onto the designated print area of the mockup, following a specific creative instruction.

    **Creative Instruction:** "${applicationInstruction}"

    **Key Rules:**
    1.  **Placement:** Position the design on the main print area (e.g., center chest) unless the instruction specifies a different location.
    2.  **Style Consistency:** The final image must maintain the exact same clean, flat, vector-illustration style of the input mockup. DO NOT add photorealistic lighting, shadows, or textures to the garment itself. The only texture should be on the applied design as specified by the creative application.
    3.  **Preservation:** Perfectly preserve the original mockup's color, shape, and background. Only add the user's design.
    4.  **Final Output:** The result must be a high-quality image that looks like a professional, production-ready vector mockup with the design applied. Avoid any photographic elements.`;

    parts.push({text: prompt});

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
    }

    throw new Error("No image was generated. Please try again.");
};

export const editImage = async (image: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(image);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
    }
    throw new Error("Could not edit image. Please try again.");
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio,
            outputMimeType: 'image/png',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    }
    throw new Error("Image generation failed. Please try again.");
};

const buildSystemInstruction = (): string => {
    const intro = `You are an expert assistant integrated into the 'VectorCraft AI' application. Your purpose is to help users with complex tasks by leveraging the full power of the application's features. You must provide detailed, actionable advice that incorporates the application's tools.

Here is a summary of the VectorCraft AI tool suite:`;

    const featuresList = FEATURE_DESCRIPTIONS.map((feature, index) => {
        let featureText = `${index + 1}. **${feature.name}**: ${feature.description}`;
        if (feature.subFeatures && feature.subFeatures.length > 0) {
            const subFeaturesList = feature.subFeatures.map(sub => `    *   **${sub.name}**: ${sub.description}`).join('\n');
            featureText += `\n${subFeaturesList}`;
        }
        return featureText;
    }).join('\n\n');

    const outro = `Your role in "Thinking Mode" is to synthesize information and provide complex responses that guide the user on how to use these tools effectively.

**Example User Query**: "Develop a comprehensive business plan for a new sustainable clothing brand."

**Your Ideal Response should be structured like this**:
"Of course. Here is a comprehensive business plan. Let's use VectorCraft AI to make it actionable.
**1. Executive Summary**: ...
**2. Market Analysis**:
   *   **Competitor Research**: You can use the **Brand Kit Extractor** to analyze the websites of your top 3 competitors (e.g., Patagonia, Allbirds). This will give you immediate insights into their branding, color schemes, and visual identity. You can then save this to your **Brand Hub** for later use.
   *   **Trend Analysis**: Before designing, use the **AI Trend Forecaster** to analyze 'sustainable fashion trends for 2025'. This will give you insights into trending colors and materials.
**3. Products & Services**:
   *   **Product Visualization**: Once you have your initial designs, use the **Sketch to Mockup** tool to turn your drawings into clean technical flats. Then, take those designs into the **Mockup Studio**. Generate mockups for your core products (e.g., organic cotton T-shirts) in earthy tones using the 'Minimalist' style. This will create your product catalog before you've spent anything on manufacturing. After you have a design you like, use the **AI Design Variations** tool to explore alternatives instantly. Once finalized, click **Generate Tech Pack** to create a spec sheet to send to your manufacturer.
**4. Marketing & Sales Strategy**:
   *   **Content Creation**: Use the **Image Generator** to create stunning lifestyle images. Then, take those mockups to the **AI Brand Copywriter** to generate product descriptions and social media captions with a 'conscious and inspiring' tone of voice. Finally, use the **Social Post Composer** (in the Image Editor) to create ready-to-publish assets for your campaign.
...and so on."

Always be helpful, detailed, and focus on integrating the app's features into your advice.`;

    return `${intro}\n\n${featuresList}\n\n${outro}`;
};


export const generateWithThinking = async (prompt: string): Promise<string> => {
    const systemInstruction = buildSystemInstruction();

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    return response.text;
};

export const searchWithGrounding = async (prompt: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources: sources as GroundingChunk[] };
};

export const sketchToMockup = async (sketchImage: File, prompt: string): Promise<string> => {
    const sketchPart = await fileToGenerativePart(sketchImage);
    const textPart = { text: `Transform the provided user's sketch into a clean, vector-style mockup or technical drawing.
    
    User's creative direction: "${prompt}"
    
    Instructions:
    1.  Analyze the subject in the user's uploaded sketch (e.g., clothing, product, UI).
    2.  **Crucially, interpret the visual information from the sketch.** If the sketch includes colors, apply those colors to the final mockup. If it suggests a texture (like denim or plaid), recreate that texture in a clean, vector style.
    3.  Recreate the subject in a flat, vector illustration style using clean lines and appropriate shading.
    4.  Remove any distracting backgrounds or photographic textures from the original sketch, unless they are part of the design itself.
    5.  The final output should be a high-quality, production-ready mockup image against a neutral, solid light gray background.
    6.  The user's creative direction should override any interpretation from the sketch if there is a conflict.
    7.  The output should be only the final mockup image, with no additional text or annotations.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [sketchPart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
    }

    throw new Error("No image was generated from the sketch. Please try again.");
};

export const extractBrandKitFromImage = async (imageFile: File): Promise<BrandKitData> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = {
        text: `Analyze the provided logo image and extract its brand identity. 
        
        Instructions:
        1.  Identify the primary, secondary, accent, and neutral colors from the logo and provide them as hex color codes. The primary color should be the most dominant one.
        2.  Identify the main font family used in the logo. If only one font is present, use it for both 'heading' and 'body'. If no text is present, return "Not applicable" for both.
        3.  Provide a brief, textual description of the logo's appearance (shapes, colors, style).
        4.  Briefly describe the brand's likely tone of voice based on the logo's design (e.g., 'playful', 'corporate', 'minimalist').
        5.  Respond ONLY with a valid JSON object based on the schema.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    colors: {
                        type: Type.OBJECT,
                        properties: {
                            primary: { type: Type.STRING, description: "The primary color of the brand, as a hex code." },
                            secondary: { type: Type.STRING, description: "The secondary color of the brand, as a hex code." },
                            accent: { type: Type.STRING, description: "The accent color of the brand, as a hex code." },
                            neutral: { type: Type.STRING, description: "The neutral color of the brand, as a hex code." },
                        },
                        required: ['primary', 'secondary', 'accent', 'neutral'],
                    },
                    fonts: {
                        type: Type.OBJECT,
                        properties: {
                            heading: { type: Type.STRING, description: "The font used for headings. Use the main logo font here." },
                            body: { type: Type.STRING, description: "The font used for body text. Use the main logo font here if only one is present." },
                        },
                         required: ['heading', 'body'],
                    },
                    logoDescription: { type: Type.STRING, description: "A description of the logo's appearance." },
                    toneOfVoice: { type: Type.STRING, description: "The brand's likely tone of voice based on the logo's design."}
                },
                required: ['colors', 'fonts', 'logoDescription', 'toneOfVoice'],
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as BrandKitData;
};

export const extractBrandKit = async (url: string): Promise<BrandKitData> => {
    const prompt = `Analyze the website at the URL ${url} and extract its brand identity. Respond ONLY with a valid JSON object that follows this structure: { "colors": { "primary": "string", "secondary": "string", "accent": "string", "neutral": "string" }, "fonts": { "heading": "string", "body": "string" }, "logoDescription": "string", "toneOfVoice": "string" }.
    
    Instructions:
    1.  Identify the primary, secondary, accent, and neutral colors and provide them as hex color codes.
    2.  Identify the main font families used for headings and body text.
    3.  Provide a brief, textual description of the company logo's appearance (shapes, colors, style).
    4.  Analyze the website's language and describe its tone of voice (e.g., 'professional', 'playful', 'technical').
    5.  Do not include any text, markdown formatting, or explanations outside of the JSON object.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const jsonText = response.text
        .trim()
        .replace(/^```json\s*/, '')
        .replace(/```\s*$/, '');
        
    return JSON.parse(jsonText) as BrandKitData;
};

export const generateCodeForImage = async (prompt: string, imageBase64: string, imageMimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: imageMimeType,
        },
    };
    const textPart = { text: `Based on the original prompt "${prompt}" and the provided UI image, generate the HTML and CSS code to build this component. The code should be self-contained in a single block, with CSS inside a <style> tag. The response should only contain the code, formatted inside a single markdown code block.` };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [textPart, imagePart] },
    });

    return response.text.replace(/```(html)?/g, '').trim();
};

export const generateConsistentMockup = async (
  prompt: string,
  referenceImageBase64?: string
): Promise<string> => {
  const textPart = { text: prompt };
  const parts: ({text: string} | {inlineData: {data: string, mimeType:string}})[] = [textPart];

  if (referenceImageBase64) {
    const match = referenceImageBase64.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid reference image base64 string.");
    }
    const mimeType = match[1];
    const base64Data = match[2];
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
    parts.unshift(imagePart); // Prepend image for context
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const firstPart = response.candidates?.[0]?.content?.parts?.[0];
  if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
    return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
  }

  throw new Error("No image was generated. Please try again.");
};

export const generateDesignVariations = async (mockupFile: File, designFile: File): Promise<string[]> => {
    const variationInstructions = [
        "Make the design's color palette monochrome, using only shades of black, white, and grey.",
        "Reduce the design's size by 50% and place it on the left chest (wearer's heart side).",
        "Apply a subtle vintage, cracked-print effect to the design to make it look slightly worn-in.",
    ];

    const variationPromises = variationInstructions.map(instruction => {
        return applyVectorToMockup(mockupFile, designFile, 'Print', instruction);
    });

    return Promise.all(variationPromises);
};

export const generateTrendReport = async (topic: string): Promise<string> => {
    const prompt = `
You are a highly skilled fashion market analyst and trend forecaster. Your task is to generate a detailed and actionable trend report based on a user's query.
You must use your access to Google Search to find the most current and relevant information from social media (TikTok, Instagram), fashion blogs, e-commerce sites, and runway reports.

**User's Topic:** "${topic}"

**Report Structure:**
Generate a report in Markdown format with the following sections:

### 1. Executive Summary
A brief, high-level overview of the key trends and overall market sentiment for the given topic.

### 2. Key Color Palettes
- Identify 3-5 dominant and emerging colors.
- For each color, provide its name, a hex code, and a brief description of its context or feeling (e.g., "Digital Lavender - #E6E6FA: A calming, digital-first pastel shade gaining traction on social media.").
- List them in a bulleted or numbered list.

### 3. Emerging Styles & Graphics
- Describe 2-3 key stylistic trends (e.g., "Y2K Revival," "Gorpcore," "Utility Wear").
- For each style, explain its core characteristics and visual elements.
- Describe the types of graphics, patterns, or typography associated with these styles.

### 4. Trending Garments & Silhouettes
- List 3-5 specific apparel items that are currently popular or gaining momentum (e.g., "Cargo Pants," "Oversized Blazers," "Cropped Hoodies").
- Briefly describe the popular fits or silhouettes for these items (e.g., "baggy and low-rise," "sharp and structured").

### 5. Actionable Insights & Recommendations
- Provide 2-3 concrete pieces of advice for a new fashion brand based on this analysis.
- Example: "A brand entering the streetwear market should focus on producing high-quality heavyweight hoodies in earthy tones like olive green and taupe, featuring minimalist, embroidered logos."

Ensure the information is as current as possible, referencing recent events, seasons (e.g., SS25, FW24), or social media trends where applicable.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return response.text;
};

export const generateMarketingCopy = async (
    productImage: File,
    productName: string,
    toneOfVoice: string
): Promise<MarketingCopy> => {
    const imagePart = await fileToGenerativePart(productImage);
    const textPart = {
        text: `
You are an expert brand copywriter for fashion and e-commerce. Your task is to generate compelling marketing copy for a new product.
You will be given a product image, the product's name, and the desired tone of voice for the brand.

**Product Name:** "${productName}"
**Brand Tone of Voice:** "${toneOfVoice}"

Based on the provided image and information, generate the following pieces of copy.
Respond ONLY with a valid JSON object. Do not include any text, markdown formatting, or explanations outside of the JSON object.
`};
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productDescription: {
                        type: Type.STRING,
                        description: "A compelling, 2-3 sentence e-commerce product description highlighting key features and benefits, written in the brand's tone of voice.",
                    },
                    instagramCaption: {
                        type: Type.STRING,
                        description: "A short, engaging Instagram caption. Include a call-to-action and 3-5 relevant hashtags.",
                    },
                    emailSubject: {
                        type: Type.STRING,
                        description: "A catchy and intriguing subject line for a marketing email announcing the new product.",
                    },
                },
                required: ["productDescription", "instagramCaption", "emailSubject"],
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as MarketingCopy;
};