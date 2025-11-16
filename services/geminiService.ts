import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ApplicationType, BrandKitData, GroundingChunk, MarketingCopy, MockupProduct, MockupView } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    // SECURITY & PERFORMANCE WARNING: This client-side processing is not suitable for production.
    // Large files can crash the browser. In a real application, this should be replaced
    // with a secure backend endpoint that generates a signed URL for cloud storage upload.
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

const base64ToGenerativePart = (base64Data: string) => {
    const match = base64Data.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        // Fallback for non-data-URL base64 strings, assuming png
        return {
            inlineData: {
                data: base64Data,
                mimeType: 'image/png',
            },
        };
    }
    const mimeType = match[1];
    const data = match[2];
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};


const viewPrompts: Record<MockupView, string> = {
    frontal: 'front-facing view',
    retro: 'rear view, showing the back of the garment',
};

export const generateMockupViews = async (basePrompt: string, category: MockupProduct['category']): Promise<Record<MockupView, string>> => {
    // 1. Generate the front view first to use as a reference.
    const frontalPrompt = `Generate a technical flat vector illustration for a clothing tech pack. The specific view to generate is the **front-facing view**. The product is a ${basePrompt}.

**CRITICAL RULES FOR STYLE:**
1.  The style must be a clean, flat vector illustration with a crisp black outline on all edges and seams. It should look like a technical drawing, not a photograph.
2.  Include basic seam lines (e.g., on the collar, hem, sleeves) but avoid any photorealistic shading, shadows, or complex fabric textures.
3.  The garment must be perfectly centered, clean, and wrinkle-free on a solid, neutral gray background (#cccccc).
4.  **Sleeve Position:** If the garment has sleeves, they must be perfectly straight and spread out wide to the sides, creating a T-shape. If it is sleeveless, do not add sleeves.`;

    const frontalResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: frontalPrompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
            temperature: 0.1,
        },
    });

    const frontalPart = frontalResponse.candidates?.[0]?.content?.parts?.[0];
    if (!frontalPart || !('inlineData' in frontalPart) || !frontalPart.inlineData) {
        throw new Error(`Failed to generate the frontal mockup from the prompt.`);
    }
    
    const frontalImageBase64 = `data:${frontalPart.inlineData.mimeType};base64,${frontalPart.inlineData.data}`;
    const referenceImagePart = base64ToGenerativePart(frontalImageBase64);

    // 2. Generate the other views using the front view as a reference.
    const otherViews: MockupView[] = ['retro'];
    
    const generationPromises = otherViews.map(async (view) => {
        let viewSpecificPrompt = `You will be given a reference image of the **front view** of a garment. Your task is to generate another technical flat vector illustration for the same garment, but for a different view: the **${viewPrompts[view]}**.

**CRITICAL RULES FOR CONSISTENCY AND STYLE:**
1.  **ABSOLUTE DIMENSIONAL ACCURACY:** This is the most important rule. The generated view MUST be dimensionally identical to the reference image. Replicate the exact length, width, and proportions of every part of the garment (body, collar, and especially the sleeves). The overall scale and size must not change.
2.  **SLEEVELESS GARMENTS:** If the reference image shows a sleeveless garment (like a vest or tank top), the generated view MUST also be sleeveless. Do not add sleeves under any circumstances.
3.  **BACKGROUND:** The background MUST be the same solid, neutral gray (#cccccc) as the reference image.
4.  **CLEAN VECTOR STYLE:** Maintain the clean, flat vector style with crisp black outlines. No photorealistic shading or complex textures.`;

        const topsCategories: MockupProduct['category'][] = ['Tops', 'Felpe', 'Outerwear'];
        if (topsCategories.includes(category)) {
            if (view === 'retro') {
                 viewSpecificPrompt += `
5. **Sleeve Position and Length for Back View:** If the garment has sleeves, they must be perfectly straight and spread out wide to the sides, creating a T-shape. This back view must be a perfect mirror of the front view's silhouette and dimensions.`;
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [
                { text: viewSpecificPrompt },
                referenceImagePart // Provide the front view as context
            ] },
            config: {
                responseModalities: [Modality.IMAGE],
                temperature: 0.1,
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
            return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
        }
        throw new Error(`Failed to generate the ${view} mockup from the prompt.`);
    });

    const otherResults = await Promise.all(generationPromises);
    
    const finalViews: Record<MockupView, string> = {
        frontal: frontalImageBase64,
        retro: otherResults[0],
    };

    return finalViews;
};

