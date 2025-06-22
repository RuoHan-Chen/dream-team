'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoScreenProps {
  onComplete: () => void;
  children?: React.ReactNode;
}

export function LogoScreen({ onComplete, children }: LogoScreenProps) {
  const [showLogo, setShowLogo] = useState(false);
  const [showDreamBig, setShowDreamBig] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDistance, setSlideDistance] = useState(0);
  const [shouldUnmount, setShouldUnmount] = useState(false);

  useEffect(() => {
    // Show logo after 0.5 seconds
    const timer0 = setTimeout(() => {
      setShowLogo(true);
    }, 500);

    // Show "Dream Big" text after 1 second
    const timer1 = setTimeout(() => {
      setShowDreamBig(true);
    }, 1000);

    // Show swipe hint after 1.5 seconds
    const timer2 = setTimeout(() => {
      setShowSwipeHint(true);
    }, 1500);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const minSwipeDistance = 50;
  const maxSlideDistance = 1000; // Increased to ensure it goes completely off screen

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchEndY(0);
    setIsSliding(false);
    setSlideDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    setTouchEndY(currentY);
    
    if (touchStartY > 0) {
      const distance = touchStartY - currentY;
      if (distance > 0) {
        // Use a smoother easing function for the slide distance
        const easedDistance = Math.min(distance * 0.8, maxSlideDistance);
        setSlideDistance(easedDistance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartY || !touchEndY) return;
    
    const distance = touchStartY - touchEndY;
    const isUpSwipe = distance > minSwipeDistance;

    if (isUpSwipe) {
      console.log('Swipe detected! Distance:', distance);
      setIsSliding(true);
      setSlideDistance(maxSlideDistance); // Slide up completely off screen
      
      // Complete the transition after animation finishes
      setTimeout(() => {
        setShouldUnmount(true);
        setTimeout(() => {
          onComplete();
        }, 100);
      }, 800);
    } else {
      // Reset if swipe wasn't strong enough
      setIsSliding(true);
      setSlideDistance(0);
      setTimeout(() => {
        setIsSliding(false);
      }, 300);
    }
  };

  // Also handle mouse events for desktop testing
  const [mouseStartY, setMouseStartY] = useState(0);
  const [mouseEndY, setMouseEndY] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setMouseStartY(e.clientY);
    setMouseEndY(0);
    setIsSliding(false);
    setSlideDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDown) {
      const currentY = e.clientY;
      setMouseEndY(currentY);
      
      if (mouseStartY > 0) {
        const distance = mouseStartY - currentY;
        if (distance > 0) {
          // Use a smoother easing function for the slide distance
          const easedDistance = Math.min(distance * 0.8, maxSlideDistance);
          setSlideDistance(easedDistance);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDown) return;
    
    setIsMouseDown(false);
    if (!mouseStartY || !mouseEndY) return;
    
    const distance = mouseStartY - mouseEndY;
    const isUpSwipe = distance > minSwipeDistance;

    if (isUpSwipe) {
      console.log('Mouse swipe detected! Distance:', distance);
      setIsSliding(true);
      setSlideDistance(maxSlideDistance); // Slide up completely off screen
      
      // Complete the transition after animation finishes
      setTimeout(() => {
        setShouldUnmount(true);
        setTimeout(() => {
          onComplete();
        }, 100);
      }, 800);
    } else {
      // Reset if swipe wasn't strong enough
      setIsSliding(true);
      setSlideDistance(0);
      setTimeout(() => {
        setIsSliding(false);
      }, 300);
    }
  };

  // Don't render if should unmount
  if (shouldUnmount) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Main content behind the logo screen */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Logo screen overlay */}
      <div 
        className="fixed inset-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center z-50 select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsMouseDown(false)}
        style={{
          transform: `translateY(-${slideDistance}px)`,
          transition: isSliding ? 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
        }}
      >
        {/* Logo */}
        <div className={`mb-8 transform transition-all duration-1000 ease-out ${
          showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Link href="/" className="block hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo.png"
              alt="Dream Market Logo"
              width={300}
              height={90}
              className="h-20 md:h-32 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Dream Big Text */}
        <div className={`transition-all duration-1000 ease-out transform ${
          showDreamBig ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4">
            Dream Market
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-blue-200 text-center mb-2">
            Dream Big
          </p>
          <p className="text-xl md:text-2xl text-blue-200 text-center">
            Predict the future, earn rewards
          </p>
        </div>

        {/* Swipe Up Hint */}
        <div className={`absolute bottom-20 transition-all duration-1000 ease-out transform ${
          showSwipeHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex flex-col items-center text-white">
            <div className="animate-bounce mb-2">
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 10l7-7m0 0l7 7m-7-7v18" 
                />
              </svg>
            </div>
            <p className="text-lg font-medium">Swipe up to enter</p>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-400/10 to-transparent animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-ping"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-300/20 rounded-full blur-xl animate-ping animation-delay-1000"></div>
        </div>
      </div>
    </>
  );
} 