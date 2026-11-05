import React from 'react';
import { HowItWorksMain } from '../how-it-works/HowItWorksMain.tsx';

interface HowItWorksProps {
  setCurrentView?: (view: string) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = () => {
  return <HowItWorksMain />;
};

export default HowItWorks;
