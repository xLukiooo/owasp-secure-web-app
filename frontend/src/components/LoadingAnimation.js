import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

/**
 * Komponent LoadingAnimation.
 *
 * Wyświetla animację ładowania z trzema pulsującymi kółkami.
 * Animacja realizowana jest przy użyciu biblioteki gsap, która zmienia skalę oraz przezroczystość elementów.
 *
 * @component
 * @returns {JSX.Element} Element reprezentujący animację ładowania.
 */
const LoadingAnimation = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const circles = containerRef.current.querySelectorAll('.circle');
    gsap.to(circles, {
      scale: 0.5,
      opacity: 0.5,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      stagger: 0.2,
      ease: 'power1.inOut'
    });
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div ref={containerRef} style={{ display: 'flex', gap: '10px' }}>
        <div className="circle" style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#3498db'
        }}></div>
        <div className="circle" style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#3498db'
        }}></div>
        <div className="circle" style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#3498db'
        }}></div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
