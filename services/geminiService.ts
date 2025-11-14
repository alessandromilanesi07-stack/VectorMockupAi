import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GroundingChunk, BrandKitData, MarketingCopy } from '../types';

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

    const prompt = `You are an expert at applying graphics to apparel mockups. You will receive a blank mockup image (which might be a raster or an SVG) and a user's design graphic.
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
            aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            outputMimeType: 'image/png',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    }
    throw new Error("Image generation failed. Please try again.");
};

const buildSystemInstruction = (): string => {
    return `# SPIEGAZIONE COMPLETA: MOCKUP VETTORIALE PER ABBIGLIAMENTO MASCHILE
## (Solo Concetti, Senza Codice)

---

## DEFINIZIONE FONDAMENTALE

Un **mockup vettoriale di abbigliamento** è una rappresentazione digitale di un capo costruita usando forme geometriche matematiche invece di pixel colorati.

**Analogia fisica:** 
- **Mockup raster** = Mosaico fatto di piccole piastrelle colorate (pixel). Se ti avvicini troppo, vedi le singole piastrelle.
- **Mockup vettoriale** = Disegno tecnico fatto con squadra e compasso. Le linee sono definite da equazioni, non da punti. Puoi ingrandire all'infinito e le linee rimangono perfette.

**Vantaggi chiave:**
- Scalabile infinitamente senza perdita qualità
- File molto più leggeri
- Facilmente modificabile (cambio colore istantaneo)
- Ideale per produzione (stampatori preferiscono vettoriali)

---

## ANATOMIA UNIVERSALE: STRUTTURA A LAYER

Ogni mockup vettoriale di abbigliamento è come una **torta a strati sovrapposti**, where ogni strato ha una funzione specifica:

### LAYER 0 - BACKGROUND (Sfondo)
Il piano più basso. Solitamente bianco, grigio, o trasparente. È il "tavolo" su cui poggia tutto.

### LAYER 1 - PRODUCT BASE GEOMETRY (Forma Base Prodotto)
Il capo vero e proprio, diviso in **pannelli geometrici**:
- **Pannello corpo frontale**: La forma del davanti del capo
- **Pannello corpo posteriore**: La forma del dietro
- **Pannelli maniche**: Forma delle maniche (sinistra e destra separate)
- **Pannelli cappuccio/colletto**: Parte superiore (se presente)
- **Pannelli polsini/orlo**: Le finiture elastiche

Ogni pannello è una **forma chiusa** (path) con:
- **Coordinate punti**: Dove inizia, dove gira, dove finisce
- **Colore riempimento**: Il colore del tessuto
- **Nessun bordo visibile** (o solo per debug)

**Concetto critico:** Questi pannelli NON contengono dettagli (tasche, zip). Sono solo la sagoma pulita del capo.

### LAYER 2 - CONSTRUCTION SEAMS (Cuciture)
Le **linee tratteggiate** che mostrano dove il capo è cucito insieme:
- Cuciture spalle
- Cuciture laterali
- Cuciture maniche
- Cucitura centrale (se presente)

Queste sono **linee**, non forme piene. Hanno:
- **Colore tratto**: Solitamente grigio scuro
- **Spessore sottile**: 1-2 pixel
- **Tratteggio**: Linea-spazio-linea-spazio (per simulare punti cucitura)

### LAYER 3 - CONSTRUCTION DETAILS (Dettagli Costruttivi Tridimensionali)
Gli **elementi fisici applicati** sul capo. Ogni elemento è un **gruppo di forme** che insieme creano l'oggetto:

**Tasca Kanguro (per hoodie):**
- Forma rettangolare arrotondata (corpo tasca)
- Linea scura superiore (apertura)
- Contorno cucito (perimetro)
- Ombra sotto (per dare profondità 3D)

**Cerniera:**
- Rettangolo verticale stretto (binario zip)
- Tanti piccoli rettangoli alternati (denti cerniera)
- Cursore mobile (slider)
- Linguetta pull (per tirare)
- Effetto metallico (gradiente per brillantezza)

