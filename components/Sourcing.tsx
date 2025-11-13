import React, { useState, useMemo } from 'react';
import { manufacturers } from './sourcing/data';
import type { Manufacturer } from '../types';

const getMoqBadge = (category: Manufacturer['productionData']['moq']['category']) => {
    switch (category) {
        case 'Startup Friendly': return <span className="px-2 py-1 text-xs font-medium bg-green-900 text-green-300 rounded-full">🟢 Low MOQ</span>;
        case 'Small Batch': return <span className="px-2 py-1 text-xs font-medium bg-yellow-900 text-yellow-300 rounded-full">🟡 Medium MOQ</span>;
        case 'Standard Production': return <span className="px-2 py-1 text-xs font-medium bg-orange-900 text-orange-300 rounded-full">🟠 Standard MOQ</span>;
        case 'Large Scale': return <span className="px-2 py-1 text-xs font-medium bg-red-900 text-red-300 rounded-full">🔴 High MOQ</span>;
    }
};

const ManufacturerCard: React.FC<{ manufacturer: Manufacturer, onSelect: () => void }> = ({ manufacturer, onSelect }) => (
    <div onClick={onSelect} className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-white">{manufacturer.name}</h3>
                <p className="text-sm text-gray-400">{manufacturer.city}, {manufacturer.country}</p>
            </div>
            {getMoqBadge(manufacturer.productionData.moq.category)}
        </div>
        <div className="mt-4 border-t border-gray-700 pt-3">
            <p className="text-xs text-gray-500 mb-2">Specializes In:</p>
            <div className="flex flex-wrap gap-2">
                {manufacturer.specializations.productCategories.slice(0, 3).map(spec => (
                    <span key={spec} className="px-2 py-1 text-xs bg-gray-700 rounded-md">{spec}</span>
                ))}
            </div>
        </div>
    </div>
);

const ManufacturerDetailModal: React.FC<{ manufacturer: Manufacturer | null, onClose: () => void }> = ({ manufacturer, onClose }) => {
    if (!manufacturer) return null;

    const handleContact = () => {
        const subject = `Production Inquiry from VectorCraft AI User`;
        const body = `Hello ${manufacturer.name} team,\n\nI am reaching out regarding a production inquiry for my brand.\n\nI have created a technical pack using VectorCraft AI for my design and would like to get a quote.\n\nPlease find the details attached.\n\nBest regards,`;
        window.location.href = `mailto:${manufacturer.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 sticky top-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">{manufacturer.name}</h2>
                            <p className="text-gray-400">{manufacturer.city}, {manufacturer.country}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl">&times;</button>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold mb-2">Production Data</h4>
                            <ul className="text-sm space-y-2">
                                <li><strong>MOQ:</strong> {manufacturer.productionData.moq.value} pcs {getMoqBadge(manufacturer.productionData.moq.category)}</li>
                                <li><strong>Lead Time:</strong> {manufacturer.productionData.leadTime}</li>
                                <li><strong>Sample Time:</strong> {manufacturer.productionData.sampleTime}</li>
                                <li><strong>Capacity:</strong> {manufacturer.productionData.monthlyCapacity}</li>
                            </ul>
                        </div>
                         <div className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold mb-2">Pricing & Terms</h4>
                            <ul className="text-sm space-y-2">
                                <li><strong>Range:</strong> {manufacturer.pricing.range}</li>
                                {manufacturer.pricing.examples.map(ex => <li key={ex.item}><strong>{ex.item}:</strong> {ex.cost}</li>)}
                                <li><strong>Terms:</strong> {manufacturer.pricing.paymentTerms}</li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Specializations</h4>
                        <p className="text-sm text-gray-400"><strong>Categories:</strong> {manufacturer.specializations.productCategories.join(', ')}</p>
                        <p className="text-sm text-gray-400"><strong>Techniques:</strong> {manufacturer.specializations.productionTechniques.join(', ')}</p>
                        <p className="text-sm text-gray-400"><strong>Materials:</strong> {manufacturer.specializations.materials.join(', ')}</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Brand References</h4>
                        <div className="flex flex-wrap gap-2">
                            {manufacturer.brandReferences.map(ref => (
                                <span key={ref.name} className={`px-2 py-1 text-xs font-medium rounded-full ${ref.tier === 1 ? 'bg-purple-800' : ref.tier === 2 ? 'bg-blue-800' : 'bg-gray-700'}`}>{ref.name}</span>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-4 flex justify-end gap-4">
                        <a href={manufacturer.contact.website} target="_blank" rel="noopener noreferrer" className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700">Website</a>
                        <button onClick={handleContact} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Contact Producer</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Sourcing: React.FC = () => {
    const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
    const [filters, setFilters] = useState<{ region: string, moq: number }>({ region: 'All', moq: 5000 });

    const regions = useMemo(() => ['All', ...Array.from(new Set(manufacturers.map(m => m.region)))], []);

    const filteredManufacturers = useMemo(() => {
        return manufacturers.filter(m => {
            const regionMatch = filters.region === 'All' || m.region === filters.region;
            const moqMatch = m.productionData.moq.value <= filters.moq;
            return regionMatch && moqMatch;
        });
    }, [filters]);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Sourcing & Production Database</h2>
                <p className="mt-4 text-lg text-gray-400">Find vetted manufacturers to bring your designs to life.</p>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 p-4 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Region</label>
                    <select value={filters.region} onChange={e => setFilters(f => ({...f, region: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white">
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                 <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Max. MOQ: {filters.moq} pcs</label>
                    <input type="range" min="50" max="5000" step="50" value={filters.moq} onChange={e => setFilters(f => ({...f, moq: Number(e.target.value)}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredManufacturers.map(m => (
                    <ManufacturerCard key={m.id} manufacturer={m} onSelect={() => setSelectedManufacturer(m)} />
                ))}
            </div>

            <ManufacturerDetailModal manufacturer={selectedManufacturer} onClose={() => setSelectedManufacturer(null)} />
        </div>
    );
};
