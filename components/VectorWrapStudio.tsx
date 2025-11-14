import React, { useState, useCallback } from 'react';
import saveAs from 'file-saver';
import { applyVectorToMockup, generateBlankMockup, generateVectorGraphic } from '../services/geminiService';
import { trackEvent } from '../services/analytics';
import { sanitizeSvgInput, optimizeSvgOutput } from '../services/vectorService';
import { Spinner } from './Spinner';
import { UploadIcon, DownloadIcon, WandIcon } from './Icons';
import type { ApplicationType } from '../types';

const MAX_MOCKUP_SIZE_MB = 5;
const MAX_DESIGN_SIZE_MB = 2;

const base64ToFile = (base64: string, filename: string): Promise<File> => {
    return fetch(base64)
        .then(res => res.blob())
        .then(blob => new File([blob], filename, { type: blob.type }));
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

const GenerationPanel: React.FC<{
    title: string;
    prompt: string;
    setPrompt: (p: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    generatedImage: string | null;
    uploadedFile: File | null;
    source: 'upload' | 'generate';
    setSource: (s: 'upload' | 'generate') => void;
    onFileSelect: (f: File) => void;
    maxSizeMB: number;
}> = ({ title, prompt, setPrompt, onGenerate, isLoading, generatedImage, uploadedFile, source, setSource, onFileSelect, maxSizeMB }) => {
    const displayImage = uploadedFile ? URL.createObjectURL(uploadedFile) : generatedImage;

    return (
        <div className="bg-gray-800 p-4 rounded-xl flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-3 text-center">{title}</h3>
            <div className="flex justify-center mb-3 bg-gray-900 rounded-lg p-1">
                <button onClick={() => setSource('generate')} className={`px-4 py-1 text-sm rounded-md ${source === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Generate AI</button>
                <button onClick={() => setSource('upload')} className={`px-4 py-1 text-sm rounded-md ${source === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Upload</button>
            </div>
            
            <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden mb-3">
                 {isLoading ? (
                    <div className="text-center">
                        <Spinner large />
                        <p className="mt-2 text-sm text-gray-400">Generating...</p>
                    </div>
                ) : displayImage ? (
                    <img src={displayImage} alt="Asset" className="w-full h-full object-contain" />
                ) : (
                    <p className="text-gray-500 text-sm p-4 text-center">Your asset will appear here</p>
                )}
            </div>
            
            <div className="flex-grow flex flex-col">
                {source === 'generate' ? (
                    <>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={`e.g., ${title === '1. Mockup' ? 'white t-shirt, classic fit' : 'roaring tiger logo, line art'}`}
                            className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white mb-2 flex-grow"
                        />
                        <button onClick={onGenerate} disabled={isLoading || !prompt} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-600">
                            {isLoading ? <Spinner /> : <><WandIcon /> Generate {title.split('. ')[1]}</>}
                        </button>
                    </>
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
    const [mockupPrompt, setMockupPrompt] = useState<string>('black hoodie, classic fit, vector illustration');
    const [designPrompt, setDesignPrompt] = useState<string>('minimalist roaring tiger logo, line art style, on transparent background');
    
    // Generated asset states
    const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
    const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);

    // Final result states
    const [applicationType, setApplicationType] = useState<ApplicationType>('Print');
    const [resultImage, setResultImage] = useState<string | null>(null);
    
    // Loading and error states
    const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
    const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
    const [isApplyingDesign, setIsApplyingDesign] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    
    const hasMockup = mockupFile || generatedMockup;
    const hasDesign = designFile || generatedDesign;
    const canApply = hasMockup && hasDesign && !isApplyingDesign && !isGeneratingMockup && !isGeneratingDesign;

    const handleGenerateMockup = useCallback(async () => {
        setIsGeneratingMockup(true);
        setError(null);
        setMockupFile(null);
        setGeneratedMockup(null);
        try {
            const result = await generateBlankMockup(mockupPrompt);
            setGeneratedMockup(result);
            trackEvent('ai_mockup_generated');
        } catch(e) {
            setError(e instanceof Error ? e.message : 'Failed to generate mockup');
        } finally {
            setIsGeneratingMockup(false);
        }
    }, [mockupPrompt]);

    const handleGenerateDesign = useCallback(async () => {
        setIsGeneratingDesign(true);
        setError(null);
        setDesignFile(null);
        setGeneratedDesign(null);
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

    const handleApplyDesign = useCallback(async () => {
        if (!canApply) return;
        
        trackEvent('generation_started', { type: applicationType });
        setIsApplyingDesign(true);
        setError(null);
        setResultImage(null);
        setStatusMessage('Preparing assets...');

        try {
            const mockupForApi = mockupFile ? mockupFile : await base64ToFile(generatedMockup!, 'mockup.png');
            let designForApi = designFile ? designFile : await base64ToFile(generatedDesign!, 'design.png');
            
            // Placeholder for backend processing
            designForApi = await sanitizeSvgInput(designForApi);

            const generatedImage = await applyVectorToMockup(
                mockupForApi,
                designForApi,
                applicationType,
                setStatusMessage
            );
            
            // Placeholder for backend processing
            const optimizedImage = await optimizeSvgOutput(generatedImage);

            setResultImage(optimizedImage);
            trackEvent('generation_succeeded', { type: applicationType });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            trackEvent('generation_failed', { type: applicationType, error: errorMessage });
        } finally {
            setIsApplyingDesign(false);
            setStatusMessage(null);
        }
    }, [mockupFile, designFile, generatedMockup, generatedDesign, applicationType, canApply]);
  
    const handleDownload = () => {
        if (!resultImage) return;
        trackEvent('result_downloaded');
        saveAs(resultImage, `vectormockup_result_${Date.now()}.png`);
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
                    prompt={mockupPrompt}
                    setPrompt={setMockupPrompt}
                    onGenerate={handleGenerateMockup}
                    isLoading={isGeneratingMockup}
                    generatedImage={generatedMockup}
                    uploadedFile={mockupFile}
                    source={mockupSource}
                    setSource={(s) => { setMockupSource(s); setGeneratedMockup(null); setMockupFile(null); }}
                    onFileSelect={(f) => { setMockupFile(f); setGeneratedMockup(null); }}
                    maxSizeMB={MAX_MOCKUP_SIZE_MB}
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
                    setSource={(s) => { setDesignSource(s); setGeneratedDesign(null); setDesignFile(null); }}
                    onFileSelect={(f) => { setDesignFile(f); setGeneratedDesign(null); }}
                    maxSizeMB={MAX_DESIGN_SIZE_MB}
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
                        {resultImage && <img src={resultImage} alt="Generated mockup" className="w-full h-full object-contain"/>}
                        {!isApplyingDesign && !resultImage && !error && <p className="text-gray-500 text-sm">Your result will appear here</p>}
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

                    <div className="flex-grow flex flex-col justify-end">
                        <button
                            onClick={handleApplyDesign}
                            disabled={!canApply}
                            className="w-full inline-flex items-center justify-center px-6 py-4 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isApplyingDesign ? <Spinner /> : 'Apply Design'}
                        </button>
                        {resultImage && !isApplyingDesign && (
                            <button
                                onClick={handleDownload}
                                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                                <DownloadIcon />
                                Download
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};