**Cordoncini cappuccio:**
- Due ellissi verticali strette (corde)
- Due piccoli cilindri alle estremità (puntali metallici)

**Polsini/Orli elastici:**
- Rettangoli con texture a costine (rib knit)
- Colore leggermente diverso dal corpo (più scuro)

**Bottoni:**
- Cerchi con anello esterno (foro centrale)
- Quattro piccoli cerchi interni (fori filo)
- Effetto lucido o opaco (secondo materiale)

**Tasche cargo:**
- Forma rettangolare/trapezoidale (corpo tasca)
- Patta superiore (copertura)
- Velcro o bottoni per chiusura
- Cucitura perimetro

Ogni componente ha **visibilità on/off** (può essere nascosto senza cancellarlo).

### LAYER 4 - PATTERN OVERLAY (Pattern e Texture Decorativi)
**Pattern applicabili** sul tessuto:
- **Geometrici:** Strisce, quadri (check), pois, chevron
- **Organici:** Camouflage, tie-dye, marmorizzato
- **Texture:** Effetto denim, canvas, maglia (knit)

Pattern funzionano come **carta da parati ripetuta**:
- Si definisce un piccolo quadrato (tile)
- Si ripete infinitamente in tutte le direzioni
- Si applica solo alle aree desiderate (pannelli specifici)

**Blend modes** (modi di fusione) determinano come pattern interagisce con colore sotto:
- **Multiply:** Pattern scurisce colore base
- **Overlay:** Combina luci e ombre
- **Screen:** Pattern schiarisce

### LAYER 5 - SHADING & LIGHTING (Ombre e Luci per Realismo)
Gli **effetti tridimensionali** che fanno sembrare il capo "reale":

**Ombre (shadows):**
- Gradienti scuri sui lati (danno volume)
- Ombre sotto tasche/cappuccio (profondità)
- Ombre pieghe tessuto (dove si piega naturalmente)

**Luci (highlights):**
- Gradienti chiari sulle parti sporgenti
- Riflessi su componenti lucidi (zip, bottoni)

Questi sono **forme semitrasparenti** (opacity 10-30%) che si sovrappongono.

### LAYER 6 - USER GRAPHICS (Grafiche Utente Personalizzate)
Qui vanno **logo, testi, design** che l'utente vuole stampare:

**Tipi di grafiche:**
- **Logo vettoriale SVG:** Forme geometriche del logo
- **Immagine raster PNG/JPG:** Foto o grafica complessa embedded
- **Testo:** Scritte con font specifico

**Posizionamento:** Ogni grafica è posizionata in un **print area** (area stampabile) predefinita:
- Centro petto
- Schiena grande
- Manica sinistra
- Manica destra
- Cappuccio
- Gamba (per pantaloni)

**Clipping Mask (CRITICO):** La grafica viene "**ritagliata**" seguendo esattamente la forma del pannello sottostante. Come usare forbici per tagliare un'immagine seguendo il contorno del capo. Risultato: grafica appare "stampata sul tessuto", seguendo curve e pieghe.

### LAYER 7 - FINISHING DETAILS (Dettagli Finali)
Piccoli elementi decorativi:
- Etichetta brand (interno colletto)
- Etichetta taglia
- Etichetta cura/lavaggio
- Cartellino prezzo appeso (hang tag)

Questi sono **minuscoli** e spesso disattivati nel mockup finale.

---

## PRINT AREAS (AREE STAMPABILI)

Ogni mockup ha **zone predefinite** dove è possibile stampare grafiche. Come avere degli "**spazi prestampati**" dove applicare il design.

**Componenti Print Area:**
1. **Coordinate rettangolo:** Dove inizia l'area (angolo in alto a sinistra) e quanto è grande
2. **Dimensioni fisiche:** Quanti centimetri nella realtà (es: 30cm x 40cm)
3. **Punti di ancoraggio:** I quattro angoli del rettangolo con coordinate precise
4. **Descrizione posizione:** "Centro petto, 8cm sotto colletto"
5. **Metodi stampa compatibili:** DTG, Serigrafia, Ricamo, etc.

