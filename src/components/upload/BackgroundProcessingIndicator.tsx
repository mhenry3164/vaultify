'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface ProcessingStatus {
  current: number;
  total: number;
  isProcessing: boolean;
  isComplete: boolean;
}

export function BackgroundProcessingIndicator() {
  const [status, setStatus] = useState<ProcessingStatus>({
    current: 0,
    total: 0,
    isProcessing: false,
    isComplete: false
  });

  useEffect(() => {
    // Check for background processing
    const checkProcessing = () => {
      const currentProcessing = (window as any).currentProcessing;
      
      if (currentProcessing) {
        setStatus(prev => ({ ...prev, isProcessing: true }));
        
        // Set up progress listener
        (window as any).onGlobalProcessingUpdate = (current: number, total: number) => {
          setStatus({
            current,
            total,
            isProcessing: current < total,
            isComplete: current === total
          });
        };
        
        // Watch for completion
        currentProcessing.then(() => {
          setStatus(prev => ({ ...prev, isProcessing: false, isComplete: true }));
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            setStatus({ current: 0, total: 0, isProcessing: false, isComplete: false });
          }, 3000);
        });
      }
    };

    checkProcessing();
    
    // Check periodically for new processing
    const interval = setInterval(checkProcessing, 1000);
    
    return () => {
      clearInterval(interval);
      (window as any).onGlobalProcessingUpdate = null;
    };
  }, []);

  if (!status.isProcessing && !status.isComplete) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-elegant-800 border border-elegant-700 rounded-lg px-4 py-3 shadow-lg max-w-xs">
        {status.isProcessing ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
            <div>
              <p className="text-white text-sm font-medium">Processing Assets</p>
              <p className="text-elegant-400 text-xs">
                {status.current} of {status.total} items
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white text-sm font-medium">Processing Complete</p>
              <p className="text-elegant-400 text-xs">
                {status.total} items added to inventory
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}