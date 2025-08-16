'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  className?: string;
}

export function ProcessingStatus({ steps, className }: ProcessingStatusProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const processingStepIndex = steps.findIndex(step => step.status === 'processing');
    if (processingStepIndex !== -1) {
      setCurrentStep(processingStepIndex);
    }
  }, [steps]);

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Processing Your Assets</h3>
        <p className="text-gray-400">AI is analyzing your photos...</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            {getStepIcon(step.status)}
            <span className={cn(
              'text-sm',
              step.status === 'completed' ? 'text-green-400' :
              step.status === 'processing' ? 'text-yellow-400' :
              step.status === 'error' ? 'text-red-400' :
              'text-gray-400'
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}