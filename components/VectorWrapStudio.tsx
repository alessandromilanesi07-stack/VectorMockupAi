import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { applyVectorToMockup, generateSvgMockup } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, ShoppingCartIcon, DownloadIcon, WandIcon, DocumentTextIcon, EditIcon, PlusIcon } from './Icons';
import { products, productCategories } from './mockup/data';
import type { MockupProduct } from './mockup/data';
import { OrderModal } from './OrderModal';
import { TechPackModal } from './TechPackModal';
import type { View, Brand, SavedProduct, MarketingCopy } from '../types';

// Helper to render SVG string safely
const SvgRenderer: React.FC<{ svgString: string, layerVisibility: {[key: string]: boolean} }> = ({ svgString, layerVisibility }) => {
    const styleString = Object.entries(layerVisibility)
        .map(([layerId, isVisible]) => `[id='${layerId}'] { display: ${isVisible ? 'block' : 'none'}; }`)
        .join(' ');
    
    // Inject style tag into SVG string
    const finalSvg = svgString.replace('</svg>', `<style>${styleString}</style></svg>`);

    return <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: finalSvg }} />;
};

const base64ToFile = async (base64: string, filename: string, mimeType: string): Promise<File> => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
};


export const MockupStudio: React.FC<{
    setCurrentView: (view: View) => void;
    setImageForEditing: (image: string) => void;
    activeBrand: Brand | null;
    addProductToBrand: (brandId: string, product: SavedProduct) => void;
    imageForMockup: string | null;
    setImageForMockup: (image: string | null) => void;
    copyForTechPack: MarketingCopy | null;
}> = ({ setCurrentView, setImageForEditing, activeBrand, addProductToBrand, imageForMockup, setImageForMockup, copyForTechPack }) => {
    const [selectedProductId, setSelectedProductId] = useState<string>('t-shirt-basic');
    const [selectedCustomizations, setSelectedCustomizations] = useState<{ [key: string]: string }>({});
    const [selectedViews, setSelectedViews] = useState<{[key: string]: boolean}>({
        frontal: true,
        retro: false,
        lato_dx: false,
        lato_sx: false,
    });
    const [color, setColor] = useState<string>('#FFFFFF');
    const [designImage, setDesignImage] = useState<File | null>(null);
    const [applicationType, setApplicationType] = useState<'Print' | 'Embroidery'>('Print');
    
    const [generatedMockups, setGeneratedMockups] = useState<{ [viewId: string]: string } | null>(null);
    const [finalImages, setFinalImages] = useState<{ [viewId: string]: string } | null>(null);
    const [activeViewId, setActiveViewId] = useState<string>('frontal');
    const [stage, setStage] = useState<'config' | 'generating' | 'applying' | 'done'>('config');
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isTechPackModalOpen, setIsTechPackModalOpen] = useState(false);
    
    const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({
        'Background_Layer': true,
        'Product_Base_Geometry': true,
        'Construction_Seams': true,
        'Construction_Details': true,
        'Pattern_Overlay': true,
        'Shading_Lighting': true,
        'User_Graphics': true,
        'Finishing_Details': true,
    });

    const layerLabels: { [key: string]: string } = {
        'Product_Base_Geometry': 'Base',
        'Construction_Seams': 'Cuciture',
        'Construction_Details': 'Dettagli',
        'Pattern_Overlay': 'Pattern',
        'Shading_Lighting': 'Ombre',
        'User_Graphics': 'Grafiche',
        'Finishing_Details': 'Finiture',
    };
    
    const svgContainerRef = useRef<HTMLDivElement>(null);

    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId)!, [selectedProductId]);
    
    useEffect(() => {
        const defaults: { [key: string]: string } = {};
        selectedProduct.customizations?.forEach(cust => {
            defaults[cust.id] = cust.defaultOptionId;
        });
        setSelectedCustomizations(defaults);
    }, [selectedProduct]);
    
    useEffect(() => {
        if (activeBrand) {
            setColor(activeBrand.kit.colors.primary || '#FFFFFF');
        }
    }, [activeBrand]);

    useEffect(() => {
        if (imageForMockup) {
            const [header] = imageForMockup.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            base64ToFile(imageForMockup, `design-${Date.now()}.png`, mimeType)
                .then(file => {
                    setDesignImage(file);
                });
            // Clear the prop so it doesn't re-trigger on re-render
            setImageForMockup(null);
        }
    }, [imageForMockup, setImageForMockup]);


    const handleSaveMockup = () => {
        if (!finalImages?.[activeViewId]) return;
    
        if (activeBrand) {
            const savedCustomizations = selectedProduct.customizations?.map(c => ({
                name: c.name,
                option: c.options.find(o => o.id === selectedCustomizations[c.id])?.name || 'Default'
            })) || [];
            
            const product: SavedProduct = {
                id: `prod-${Date.now()}`,
                productName: selectedProduct.name,
                color: color,
                imageUrl: finalImages[activeViewId],
                customizations: savedCustomizations
            };
            addProductToBrand(activeBrand.id, product);
            alert(`"${product.productName}" saved to "${activeBrand.name}" Brand Hub!`);
        } else {
            if (window.confirm("To save a mockup, you need to create or select a Brand first. Would you like to go to the Brand Kit section to set one up?")) {
                setCurrentView('brandHub');
            }
        }
    };

    const handleCustomizationChange = (customizationId: string, optionId: string) => {
        setSelectedCustomizations(prev => ({ ...prev, [customizationId]: optionId }));
    };

    const handleGenerateMockup = useCallback(async () => {
        const viewsToGenerate = Object.entries(selectedViews)
            .filter(([, isSelected]) => isSelected)
            .map(([viewId]) => viewId);

        if (viewsToGenerate.length === 0) {
            setError("Seleziona almeno una vista da generare.");
            return;
        }

        setStage('generating');
        setError(null);
        setGeneratedMockups(null);
        setFinalImages(null);
        setStatusMessage('Generating technical flat...');
        
        try {
            const fitOption = selectedProduct.customizations?.find(c => c.id === 'fit')?.options.find(o => o.id === selectedCustomizations['fit']);
            const fitDescription = fitOption?.name || selectedProduct.fit;

            const getConstructionDetails = (product: MockupProduct): string => {
                const details: string[] = [];
                const desc = product.description.toLowerCase();

                if (desc.includes('kangaroo pocket') || desc.includes('tasca a marsupio')) {
                    details.push('- Tasche: Tasca a marsupio frontale (Kangaroo pocket).');
                }
                if (desc.includes('zip-up') || desc.includes('zip front')) {
                    details.push('- Chiusure: Zip frontale a tutta lunghezza.');
                } else if (desc.includes('half-zip')) {
                    details.push('- Chiusure: Mezza zip (Half-zip) sul colletto.');
                } else if (desc.includes('pullover')) {
                    details.push('- Chiusure: Nessuna (stile Pullover).');
                }
                if (desc.includes('button-up') || desc.includes('button placket')) {
                    details.push('- Chiusure: Bottoni frontali.');
                }
                if (desc.includes('hoodie') || desc.includes('cappuccio')) {
                    details.push('- Cappuccio: Cappuccio a doppio strato standard.');
                }
                if (desc.includes('crewneck') || desc.includes('girocollo')) {
                    details.push('- Colletto: Colletto a costine a girocollo.');
                }
                if (desc.includes('polo')) {
                    details.push('- Colletto: Colletto stile Polo con abbottonatura.');
                }
                 if (desc.includes('cargo') || desc.includes('side pockets')) {
                    details.push('- Tasche: Tasche laterali cargo applicate.');
                }

                details.push('- Polsini e Orlo: Costine elastiche standard.');
                details.push('- Cuciture: Cuciture standard tono su tono.');

                return details.join('\n');
            };

            const constructionDetails = getConstructionDetails(selectedProduct);
            
            const materialMap: { [key in MockupProduct['category']]: string } = {
                'Tops': 'Cotton Jersey 220gsm',
                'Felpe': 'Heavyweight Cotton Fleece 480gsm',
                'Outerwear': 'Technical Nylon Fabric',
                'Pantaloni': 'Durable Cotton Twill',
                'Accessori': 'Materiale appropriato per l\'articolo (es. Canvas per Tote Bag)',
            };
            const material = materialMap[selectedProduct.category] || 'Standard Fabric';


            const generationPromises = viewsToGenerate.map(viewId => {
                const viewNameMap: { [key: string]: string } = {
                    frontal: 'Vista Frontale Piatta',
                    retro: 'Vista Posteriore Piatta',
                    lato_dx: 'Vista Laterale Destra Piatta',
                    lato_sx: 'Vista Laterale Sinistra Piatta',
                };
                const viewName = viewNameMap[viewId] || 'Vista Frontale Piatta';

                const prompt = `RUOLO E OBIETTIVO:
Agisci come un esperto fashion designer e illustratore tecnico. Il tuo obiettivo è creare un mockup vettoriale professionale (technical flat) del capo di abbigliamento descritto di seguito. Il risultato deve essere pulito, scalabile e pronto per una scheda tecnica di produzione.

DESCRIZIONE CAPO PRINCIPALE:
- Tipo di Capo: ${selectedProduct.name}
- Vestibilità (Fit): ${fitDescription}
- Materiale Principale (per texture e resa): ${material}
- Colore Base: ${color}

DETTAGLI COSTRUTTIVI E COMPONENTI:
${constructionDetails}

VISTE RICHIESTE:
Genera la seguente vista del capo:
1. ${viewName}

STILE E OUTPUT:
- Stile Grafico: Linee nere pulite e definite. Usa ombreggiature (shading) minimali solo per dare un leggero senso di tridimensionalità e volume, concentrate sotto il colletto, le ascelle e le tasche. Il risultato DEVE essere un disegno tecnico pulito, non un mockup fotorealistico.
- Formato Output: Genera il file in formato **SVG (Scalable Vector Graphics)**.
- Struttura Layer (MANDATORIA): Devi strutturare l'SVG con i seguenti tag <g> usando questi esatti ID. L'ordine è dal basso verso l'alto.
    - \`<g id="Background_Layer">\`: Un semplice rettangolo per lo sfondo, colore: #FFFFFF (bianco).
    - \`<g id="Product_Base_Geometry">\`: I pannelli principali del tessuto del capo riempiti con il colore base specificato (${color}). Questo definisce la silhouette in base alla vestibilità.
    - \`<g id="Construction_Seams">\`: (Opzionale ma preferito) Linee tratteggiate che rappresentano le principali cuciture di costruzione.
    - \`<g id="Construction_Details">\`: (Se applicabile) Gruppi di forme per elementi fisici come tasche, cerniere, bottoni.
    - \`<g id="Pattern_Overlay">\`: Un tag <g> vuoto come placeholder per i pattern.
    - \`<g id="Shading_Lighting">\`: Forme sottili e semitrasparenti per dare un accenno di volume e profondità. Evita effetti fotorealistici.
    - \`<g id="User_Graphics">\`: Un tag <g> vuoto come placeholder per i design applicati dall'utente.
    - \`<g id="Finishing_Details">\`: (Opzionale) Piccoli dettagli come un'etichetta del brand all'interno del colletto.
- Regola Finale: Rispondi **SOLO con il codice SVG grezzo**. Non includere spiegazioni, formattazione markdown (\`\`\`svg), o qualsiasi altro testo al di fuori dei tag <svg>...</svg>.
`;
                
                return generateSvgMockup(prompt).then(svgResult => ({ viewId, svgResult }));
            });

            const results = await Promise.all(generationPromises);
            
            const newMockups = results.reduce((acc, { viewId, svgResult }) => {
                acc[viewId] = svgResult;
                return acc;
            }, {} as { [key: string]: string });

            setGeneratedMockups(newMockups);
            setActiveViewId(viewsToGenerate[0]);
            setStage('config');
            setStatusMessage(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setStage('config');
            setStatusMessage(null);
        }
    }, [selectedProduct, selectedCustomizations, color, selectedViews]);

    const handleApplyDesign = async () => {
         if (!generatedMockups || !designImage) {
            setError('Please generate a mockup and upload a design first.');
            return;
        }
        setStage('applying');
        setError(null);
        setStatusMessage('Starting design application...');
        
        try {
            const applicationPromises = Object.entries(generatedMockups).map(async ([viewId, svgData]: [string, string]) => {
                const mockupFile = new File([new Blob([svgData], { type: 'image/svg+xml' })], `${viewId}-mockup.svg`);
                const finalImageBase64 = await applyVectorToMockup(
                    mockupFile, 
                    designImage, 
                    applicationType, 
                    undefined, 
                    (status) => setStatusMessage(`[${viewId}] ${status}`)
                );
                return { viewId, finalImage: finalImageBase64 };
            });

            const results = await Promise.all(applicationPromises);

            const newFinalImages = results.reduce((acc, { viewId, finalImage }) => {
                acc[viewId] = finalImage;
                return acc;
            }, {} as { [key: string]: string });

            setFinalImages(newFinalImages);
            setStage('done');
            setStatusMessage(null);

        } catch(e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while applying the design.');
            setStage('config');
            setStatusMessage(null);
        }
    };

    const handleExport = async (format: 'svg' | 'png') => {
        if (!svgContainerRef.current || !generatedMockups || !generatedMockups[activeViewId]) return;

        if (format === 'svg') {
            const svgBlob = new Blob([generatedMockups[activeViewId]], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedProduct.name.replace(' ', '_')}_${activeViewId}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
             alert("PNG export requires a canvas rendering library, which is a planned feature.");
        }
    };
    
    const isLoading = ['generating', 'applying'].includes(stage);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl text-center">AI Mockup Studio (Vector)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Config Panel */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-4 self-start">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3">1. Seleziona Prodotto</h3>
                        <select 
                            value={selectedProductId} 
                            onChange={e => setSelectedProductId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white"
                        >
                            {productCategories.map(category => (
                                <optgroup label={category} key={category}>
                                    {products.filter(p => p.category === category).map(product => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Customizations */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedProduct.customizations?.map(cust => (
                            <div key={cust.id}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{cust.name}</label>
                                <select
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                                    value={selectedCustomizations[cust.id] || cust.defaultOptionId}
                                    onChange={(e) => handleCustomizationChange(cust.id, e.target.value)}
                                >
                                    {cust.options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    
                    {/* View Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3">2. Seleziona Viste</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries({frontal: 'Frontale', retro: 'Retro', lato_dx: 'Lato Destro', lato_sx: 'Lato Sinistro'}).map(([viewId, viewLabel]) => (
                                <label key={viewId} className="flex items-center p-2 bg-gray-700 rounded-md cursor-pointer has-[:checked]:bg-blue-600/50 has-[:checked]:ring-2 has-[:checked]:ring-blue-500 transition-all">
                                    <input 
                                        type="checkbox" 
                                        className="form-checkbox bg-gray-800 border-gray-600 rounded text-blue-500 focus:ring-blue-600"
                                        checked={selectedViews[viewId as keyof typeof selectedViews]} 
                                        onChange={e => setSelectedViews(p => ({...p, [viewId]: e.target.checked}))} 
                                    />
                                    <span className="ml-2 text-sm">{viewLabel}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Colors */}
                     <div>
                        <h3 className="text-lg font-bold text-white mb-3">3. Colore Base</h3>
                        <div className="flex items-center gap-4">
                           <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 p-1 bg-gray-700 rounded-lg" />
                           {activeBrand && (
                               <div className="flex gap-2">
                                   {Object.values(activeBrand.kit.colors).map((brandColor, index) => (
                                      <button
                                        key={index}
                                        onClick={() => setColor(brandColor)}
                                        className="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-white transition-all"
                                        style={{ backgroundColor: brandColor }}
                                        title={`Set color to ${brandColor}`}
                                      />
                                   ))}
                               </div>
                           )}
                        </div>
                    </div>

                     <div className="text-center border-t border-gray-700 pt-4">
                        <button onClick={handleGenerateMockup} disabled={isLoading} className="w-full inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500">
                            {isLoading ? <Spinner /> : 'Genera Mockup Vettoriale'}
                        </button>
                    </div>
                    
                    {/* Design Application */}
                    {generatedMockups && (
                         <div className="space-y-4 border-t border-gray-700 pt-4">
                             <label className="block text-sm font-medium text-gray-300">4. Carica Design</label>
                             <label className="w-full flex flex-col items-center justify-center p-4 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer">
                                 <UploadIcon />
                                 <span className="mt-2 text-sm text-gray-400">{designImage ? designImage.name : 'Click to upload'}</span>
                                 <input type="file" className="hidden" accept="image/*" onChange={(e) => setDesignImage(e.target.files ? e.target.files[0] : null)} />
                             </label>
                             <button onClick={handleApplyDesign} disabled={isLoading || !designImage} className="w-full inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500">
                                 {stage === 'applying' ? <Spinner /> : 'Applica Design'}
                             </button>
                         </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="bg-gray-800 p-4 rounded-xl shadow-2xl flex flex-col">
                    <div ref={svgContainerRef} className="w-full aspect-square bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden">
                        {isLoading ? <div className="text-center p-4"><Spinner large={true}/><p className="mt-4 text-gray-800 text-sm">{statusMessage || 'Processing...'}</p></div> : 
                         generatedMockups && generatedMockups[activeViewId] ? <SvgRenderer svgString={generatedMockups[activeViewId]} layerVisibility={layerVisibility} /> :
                         <p className="text-gray-400">Il tuo mockup vettoriale apparirà qui.</p>}
                    </div>
                    
                    {error && <div className="mt-4 bg-red-900/50 text-red-300 p-3 rounded-lg text-center text-sm">{error}</div>}

                    {generatedMockups && Object.keys(generatedMockups).length > 1 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {Object.keys(generatedMockups).map((viewId) => (
                                <div 
                                    key={viewId}
                                    onClick={() => setActiveViewId(viewId)}
                                    className={`p-1 rounded-lg cursor-pointer transition-all ${activeViewId === viewId ? 'ring-2 ring-blue-500 bg-blue-500/20' : 'bg-gray-900 hover:bg-gray-700'}`}
                                    title={`View ${viewId.replace('_', ' ')}`}
                                >
                                    <div 
                                        className="bg-white rounded p-1"
                                        dangerouslySetInnerHTML={{ __html: generatedMockups[viewId].replace(/<svg/g, `<svg class="w-full h-full object-contain"`) }} 
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {generatedMockups && (
                         <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="text-sm font-bold text-center text-gray-400 mb-2">Layers</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                {Object.entries(layerLabels).map(([layerId, label]) => (
                                    <label key={layerId} className="flex items-center p-2 bg-gray-700 rounded-md">
                                        <input type="checkbox" className="form-checkbox bg-gray-800 border-gray-600 rounded text-blue-500 focus:ring-blue-600" checked={layerVisibility[layerId] ?? true} onChange={e => setLayerVisibility(p => ({...p, [layerId]: e.target.checked}))} />
                                        <span className="ml-2 capitalize">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {stage === 'done' && finalImages && (
                        <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                             <h4 className="text-sm font-bold text-center text-gray-400 mb-2">Prodotto Finale</h4>
                              <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden">
                                {finalImages[activeViewId] && <img src={finalImages[activeViewId]} alt={`Final product - ${activeViewId}`} className="w-full h-full object-contain"/>}
                             </div>
                              {Object.keys(finalImages).length > 1 && (
                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    {Object.keys(finalImages).map((viewId) => (
                                        <div 
                                            key={viewId}
                                            onClick={() => setActiveViewId(viewId)}
                                            className={`p-1 rounded-lg cursor-pointer transition-all ${activeViewId === viewId ? 'ring-2 ring-blue-500' : 'bg-gray-900 hover:bg-gray-700'}`}
                                            title={`View ${viewId.replace('_', ' ')}`}
                                        >
                                            <img src={finalImages[viewId]} alt={`Thumbnail ${viewId}`} className="w-full h-full object-contain rounded"/>
                                        </div>
                                    ))}
                                </div>
                            )}

                             <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                 <button onClick={() => handleExport('svg')} className="flex items-center justify-center gap-2 p-2 bg-blue-600 rounded-md hover:bg-blue-700 text-sm"><DownloadIcon /> Export SVG</button>
                                <button onClick={() => setIsTechPackModalOpen(true)} className="flex items-center justify-center gap-2 p-2 bg-green-600 rounded-md hover:bg-green-700 text-sm"><DocumentTextIcon /> Tech Pack</button>
                                <button onClick={() => {if(finalImages?.[activeViewId]) setImageForEditing(finalImages[activeViewId]); setCurrentView('editor');}} className="flex items-center justify-center gap-2 p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 text-sm"><EditIcon /> Social Post</button>
                                <button onClick={() => setIsOrderModalOpen(true)} className="flex items-center justify-center gap-2 p-2 bg-purple-600 rounded-md hover:bg-purple-700 text-sm"><ShoppingCartIcon /> Order Print</button>
                                <button
                                    onClick={handleSaveMockup}
                                    className="flex col-span-full items-center justify-center gap-2 p-2 bg-teal-600 rounded-md hover:bg-teal-700 text-sm">
                                    <PlusIcon /> Save Mockup
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
             {isOrderModalOpen && finalImages && finalImages[activeViewId] && (
                <OrderModal 
                    isOpen={isOrderModalOpen}
                    onClose={() => setIsOrderModalOpen(false)}
                    productImage={finalImages[activeViewId]}
                    productDetails={{ id: selectedProduct.id, name: selectedProduct.name, color: color }}
                />
            )}
             {isTechPackModalOpen && (
                <TechPackModal
                    isOpen={isTechPackModalOpen}
                    onClose={() => setIsTechPackModalOpen(false)}
                    productDetails={selectedProduct}
                    finalImages={finalImages}
                    color={color}
                    designFile={designImage}
                    activeBrand={activeBrand}
                    copyForTechPack={copyForTechPack}
                />
            )}
        </div>
    );
};