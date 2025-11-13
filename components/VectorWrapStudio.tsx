import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { applyVectorToMockup, generateSvgMockup } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, ShoppingCartIcon, DownloadIcon, WandIcon, DocumentTextIcon, EditIcon, PlusIcon } from './Icons';
import { products, productCategories } from './mockup/data';
import * as ProductIcons from './mockup/icons';
import type { MockupProduct } from './mockup/data';
import { OrderModal } from './OrderModal';
import { TechPackModal } from './TechPackModal';
import type { View, Brand, SavedProduct } from '../types';

// Helper to render SVG string safely
const SvgRenderer: React.FC<{ svgString: string, layerVisibility: {[key: string]: boolean} }> = ({ svgString, layerVisibility }) => {
    const styleString = Object.entries(layerVisibility)
        .map(([layerId, isVisible]) => `[id='${layerId}'] { display: ${isVisible ? 'block' : 'none'}; }`)
        .join(' ');
    
    // Inject style tag into SVG string
    const finalSvg = svgString.replace('</svg>', `<style>${styleString}</style></svg>`);

    return <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: finalSvg }} />;
};

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export const MockupStudio: React.FC<{
    setCurrentView: (view: View) => void;
    setImageForEditing: (image: string) => void;
    activeBrand: Brand | null;
    addProductToBrand: (brandId: string, product: SavedProduct) => void;
}> = ({ setCurrentView, setImageForEditing, activeBrand, addProductToBrand }) => {
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
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isTechPackModalOpen, setIsTechPackModalOpen] = useState(false);
    
    const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({
        'Background_Layer': true,
        'Product_Base_Geometry': true,
        'Pattern_Overlay': true,
        'Shading_Lighting': true,
        'User_Graphics': true,
    });

    const layerLabels: { [key: string]: string } = {
        'Product_Base_Geometry': 'Base',
        'Shading_Lighting': 'Ombre',
        'Pattern_Overlay': 'Patterns',
        'User_Graphics': 'Grafiche',
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
        
        try {
            const fitOption = selectedProduct.customizations?.find(c => c.id === 'fit')?.options.find(o => o.id === selectedCustomizations['fit']);
            const fitDescription = fitOption?.description || selectedProduct.fit;

            const generationPromises = viewsToGenerate.map(viewId => {
                const viewNameMap: { [key: string]: string } = {
                    frontal: 'Frontal view',
                    retro: 'Back view',
                    lato_dx: 'Right side view',
                    lato_sx: 'Left side view',
                };
                const viewName = viewNameMap[viewId] || 'Frontal view';

                const prompt = `Act as a Virtual Graphic Production Director for Fashion Design. Your task is to generate a professional, realistic vector mockup SVG of a ${selectedProduct.name}.

**PRODUCT SPECIFICATIONS:**
- **Product:** ${selectedProduct.name}
- **Fit:** ${fitDescription}. This is critical for the geometry and proportions.
- **Base Color:** ${color}.
- **View:** ${viewName}.

**SVG STRUCTURE & STYLE REQUIREMENTS (MANDATORY):**

1.  **REALISM > FLAT:** The output MUST be a realistic mockup with natural fabric folds, soft shadows, and subtle lighting to give it a 3D appearance. **DO NOT create a flat technical sketch.** It should look like a real garment photographed cleanly in a studio setting.

2.  **SIMPLIFIED LAYERED SVG HIERARCHY:** You MUST structure the SVG with the following <g> tags, using these **exact IDs**. The order is from bottom to top. Focus on the overall shape and realism, omitting fine construction details like seams or labels.
    - \`<g id="Background_Layer">\`: A simple rectangle for the background, color: #f3f4f6 (light gray).
    - \`<g id="Product_Base_Geometry">\`: The main fabric panels of the garment filled with the specified base color (${color}). This defines the shape based on the fit.
    - \`<g id="Pattern_Overlay">\`: An empty group tag as a placeholder.
    - \`<g id="Shading_Lighting">\`: **THIS IS THE MOST IMPORTANT LAYER FOR REALISM.** Add soft gradients (radial and linear), highlights, and shadows to simulate fabric folds and create depth. Use subtle black/white gradients with low opacity (e.g., 0.1-0.3).
    - \`<g id="User_Graphics">\`: An empty group tag as a placeholder for user-applied designs.

3.  **OUTPUT FORMAT:** Respond with **ONLY the raw SVG code**. Do not include any explanations, markdown formatting (\`\`\`svg), or any other text outside the <svg>...</svg> tags.
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
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setStage('config');
        }
    }, [selectedProduct, selectedCustomizations, color, selectedViews]);

    const handleApplyDesign = async () => {
         if (!generatedMockups || !designImage) {
            setError('Please generate a mockup and upload a design first.');
            return;
        }
        setStage('applying');
        setError(null);
        
        try {
            // FIX: Explicitly type `[viewId, svgData]` to resolve a type inference issue where `svgData` was treated as `unknown`.
            const applicationPromises = Object.entries(generatedMockups).map(async ([viewId, svgData]: [string, string]) => {
                const mockupFile = new File([new Blob([svgData], { type: 'image/svg+xml' })], `${viewId}-mockup.svg`);
                const finalImageBase64 = await applyVectorToMockup(mockupFile, designImage, applicationType);
                return { viewId, finalImage: finalImageBase64 };
            });

            const results = await Promise.all(applicationPromises);

            const newFinalImages = results.reduce((acc, { viewId, finalImage }) => {
                acc[viewId] = finalImage;
                return acc;
            }, {} as { [key: string]: string });

            setFinalImages(newFinalImages);
            setStage('done');

        } catch(e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while applying the design.');
            setStage('config');
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
                        <div className="flex gap-4">
                            <div>
                                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 p-1 bg-gray-700 rounded-lg" />
                            </div>
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
                    <div ref={svgContainerRef} className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden">
                        {isLoading ? <div className="text-center"><Spinner large={true}/><p className="mt-4">Generating realistic mockup...</p></div> : 
                         generatedMockups && generatedMockups[activeViewId] ? <SvgRenderer svgString={generatedMockups[activeViewId]} layerVisibility={layerVisibility} /> :
                         <p className="text-gray-400">Il tuo mockup vettoriale apparirà qui.</p>}
                    </div>
                    
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
                                        <input type="checkbox" className="form-checkbox bg-gray-800 border-gray-600 rounded text-blue-500 focus:ring-blue-600" checked={layerVisibility[layerId]} onChange={e => setLayerVisibility(p => ({...p, [layerId]: e.target.checked}))} />
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
                                 {activeBrand && (
                                    <button onClick={async () => {
                                        if (finalImages?.[activeViewId]) {
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
                                            alert(`"${product.productName}" salvato nel Brand Hub di "${activeBrand.name}"!`);
                                        }
                                    }} className="flex col-span-full items-center justify-center gap-2 p-2 bg-teal-600 rounded-md hover:bg-teal-700 text-sm"><PlusIcon /> Salva nel Brand Hub</button>
                                )}
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
                />
            )}
        </div>
    );
};
