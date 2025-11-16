import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { BaseConstruction, BrandKitData, GroundingChunk, MarketingCopy, MockupView } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Add helper function to convert File to GenerativePart for multimodal prompts.
const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

// FIX: Export MultimodalContent type.
export type MultimodalContent = (string | File)[];

// FIX: Implement and export missing service functions.
export const applyVectorToMockup = async (
    mockupImage: File,
    designImage: File,
    applicationType: string,
    placement: string,
    setStatusMessage: (message: string) => void,
    feedback?: string
): Promise<string> => {
    setStatusMessage("Preparing images for AI...");
    const mockupPart = await fileToGenerativePart(mockupImage);
    const designPart = await fileToGenerativePart(designImage);

    let prompt = `You are a professional apparel mockup generator.
    Your task is to apply the provided design onto the blank mockup image with extreme photorealism.
    - Application Type: ${applicationType}. If 'Embroidery', give the design a realistic stitched texture. If 'Print', make it look like a high-quality screen print.
    - Placement: ${placement}. Accurately place the design on this area of the garment.
    - Realism: The final image must look like a real photo. Pay attention to fabric texture, wrinkles, shadows, and lighting. The applied design must conform to the garment's shape.
    - Output: Return ONLY the final image. Do not include the original mockup or design in the output.`;
    
    if (feedback) {
        prompt += `\n\nUSER FEEDBACK FOR REVISION: "${feedback}". Please adjust the previous result based on this feedback.`;
    }

    setStatusMessage("Applying design with Gemini...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [mockupPart, designPart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    setStatusMessage("Finalizing image...");
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("AI did not return an image.");
};

export const generateMockupViews = async (prompt: string, category: string): Promise<Record<MockupView, string>> => {
    const views: MockupView[] = ['frontal', 'retro'];
    const results: Partial<Record<MockupView, string>> = {};

    for (const view of views) {
        const viewPrompt = `Photorealistic studio shot of a blank ${prompt}, ${view} view, on a solid neutral grey background. professional apparel photography, clean, no shadows, ready for mockup.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: viewPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            }
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        results[view] = `data:image/png;base64,${base64ImageBytes}`;
    }

    if (Object.keys(results).length !== views.length) {
        throw new Error("Failed to generate all required mockup views.");
    }

    return results as Record<MockupView, string>;
};

export const generateVectorGraphic = async (prompt: string): Promise<string> => {
    const fullPrompt = `Generate a clean, minimalist, single-color SVG vector graphic based on the following prompt: "${prompt}".
    The output must be a valid SVG file string. Do not include any explanation or markdown formatting like \`\`\`svg.
    The SVG should be simple, suitable for a logo or t-shirt design. Use black (#000000) for all paths and strokes. Do not use fills unless necessary for the design.
    The SVG viewBox should be "0 0 100 100".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            temperature: 0.2,
        }
    });

    const svgText = response.text.replace(/```svg/g, '').replace(/```/g, '').trim();
    if (!svgText.startsWith('<svg')) {
        throw new Error("AI did not return a valid SVG.");
    }
    return `data:image/svg+xml;base64,${btoa(svgText)}`;
};

export const generateDesignPrompt = async (productName: string): Promise<string> => {
    const prompt = `Generate a short, creative, and inspiring design prompt for a vector graphic to be placed on a "${productName}". The prompt should be suitable for a minimalist, modern apparel brand. Output only the prompt text. For example: "a minimalist geometric wolf head logo".`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text.trim();
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

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("AI did not return an edited image.");
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio as any,
        }
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateCodeForImage = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    const fullPrompt = `Based on this image of a UI, and the user prompt "${prompt}", generate the corresponding HTML with inline CSS. The output should be a single block of code. Do not include explanations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, { text: fullPrompt }] }
    });

    return response.text.replace(/```html/g, '').replace(/```/g, '').trim();
};

