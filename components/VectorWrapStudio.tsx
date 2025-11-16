import React, { useState, useCallback, useEffect, useMemo } from 'react';
import saveAs from 'file-saver';
import { applyVectorToMockup, generateMockupViews, generateVectorGraphic, generateDesignPrompt } from '../services/geminiService';
import { trackEvent } from '../services/analytics';
import { sanitizeSvgInput, optimizeSvgOutput } from '../services/vectorService';
import { Spinner } from './Spinner';
import { UploadIcon, DownloadIcon, WandIcon, ThumbsUpIcon, ThumbsDownIcon, RefreshIcon, EditIcon } from './Icons';
import type { ApplicationType, MockupProduct, MockupView } from '../types';
import { productCategories, products } from './mockup/data';
import * as ProductIcons from './mockup/icons';

const MAX_MOCKUP_SIZE_MB = 5;
const MAX_DESIGN_SIZE_MB = 2;

const base64ToFile = (base64: string, filename: string): Promise<File> => {
    return fetch(base64)
        .then(res => res.blob())
        .then(blob => new File([blob], filename, { type: blob.type }));
};

const viewDisplayNames: Record<MockupView, string> = {
    frontal: 'Frontale',
    retro: 'Retro',
};


const FileInput: React.FC<{
  onFileSelect: (file: File) => void;
  title: string;
  file: File | null;
  maxSizeMB: number;
}> = ({ onFileSelect, title, file, maxSizeMB }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        alert(`Error: File size cannot exceed ${maxSizeMB}MB.`);
        return;
      }
      if (!['image/svg+xml', 'image/png', 'image/jpeg'].includes(selectedFile.type)) {
        alert('Error: Invalid file type. Please upload SVG, PNG, or JPG.');
        return;
      }
      onFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
      <label
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full flex flex-col items-center justify-center p-4 bg-gray-700 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-gray-600' : 'border-gray-500 hover:border-gray-400'}`}
      >
        <UploadIcon className="h-8 w-8 text-gray-500"/>
        <span className="mt-2 text-sm text-center text-gray-400">
          {file ? file.name : `Drag & drop, or click`}
        </span>
        <span className="mt-1 text-xs text-gray-500">Max {maxSizeMB}MB</span>
        <input
          type="file"
          className="hidden"
          accept="image/svg+xml,image/png,image/jpeg"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </label>
  );
};

const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = ProductIcons;