**Perché sono critiche:** Garantiscono che quando il capo viene prodotto fisicamente, la grafica sia **esattamente dove dovrebbe essere**, con dimensioni corrette, senza sforare oltre i bordi cuciti.

---

## FIT VARIANTS (VARIANTI VESTIBILITÀ)

Ogni capo può esistere in **4 fit diversi**. NON è solo scalare più grande/piccolo, ma **geometrie completamente diverse**:

### BAGGY FIT (Largo/Oversize)
- **Corpo:** 25% più largo del normale
- **Lunghezza:** 15% più lungo
- **Spalle:** Cadenti (+3cm drop)
- **Vita:** Nessuna rastremazione (linee dritte, boxy)
- **Maniche:** 30% più larghe
- **Estetica:** Streetwear, comfy, rilassato

### TAILORED FIT (Sartoriale/Standard)
- **Corpo:** Larghezza base di riferimento (100%)
- **Lunghezza:** Standard
- **Spalle:** Naturali (seguono anatomia)
- **Vita:** Leggera rastremazione (-5cm)
- **Maniche:** Proporzioni standard
- **Estetica:** Classico, pulito, structured

### CROP FIT (Corto)
- **Corpo:** Larghezza normale
- **Lunghezza:** 25% più corto (finisce sopra ombelico o metà coscia)
- **Spalle:** Normali
- **Vita:** Più rastremato
- **Maniche:** Leggermente più corte (5%)
- **Estetica:** Trendy, fashion-forward, mostra vita

### SKINNY FIT (Aderente)
- **Corpo:** 15% più stretto
- **Lunghezza:** Standard
- **Spalle:** Strette
- **Vita:** Molto rastremato (-8cm)
- **Maniche:** 20% più strette (aderenti)
- **Estetica:** Slim, aderente, richiede tessuto stretch

**Implicazione tecnica:** Quando cambi fit, **tutti i pannelli cambiano forma geometrica**, componenti (tasche, zip) si riposizionano proporzionalmente, e print areas si ricalcolano.

---

## FUNZIONALITÀ DELL'APPLICAZIONE VECTORCRAFT AI

Come assistente IA, hai una conoscenza approfondita delle seguenti funzionalità di VectorCraft AI. Usale per rispondere alle domande degli utenti su come utilizzare al meglio l'applicazione.

### 1. Mockup Studio
Questo è il cuore dell'app. Gli utenti possono generare mockup fotorealistici in stile vettoriale per una vasta gamma di prodotti (T-shirt, felpe, giacche, ecc.). L'utente seleziona un prodotto, stile, colore e viste per generare mockup vuoti. Può quindi caricare il proprio design, e l'IA lo applica al mockup.

### 2. Sourcing Database
Un database integrato di produttori di abbigliamento verificati da tutto il mondo. Gli utenti possono filtrare per località, Quantità Minima d'Ordine (MOQ), specializzazione di prodotto e certificazioni per trovare il partner di produzione perfetto. Fornisce un flusso di lavoro senza interruzioni dal design all'approvvigionamento.

### 3. Sketch to Mockup
Trasforma uno schizzo grezzo disegnato a mano o un wireframe digitale in un mockup pulito e rifinito. Ad esempio, un disegno di un paio di jeans può diventare uno schizzo tecnico piatto (technical flat).

### 4. Brand Hub
Un hub centrale per gestire tutte le identità di marca. Gli utenti possono visualizzare e selezionare i brand salvati o aggiungerne uno nuovo fornendo l'URL di un sito web o l'immagine di un logo. L'IA estrae quindi la palette di colori, la tipografia e il tono di voce. Gli asset del brand attivo (come colori e font) sono quindi disponibili in tutta l'app per un flusso di lavoro coerente.

