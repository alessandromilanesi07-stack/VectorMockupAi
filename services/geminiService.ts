// FIX: Add Type to imports for JSON schema functionality.
import { GoogleGenAI, Modality, Type } from "@google/genai";
// FIX: Import all necessary types.
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

const viewPrompts: Record<MockupView, string> = {
    frontal: 'front-facing view',
    retro: 'rear view, showing the back',
    lato_sx: 'left side view, profile',
    lato_dx: 'right side view, profile'
};

export const generateMockupViews = async (basePrompt: string, category: MockupProduct['category']): Promise<Record<MockupView, string>> => {
    const views: MockupView[] = ['frontal', 'retro', 'lato_sx', 'lato_dx'];
    
    const generationPromises = views.map(async (view) => {
        let fullPrompt = `Generate a technical flat vector illustration for a clothing tech pack. The specific view to generate is the **${viewPrompts[view]}**. The product is a ${basePrompt}.

**CRITICAL RULES FOR CONSISTENCY AND STYLE:**
1.  This is one of four views (front, back, left side, right side) of the **exact same garment**. All views MUST have identical proportions, dimensions, and style details. The garment's scale and size must not change between views.
2.  The style must be a clean, flat vector illustration with a crisp black outline on all edges and seams. It should look like a technical drawing, not a photograph.
3.  Include basic seam lines (e.g., on the collar, hem, sleeves) but avoid any photorealistic shading, shadows, or complex fabric textures.
4.  The garment must be perfectly centered, clean, and wrinkle-free on a solid, neutral gray background (#cccccc).`;
        
        const topsCategories: MockupProduct['category'][] = ['Tops', 'Felpe', 'Outerwear'];
        if (topsCategories.includes(category)) {
            fullPrompt += `
5. **Sleeve Position:** The sleeves must be perfectly straight and spread out wide to the sides, creating a T-shape, to allow for easy application of graphics.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
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

    const results = await Promise.all(generationPromises);
    
    const finalViews: Record<MockupView, string> = {
        frontal: results[0],
        retro: results[1],
        lato_sx: results[2],
        lato_dx: results[3],
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
    const fullPrompt = `A clean, modern, vector logo of a ${prompt}. The design must be simple, bold, and easily scalable. Crucially, the background MUST be transparent.`;
    
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

// FIX: Implement and export all missing functions and types.

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
    throw new Error("Failed to generate mockup from sketch.");
};

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
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
    throw new Error("Failed to edit image.");
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            aspectRatio,
            outputMimeType: 'image/png',
        },
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateCodeForImage = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
    const userPrompt = `Based on the following user prompt and image, generate the corresponding HTML and CSS code. 
    User prompt: "${prompt}"
    
    Provide only the code, enclosed in a single markdown block.
    `;
    const textPart = { text: userPrompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
    });
    
    // Extract code from markdown block
    const codeBlockRegex = /```(html|css|javascript)?\n([\s\S]*?)```/g;
    const matches = [...response.text.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
        return matches.map(match => match[2]).join('\n\n');
    }
    return response.text;
};

export const generateWithThinking = async (content: MultimodalContent): Promise<string> => {
    const parts = await Promise.all(content.map(item => {
        if (typeof item === 'string') {
            return { text: item };
        }
        return fileToGenerativePart(item);
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
        config: {
            thinkingConfig: { thinkingBudget: 8192 }, // Use thinking for complex queries
        }
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
    const prompt = `As an expert trend forecaster, analyze real-time data for the topic: "${topic}".
    Provide a detailed report covering:
    1.  **Key Themes & Aesthetics:** What are the dominant visual and conceptual trends?
    2.  **Color Palettes:** Identify 3-5 key colors with hex codes.
    3.  **Key Garments & Silhouettes:** What specific apparel items are trending?
    4.  **Overall Summary:** A brief conclusion of the findings.
    
    Format the output in clean, readable markdown.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
        },
    });

    return response.text;
};

export const generateMarketingCopy = async (imageFile: File, productName: string, toneOfVoice: string): Promise<MarketingCopy> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `Analyze the product image. Generate marketing copy for a product named "${productName}". The brand's tone of voice is: "${toneOfVoice}". 
    Provide the following fields in your JSON response: productDescription, instagramCaption, and emailSubject.`;

    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productDescription: { type: Type.STRING },
                    instagramCaption: { type: Type.STRING },
                    emailSubject: { type: Type.STRING },
                },
                required: ['productDescription', 'instagramCaption', 'emailSubject'],
            },
        },
    });

    return JSON.parse(response.text);
};

const brandKitSchema = {
    type: Type.OBJECT,
    properties: {
        colors: {
            type: Type.OBJECT,
            properties: {
                primary: { type: Type.STRING, description: 'Primary brand color hex code (e.g., #FFFFFF).' },
                secondary: { type: Type.STRING, description: 'Secondary brand color hex code.' },
                accent: { type: Type.STRING, description: 'Accent brand color hex code.' },
                neutral: { type: Type.STRING, description: 'Neutral/background brand color hex code.' },
            },
        },
        fonts: {
            type: Type.OBJECT,
            properties: {
                heading: { type: Type.STRING, description: 'Name of the primary heading font.' },
                body: { type: Type.STRING, description: 'Name of the primary body text font.' },
            },
        },
        logoDescription: { type: Type.STRING, description: 'A brief, one-sentence description of the logo\'s style.' },
        toneOfVoice: { type: Type.STRING, description: '3-5 keywords describing the brand\'s tone of voice (e.g., "minimal, luxurious, modern").' },
    },
};

export const extractBrandKit = async (url: string): Promise<BrandKitData> => {
    const prompt = `Analyze the content of the website at ${url}. Extract the brand kit information.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: brandKitSchema,
        },
    });

    return JSON.parse(response.text);
};

export const extractBrandKitFromImage = async (imageFile: File): Promise<BrandKitData> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `Analyze this logo image and extract the brand kit information.`;
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: brandKitSchema,
        },
    });

    return JSON.parse(response.text);
};