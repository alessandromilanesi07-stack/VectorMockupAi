import React, { useState, useCallback } from 'react';
import { extractBrandKit, extractBrandKitFromImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, PlusIcon } from './Icons';
import type { BrandKitData, Brand } from '../types';

const ColorSwatch: React.FC<{ color?: string; name: string }> = ({ color, name }) => (
    <div className="flex flex-col items-center space-y-2">
        <div 
            className="w-16 h-16 rounded-full border-2 border-gray-500 bg-gray-700 flex items-center justify-center" 
            style={{ backgroundColor: color || undefined }}
        >
            {!color && <span className="text-gray-400 text-xs">N/A</span>}
        </div>
        <div className="text-center">
            <p className="font-medium text-sm text-white">{name}</p>
            <p className="font-mono text-xs text-gray-400">{color || 'Not found'}</p>
        </div>
    </div>
);

interface BrandHubProps {
    brands: Brand[];
    setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
    activeBrandId: string | null;
    setActiveBrandId: (id: string | null) => void;
}

const BrandCard: React.FC<{brand: Brand, isActive: boolean, onSelect: () => void}> = ({ brand, isActive, onSelect }) => (
    <div onClick={onSelect} className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${isActive ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
        <div className="flex items-center gap-4">
            {brand.logoImage ? (
                <img src={brand.logoImage} alt={`${brand.name} logo`} className="w-12 h-12 rounded-md object-contain bg-white p-1"/>
            ) : (
                <div className="w-12 h-12 rounded-md bg-gray-700 flex items-center justify-center text-xl font-bold">
                    {brand.name.charAt(0)}
                </div>
            )}
            <div>
                <h4 className="font-bold text-white">{brand.name}</h4>
                <div className="flex gap-1 mt-1">
                    {Object.values(brand.kit.colors).map((c, i) => <div key={i} className="w-4 h-4 rounded-full" style={{backgroundColor: c}}></div>)}
                </div>
            </div>
        </div>
    </div>
)


export const BrandHub: React.FC<BrandHubProps> = ({ brands, setBrands, activeBrandId, setActiveBrandId }) => {
    const [url, setUrl] = useState<string>('');
    const [brandKit, setBrandKit] = useState<BrandKitData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [inputType, setInputType] = useState<'url' | 'image'>('url');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setBrandKit(null);
            setError(null);
        }
    };

    const clearInputs = () => {
        setUrl('');
        setImageFile(null);
        setImagePreview(null);
        setBrandKit(null);
        setError(null);
    };

    const handleSaveBrand = () => {
        if (!brandKit) return;
        const brandName = prompt("Inserisci un nome per questo Brand Kit:", url || imageFile?.name || "New Brand");
        if (brandName) {
            const newBrand: Brand = {
                id: `brand-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: brandName,
                kit: brandKit,
                logoImage: inputType === 'image' ? imagePreview || undefined : undefined,
            };
            setBrands(prev => {
                // Ensure no duplicate IDs, though highly unlikely
                const existing = prev.find(b => b.id === newBrand.id);
                if (existing) return prev;
                return [...prev, newBrand];
            });
            setTimeout(() => {
                 alert(`Brand "${brandName}" salvato nel Brand Hub!`);
                 clearInputs();
            }, 0);
        }
    };

    const handleSubmit = useCallback(async () => {
        setLoading(true);
        setError(null);
        setBrandKit(null);

        try {
            let result: BrandKitData;
            if (inputType === 'url') {
                if (!url) {
                    setError('Please enter a website URL.');
                    setLoading(false);
                    return;
                }
                const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                result = await extractBrandKit(fullUrl);
            } else { // inputType === 'image'
                if (!imageFile) {
                    setError('Please upload a logo image.');
                    setLoading(false);
                    return;
                }
                result = await extractBrandKitFromImage(imageFile);
            }
            setBrandKit(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to extract brand kit. Please check your input and try again.');
        } finally {
            setLoading(false);
        }
    }, [url, inputType, imageFile]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Brand Hub</h2>
                <p className="mt-4 text-lg text-gray-400">Manage your brand identities or extract a new one from a URL or logo.</p>
            </div>
            
            {/* Existing Brands */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-4">
                <h3 className="text-xl font-bold text-white">Your Brands</h3>
                 {brands.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {brands.map(brand => (
                            <BrandCard 
                                key={brand.id} 
                                brand={brand}
                                isActive={brand.id === activeBrandId}
                                onSelect={() => setActiveBrandId(brand.id)}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p>No brands saved yet. Add one below to get started!</p>
                    </div>
                 )}
            </div>


            {/* Brand Extractor */}
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <h3 className="text-xl font-bold text-white text-center">Add New Brand</h3>
                <div className="flex justify-center border-b border-gray-700 -mt-2 mb-4">
                    <button 
                        onClick={() => { setInputType('url'); clearInputs(); }}
                        className={`px-6 py-2 text-sm font-medium transition-colors ${inputType === 'url' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        From URL
                    </button>
                    <button 
                        onClick={() => { setInputType('image'); clearInputs(); }}
                        className={`px-6 py-2 text-sm font-medium transition-colors ${inputType === 'image' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        From Logo Image
                    </button>
                </div>

                {inputType === 'url' && (
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full bg-gray-700 border border-gray-600 rounded-full py-3 pl-5 pr-32 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., google.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !url}
                            className="absolute inset-y-0 right-0 flex items-center justify-center px-6 my-1.5 mr-1.5 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
                        >
                            {loading ? <Spinner /> : 'Extract'}
                        </button>
                    </div>
                )}
                
                {inputType === 'image' && (
                     <div className="space-y-4">
                        <label htmlFor="logo-upload" className="w-full flex flex-col items-center justify-center px-4 py-10 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Logo preview" className="max-h-32 rounded-md object-contain"/>
                            ) : (
                                <>
                                    <UploadIcon />
                                    <span className="mt-2 text-sm text-gray-400">{imageFile ? imageFile.name : 'Click to upload a logo'}</span>
                                </>
                            )}
                            <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                         <button
                            onClick={handleSubmit}
                            disabled={loading || !imageFile}
                            className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? <Spinner /> : 'Extract from Image'}
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}

            {loading && <div className="text-center text-lg text-gray-300">Analyzing...</div>}

            {brandKit && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-8">
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-center text-white">Extracted Brand Kit</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
                            <ColorSwatch color={brandKit.colors?.primary} name="Primary" />
                            <ColorSwatch color={brandKit.colors?.secondary} name="Secondary" />
                            <ColorSwatch color={brandKit.colors?.accent} name="Accent" />
                            <ColorSwatch color={brandKit.colors?.neutral} name="Neutral" />
                        </div>
                    </div>
                    <div className="border-t border-gray-700 my-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-white">Typography</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-400">Heading Font</p>
                                    <p className="text-lg font-semibold text-white">{brandKit.fonts?.heading || 'Not found'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Body Font</p>
                                    <p className="text-lg font-semibold text-white">{brandKit.fonts?.body || 'Not found'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-white">Logo Description</h3>
                                <p className="text-gray-300">{brandKit.logoDescription || 'No description could be generated.'}</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-white">Tone of Voice</h3>
                                <p className="text-gray-300 italic">{brandKit.toneOfVoice || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center border-t border-gray-700 pt-6">
                        <button
                            onClick={handleSaveBrand}
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                           <PlusIcon className="w-5 h-5 mr-2" /> Salva nel Brand Hub
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};