export const generateWithThinking = async (content: MultimodalContent): Promise<string> => {
    const parts = await Promise.all(content.map(item => typeof item === 'string' ? { text: item } : fileToGenerativePart(item)));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: parts },
        config: {
            thinkingConfig: { thinkingBudget: 8192 }
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
        }
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources: sources as GroundingChunk[] };
};

export const sketchToMockup = async (sketchFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(sketchFile);
    const fullPrompt = `Take the user-provided sketch and transform it based on this prompt: "${prompt}". The output must be a single, clean image.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("AI did not return an image from the sketch.");
};

export const generateTrendReport = async (topic: string): Promise<string> => {
    const prompt = `Act as a professional trend forecaster. Using Google Search, analyze the provided topic: "${topic}".
    Generate a concise but detailed report covering:
    1.  **Key Styles & Silhouettes:** What are the dominant shapes and garments?
    2.  **Color Palette:** What are the key colors and color combinations? Provide HEX codes.
    3.  **Key Materials & Textures:** What fabrics are trending?
    4.  **Overall Vibe:** A short paragraph summarizing the trend's aesthetic.
    Format your response in clear markdown.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    return response.text;
};

export const generateMarketingCopy = async (imageFile: File, productName: string, toneOfVoice: string): Promise<MarketingCopy> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `Analyze the product image. The product is named "${productName}". The brand's tone of voice is "${toneOfVoice}".
    Generate marketing copy in JSON format. The JSON object must have three keys: "productDescription", "instagramCaption", and "emailSubject".
    - productDescription: An engaging e-commerce description (2-3 sentences).
    - instagramCaption: A catchy caption for an Instagram post, including 3-5 relevant hashtags.
    - emailSubject: A compelling subject line for a marketing email.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: 'application/json',
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

    let jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as MarketingCopy;
};

export const extractBrandKit = async (url: string): Promise<BrandKitData> => {
    const prompt = `Analyze the website at this URL: ${url}.
    Extract its brand kit and return it as a JSON object.
    The object must have these keys: "colors" (an object with "primary", "secondary", "accent", "neutral" hex codes), "fonts" (an object with "heading" and "body" font family names), and "toneOfVoice" (a short description).`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
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
                        }
                    },
                    toneOfVoice: { type: Type.STRING }
                },
                required: ['colors', 'fonts', 'toneOfVoice']
            },
        }
    });
    
    let jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as BrandKitData;
};

export const extractBrandKitFromImage = async (imageFile: File): Promise<BrandKitData> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `This image is a company logo. Analyze it to extract its brand kit.
    Return a JSON object with: "colors" (an object with "primary", "secondary", "accent", "neutral" hex codes from the logo and its likely context), "fonts" (guess "heading" and "body" font family names based on the logo's style), "logoDescription" (a brief visual description), and "toneOfVoice" (a short description of the brand's likely personality).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: 'application/json',
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
                        }
                    },
                    logoDescription: { type: Type.STRING },
                    toneOfVoice: { type: Type.STRING }
                },
                required: ['colors', 'fonts', 'logoDescription', 'toneOfVoice']
            },
        }
    });

    let jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as BrandKitData;
};