export const generateDesignPrompt = async (productName: string): Promise<string> => {
    const prompt = `You are a creative director for a modern streetwear brand. Generate a short, creative prompt for a vector graphic to be printed on a "${productName}".
    The style must be modern, trendy, and suitable for a vector logo. It should be simple, bold, and easily scalable.
    The output should be on a transparent background.
    Example Prompts:
    - a minimalist roaring tiger logo, line art style
    - a stylized phoenix rising from ashes, geometric vector art
    - a simple wave icon in a circle, Japanese art style
    - a retro-inspired astronaut helmet with a floral pattern
    
    Provide ONLY the prompt text itself, with no introductory phrases like "Here is a prompt:".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.9,
        }
    });

    return response.text.trim();
};

export const generateVectorGraphic = async (prompt: string): Promise<string> => {
    const fullPrompt = `Create a vector graphic logo based on the theme: "${prompt}".

**ABSOLUTE NON-NEGOTIABLE RULES:**
1.  **OUTPUT FORMAT:** The output must be a single, isolated graphic object on a **completely transparent background**.
2.  **STYLE:** The style must be a clean, flat, 2D vector illustration. Think modern logo, not a picture. Use solid colors and bold lines.
3.  **NO REALISM:** Do **NOT** generate photographs, realistic images, 3D renders, or anything that looks like a photo.
4.  **NO BACKGROUNDS:** Do **NOT** include any backgrounds, scenes, environments, textures, or colors behind the main graphic object. The background must be transparent.
5.  **NO HUMANS OR TEXT:** Do **NOT** include any people, human figures, text, letters, or numbers unless the original prompt explicitly asks for them.
6.  **SIMPLE & BOLD:** The final graphic must be simple, bold, and easily recognizable, suitable for printing on apparel.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });

    if (response.generatedImages.length > 0) {
        return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    throw new Error("Failed to generate a vector graphic from the prompt.");
};


export const validateMockupOutput = async (generatedImageBase64: string): Promise<boolean> => {
    const data = generatedImageBase64.split(',')[1];
    const mimeType = generatedImageBase64.match(/:(.*?);/)?.[1] || 'image/png';
    
    const imagePart = {
        inlineData: { data, mimeType },
    };

    const prompt = `Analyze this mockup image. Respond ONLY with 'TRUE' if the image adheres to ALL the following rules, otherwise respond 'FALSE'.
    1. The garment itself does not have photorealistic lighting, shadows, or textures. It must look like a clean vector illustration.
    2. Any applied graphic is flat or has only the specified texture (like embroidery), fitting the vector style.
    3. The overall shape, color, and background of the original blank mockup are perfectly preserved.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            temperature: 0, // for deterministic TRUE/FALSE
        }
    });

    const resultText = response.text.trim().toUpperCase();
    console.log('Validation result:', resultText);
    return resultText === 'TRUE';
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getSystemPrompt = (): string => {
    return `Sei VectorPro, un'IA specializzata nell'applicazione fotorealistica di design grafici su mockup di abbigliamento, con un focus maniacale sulla preservazione dello stile vettoriale del mockup base.

    REGOLE FONDAMENTALI (NON NEGOZIABILI):
    1.  **PRESERVAZIONE ASSOLUTA:** Il mockup di base (colore, forma, sfondo, stile di disegno) NON DEVE ESSERE ALTERATO. Applica solo il design. Non aggiungere ombre, luci, o texture al capo d'abbigliamento stesso.
    2.  **STILE VETTORIALE:** L'output finale DEVE mantenere l'aspetto di un'illustrazione vettoriale pulita. Nessun elemento fotografico.
    3.  **OUTPUT DIRETTO:** Rispondi SOLO con l'immagine finale. Nessun testo, nessuna spiegazione.`;
};

const getUserPrompt = (applicationType: ApplicationType, placement: string): string => {
    if (applicationType === 'Embroidery') {
        return `Applica il design fornito sul mockup di felpa.
    Simula un RICAMO (embroidery) fotorealistico e dettagliato.
    Crea una texture visibile con fili (thread texture), un leggero rilievo tridimensionale (slight 3D elevation), e un effetto lucido (satin stitch sheen) dove la luce colpirebbe i fili.
    Mantieni i bordi del ricamo netti e definiti.
    Posizionalo accuratamente in questa area: ${placement}.`;
    }
    // Default to 'Print'
    return `Applica il design fornito sul mockup di t-shirt.
    Simula una stampa DTG (Direct-to-Garment) di altissima qualità.
    Il design deve apparire piatto, con colori vividi e integrato nel tessuto, rispettando le lievi pieghe del capo.
    Posizionalo accuratamente in questa area: ${placement}.`;
}