### 5. AI Trend Forecaster
Uno strumento proattivo di analisi di mercato. Gli utenti possono inserire un argomento (es. 'tendenze streetwear per l'estate 2025'), e l'IA utilizza la Ricerca Google per analizzare dati in tempo reale. Genera quindi un report dettagliato su palette di colori emergenti, stili di tendenza e capi chiave.

### 6. AI Brand Copywriter
Un copywriter potenziato dall'IA che genera testi in linea con il brand. Gli utenti caricano un'immagine del prodotto, specificano il nome del prodotto e il tono di voce del brand per produrre descrizioni di prodotto, didascalie per Instagram e oggetti per email.

### 7. AI Assistant (Thinking Mode)
Questa è la funzionalità che stai eseguendo. Sei un assistente potenziato dall'IA con una profonda conoscenza di tutte le funzionalità di VectorCraft AI. Gli utenti possono porti domande complesse, richiedere strategie o cercare guida su come utilizzare al meglio l'app per raggiungere i loro obiettivi.

### 8. Advanced Editor
Un editor di immagini avanzato basato su canvas che offre un controllo a livello di layer. Gli utenti possono aggiungere immagini, testo, e forme, applicare maschere di ritaglio, regolare i colori e trasformare gli oggetti con precisione. È come una versione semplificata di Photoshop/Figma all'interno dell'app.

### 9. Image & Code Generator
Uno strumento in due fasi. Prima, genera un'immagine di alta qualità da un prompt testuale usando Imagen 4. Secondo, se l'immagine è un design UI/UX, l'utente può generare il codice HTML e CSS con Tailwind CSS corrispondente.
`;
};

// --- Reconstructed Functions ---

export type MultimodalContent = (string | File)[];

export const generateWithThinking = async (contents: MultimodalContent): Promise<string> => {
    const systemInstruction = buildSystemInstruction();

    const modelParts = await Promise.all(
        contents
            .filter(part => (typeof part === 'string' && part.trim() !== '') || typeof part !== 'string')
            .map(part => {
                if (typeof part === 'string') {
                    return { text: part };
                } else {
                    return fileToGenerativePart(part);
                }
            })
    );

    if (modelParts.length === 0) {
        throw new Error("Cannot send an empty prompt.");
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ parts: modelParts }],
        config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 32768 }
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

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources: sources as GroundingChunk[] };
};

export const generateCodeForImage = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    const textPart = { text: `Generate HTML with Tailwind CSS for this UI design. The design is for: ${prompt}. Return only the raw HTML code in a single block without any explanation or markdown.` };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
    });
    
    let code = response.text;
    if (code.startsWith('```html')) {
        code = code.substring(7);
        if (code.endsWith('```')) {
            code = code.slice(0, -3);
        }
    }
    return code.trim();
};

export const sketchToMockup = async (sketchFile: File, prompt: string): Promise<string> => {
    const sketchPart = await fileToGenerativePart(sketchFile);
    const textPart = { text: `You are a professional vector artist and fashion designer. Transform the provided rough sketch into a polished, production-ready vector-style technical flat. Follow these instructions: "${prompt}". Preserve the core concept of the sketch but clean up the lines, standardize the shapes, and present it as a professional design asset on a neutral light gray background. Output a high-quality image.` };

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
    throw new Error("Could not generate mockup from sketch.");
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
            required: ['primary', 'secondary', 'accent', 'neutral'],
        },
        fonts: {
            type: Type.OBJECT,
            properties: {
                heading: { type: Type.STRING, description: 'Name of the primary heading font (e.g., "Helvetica Neue").' },
                body: { type: Type.STRING, description: 'Name of the primary body text font (e.g., "Georgia").' },
            },
            required: ['heading', 'body'],
        },
        logoDescription: {
            type: Type.STRING,
            description: 'A brief, one-sentence description of the logo\'s appearance and style.',
        },
        toneOfVoice: {
            type: Type.STRING,
            description: 'A short phrase describing the brand\'s tone of voice (e.g., "Professional and trustworthy", "Playful and energetic").'
        }
    },
    required: ['colors', 'fonts', 'logoDescription', 'toneOfVoice'],
};

