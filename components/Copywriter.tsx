import React, { useState, useCallback, useEffect } from 'react';
import { generateMarketingCopy } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon } from './Icons';
import type { MarketingCopy, Brand } from '../types';

interface CopywriterProps {
    activeBrand: Brand | null;
    setCopyForTechPack: (copy: MarketingCopy) => void;
}

export const Copywriter: React.FC<CopywriterProps> = ({ activeBrand, setCopyForTechPack }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [productName, setProductName] = useState<string>('');
    const [toneOfVoice, setToneOfVoice] = useState<string>('Playful and irreverent');
    const [copy, setCopy] = useState<MarketingCopy | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activeBrand && activeBrand.kit.toneOfVoice) {
            setToneOfVoice(activeBrand.kit.toneOfVoice);
        }
    }, [activeBrand]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
            setCopy(null);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!imageFile || !productName || !toneOfVoice) {
            setError('Please provide a product image, name, and tone of voice.');
            return;
        }

        setLoading(true);
        setError(null);
        setCopy(null);

        try {
            const result = await generateMarketingCopy(imageFile, productName, toneOfVoice);
            setCopy(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while generating copy.');
        } finally {
            setLoading(false);
        }
    }, [imageFile, productName, toneOfVoice]);

    const handleUseForTechPack = () => {
        if (copy) {
            setCopyForTechPack(copy);
            alert('Copy saved for your next Tech Pack!');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">AI Brand Copywriter</h2>
                <p className="mt-4 text-lg text-gray-400">Generate on-brand marketing copy from your product visuals.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Configuration Panel */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6 self-start">
                    <div>
                        <label htmlFor="product-image-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Upload Product Image</label>
                        <label htmlFor="product-image-upload" className={`w-full flex flex-col items-center justify-center px-4 py-10 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors ${previewImage ? 'p-2' : ''}`}>
                            {previewImage ? (
                                <img src={previewImage} alt="Product preview" className="max-h-48 rounded-md"/>
                            ) : (
                                <>
                                    <UploadIcon />
                                    <span className="mt-2 text-sm text-gray-400">Click to upload</span>
                                </>
                            )}
                            <input id="product-image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                    <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-300 mb-2">2. Product Name</label>
                        <input
                            id="product-name"
                            type="text"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 'The Voyager Hoodie'"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                    </div>
                     <div>
                        <label htmlFor="tone-of-voice" className="block text-sm font-medium text-gray-300 mb-2">3. Brand Tone of Voice</label>
                        <textarea
                            id="tone-of-voice"
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 'Minimal and luxurious', 'Bold and energetic'"
                            value={toneOfVoice}
                            onChange={(e) => setToneOfVoice(e.target.value)}
                        />
                    </div>
                    <div className="text-center border-t border-gray-700 pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !imageFile || !productName || !toneOfVoice}
                            className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? <Spinner /> : 'Generate Copy'}
                        </button>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl min-h-[30rem]">
                     <h3 className="text-xl font-bold text-center text-white mb-4">Generated Copy</h3>
                     {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}
                     {loading && (
                         <div className="flex flex-col items-center justify-center h-full pt-16">
                             <Spinner large={true} />
                             <p className="mt-4 text-gray-300">Crafting the perfect words...</p>
                         </div>
                     )}
                     {!loading && !copy && !error && (
                         <div className="flex flex-col items-center justify-center h-full pt-16">
                            <p className="text-gray-400 text-center">Your generated marketing copy will appear here.</p>
                        </div>
                     )}
                     {copy && (
                         <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-2">E-commerce Product Description</h4>
                                <p className="text-gray-200">{copy.productDescription}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-2">Instagram Caption</h4>
                                <p className="text-gray-200 whitespace-pre-wrap">{copy.instagramCaption}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-2">Email Subject Line</h4>
                                <p className="text-gray-200">{copy.emailSubject}</p>
                            </div>
                             <div className="border-t border-gray-700 pt-4 text-center">
                                <button
                                    onClick={handleUseForTechPack}
                                    className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                                >
                                    Usa Testo per Scheda Tecnica
                                </button>
                            </div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};