const GenerationPanel: React.FC<{
    title: string;
    prompt?: string;
    setPrompt?: (p: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    generatedImage?: string | null;
    generatedImages?: Record<MockupView, string> | null;
    selectedMockupView?: MockupView;
    setSelectedMockupView?: (view: MockupView) => void;
    uploadedFile: File | null;
    source: 'upload' | 'generate';
    setSource: (s: 'upload' | 'generate') => void;
    onFileSelect: (f: File) => void;
    maxSizeMB: number;
    isMockupPanel?: boolean;
    selectedCategory?: MockupProduct['category'];
    setSelectedCategory?: (category: MockupProduct['category']) => void;
    selectedProduct?: MockupProduct | null;
    setSelectedProduct?: (product: MockupProduct) => void;
    mockupColor?: string;
    setMockupColor?: (color: string) => void;
    mockupCustomizations?: { [key: string]: string };
    setMockupCustomization?: (customizationId: string, optionId: string) => void;
    onGenerateIdea?: () => void;
    isGeneratingIdea?: boolean;
    onDownloadBlank?: () => void;
}> = ({ 
    title, prompt, setPrompt, onGenerate, isLoading, generatedImage, generatedImages, selectedMockupView, setSelectedMockupView, uploadedFile, source, setSource, onFileSelect, maxSizeMB,
    isMockupPanel, selectedCategory, setSelectedCategory, selectedProduct, setSelectedProduct, mockupColor, setMockupColor, mockupCustomizations, setMockupCustomization,
    onGenerateIdea, isGeneratingIdea, onDownloadBlank
}) => {
    const displayImage = isMockupPanel 
        ? (uploadedFile ? URL.createObjectURL(uploadedFile) : (generatedImages && selectedMockupView ? generatedImages[selectedMockupView] : null))
        : (uploadedFile ? URL.createObjectURL(uploadedFile) : generatedImage);

    const filteredProducts = products.filter(p => p.category === selectedCategory);
    
    const anyDesignLoading = isLoading || isGeneratingIdea;

    return (
        <div className="bg-gray-800 p-4 rounded-xl flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-3 text-center">{title}</h3>
            <div className="flex justify-center mb-3 bg-gray-900 rounded-lg p-1">
                <button onClick={() => setSource('generate')} className={`px-4 py-1 text-sm rounded-md ${source === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Generate AI</button>
                <button onClick={() => setSource('upload')} className={`px-4 py-1 text-sm rounded-md ${source === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Upload</button>
            </div>
            
            <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden mb-3">
                 {isLoading || isGeneratingIdea ? (
                    <div className="text-center">
                        <Spinner large />
                        <p className="mt-2 text-sm text-gray-400">{isMockupPanel ? 'Generating views...' : 'Generating...'}</p>
                    </div>
                ) : displayImage ? (
                    <img src={displayImage} alt="Asset" className="w-full h-full object-contain" />
                ) : (
                    <p className="text-gray-500 text-sm p-4 text-center">Your asset will appear here</p>
                )}
            </div>
            
            {isMockupPanel && generatedImages && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {(Object.keys(generatedImages) as MockupView[]).map(view => (
                        <button 
                            key={view}
                            onClick={() => setSelectedMockupView?.(view)}
                            className={`aspect-square rounded-md overflow-hidden ring-2 transition-all ${selectedMockupView === view ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-500'}`}
                            title={`View ${viewDisplayNames[view]}`}
                        >
                            <img src={generatedImages[view]} alt={`${view} view`} className="w-full h-full object-contain bg-gray-700" />
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-grow flex flex-col">
                {source === 'generate' ? (
                    isMockupPanel ? (
                        <div className="flex-grow flex flex-col space-y-3">
                            {/* Category Tabs */}
                            <div className="flex flex-wrap gap-1 bg-gray-900 p-1 rounded-lg">
                                {productCategories.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setSelectedCategory?.(cat)}
                                        className={`flex-1 px-2 py-1 text-xs rounded-md ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                    >{cat}</button>
                                ))}
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-48 pr-2">
                               {filteredProducts.map(prod => {
                                   const IconComponent = iconMap[prod.icon];
                                   return (
                                        <button key={prod.id} onClick={() => setSelectedProduct?.(prod)} className={`p-2 flex flex-col items-center gap-1 rounded-lg transition-colors text-center ${selectedProduct?.id === prod.id ? 'bg-blue-600/50 ring-2 ring-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {IconComponent && <IconComponent className="w-6 h-6" />}
                                            <span className="text-xs leading-tight">{prod.name}</span>
                                        </button>
                                   );
                               })}
                            </div>

                             {/* Customizations & Color */}
                            <div className="flex flex-col space-y-2">
                               {selectedProduct?.customizations?.map(cust => (
                                   <div key={cust.id}>
                                       <label className="text-xs font-bold text-gray-300">{cust.name}</label>
                                       <div className="flex gap-1 bg-gray-900 p-1 rounded-lg mt-1">
                                           {cust.options.map(opt => (
                                               <button 
                                                    key={opt.id}
                                                    onClick={() => setMockupCustomization?.(cust.id, opt.id)}
                                                    className={`flex-1 px-2 py-1 text-xs rounded-md ${mockupCustomizations?.[cust.id] === opt.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                               >{opt.name}</button>
                                           ))}
                                       </div>
                                   </div>
                               ))}
                                <div>
                                    <label className="text-xs font-bold text-gray-300">Colore</label>
                                    <input type="color" value={mockupColor} onChange={(e) => setMockupColor?.(e.target.value)} className="w-full h-8 mt-1 bg-gray-700 border border-gray-600 rounded-lg p-1 cursor-pointer"/>
                                </div>
                            </div>

                            <div className="mt-auto flex flex-col gap-2">
                                <button onClick={onGenerate} disabled={isLoading || !selectedProduct} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-600">
                                    {isLoading ? <Spinner /> : <><WandIcon /> Genera Mockup</>}
                                </button>
                                {onDownloadBlank && (
                                    <button 
                                        onClick={onDownloadBlank} 
                                        disabled={!generatedImages} 
                                        className="w-full flex items-center justify-center gap-2 p-2 text-xs font-bold bg-gray-600 hover:bg-gray-500 rounded-lg disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    >
                                        <DownloadIcon className="w-4 h-4" /> Download Mockup
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt?.(e.target.value)}
                                placeholder={`e.g., roaring tiger logo, line art`}
                                className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white mb-2 flex-grow"
                                disabled={anyDesignLoading}
                            />
                            <div className="flex flex-col gap-2">
                                <button onClick={onGenerate} disabled={anyDesignLoading || !prompt} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-600">
                                    {isLoading ? <Spinner /> : <><EditIcon className="w-5 h-5" /> Generate from Prompt</>}
                                </button>
                                <button onClick={onGenerateIdea} disabled={anyDesignLoading} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-600">
                                    {isGeneratingIdea ? <Spinner /> : <><WandIcon /> Generate with AI</>}
                                </button>
                            </div>
                        </>
                    )
                ) : (
                    <FileInput onFileSelect={onFileSelect} title="" file={uploadedFile} maxSizeMB={maxSizeMB} />
                )}
            </div>
        </div>
    );
};


export const MockupStudio: React.FC = () => {
    // Input states
    const [mockupFile, setMockupFile] = useState<File | null>(null);
    const [designFile, setDesignFile] = useState<File | null>(null);
    const [mockupSource, setMockupSource] = useState<'upload' | 'generate'>('generate');
    const [designSource, setDesignSource] = useState<'upload' | 'generate'>('generate');
    const [designPrompt, setDesignPrompt] = useState<string>('minimalist roaring tiger logo, line art style, on transparent background');
    
    // New Mockup Generation State
    const [selectedCategory, setSelectedCategory] = useState<MockupProduct['category']>(productCategories[0]);
    const [selectedProduct, setSelectedProduct] = useState<MockupProduct | null>(products.find(p => p.id === 'hoodie-classic') || products[0]);
    const [mockupColor, setMockupColor] = useState<string>('#111827');
    const [mockupCustomizations, setMockupCustomizations] = useState<{ [key: string]: string }>({});

    // Generated asset states
    const [generatedMockups, setGeneratedMockups] = useState<Record<MockupView, string> | null>(null);
    const [selectedMockupView, setSelectedMockupView] = useState<MockupView>('frontal');
    const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);

    // Final result states
    const [applicationType, setApplicationType] = useState<ApplicationType>('Print');
    const [placement, setPlacement] = useState<string>('');
    const [resultImages, setResultImages] = useState<Partial<Record<MockupView, string>>>({});
    const [viewForApplication, setViewForApplication] = useState<MockupView>('frontal');
    
    // Loading and error states
    const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
    const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    const [isApplyingDesign, setIsApplyingDesign] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Feedback states
    const [userRating, setUserRating] = useState<'good' | 'bad' | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    
    const availablePlacements = useMemo(() => {
        if (!selectedProduct?.printArea) return [];
        return selectedProduct.printArea.split(',').map(p => p.trim());
    }, [selectedProduct]);

    useEffect(() => {
        if (availablePlacements.length > 0) {
            setPlacement(availablePlacements[0]);
        } else {
            setPlacement('');
        }
    }, [availablePlacements]);

    useEffect(() => {
        // Set default product for the newly selected category
        const firstProductInCategory = products.find(p => p.category === selectedCategory);
        setSelectedProduct(firstProductInCategory || null);
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedProduct?.customizations) {
            const defaults = selectedProduct.customizations.reduce((acc, cust) => {
                acc[cust.id] = cust.defaultOptionId;
                return acc;
            }, {} as {[key: string]: string});
            setMockupCustomizations(defaults);
        } else {
            setMockupCustomizations({});
        }
    }, [selectedProduct]);

    const handleSetCustomization = (customizationId: string, optionId: string) => {
        setMockupCustomizations(prev => ({ ...prev, [customizationId]: optionId }));
    };

    const hasMockup = mockupFile || generatedMockups;
    const hasDesign = designFile || generatedDesign;
    const canApply = hasMockup && hasDesign && !!placement && !isApplyingDesign && !isGeneratingMockup && !isGeneratingDesign && !isGeneratingIdea;

    const handleGenerateMockup = useCallback(async () => {
        if (!selectedProduct) {
            setError("Please select a product to generate.");
            return;
        }

        setIsGeneratingMockup(true);
        setError(null);
        setMockupFile(null);
        setGeneratedMockups(null);
        setResultImages({});

        const promptParts = [];

        // Start with a clear description of the product and its color
        promptParts.push(`${selectedProduct.description} in the color ${mockupColor}`);
        
        // Add details about fit and other customizations
        if (selectedProduct.customizations) {
            selectedProduct.customizations.forEach(customization => {
                const selectedOptionId = mockupCustomizations[customization.id];
                const selectedOption = customization.options.find(opt => opt.id === selectedOptionId);
                if (selectedOption) {
                    promptParts.push(selectedOption.description);
                }
            });
        } else if (selectedProduct.fit !== 'N/A') {
            promptParts.push(selectedProduct.fit);
        }

        const finalPrompt = promptParts.join(', ');

        try {
            const results = await generateMockupViews(finalPrompt, selectedProduct.category);
            setGeneratedMockups(results);
            setSelectedMockupView('frontal'); // Default to front view
            trackEvent('ai_mockup_generated', { 
                product: selectedProduct.name, 
                color: mockupColor,
                customizations: mockupCustomizations 
            });
        } catch(e) {
            setError(e instanceof Error ? e.message : 'Failed to generate mockup');
        } finally {
            setIsGeneratingMockup(false);
        }
    }, [selectedProduct, mockupColor, mockupCustomizations]);

    const handleDownloadMockup = useCallback(() => {
        if (generatedMockups && selectedMockupView) {
            const imageToDownload = generatedMockups[selectedMockupView];
            const product = selectedProduct?.name.replace(/\s+/g, '-') || 'product';
            const view = selectedMockupView;
            saveAs(imageToDownload, `blank-mockup-${product}-${view}.png`);
            trackEvent('blank_mockup_downloaded', { view: selectedMockupView, product: selectedProduct?.name });
        }
    }, [generatedMockups, selectedMockupView, selectedProduct]);

    const handleGenerateDesign = useCallback(async () => {
        setIsGeneratingDesign(true);
        setError(null);
        setDesignFile(null);
        setGeneratedDesign(null);
        setResultImages({});
        try {
            const result = await generateVectorGraphic(designPrompt);
            setGeneratedDesign(result);
            trackEvent('ai_design_generated');
        } catch(e) {
            setError(e instanceof Error ? e.message : 'Failed to generate design');
        } finally {
            setIsGeneratingDesign(false);
        }
    }, [designPrompt]);

    const handleGenerateAIDesign = useCallback(async () => {
        if (!selectedProduct) {
            setError("Please select a mockup product first.");
            return;
        }
        setIsGeneratingIdea(true);
        setError(null);
        setDesignFile(null);
        setGeneratedDesign(null);
        setResultImages({});
        try {
            const newPrompt = await generateDesignPrompt(selectedProduct.name);
            setDesignPrompt(newPrompt);
            const result = await generateVectorGraphic(newPrompt);
            setGeneratedDesign(result);
            trackEvent('ai_design_idea_generated', { product: selectedProduct.name });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to generate AI design';
            setError(errorMessage);
            trackEvent('ai_design_idea_failed', { product: selectedProduct.name, error: errorMessage });
        } finally {
            setIsGeneratingIdea(false);
        }
    }, [selectedProduct]);


    const handleApplyDesign = useCallback(async (feedback?: string) => {
        if (!canApply || !placement) return;
        
        if (feedback) {
            trackEvent('regeneration_started', { type: applicationType, feedback_length: feedback.length, placement });
            setStatusMessage('Applying your feedback...');
        } else {
            trackEvent('generation_started', { type: applicationType, placement });
            setStatusMessage('Preparing assets...');
        }
        
        setIsApplyingDesign(true);
        setError(null);
        setResultImages(prev => ({...prev, [viewForApplication]: undefined }));
        setUserRating(null);

        try {
            const mockupSourceImage = mockupFile 
                ? mockupFile 
                : (generatedMockups?.[viewForApplication] 
                    ? await base64ToFile(generatedMockups[viewForApplication], 'mockup.png') 
                    : null);

            if (!mockupSourceImage) {
                throw new Error('No mockup source available for the selected view.');
            }

            let designForApi = designFile ? designFile : await base64ToFile(generatedDesign!, 'design.png');
            
            designForApi = await sanitizeSvgInput(designForApi);

            const generatedImage = await applyVectorToMockup(
                mockupSourceImage,
                designForApi,
                applicationType,
                placement,
                setStatusMessage,
                feedback
            );
            
            const optimizedImage = await optimizeSvgOutput(generatedImage);

            setResultImages(prev => ({...prev, [viewForApplication]: optimizedImage }));
            setFeedbackText(''); // Clear feedback after use
            trackEvent('generation_succeeded', { type: applicationType, is_regeneration: !!feedback });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            trackEvent('generation_failed', { type: applicationType, error: errorMessage });
        } finally {
            setIsApplyingDesign(false);
            setStatusMessage(null);
        }
    }, [mockupFile, designFile, generatedMockups, generatedDesign, applicationType, placement, canApply, viewForApplication]);
  
    const handleDownload = () => {
        if (!resultImages[viewForApplication]) return;
        trackEvent('result_downloaded', { view: viewForApplication });
        saveAs(resultImages[viewForApplication]!, `vectormockup_result_${viewForApplication}_${Date.now()}.png`);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 bg-gray-900/50 p-6 rounded-xl shadow-2xl border border-gray-700">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">VectorMockupAi</h2>
                <p className="mt-2 text-gray-400">Generate both your mockup and your design from text, or upload your own.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Mockup Panel */}
                <GenerationPanel 
                    title="1. Mockup"
                    onGenerate={handleGenerateMockup}
                    isLoading={isGeneratingMockup}
                    generatedImages={generatedMockups}
                    selectedMockupView={selectedMockupView}
                    setSelectedMockupView={setSelectedMockupView}
                    uploadedFile={mockupFile}
                    source={mockupSource}
                    setSource={(s) => { setMockupSource(s); setGeneratedMockups(null); setMockupFile(null); setResultImages({}); }}
                    onFileSelect={(f) => { setMockupFile(f); setGeneratedMockups(null); setResultImages({}); }}
                    maxSizeMB={MAX_MOCKUP_SIZE_MB}
                    isMockupPanel={true}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    mockupColor={mockupColor}
                    setMockupColor={setMockupColor}
                    mockupCustomizations={mockupCustomizations}
                    setMockupCustomization={handleSetCustomization}
                    onDownloadBlank={handleDownloadMockup}
                />

                {/* Design Panel */}
                <GenerationPanel 
                    title="2. Design"
                    prompt={designPrompt}
                    setPrompt={setDesignPrompt}
                    onGenerate={handleGenerateDesign}
                    isLoading={isGeneratingDesign}
                    generatedImage={generatedDesign}
                    uploadedFile={designFile}
                    source={designSource}
                    setSource={(s) => { setDesignSource(s); setGeneratedDesign(null); setDesignFile(null); setResultImages({}); }}
                    onFileSelect={(f) => { setDesignFile(f); setGeneratedDesign(null); setResultImages({}); }}
                    maxSizeMB={MAX_DESIGN_SIZE_MB}
                    onGenerateIdea={handleGenerateAIDesign}
                    isGeneratingIdea={isGeneratingIdea}
                />

                {/* Results Panel */}
                <div className="bg-gray-800 p-4 rounded-xl flex flex-col h-full space-y-3">
                    <h3 className="text-lg font-bold text-white text-center">3. Final Result</h3>
                     <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden p-2">
                        {isApplyingDesign && (
                            <div className="text-center">
                                <Spinner large={true}/>
                                <p className="mt-4 text-gray-300 text-sm animate-pulse">{statusMessage || 'Applying design...'}</p>
                            </div>
                        )}
                        {error && <div className="text-red-400 p-4 text-center text-sm">{error}</div>}
                        {resultImages[viewForApplication] && !isApplyingDesign && <img src={resultImages[viewForApplication]} alt="Generated mockup" className="w-full h-full object-contain"/>}
                        {!isApplyingDesign && !resultImages[viewForApplication] && !error && <p className="text-gray-500 text-sm">Your result will appear here</p>}
                    </div>
                    
                    {Object.values(resultImages).some(Boolean) && (
                         <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(viewDisplayNames) as MockupView[]).map(view => (
                                <button 
                                    key={view}
                                    onClick={() => setViewForApplication(view)}
                                    className={`relative aspect-square rounded-md overflow-hidden ring-2 transition-all ${viewForApplication === view ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-500'}`}
                                    title={`View ${viewDisplayNames[view]}`}
                                >
                                    {resultImages[view] ? (
                                        <img src={resultImages[view]} alt={`${view} result`} className="w-full h-full object-contain bg-gray-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700/50 flex items-center justify-center text-xs text-gray-500 p-1 text-center">
                                            {generatedMockups?.[view] || mockupFile ? 'Apply Design' : 'N/A'}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="space-y-3">
                         <div>
                            <h4 className="text-sm font-bold text-white mb-2">Vista da modificare</h4>
                            <select
                                value={viewForApplication}
                                onChange={(e) => setViewForApplication(e.target.value as MockupView)}
                                disabled={!hasMockup || !!mockupFile}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {mockupFile ? (
                                    <option value="frontal">{viewDisplayNames.frontal}</option>
                                ) : (
                                    (Object.keys(viewDisplayNames) as MockupView[]).map(view => (
                                         <option key={view} value={view}>{viewDisplayNames[view]}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-2">Application Type</h4>
                            <div className="flex gap-2">
                                {(['Print', 'Embroidery'] as ApplicationType[]).map(type => (
                                    <label key={type} className="flex-1">
                                    <input
                                        type="radio"
                                        name="applicationType"
                                        value={type}
                                        checked={applicationType === type}
                                        onChange={() => setApplicationType(type)}
                                        className="sr-only"
                                    />
                                    <div className={`p-3 rounded-lg text-center text-sm cursor-pointer transition-all ${applicationType === type ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {type}
                                    </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-2">Posizionamento Grafica</h4>
                            <select
                                value={placement}
                                onChange={(e) => setPlacement(e.target.value)}
                                disabled={!hasMockup || availablePlacements.length === 0}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {availablePlacements.length > 0 ? (
                                    availablePlacements.map(p => <option key={p} value={p}>{p}</option>)
                                ) : (
                                    <option>N/A for this product</option>
                                )}
                            </select>
                        </div>
                    </div>
                     <div className="flex-grow flex flex-col justify-end">
                        {resultImages[viewForApplication] && !isApplyingDesign ? (
                            <div className="space-y-3 pt-3 border-t border-gray-700">
                                <h4 className="text-sm font-bold text-white text-center">Come valuti il risultato?</h4>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => setUserRating('good')} title="Good" className={`p-3 rounded-full transition-colors ${userRating === 'good' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        <ThumbsUpIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setUserRating('bad')} title="Bad" className={`p-3 rounded-full transition-colors ${userRating === 'bad' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        <ThumbsDownIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                {userRating === 'bad' && (
                                    <div className="space-y-2 animate-fade-in">
                                        <textarea 
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="Cosa possiamo migliorare? (es. logo più grande, ricamo più scuro)"
                                            className="w-full h-20 bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white"
                                        />
                                        <button
                                            onClick={() => handleApplyDesign(feedbackText)}
                                            disabled={!feedbackText || isApplyingDesign}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
                                        >
                                            <RefreshIcon className="w-5 h-5" /> Rigenera con Feedback
                                        </button>
                                    </div>
                                )}
                                
                                <button
                                    onClick={handleDownload}
                                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                >
                                    <DownloadIcon /> Download
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleApplyDesign()}
                                disabled={!canApply}
                                className="w-full inline-flex items-center justify-center px-6 py-4 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {isApplyingDesign ? <Spinner /> : 'Apply Design'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};