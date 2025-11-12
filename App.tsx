import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MockupStudio } from './components/VectorWrapStudio';
import { ImageEditor } from './components/ImageEditor';
import { ImageGenerator } from './components/ImageGenerator';
import { ThinkingMode } from './components/ThinkingMode';
import { Search } from './components/Search';
import { SketchToMockup } from './components/SketchToMockup';
import { BrandKit } from './components/BrandKit';
import { TrendForecaster } from './components/TrendForecaster';
import { Copywriter } from './components/Copywriter';
import type { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('studio');
  const [imageForEditing, setImageForEditing] = useState<string | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'studio':
        return <MockupStudio 
          setCurrentView={setCurrentView} 
          setImageForEditing={setImageForEditing} 
        />;
      case 'sketch':
        return <SketchToMockup />;
      case 'brand':
        return <BrandKit />;
      case 'editor':
        return <ImageEditor 
          imageForEditing={imageForEditing} 
          setImageForEditing={setImageForEditing}
        />;
      case 'generator':
        return <ImageGenerator />;
      case 'thinking':
        return <ThinkingMode />;
      case 'search':
        return <Search />;
      case 'trends':
        return <TrendForecaster />;
      case 'copywriter':
        return <Copywriter />;
      default:
        return <MockupStudio 
          setCurrentView={setCurrentView} 
          setImageForEditing={setImageForEditing} 
        />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;