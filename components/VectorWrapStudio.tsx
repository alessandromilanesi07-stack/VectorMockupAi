


import React, { useState, useCallback, useMemo } from 'react';
import { applyVectorToMockup, generateConsistentMockup, generateDesignVariations } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, ShoppingCartIcon, DownloadIcon, WandIcon, DocumentTextIcon } from './Icons';
import { products, styles, productCategories } from './mockup/data';
import * as ProductIcons from './mockup/icons';
import type { MockupProduct, MockupStyle } from './mockup/data';
import { OrderModal } from './OrderModal';
import { TechPackModal } from './TechPackModal';

const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Invalid base64 string: MIME type not found.");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

const buildMockupPrompt = (product: MockupProduct, style: MockupStyle, color: string, view: string): string => {
  return `
Generate a high-resolution, production-ready vector-style mockup of a blank apparel item. The output must be a raster image that perfectly emulates a true vector graphic.

**Core Style: Vector Illustration**
- **Composition:** The entire product must be rendered using clean, hard-edged geometric shapes and smooth paths, as if it were created in a vector graphics editor.
- **Color:** Use flat, solid colors for the main body of the product.
- **Shading:** If shading is necessary to show form, use only simple, subtle linear gradients. Do NOT use complex, photorealistic shadows, airbrushing, or soft gradients.
- **Textures:** Absolutely NO photographic fabric textures (like cotton weave, denim, fleece). The surface should be perfectly smooth and clean.
- **Outlines:** Use thin, consistent stroke lines to define edges and seams, or use a lineless style. The style should be consistent.
- **Background:** A completely neutral, solid light gray (#F0F0F0) background. No props, environments, or textures in the background.

**Product Details**
- **Product Type:** ${product.name} (${product.description}).
- **Fit:** ${product.fit}.
- **Base Color:** ${color}.
- **Style Aesthetic:** ${style.name}.

**Technical Requirements**
- **View:** ${view}.
- **Print Area:** The designated print area (${product.printArea}) must be clearly visible, flat, and perfectly centered, ready for a design to be applied.
- **Output Format:** High resolution 2048x2048px PNG.
- **Content:** The mockup must be completely blank. No logos, text, tags, or pre-existing graphics.
- **Framing:** The product should occupy approximately 70% of the image frame.

**Negative Prompts (What to AVOID):**
- **AVOID:** Photorealism, photographs, realistic lighting, complex shadows, fabric textures, 3D rendering effects, human models, props.
  `.trim();
}

const buildFollowUpMockupPrompt = (product: MockupProduct, style: MockupStyle, color: string, newView: string): string => {
  return `
You are provided with a reference image of a vector-style apparel mockup. Your task is to generate a new image of the *exact same item* but from a different viewpoint.

**Consistency is the #1 priority.**
- The generated item must have the exact same color (${color}), stitching, collar, cuffs, and any other details as the item in the reference image.
- It must look like it's the same object, just seen from a different angle.
- Maintain the identical clean, vector illustration style (hard edges, flat colors, no photo textures).
- The background must be a solid light gray (#F0F0F0).

**Product Details (for context):**
- **Product Type:** ${product.name} (${product.description}).
- **Style Aesthetic:** ${style.name}.

**New Viewpoint to Generate:**
- **View:** ${newView}.

**Output Requirements:**
- High resolution 2048x2048px PNG.
- The product should be centered and occupy about 70% of the frame.

**AVOID:**
- Do NOT change any details of the clothing item from the reference image.
- AVOID photorealism, textures, complex shadows, and human models.
  `.trim();
}

const availableViews = [
    { id: 'frontal', label: 'Frontale' },
    { id: 'retro', label: 'Retro' },
    { id: 'lato_sx', label: 'Lato Sinistro' },
    { id: 'lato_dx', label: 'Lato Destro' },
];

const viewPromptMap: { [key: string]: string } = {
    frontal: 'Centered, front-on view',
    retro: 'Centered, back view',
    lato_sx: 'Centered, left side view',
    lato_dx: 'Centered, right side view',
};