const buildSimplifiedSketchPrompt = (base: BaseConstruction, colorHex: string, view: 'front' | 'back'): string => {
    // ROLE OBJECTIVE
    const roleAndTask = `
You are an expert AI assistant specialized as a Technical Fashion Illustrator.
Your sole purpose is to generate clean, accurate, and professional 2D flat sketches for tech packs.
Your main task is to generate ONE image per request: either a FRONT VIEW or a BACK VIEW as a 2D technical flat sketch.
    `.trim();

    // --- Section 1: Garment Description (Visual Glossary Implementation) ---
    const descriptionParts: string[] = [base.fitType];
     // Add garment type, but handle special cases like Zip Sweatshirt where collar is implicit
    if (base.garmentType !== 'Zip Sweatshirt') {
        descriptionParts.push(base.garmentType);
    }
    
    const isTop = !base.garmentType.includes('Jeans') && !['Pants', 'Skirt', 'Shorts'].some(t => base.garmentType.includes(t));

    if (isTop) {
        switch (base.sleeveType) {
            case 'Senza Maniche': descriptionParts.push('sleeveless'); break;
            case 'Standard': descriptionParts.push('with standard set-in sleeves where the seam follows the armhole'); break;
            case 'Raglan': descriptionParts.push('with raglan sleeves, featuring a diagonal seam from the collar to the underarm and no shoulder seam'); break;
            case 'Drop Shoulder': descriptionParts.push('with drop shoulder sleeves, where the shoulder seam is positioned visibly lower on the arm'); break;
            default: descriptionParts.push(`${base.sleeveType} sleeves`);
        }
        
        // Only add collar type if it's not a garment with an implicit collar style (like a hoodie or zip-up)
        const hasImplicitCollar = ['Hoodie', 'Zip Hoodie', 'Parka', 'Zip Sweatshirt'].some(t => base.garmentType.includes(t));
        if (!hasImplicitCollar) {
            descriptionParts.push(`${base.collarType} collar`);
        }
    }

    if (base.garmentType.includes('Jeans')) descriptionParts.push("5-pocket style, belt loops, zip fly seam");
    if (base.garmentType === 'Hoodie') descriptionParts.push("kangaroo pocket");
    if (base.garmentType === 'Zip Hoodie') descriptionParts.push("full front zipper, split kangaroo pocket");
    if (base.garmentType === 'Zip Sweatshirt') descriptionParts.push("A zip sweatshirt with a full front zipper and a stand-up collar");
    if (base.garmentType === 'Trench Coat') descriptionParts.push("double-breasted front, waist belt, epaulets, storm flap on back");
    if (base.garmentType === 'Blazer') descriptionParts.push("lapels and buttons");
    if (base.garmentType === 'Leather Jacket') descriptionParts.push("asymmetric biker-style lapels, zippers");
    if (base.garmentType.includes('Puffer') || base.garmentType.includes('Parka')) descriptionParts.push("quilting stitch lines");
    
    const garmentDescription = "Garment Details: " + descriptionParts.join(', ');

    // --- Section 2: View Instruction & Logical Hierarchy ---
    const logicalHierarchy = `
### Golden Rules (Logical Hierarchy)
1.  **GARMENT TYPE IS KING:** The specified garment type (e.g., 'Zip Hoodie') dictates the core design.
2.  **LOGICAL EXCLUSION:** Bottoms (like jeans) do not have sleeve or collar types. Tops do not have a fly seam.
3.  **ABSOLUTE GARMENT CONSISTENCY (CRITICAL):** The Front View and Back View must depict the **exact same physical garment**. This means all proportions (sleeve length, body width, garment length), seam placements, fabric drape, and stylistic details MUST be perfectly consistent between the two views. The back view is simply the front view flipped over, maintaining all identical characteristics.
4.  **CRITICAL RULE - ABSOLUTE FORMAT CONSISTENCY:** Both the Front View and Back View MUST be generated in the identical format: a 2D technical flat sketch. It is FORBIDDEN to generate one view as a sketch and the other as a photograph, realistic illustration, or 3D render. This is a critical failure.
    `.trim();
    
    const viewInstruction = view === 'front'
        ? 'Generate the **FRONT VIEW ONLY** of the garment.'
        : `Generate the **BACK VIEW ONLY** of the exact same garment. Adhere strictly to Golden Rule #3. The back view MUST be stylistically, proportionally, and dimensionally identical to the front view. All details like sleeve shape, hem style, and overall size must be maintained perfectly.`;

    // --- Section 3: Ultra-Strict Formatting Rules ---
    const formattingRules = `
### Ultra-Strict Output Formatting Rules (THE MOST IMPORTANT)
1.  **ABSOLUTE PROHIBITION OF PHOTOGRAPHY, REALISM, AND MODELS:**
    *   It is **ABSOLUTELY FORBIDDEN** to generate photographs, photorealistic images, or 3D renderings.
    *   It is **ABSOLUTELY FORBIDDEN** to draw, generate, or show the garment worn by a human model, person, mannequin, or 3D figure.
    *   The output must be a flat technical drawing, **NOT** an e-commerce or lookbook photo. Any output that resembles a photo is a critical failure.

2.  **2D TECHNICAL FLAT SKETCH STYLE ONLY:**
    *   The output **MUST** be a 2D technical flat sketch.
    *   Use only clean, defined **black outlines** (hex code: #000000).
    *   Use a pure **white background** (hex code: #FFFFFF).
    *   The garment itself should be filled with the solid, flat color: ${colorHex}.
    *   **NO** shadows, **NO** gradients, **NO** photorealistic textures.
    *   **SLEEVE POSTURE (CRITICAL FOR TOPS - APPLIES TO BOTH VIEWS):** For all tops (T-shirts, sweaters, hoodies, jackets, etc.), the sleeves MUST be drawn open, spread outwards, and slightly upwards in a classic 'flat lay' technical pose. The angle and position of the sleeves must be consistent between the front and back views. Do NOT draw sleeves pointing downwards or bent at the elbow.

3.  **EXACTLY ONE IMAGE, NO EXTRAS:**
    *   Generate exactly **ONE (1)** image per request.
    *   **NEVER** generate side views.
    *   **NEVER** generate collages of multiple images in a single frame.

4.  **NO TEXT OR ANNOTATIONS:**
    *   The final image must contain **ONLY THE DRAWING**.
    *   **NEVER** include text (e.g., 'Front View'), annotations, arrows, measurements, or logos inside the image.

5.  **HIGH-QUALITY DETAILING (CRITICAL):**
    *   **Seams:** All construction seams (side seams, hems, cuffs, collars, plackets) must be clearly drawn with clean, visible stitch lines (e.g., using dashed or parallel lines where appropriate, like for coverstitching on hems).
    *   **Zippers:** If the garment has a zipper, it must be drawn with realistic detail, including the zipper teeth, the slider, and the pull tab.
    *   **Hems & Cuffs:** Ribbed hems and cuffs (on sweatshirts, hoodies, etc.) must be rendered with vertical lines to indicate the ribbed texture.
    *   **Folds & Creases:** Use minimal, subtle, and clean lines to indicate natural fabric folds (e.g., at the elbow or where fabric gathers at a waistband). This adds realism without violating the "no shadows/gradients" rule. These should be suggestion lines, not heavy shading.
    `.trim();

    // --- Final Assembly ---
    const prompt = [
        roleAndTask,
        logicalHierarchy,
        garmentDescription,
        viewInstruction,
        formattingRules,
    ].join('\n\n');

    return prompt;
};