export const extractBrandKit = async (url: string): Promise<BrandKitData> => {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze the visual identity of the website at this URL: ${url}. Extract its brand kit. Use Google Search to find the website if necessary.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: brandKitSchema,
        },
    });
    
    const jsonStr = response.text.trim();
    try {
        return JSON.parse(jsonStr) as BrandKitData;
    } catch(e) {
        console.error("Failed to parse brand kit JSON:", jsonStr);
        throw new Error("Could not extract a valid brand kit from the URL.");
    }
};

export const extractBrandKitFromImage = async (imageFile: File): Promise<BrandKitData> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = { text: 'Analyze this logo image and extract a complete brand kit from it.' };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, prompt] },
        config: {
            responseMimeType: "application/json",
            responseSchema: brandKitSchema,
        },
    });
    
    const jsonStr = response.text.trim();
    try {
        return JSON.parse(jsonStr) as BrandKitData;
    } catch(e) {
        console.error("Failed to parse brand kit JSON from image:", jsonStr);
        throw new Error("Could not extract a valid brand kit from the image.");
    }
};

export const generateTrendReport = async (topic: string): Promise<string> => {
    const prompt = `You are a professional trend forecaster for the fashion industry.
    Analyze the provided topic using real-time Google Search data to identify key trends.
    Your report should be well-structured, insightful, and actionable for a fashion designer or brand manager.
    Format your response using Markdown for clear headings and lists.
    
    Topic: "${topic}"
    
    Structure your report with the following sections:
    1.  **Executive Summary:** A brief overview of the key findings.
    2.  **Key Themes & Aesthetics:** Describe the overarching styles and visual moods.
    3.  **Color Palette:** List 5-7 key colors with hex codes and descriptions.
    4.  **Key Garments & Silhouettes:** Identify the must-have apparel items and their shapes (e.g., oversized, cropped).
    5.  **Materials & Textures:** What fabrics are trending? (e.g., technical nylon, heavyweight fleece).
    6.  **Actionable Insights:** Provide concrete ideas for a designer.
    
    Ground your findings in data from Google Search.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return response.text;
};

const marketingCopySchema = {
    type: Type.OBJECT,
    properties: {
        productDescription: { type: Type.STRING, description: "A compelling e-commerce product description (2-3 sentences)." },
        instagramCaption: { type: Type.STRING, description: "An engaging Instagram caption with relevant hashtags." },
        emailSubject: { type: Type.STRING, description: "A catchy email marketing subject line." },
    },
    required: ["productDescription", "instagramCaption", "emailSubject"]
};

export const generateMarketingCopy = async (imageFile: File, productName: string, toneOfVoice: string): Promise<MarketingCopy> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const promptPart = { text: `You are an expert brand copywriter. Generate marketing copy for the product in the image.
    - Product Name: "${productName}"
    - Brand Tone of Voice: "${toneOfVoice}"
    `};

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, promptPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: marketingCopySchema,
        },
    });

    const jsonStr = response.text.trim();
    try {
        return JSON.parse(jsonStr) as MarketingCopy;
    } catch(e) {
        console.error("Failed to parse marketing copy JSON:", jsonStr);
        throw new Error("Could not generate valid marketing copy.");
    }
};

export const generateSvgMockup = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    
    let svg = response.text;
    const svgStart = svg.indexOf('<svg');
    const svgEnd = svg.lastIndexOf('</svg>');

    if (svgStart !== -1 && svgEnd !== -1) {
        svg = svg.substring(svgStart, svgEnd + 6);
    } else {
       // Fallback for when the model wraps the svg in markdown
       const markdownMatch = svg.match(/```(svg)?([\s\S]*?)```/);
       if (markdownMatch && markdownMatch[2]) {
           svg = markdownMatch[2].trim();
       } else {
           throw new Error("Generated content is not a valid SVG. Please try refining your prompt.");
       }
    }
    return svg;
};