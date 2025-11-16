import React from 'react';
import { TechPackBuilder } from './components/TechPackBuilder';

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-gray-100 font-sans flex items-center justify-center p-4 bg-gray-900">
      <TechPackBuilder />
    </div>
  );
};

export default App;
