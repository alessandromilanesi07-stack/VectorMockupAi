import React from 'react';
import { MockupStudio } from './components/VectorWrapStudio';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center p-4">
      <MockupStudio />
    </div>
  );
};

export default App;