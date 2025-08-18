'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, Eye } from 'lucide-react';
import Link from 'next/link';

interface ProcessingStatus {
  total: number; // Only need total for completion message
  isProcessing: boolean;
  isComplete: boolean;
}

export function BackgroundProcessingIndicator() {
  const [status, setStatus] = useState<ProcessingStatus>({
    total: 0,
    isProcessing: false,
    isComplete: false
  });
  
  const currentProcessingRef = useRef<Promise<any> | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    // Set up progress listener to track completion
    const progressListener = (current: number, total: number) => {
      console.log('Processing update:', current, 'of', total);
      
      setStatus({
        total,
        isProcessing: current < total,
        isComplete: current === total
      });
      isVisibleRef.current = true;
    };
    
    // Always set the progress listener (this ensures it's always the latest version)
    (window as any).onGlobalProcessingUpdate = progressListener;
    
    // Check for new processing promises
    const checkForNewProcessing = () => {
      const currentProcessing = (window as any).currentProcessing;
      
      if (currentProcessing && currentProcessing !== currentProcessingRef.current) {
        console.log('New processing detected');
        currentProcessingRef.current = currentProcessing;
        
        // Clear any existing hide timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        
        // Watch for completion
        currentProcessing.then(() => {
          console.log('Processing completed');
          if (currentProcessing === currentProcessingRef.current) {
            // Auto-hide after 4 seconds
            hideTimeoutRef.current = setTimeout(() => {
              console.log('Hiding notification');
              setStatus({
                total: 0,
                isProcessing: false,
                isComplete: false
              });
              isVisibleRef.current = false;
              currentProcessingRef.current = null;
              (window as any).currentProcessing = null;
            }, 4000);
          }
        }).catch((error: any) => {
          console.error('Processing error:', error);
          if (currentProcessing === currentProcessingRef.current) {
            setStatus({
              total: 0,
              isProcessing: false,
              isComplete: false
            });
            isVisibleRef.current = false;
            currentProcessingRef.current = null;
          }
        });
      }
    };

    // Initial check
    checkForNewProcessing();
    
    // Check periodically for new processing
    const interval = setInterval(checkForNewProcessing, 1500);
    
    return () => {
      clearInterval(interval);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      (window as any).onGlobalProcessingUpdate = null;
    };
  }, []);

  // Don't render if not visible or if we have invalid state
  if (!isVisibleRef.current || (!status.isProcessing && !status.isComplete)) {
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
              <p className="text-elegant-400 text-xs">AI analyzing your items...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white text-sm font-medium">Processing Complete!</p>
                <p className="text-elegant-400 text-xs">
                  {status.total} items added to inventory
                </p>
              </div>
            </div>
            <div className="text-center">
              <Link href="/inventory">
                <button className="text-green-400 hover:text-green-300 text-xs flex items-center justify-center space-x-1 w-full py-1 rounded transition-colors">
                  <Eye className="w-3 h-3" />
                  <span>View in Inventory</span>
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}