export const generateFlatSketches = async (base: BaseConstruction, colorHex: string): Promise<{ front: string; back: string; }> => {
    const results: { front?: string; back?: string } = {};
    const views: ('front' | 'back')[] = ['front', 'back'];

    for (const view of views) {
        const prompt = buildSimplifiedSketchPrompt(base, colorHex, view);

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            }
        });
        
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        results[view] = `data:image/png;base64,${base64ImageBytes}`;
    }

    if (!results.front || !results.back) {
        throw new Error("Failed to generate one or more flat sketches.");
    }

    return {
        front: results.front,
        back: results.back,
    };
};

export const getColorInformation = async (colorHex: string): Promise<{ pantone: string; name: string; }> => {
    const prompt = `You are a color expert for the apparel industry.
    Given the HEX color code "${colorHex}", provide the closest matching Pantone TCX code and a common, descriptive color name.
    
    Return the result as a JSON object with two keys: "pantone" and "name".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pantone: {
                        type: Type.STRING,
                        description: 'The closest Pantone TCX code, e.g., "19-4006 TCX".'
                    },
                    name: {
                        type: Type.STRING,
                        description: 'A common descriptive color name, e.g., "Jet Black".'
                    },
                },
                required: ['pantone', 'name'],
            },
        },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as { pantone: string; name: string; };
};