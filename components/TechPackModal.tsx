import React from 'react';
import { LogoIcon } from './Icons';
import type { Brand, MarketingCopy, MockupProduct, MockupView } from '../types';

interface TechPackModalProps {
    isOpen: boolean;
    onClose: () => void;
    productDetails: MockupProduct;
    finalImages: Partial<Record<MockupView, string>> | null;
    color: string;
    designFile: File | null;
    activeBrand: Brand | null;
    copyForTechPack: MarketingCopy | null;
}

export const TechPackModal: React.FC<TechPackModalProps> = ({ isOpen, onClose, productDetails, finalImages, color, designFile, activeBrand, copyForTechPack }) => {
    
    if (!isOpen) {
        return null;
    }

    const today = new Date().toLocaleDateString('it-IT');
    const viewOrder: MockupView[] = ['frontal', 'retro', 'lato_sx', 'lato_dx'];
    const sortedImages = finalImages ? viewOrder.filter(v => finalImages[v]).map(v => ({ viewId: v, src: finalImages[v]! })) : [];

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            onClick={onClose}
        >
             <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .tech-pack-printable, .tech-pack-printable * { visibility: visible; }
                    .tech-pack-printable { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        height: 100%;
                        border: none;
                        color: black !important;
                        background-color: white !important;
                    }
                    .tech-pack-printable .bg-gray-800 { background-color: #F3F4F6 !important; }
                    .tech-pack-printable .bg-gray-900 { background-color: white !important; }
                     .tech-pack-printable .text-white { color: black !important; }
                    .tech-pack-printable .text-gray-300 { color: #374151 !important; }
                    .tech-pack-printable .text-gray-400 { color: #6B7280 !important; }
                    .tech-pack-printable .border-gray-700 { border-color: #D1D5DB !important; }
                    .no-print { display: none; }
                }
            `}</style>
            <div 
                className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-4xl p-0 border border-gray-700 transform transition-all duration-300 scale-95 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
            >
                <div className="p-4 bg-gray-800 flex justify-between items-center no-print">
                    <h2 className="text-xl font-bold">Scheda Tecnica Prodotto</h2>
                    <div>
                        <button onClick={() => window.print()} className="mr-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm">Stampa</button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
                    </div>
                </div>
                <div className="p-8 h-[70vh] overflow-y-auto tech-pack-printable">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-gray-700">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{productDetails.name}</h1>
                            <p className="text-gray-400">ID Stile: {productDetails.id.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                           {activeBrand ? (
                                <div className="flex items-center justify-end gap-2">
                                    {activeBrand.logoImage && <img src={activeBrand.logoImage} alt={`${activeBrand.name} Logo`} className="h-8 object-contain"/>}
                                    <p className="font-bold text-lg text-white">{activeBrand.name}</p>
                               </div>
                           ) : (
                                <div className="flex items-center justify-end gap-2">
                                    <LogoIcon className="h-6 w-6 text-blue-500"/>
                                    <p className="font-bold text-lg text-white">VectorCraft AI</p>
                               </div>
                           )}
                           <p className="text-sm text-gray-400">Data: {today}</p>
                        </div>
                    </div>

                    {/* Mockup Views */}
                    <div className="my-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Viste Mockup</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {sortedImages.map(({ viewId, src }) => (
                                <div key={viewId} className="bg-gray-800 p-2 rounded-lg text-center">
                                    <img src={src} alt={`Vista ${viewId}`} className="w-full aspect-square object-contain rounded-md bg-white"/>
                                    <p className="text-sm mt-2 font-medium text-gray-300 capitalize">{viewId.replace('_', ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Colorway & Details */}
                        <div className="space-y-6">
                             <div>
                                <h2 className="text-xl font-semibold mb-3 text-white">Colorway</h2>
                                <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-gray-700" style={{backgroundColor: color}}></div>
                                    <div>
                                        <p className="font-bold text-white">Colore Base</p>
                                        <p className="font-mono text-gray-300">{color.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-3 text-white">Dettagli Prodotto</h2>
                                <ul className="bg-gray-800 p-4 rounded-lg space-y-2 text-gray-300">
                                    <li><span className="font-semibold text-gray-400">Descrizione:</span> {productDetails.description}</li>
                                    <li><span className="font-semibold text-gray-400">Fit:</span> <span className="capitalize">{productDetails.fit}</span></li>
                                </ul>
                            </div>
                        </div>
                        {/* Graphic Details */}
                        <div>
                             <h2 className="text-xl font-semibold mb-3 text-white">Dettagli Grafica</h2>
                             <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                                <div>
                                    <p className="font-semibold text-gray-400">File Design:</p>
                                    <p className="text-gray-300">{designFile?.name || 'N/A'}</p>
                                </div>
                                 <div>
                                    <p className="font-semibold text-gray-400">Posizionamento:</p>
                                    <p className="text-gray-300">{productDetails.printArea} (Vedere mockup per riferimento)</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-400">Tipo di Stampa (Suggerito):</p>
                                    <p className="text-gray-300">DTG (Direct-to-Garment) o Serigrafia</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-400">Note:</p>
                                    <div className="h-24 mt-1 border border-gray-700 rounded-md p-2 text-gray-300 overflow-y-auto text-sm">
                                        {copyForTechPack?.productDescription || 'Nessuna nota aggiuntiva.'}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};