export const applyVectorToMockup = async (
    mockupImage: File, 
    designImage: File, 
    applicationType: ApplicationType,
    placement: string,
    onStatusUpdate?: (status: string) => void,
    feedback?: string
): Promise<string> => {
    const MAX_RETRIES = 2; // As per spec

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        onStatusUpdate?.(`Applying design (Attempt ${attempt}/${MAX_RETRIES + 1})...`);
    
        const mockupPart = await fileToGenerativePart(mockupImage);
        const designPart = await fileToGenerativePart(designImage);

        const systemInstruction = getSystemPrompt();
        let userInstruction = getUserPrompt(applicationType, placement);
        
        if (attempt > 1) {
            userInstruction += "\n\n**ATTENTION:** The previous attempt failed quality validation. Be extremely strict in adhering to the Key Rules. Maintain the vector style and do not alter the mockup base.";
        }
        
        if (feedback) {
            userInstruction += `\n\n**USER FEEDBACK FOR IMPROVEMENT:** The previous result was not satisfactory. Please regenerate the image, taking the following user feedback into account: "${feedback}"`;
        }

        const parts = [mockupPart, designPart, { text: userInstruction }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                systemInstruction,
                responseModalities: [Modality.IMAGE],
                temperature: applicationType === 'Embroidery' ? 0.2 : 0.1,
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
            const generatedImageBase64 = `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
            
            onStatusUpdate?.(`Validating result (Attempt ${attempt}/${MAX_RETRIES + 1})...`);
            const isValid = await validateMockupOutput(generatedImageBase64);

            if (isValid) {
                onStatusUpdate?.('Validation successful!');
                return generatedImageBase64;
            } else if (attempt <= MAX_RETRIES) {
                 onStatusUpdate?.(`Validation failed. Retrying...`);
                 await sleep(Math.pow(2, attempt) * 200); // Exponential backoff
            }
        } else {
             if (attempt <= MAX_RETRIES) {
                onStatusUpdate?.(`Image generation failed. Retrying...`);
                await sleep(Math.pow(2, attempt) * 200); // Exponential backoff
             }
        }
    }

    throw new Error("Failed to generate a valid mockup after multiple attempts. Please try a different design or adjust custom instructions.");
};


export type MultimodalContent = (string | File)[];

export const sketchToMockup = async (sketchFile: File, prompt: string): Promise<string> => {
    const sketchPart = await fileToGenerativePart(sketchFile);
    const textPart = { text: prompt };

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
    throw new Error("Failed to generate a mockup from the sketch.");
};

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
    }
    throw new Error("Failed to edit the image.");
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio as any,
        },
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateCodeForImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const promptPart = { text: `Generate clean, responsive HTML and Tailwind CSS code for this UI design: ${prompt}. Do not include any explanations, just the code.` };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [promptPart, imagePart] },
    });

    // Clean up markdown code block fences
    return response.text.replace(/```(html|css)?/g, '').trim();
};

export const generateWithThinking = async (content: MultimodalContent): Promise<string> => {
    const parts = await Promise.all(content.map(async item => {
        if (typeof item === 'string') {
            return { text: item };
        }
        return fileToGenerativePart(item);
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            systemInstruction: `You are VectorCraft AI's assistant. You have deep knowledge of all app features. Be helpful, strategic, and concise.`,
        },
    });

    return response.text;
};

export const searchWithGrounding = async (prompt: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
};

export const generateTrendReport = async (topic: string): Promise<string> => {
    const prompt = `As a senior trend forecaster for a modern apparel brand, generate a detailed report on the topic: "${topic}". Use Google Search to find the latest information.

    The report should be structured with the following sections:
    1.  **Key Themes & Concepts:** High-level overview of the main ideas.
    2.  **Color Palette:** A list of 5-7 key colors with hex codes and descriptions.
    3.  **Key Garments & Silhouettes:** Specific apparel items that are trending.
    4.  **Graphics & Prints:** The dominant styles for graphics.
    
    Format the output using clear headings and bullet points.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.5,
        },
    });
    
    return response.text;
};

export const extractBrandKit = async (url: string): Promise<BrandKitData> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the visual identity of the website at this URL: ${url}. Extract its brand kit.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    colors: {
                        type: Type.OBJECT,
                        properties: {
                            primary: { type: Type.STRING },
                            secondary: { type: Type.STRING },
                            accent: { type: Type.STRING },
                            neutral: { type: Type.STRING },
                        },
                    },
                    fonts: {
                        type: Type.OBJECT,
                        properties: {
                            heading: { type: Type.STRING },
                            body: { type: Type.STRING },
                        },
                    },
                    logoDescription: { type: Type.STRING },
                    toneOfVoice: { type: Type.STRING },
                },
            },
        },
    });

    return JSON.parse(response.text);
};

export const extractBrandKitFromImage = async (imageFile: File): Promise<BrandKitData> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [
            imagePart, 
            { text: "This image is a company logo. Analyze its visual identity and extract a brand kit based on it." }
        ]},
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    colors: {
                        type: Type.OBJECT,
                        properties: {
                            primary: { type: Type.STRING },
                            secondary: { type: Type.STRING },
                            accent: { type: Type.STRING },
                            neutral: { type: Type.STRING },
                        },
                    },
                    fonts: {
                        type: Type.OBJECT,
                        properties: {
                            heading: { type: Type.STRING },
                            body: { type: Type.STRING },
                        },
                    },
                    logoDescription: { type: Type.STRING },
                    toneOfVoice: { type: Type.STRING },
                },
            },
        },
    });
    return JSON.parse(response.text);
};

export const generateMarketingCopy = async (imageFile: File, productName: string, toneOfVoice: string): Promise<MarketingCopy> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [
            imagePart,
            { text: `Generate marketing copy for a product named "${productName}". The brand's tone of voice is "${toneOfVoice}".` }
        ]},
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productDescription: { type: Type.STRING },
                    instagramCaption: { type: Type.STRING },
                    emailSubject: { type: Type.STRING },
                },
            },
        },
    });

    return JSON.parse(response.text);
};
