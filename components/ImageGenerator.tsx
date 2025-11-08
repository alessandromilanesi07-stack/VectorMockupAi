import React, { useState, useCallback } from 'react';
import { generateImage, generateCodeForImage } from '../services/geminiService';
import { Spinner } from './Spinner';

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingCode, setLoadingCode] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

    const handleSubmit = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a prompt to generate an image.');
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImages([]);
        setGeneratedCode(null);

        const enhancedPrompt = `${prompt}, photorealistic, high quality, no text, no words, clean background, professional product photo`;

        try {
            const result = await generateImage(enhancedPrompt, aspectRatio);
            setGeneratedImages(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [prompt, aspectRatio]);

    const handleGenerateCode = async () => {
        if (!generatedImages[0] || !prompt) {
            setError('An image and a prompt are required to generate code.');
            return;
        }
        setLoadingCode(true);
        setError(null);
        setGeneratedCode(null);

        try {
            const [header, base64Data] = generatedImages[0].split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            
            const code = await generateCodeForImage(prompt, base64Data, mimeType);
            setGeneratedCode(code);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to generate code.');
        } finally {
            setLoadingCode(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">AI Image & Code Generator</h2>
                <p className="mt-4 text-lg text-gray-400">Turn your imagination into visuals and code with Imagen 4 and Gemini Pro.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <div>
                    <label htmlFor="gen-prompt" className="block text-sm font-medium text-gray-300 mb-2">Your Prompt</label>
                    <textarea
                        id="gen-prompt"
                        rows={4}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., 'A modern login screen for a fitness app'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <select
                        id="aspect-ratio"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                    >
                        {aspectRatios.map(ratio => (
                            <option key={ratio} value={ratio}>{ratio}</option>
                        ))}
                    </select>
                </div>
                <div className="text-center">
                     <button
                        onClick={handleSubmit}
                        disabled={loading || !prompt}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Spinner /> : 'Generate Image'}
                    </button>
                </div>
            </div>
            
            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}

            {loading && (
                <div className="text-center">
                    <Spinner large={true} />
                    <p className="mt-4 text-lg text-gray-300">Generating your masterpiece...</p>
                </div>
            )}
            
            {generatedImages.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl shadow-2xl space-y-4">
                    <h3 className="text-xl font-bold text-center">Generated Image</h3>
                    <img src={generatedImages[0]} alt="Generated art" className="w-full max-w-2xl mx-auto h-auto object-contain rounded-lg" />
                    <div className="text-center">
                         <button
                            onClick={handleGenerateCode}
                            disabled={loadingCode}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
                        >
                            {loadingCode ? <Spinner /> : 'Generate Code'}
                        </button>
                    </div>
                </div>
            )}

            {loadingCode && (
                 <div className="text-center">
                    <Spinner large={true} />
                    <p className="mt-4 text-lg text-gray-300">Generating code...</p>
                </div>
            )}

            {generatedCode && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
                    <h3 className="text-xl font-bold mb-4">Generated Code (HTML/CSS)</h3>
                    <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                        <code>{generatedCode}</code>
                    </pre>
                </div>
            )}
        </div>
    );
};