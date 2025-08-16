'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Search, Shield, Plus, List, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

interface ProcessAnimationProps {
  showStaticCards?: boolean;
}

export function ProcessAnimation({ showStaticCards = false }: ProcessAnimationProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      icon: Camera,
      staticIcon: Plus,
      title: "Add Assets",
      subtitle: "Upload photos to catalog your belongings",
      description: "AI identifies and catalogs instantly",
      href: "/upload",
      color: "from-gold-400 to-gold-500",
      animatedTitle: "Capture",
      animatedSubtitle: "Snap photos of your items"
    },
    {
      icon: Search,
      staticIcon: List,
      title: "View Inventory",
      subtitle: "Browse your cataloged items",
      description: "Smart categorization & valuation",
      href: "/inventory",
      color: "from-blue-400 to-blue-500",
      animatedTitle: "Review",
      animatedSubtitle: "Verify and organize"
    },
    {
      icon: Shield,
      staticIcon: FileText,
      title: "Analyze Policy",
      subtitle: "Check for coverage gaps",
      description: "Compare with insurance policies",
      href: "/policy",
      color: "from-emerald-400 to-emerald-500",
      animatedTitle: "Analyze",
      animatedSubtitle: "Identify coverage gaps"
    }
  ];

  // Handle swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // If it's a small movement, treat it as a tap/click - don't interfere
    const isSmallMovement = Math.abs(distance) < 10;
    if (isSmallMovement) {
      return; // Let click events handle it
    }

    // Prevent default if we're handling as a swipe
    e.preventDefault();

    if (isLeftSwipe && activeStep < steps.length - 1) {
      // Swipe left: next step
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
    
    if (isRightSwipe && activeStep > 0) {
      // Swipe right: previous step
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  if (showStaticCards) {
    // Show all three cards statically
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const StaticIcon = step.staticIcon;
          return (
            <Link key={index} href={step.href}>
              <Card className="hover:bg-elegant-700/30 hover:border-gold-400/30 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-gold-glow/50 group-hover:scale-110 transition-transform duration-300">
                      <StaticIcon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-gold-400 transition-colors duration-200">{step.title}</h3>
                      <p className="text-elegant-400 text-sm">{step.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  }

  // Show animated single card that cycles through steps
  const currentStep = steps[activeStep];
  const CurrentIcon = currentStep.icon;

  return (
    <div className="space-y-4">
      {/* Process indicator */}
      <div className="flex items-center justify-center mb-3">
        <Sparkles className="w-3 h-3 text-gold-400 mr-1 animate-spin-slow" />
        <p className="text-elegant-400 text-xs font-medium">How Snap My Assets Works</p>
        <Sparkles className="w-3 h-3 text-gold-400 ml-1 animate-spin-slow" />
      </div>

      {/* Swipeable showcase card */}
      <Card 
        ref={cardRef}
        className={`
          transition-all duration-300 ease-in-out select-none cursor-pointer
          ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
          shadow-elegant-lg border border-elegant-700/50 bg-elegant-800/30
          hover:shadow-elegant-lg hover:border-elegant-600/50
        `}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <CardContent className="p-3 relative">
          {/* Swipe indicators */}
          {activeStep > 0 && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
              <div className="w-1 h-8 bg-gold-400/30 rounded-full animate-pulse" />
            </div>
          )}
          {activeStep < steps.length - 1 && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-1 h-8 bg-gold-400/30 rounded-full animate-pulse" />
            </div>
          )}

          {/* Step indicator dots */}
          <div className="flex justify-center mb-2">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-500 cursor-pointer
                    ${index === activeStep ? 'bg-gold-400 scale-125 shadow-gold-glow' : 'bg-elegant-600 hover:bg-elegant-500'}
                  `}
                  onClick={() => {
                    if (index !== activeStep) {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setActiveStep(index);
                        setIsTransitioning(false);
                      }, 150);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div className="text-center space-y-2">
            {/* Interactive Icon - clickable */}
            <div className="flex justify-center">
              <Link href={currentStep.href}>
                <div 
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer
                    bg-gradient-to-br ${currentStep.color} shadow-elegant-lg
                    hover:scale-105 active:scale-95 hover:shadow-gold-glow/50
                  `}
                >
                  <CurrentIcon className="w-8 h-8 text-black" />
                </div>
              </Link>
            </div>

            {/* Content - streamlined */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white transition-colors duration-300">
                {currentStep.animatedTitle}
              </h3>
              <p className="text-elegant-300 text-base">
                {currentStep.animatedSubtitle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Action Cards - more compact */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const StaticIcon = step.staticIcon;
          const isCurrentStep = index === activeStep;
          
          return (
            <Link key={index} href={step.href}>
              <Card className={`
                hover:bg-elegant-700/30 hover:border-gold-400/30 transition-all duration-300 cursor-pointer group
                ${isCurrentStep ? 'border-gold-400/50 bg-elegant-700/20' : 'border-elegant-700/50'}
              `}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center shadow-gold-glow/50 group-hover:scale-110 transition-transform duration-300
                      ${isCurrentStep ? 'bg-gradient-gold' : 'bg-elegant-700 group-hover:bg-gradient-gold'}
                    `}>
                      <StaticIcon className={`w-5 h-5 ${isCurrentStep ? 'text-black' : 'text-white group-hover:text-black'} transition-colors duration-200`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`
                        text-base font-semibold transition-colors duration-200
                        ${isCurrentStep ? 'text-gold-400' : 'text-white group-hover:text-gold-400'}
                      `}>
                        {step.title}
                      </h3>
                      <p className="text-elegant-400 text-xs">{step.subtitle}</p>
                    </div>
                    {isCurrentStep && (
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
                        <span className="text-gold-400 text-xs">Active</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}