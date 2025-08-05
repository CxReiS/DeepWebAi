// DeepWebAI Flag Test Page
// GrowthBook "DeepWebAi-Flag" feature flag'ini test etmek için sayfa

import React from 'react';
import { DeepWebAIFlagDemo } from '../components/DeepWebAIFlagDemo';

export const DeepWebAIFlagTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <DeepWebAIFlagDemo />
      </div>
    </div>
  );
};

export default DeepWebAIFlagTestPage;
