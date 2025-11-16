import React from 'react';
import type { View, Brand } from '../types';
import { StudioIcon, EditIcon, GenerateIcon, LogoIcon, SketchIcon, BrandIcon, TrendIcon, CopywriterIcon, PlusIcon, SourcingIcon, ThinkIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  brands: Brand[];
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
}

interface NavItemProps {
  view: View;
  label: string;
  icon: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const BrandHubSelector: React.FC<{
  brands: Brand[];
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
  setCurrentView: (view: View) => void;
}> = ({ brands, activeBrandId, setActiveBrandId, setCurrentView }) => (
    <div className="px-2 mt-6">
        <h2 className="px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Brand Hub</h2>
        {brands.length > 0 ? (
            <select 
                value={activeBrandId || ''} 
                onChange={(e) => setActiveBrandId(e.target.value || null)}
                className="custom-select w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white"
            >
                <option value="">Nessun Brand Attivo</option>
                {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
            </select>
        ) : (
             <button
                onClick={() => setCurrentView('brandHub')}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-400 hover:bg-gray-700 hover:text-white bg-gray-900/50 border-2 border-dashed border-gray-600"
            >
                <PlusIcon className="h-4 w-4 mr-2" />
                Aggiungi un Brand
            </button>
        )}
    </div>
);


const NavItem: React.FC<NavItemProps> = ({ view, label, icon, currentView, setCurrentView }) => (
  <button
    onClick={() => setCurrentView(view)}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out border-l-4 ${
      currentView === view
        ? 'bg-blue-600/20 text-white border-blue-500'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white border-transparent'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, brands, activeBrandId, setActiveBrandId }) => {
  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center mb-8 px-2">
          <LogoIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-xl font-bold ml-2 text-white">VectorCraft AI</h1>
        </div>
        <nav className="space-y-4">
          <div>
              <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">1. Concept & Inspiration</h3>
              <div className="space-y-1">
                  <NavItem view="trends" label="Trend Forecaster" icon={<TrendIcon />} currentView={currentView} setCurrentView={setCurrentView} />
                  <NavItem view="brandHub" label="Brand Hub" icon={<BrandIcon />} currentView={currentView} setCurrentView={setCurrentView} />
              </div>
          </div>
          <div>
              <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">2. Design Creation</h3>
              <div className="space-y-1">
                  <NavItem view="generator" label="Image Generator" icon={<GenerateIcon />} currentView={currentView} setCurrentView={setCurrentView} />
                  <NavItem view="sketch" label="Sketch to Mockup" icon={<SketchIcon />} currentView={currentView} setCurrentView={setCurrentView} />
              </div>
          </div>
          <div>
              <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">3. Mockup & Presentation</h3>
              <div className="space-y-1">
                  <NavItem view="studio" label="Mockup Studio" icon={<StudioIcon />} currentView={currentView} setCurrentView={setCurrentView} />
                  <NavItem view="copywriter" label="AI Copywriter" icon={<CopywriterIcon />} currentView={currentView} setCurrentView={setCurrentView} />
                  <NavItem view="editor" label="Advanced Editor" icon={<EditIcon />} currentView={currentView} setCurrentView={setCurrentView} />
                  <NavItem view="sourcing" label="Sourcing Database" icon={<SourcingIcon />} currentView={currentView} setCurrentView={setCurrentView} />
              </div>
          </div>
           <div>
              <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">AI Tools</h3>
              <div className="space-y-1">
                  <NavItem view="thinking" label="AI Assistant" icon={<ThinkIcon />} currentView={currentView} setCurrentView={setCurrentView} />
              </div>
          </div>
        </nav>
         <BrandHubSelector 
            brands={brands} 
            activeBrandId={activeBrandId} 
            setActiveBrandId={setActiveBrandId} 
            setCurrentView={setCurrentView}
        />
      </div>
      <div className="text-center text-xs text-gray-500">
          <p>&copy; 2024 VectorCraft AI</p>
      </div>
    </aside>
  );
};
