import React from 'react';
import type { View } from '../types';
import { StudioIcon, EditIcon, GenerateIcon, ThinkIcon, SearchIcon, LogoIcon, SketchIcon, BrandIcon, TrendIcon, CopywriterIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

interface NavItemProps {
  view: View;
  label: string;
  icon: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, icon, currentView, setCurrentView }) => (
  <button
    onClick={() => setCurrentView(view)}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      currentView === view
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center mb-8 px-2">
          <LogoIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-xl font-bold ml-2 text-white">VectorCraft AI</h1>
        </div>
        <nav className="space-y-2">
          <NavItem view="studio" label="Mockup Studio" icon={<StudioIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="sketch" label="Sketch to Mockup" icon={<SketchIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="brand" label="Brand Kit" icon={<BrandIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="trends" label="Trend Forecaster" icon={<TrendIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="copywriter" label="AI Copywriter" icon={<CopywriterIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="editor" label="Social Post Composer" icon={<EditIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="generator" label="Image Generator" icon={<GenerateIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="thinking" label="Thinking Mode" icon={<ThinkIcon />} currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem view="search" label="Grounded Search" icon={<SearchIcon />} currentView={currentView} setCurrentView={setCurrentView} />
        </nav>
      </div>
      <div className="text-center text-xs text-gray-500">
          <p>&copy; 2024 VectorCraft AI</p>
      </div>
    </aside>
  );
};