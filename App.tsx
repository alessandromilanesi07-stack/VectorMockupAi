import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MockupStudio } from './components/VectorWrapStudio';
import { AdvancedEditor } from './components/AdvancedEditor';
import { ImageGenerator } from './components/ImageGenerator';
import { SketchToMockup } from './components/SketchToMockup';
import { BrandHub } from './components/BrandHub';
import { TrendForecaster } from './components/TrendForecaster';
import { Copywriter } from './components/Copywriter';
import { Sourcing } from './components/Sourcing';
import { ThinkingMode } from './components/ThinkingMode';
import type { View, Brand, SavedProduct } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('studio');
  const [imageForEditing, setImageForEditing] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);

  const activeBrand = brands.find(b => b.id === activeBrandId) || null;

  const addProductToBrand = (brandId: string, product: SavedProduct) => {
    setBrands(prevBrands => {
      return prevBrands.map(brand => {
        if (brand.id === brandId) {
          const updatedProducts = [...(brand.products || []), product];
          return { ...brand, products: updatedProducts };
        }
        return brand;
      });
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'studio':
        return <MockupStudio 
          setCurrentView={setCurrentView} 
          setImageForEditing={setImageForEditing} 
          activeBrand={activeBrand}
          addProductToBrand={addProductToBrand}
        />;
      case 'sketch':
        return <SketchToMockup />;
      case 'brandHub':
        return <BrandHub 
            brands={brands}
            setBrands={setBrands}
            activeBrandId={activeBrandId}
            setActiveBrandId={setActiveBrandId}
          />;
      case 'editor':
        return <AdvancedEditor 
          imageForEditing={imageForEditing} 
          setImageForEditing={setImageForEditing}
          activeBrand={activeBrand}
        />;
      case 'generator':
        return <ImageGenerator />;
      case 'trends':
        return <TrendForecaster />;
      case 'copywriter':
        return <Copywriter activeBrand={activeBrand} />;
      case 'sourcing':
        return <Sourcing />;
      case 'thinking':
        return <ThinkingMode />;
      default:
        return <MockupStudio 
          setCurrentView={setCurrentView} 
          setImageForEditing={setImageForEditing} 
          activeBrand={activeBrand}
          addProductToBrand={addProductToBrand}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        brands={brands}
        activeBrandId={activeBrandId}
        setActiveBrandId={setActiveBrandId}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;