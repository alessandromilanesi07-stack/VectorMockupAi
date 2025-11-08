import React, { useState, useCallback } from 'react';
import { placeOrder } from '../services/printService';
import { Spinner } from './Spinner';
import { CheckCircleIcon } from './Icons';
import type { OrderConfirmation } from '../types';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    productImage: string | null;
    productDetails: {
        id: string;
        name: string;
        color: string;
    };
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, productImage, productDetails }) => {
    const [size, setSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [stage, setStage] = useState<'form' | 'placing_order' | 'confirmed' | 'error'>('form');
    const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClose = useCallback(() => {
        onClose();
        // Reset state after a short delay to allow closing animation
        setTimeout(() => {
            setStage('form');
            setConfirmation(null);
            setError(null);
            setQuantity(1);
            setSize('M');
        }, 300);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!productImage) return;

        setStage('placing_order');
        setError(null);

        try {
            const orderDetails = {
                productId: productDetails.id,
                productName: productDetails.name,
                color: productDetails.color,
                size,
                quantity,
                designUrl: productImage,
            };
            const result = await placeOrder(orderDetails);
            setConfirmation(result);
            setStage('confirmed');
        } catch (e) {
            setError(e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.");
            setStage('error');
        }
    };
    
    if (!isOpen) {
        return null;
    }

    const renderContent = () => {
        switch (stage) {
            case 'placing_order':
                return (
                    <div className="text-center py-16">
                        <Spinner large />
                        <h3 className="text-2xl font-bold mt-6">Invio dell'Ordine...</h3>
                        <p className="text-gray-400 mt-2">Stiamo comunicando con il nostro partner di stampa.</p>
                    </div>
                );
            case 'confirmed':
                return (
                    <div className="text-center py-12">
                        <CheckCircleIcon className="mx-auto text-green-500" />
                        <h3 className="text-2xl font-bold mt-6">Ordine Confermato!</h3>
                        <div className="mt-4 text-left bg-gray-800 p-4 rounded-lg space-y-2">
                             <p><span className="font-semibold text-gray-400">ID Ordine:</span> {confirmation?.orderId}</p>
                             <p><span className="font-semibold text-gray-400">Costo Totale:</span> €{confirmation?.cost.toFixed(2)}</p>
                             <p><span className="font-semibold text-gray-400">Consegna Stimata:</span> {confirmation?.estimatedDelivery}</p>
                        </div>
                        <button onClick={handleClose} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Fantastico!
                        </button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center py-12">
                        <h3 className="text-2xl font-bold text-red-400">Errore nell'Ordine</h3>
                        <p className="text-gray-400 mt-4 bg-gray-800 p-4 rounded-lg">{error}</p>
                        <button onClick={() => setStage('form')} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Riprova
                        </button>
                    </div>
                );
            case 'form':
            default:
                return (
                    <>
                        <h2 className="text-2xl font-bold text-center mb-6">Simula Ordine di Stampa</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="w-full aspect-square bg-gray-700 rounded-lg overflow-hidden">
                                <img src={productImage!} alt="Prodotto finale" className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-semibold">{productDetails.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>Colore:</span>
                                        <div className="w-4 h-4 rounded-full border border-gray-500" style={{backgroundColor: productDetails.color}}></div>
                                        <span>{productDetails.color}</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="size" className="block text-sm font-medium text-gray-300 mb-2">Taglia</label>
                                    <select id="size" value={size} onChange={(e) => setSize(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500">
                                        {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">Quantità</label>
                                    <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="border-t border-gray-700 pt-4">
                                     <button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                        Invia Ordine (Simulazione)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                );
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            onClick={handleClose}
        >
            <div 
                className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-700 transform transition-all duration-300 scale-95"
                onClick={(e) => e.stopPropagation()}
                style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
            >
                 <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">&times;</button>
                 {renderContent()}
            </div>
        </div>
    );
};