export const MockupStudio: React.FC = () => {
    const [selectedProductId, setSelectedProductId] = useState<string>('t-shirt-basic');
    const [selectedViews, setSelectedViews] = useState<string[]>(['frontal', 'retro']);
    const [selectedStyleId, setSelectedStyleId] = useState<string>('streetwear');
    const [color, setColor] = useState<string>('#FFFFFF');
    const [designImage, setDesignImage] = useState<File | null>(null);
    const [prompt] = useState<string>(`
Sei un esperto nell'applicare grafiche a mockup di abbigliamento.
Riceverai due immagini:
1. Un mockup di abbigliamento vuoto, in stile vettoriale.
2. La grafica di design di un utente.

Il tuo compito è applicare il design dell'utente sull'area di stampa designata del mockup.

**Istruzioni:**
1.  **Posizionamento:** Posiziona il design dell'utente perfettamente al centro dell'area di stampa del mockup vuoto.
2.  **Coerenza di Stile:** L'immagine finale deve mantenere lo stesso identico stile pulito, piatto e da illustrazione vettoriale del mockup di input. NON aggiungere illuminazione, ombre o texture fotorealistiche né al design né al mockup.
3.  **Applicazione:** Il design deve apparire come se fosse stampato in modo piatto sulla superficie. Non aggiungere pieghe, grinze o distorsioni prospettiche artificiali del tessuto, a meno che non siano estremamente sottili. L'applicazione deve essere pulita e nitida.
4.  **Conservazione:** Conserva perfettamente il colore, la forma e lo sfondo del mockup originale. Aggiungi solo il design dell'utente.
5.  **Output Finale:** Il risultato deve essere un'immagine di alta qualità che assomigli a un mockup vettoriale professionale e pronto per la produzione con il design applicato. Evita qualsiasi elemento fotografico.
    `.trim());
    
    const [generatedMockups, setGeneratedMockups] = useState<{ [viewId: string]: string } | null>(null);
    const [finalImages, setFinalImages] = useState<{ [viewId: string]: string } | null>(null);
    const [designVariations, setDesignVariations] = useState<string[] | null>(null);
    const [activeViewId, setActiveViewId] = useState<string>('frontal');
    const [stage, setStage] = useState<'config' | 'generating' | 'applying' | 'generating_variations' | 'done'>('config');
    const [error, setError] = useState<string | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isTechPackModalOpen, setIsTechPackModalOpen] = useState(false);

    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId)!, [selectedProductId]);
    const selectedStyle = useMemo(() => styles.find(s => s.id === selectedStyleId)!, [selectedStyleId]);

    const handleViewChange = (viewId: string) => {
        setSelectedViews(prev => {
            const newViews = prev.includes(viewId)
                ? prev.filter(v => v !== viewId)
                : [...prev, viewId];
            if (newViews.length === 0) return prev;
            if (!newViews.includes(activeViewId)) {
                setActiveViewId(newViews[0]);
            }
            return newViews;
        });
    };

    const handleGenerateMockup = useCallback(async () => {
        if (selectedViews.length === 0) {
            setError("Per favore, seleziona almeno una vista.");
            return;
        }
        setStage('generating');
        setError(null);
        setGeneratedMockups(null);
        setFinalImages(null);
        setDesignVariations(null);
        setActiveViewId(selectedViews[0]);

        try {
            const firstViewId = selectedViews[0];
            const firstViewPromptText = viewPromptMap[firstViewId];
            const baseMockupPrompt = buildMockupPrompt(selectedProduct, selectedStyle, color, firstViewPromptText);
            const firstImage = await generateConsistentMockup(baseMockupPrompt);

            const followUpPromises = selectedViews.slice(1).map(viewId => {
                const viewPromptText = viewPromptMap[viewId];
                const followUpPrompt = buildFollowUpMockupPrompt(selectedProduct, selectedStyle, color, viewPromptText); 
                return generateConsistentMockup(followUpPrompt, firstImage);
            });

            const followUpImages = await Promise.all(followUpPromises);
            const allGeneratedImages = [firstImage, ...followUpImages];

            if (allGeneratedImages.length > 0) {
                const mockupsObj = allGeneratedImages.reduce((acc, img, index) => {
                    const viewId = selectedViews[index];
                    acc[viewId] = img;
                    return acc;
                }, {} as { [viewId: string]: string });

                setGeneratedMockups(mockupsObj);
                setStage('config'); 
            } else {
                throw new Error("La generazione del mockup non è riuscita a produrre immagini.");
            }
        } catch (e) {
            // FIX: The caught error `e` is of type `unknown`. We must check if it's an instance of Error before accessing the `message` property.
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('Si è verificato un errore sconosciuto durante la generazione del mockup.');
            }
            setStage('config');
        }
    }, [selectedProduct, selectedStyle, color, selectedViews]);

    const handleApplyDesign = useCallback(async () => {
        if (!generatedMockups || !designImage) {
            setError('Per favore, genera un mockup e carica prima un design.');
            return;
        }

        setStage('applying');
        setError(null);
        setFinalImages(null);
        setDesignVariations(null);

        try {
            const finalImagesPromises = Object.entries(generatedMockups).map(async ([viewId, mockupBase64]) => {
                const mockupFile = base64ToFile(mockupBase64, `mockup-${viewId}.png`);
                const result = await applyVectorToMockup(mockupFile, designImage, prompt);
                return { viewId, result };
            });

            const results = await Promise.all(finalImagesPromises);
            const finalImagesObj = results.reduce((acc, { viewId, result }) => {
                acc[viewId] = result;
                return acc;
            }, {} as { [viewId: string]: string });

            setFinalImages(finalImagesObj);
            setStage('done');
        } catch (e) {
            // FIX: The caught error `e` is of type `unknown`. We must check if it's an instance of Error before accessing the `message` property.
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('Si è verificato un errore sconosciuto durante l\'applicazione del design.');
            }
            setStage('config');
        }
    }, [generatedMockups, designImage, prompt]);

    const handleGenerateVariations = useCallback(async () => {
        if (!generatedMockups?.[activeViewId] || !designImage) {
            setError('Please select a mockup and upload a design first.');
            return;
        }
        setStage('generating_variations');
        setError(null);
        setDesignVariations(null);
        try {
            const mockupFile = base64ToFile(generatedMockups[activeViewId], `mockup-${activeViewId}.png`);
            const variations = await generateDesignVariations(mockupFile, designImage);
            setDesignVariations(variations);
        } catch (e) {
            // FIX: The caught error `e` is of type `unknown`. We must check if it's an instance of Error before accessing the `message` property.
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred while generating variations.');
            }
        } finally {
            setStage('done');
        }
    }, [activeViewId, generatedMockups, designImage]);

    const handleSelectVariation = (variationImage: string) => {
        if (!finalImages) return;
        setFinalImages(prev => ({ ...prev!, [activeViewId]: variationImage }));
        setDesignVariations(null);
    };
    
    const handleDownload = () => {
        const imageToDownload = finalImages?.[activeViewId];
        if (!imageToDownload) return;
        const link = document.createElement('a');
        link.href = imageToDownload;
        link.download = `${selectedProduct.name.replace(/\s+/g, '_')}_${activeViewId}_mockup.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const isLoading = ['generating', 'applying', 'generating_variations'].includes(stage);
    const loadingMessage = 
        stage === 'generating' ? 'Generating AI Mockups...' :
        stage === 'applying' ? 'Applying your design to all views...' :
        stage === 'generating_variations' ? 'Generating creative variations...' : '';

    const activeImage = finalImages ? finalImages[activeViewId] : generatedMockups ? generatedMockups[activeViewId] : null;

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">AI Mockup Studio</h2>
                    <p className="mt-4 text-lg text-gray-400">Generate professional mockups, apply designs, and create production-ready assets.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Configuration Panel */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6 self-start">
                         {/* Product Selection */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-3">1. Seleziona Tipo Prodotto</h3>
                            {productCategories.map(category => (
                                <div key={category}>
                                    <h4 className="font-semibold text-gray-300 mt-4 mb-2 border-b border-gray-700 pb-1">{category}</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {products.filter(p => p.category === category).map(product => {
                                            const IconComponent = ProductIcons[product.icon as keyof typeof ProductIcons];
                                            return (
                                                <button 
                                                    key={product.id}
                                                    onClick={() => setSelectedProductId(product.id)}
                                                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 aspect-square ${selectedProductId === product.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                                    title={product.name}
                                                >
                                                    <IconComponent className="h-8 w-8" />
                                                    <span className="text-xs text-center mt-1 truncate w-full">{product.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* View Selection */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-3">2. Seleziona Viste</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {availableViews.map(view => (
                                    <label key={view.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedViews.includes(view.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
                                            checked={selectedViews.includes(view.id)}
                                            onChange={() => handleViewChange(view.id)}
                                        />
                                        <span className="ml-3 text-sm font-medium">{view.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* Style and Color */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-2">3. Seleziona Stile</label>
                                <select
                                    id="style-select"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedStyleId}
                                    onChange={(e) => setSelectedStyleId(e.target.value)}
                                >
                                    {styles.map(style => (
                                        <option key={style.id} value={style.id} title={style.tooltip}>{style.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                            <label htmlFor="color-picker" className="block text-sm font-medium text-gray-300 mb-2">4. Colore Base</label>
                            <input 
                                type="color" 
                                id="color-picker"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-12 p-1 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                            />
                            </div>
                        </div>
                        {/* Generate Button */}
                        <div className="text-center border-t border-gray-700 pt-4">
                            <button
                                onClick={handleGenerateMockup}
                                disabled={isLoading}
                                className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                                {stage === 'generating' ? <Spinner /> : 'Step 1: Genera Mockup Vuoto'}
                            </button>
                        </div>
                        {/* Design Upload and Apply */}
                        {generatedMockups && (
                            <div className="space-y-4 border-t border-gray-700 pt-4">
                                <div>
                                    <label htmlFor="design-upload" className="block text-sm font-medium text-gray-300 mb-2">5. Carica il Tuo Design</label>
                                    <label htmlFor="design-upload" className="w-full flex flex-col items-center justify-center px-4 py-6 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                                        <UploadIcon />
                                        <span className="mt-2 text-sm text-gray-400">{designImage ? designImage.name : 'Click to upload'}</span>
                                        <input id="design-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setDesignImage(e.target.files ? e.target.files[0] : null)} />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <button
                                        onClick={handleApplyDesign}
                                        disabled={isLoading || !designImage}
                                        className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {stage === 'applying' ? <Spinner /> : 'Step 2: Applica Design'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Panel */}
                    <div className="bg-gray-800 p-4 rounded-xl shadow-2xl flex flex-col">
                        <h3 className="text-xl font-bold text-center text-white mb-4">Risultato</h3>
                        {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center mb-4">{error}</div>}
                        
                        <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden flex-shrink-0">
                            {isLoading && stage !== 'done' ? (
                                <div className="text-center">
                                    <Spinner large={true}/>
                                    <p className="mt-4 text-gray-300">{loadingMessage}</p>
                                </div>
                            ) : activeImage ? (
                                <img src={activeImage} alt="Final Mockup" className="w-full h-full object-contain"/>
                            ) : (
                                <p className="text-gray-400 text-center">I tuoi mockup generati appariranno qui.</p>
                            )}
                        </div>
                        
                        {(generatedMockups || finalImages) && !isLoading && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h4 className="text-sm font-bold text-center text-gray-400 mb-2">Viste Generate</h4>
                                <div className="flex justify-center space-x-2 p-2 overflow-x-auto">
                                    {(finalImages ? Object.keys(finalImages) : Object.keys(generatedMockups!)).map((viewId) => (
                                        <button
                                            key={viewId}
                                            onClick={() => { setActiveViewId(viewId); setDesignVariations(null); }}
                                            className={`w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${activeViewId === viewId ? 'border-blue-500' : 'border-transparent hover:border-gray-500'}`}
                                        >
                                            <img src={finalImages ? finalImages[viewId] : generatedMockups![viewId]} alt={`View ${viewId}`} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {finalImages && (
                            <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                     <button onClick={handleGenerateVariations} disabled={stage === 'generating_variations'} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors disabled:bg-gray-600/50">
                                        {stage === 'generating_variations' ? <Spinner/> : <WandIcon />}
                                        Genera Variazioni
                                    </button>
                                    <button onClick={() => setIsTechPackModalOpen(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors">
                                        <DocumentTextIcon />
                                        Genera Scheda Tecnica
                                    </button>
                                </div>
                                {designVariations && (
                                     <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-center text-gray-400">Scegli una Variazione</h4>
                                        <div className="flex justify-center space-x-2 p-2">
                                            {designVariations.map((variation, index) => (
                                                <button key={index} onClick={() => handleSelectVariation(variation)} className="w-24 h-24 rounded-md overflow-hidden border-2 border-transparent hover:border-purple-500 transition-colors">
                                                    <img src={variation} alt={`Variation ${index + 1}`} className="w-full h-full object-cover"/>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-gray-700">
                                    <button onClick={handleDownload} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors">
                                        <DownloadIcon/>
                                        Download
                                    </button>
                                    <button onClick={() => setIsOrderModalOpen(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors">
                                        <ShoppingCartIcon />
                                        Ordina Stampa
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <OrderModal 
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                productImage={finalImages ? finalImages[activeViewId] : null}
                productDetails={{
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    color: color,
                }}
            />
            <TechPackModal
                isOpen={isTechPackModalOpen}
                onClose={() => setIsTechPackModalOpen(false)}
                productDetails={selectedProduct}
                finalImages={finalImages}
                color={color}
                designFile={designImage}
            />
        </>
    );
};