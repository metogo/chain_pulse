import React, { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

const Digit = ({ char, prevChar, direction }) => {
  const [animationClass, setAnimationClass] = useState('');
  const [displayChar, setDisplayChar] = useState(char);

  useEffect(() => {
    if (char !== prevChar) {
      setAnimationClass(direction === 'up' ? 'scroll-up' : 'scroll-down');
      setDisplayChar(char);
      
      const timer = setTimeout(() => {
        setAnimationClass('');
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setDisplayChar(char);
    }
  }, [char, prevChar, direction]);

  // If it's not a number (e.g. comma, dot, currency symbol), just render it
  if (isNaN(parseInt(char, 10))) {
    return <span>{char}</span>;
  }

  return (
    <span className="digit-wrapper">
      <span className={clsx("digit-reel", animationClass)}>
        {displayChar}
      </span>
    </span>
  );
};

const FlashValue = ({ value, children, className }) => {
  const [flashClass, setFlashClass] = useState('');
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const lastUpdateRef = useRef(Date.now());
  const throttleTimeoutRef = useRef(null);
  const [direction, setDirection] = useState('neutral');

  // Helper to format value to string for digit comparison
  const getValueString = (val, child) => {
    if (typeof child === 'string') return child;
    if (typeof val === 'number') return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return String(val);
  };

  const [valueString, setValueString] = useState(getValueString(value, children));
  
  // We need to store the *previous* string for comparison in the render
  const [prevValueString, setPrevValueString] = useState(getValueString(value, children));

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const throttleDelay = 300; // 300ms throttle

    const updateUI = () => {
      let newDirection = 'neutral';
      if (value > prevValueRef.current) {
        setFlashClass('price-flash-up');
        newDirection = 'up';
      } else if (value < prevValueRef.current) {
        setFlashClass('price-flash-down');
        newDirection = 'down';
      }

      setDirection(newDirection);
      setDisplayValue(value);
      
      const newValueString = getValueString(value, children);
      
      // Update previous string state BEFORE setting new string state?
      // No, we need to render with (current=new, prev=old).
      // So we set prevValueString to the *current* valueString before updating valueString.
      // But valueString is state.
      
      // Actually, we can just use the ref for the *previous* value string that was rendered.
      // But we need to update it *after* the render cycle where we used it.
      
      // Let's use the state approach:
      // When value changes, we update valueString.
      // We also need to know what it *was*.
      
      setValueString(prev => {
        setPrevValueString(prev); // Set prev to what it was
        return newValueString;    // Set new to what it is
      });
      
      // Clear animation class after duration
      const timer = setTimeout(() => {
        setFlashClass('');
      }, 1200); 

      prevValueRef.current = value;
      lastUpdateRef.current = Date.now();

      return () => clearTimeout(timer);
    };

    if (timeSinceLastUpdate >= throttleDelay) {
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      return updateUI();
    } else {
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = setTimeout(() => {
        updateUI();
      }, throttleDelay - timeSinceLastUpdate);
      
      return () => {
        if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      };
    }
  }, [value, children]);

  // Split string into chars
  const chars = valueString.split('');
  const prevChars = prevValueString.split('');

  return (
    <div className={clsx("transition-colors duration-500 rounded px-1 -mx-1 inline-block", flashClass, className)}>
      <span className="price-text flex">
        {chars.map((char, index) => {
          // Align from right if lengths differ? 
          // Simple index matching for MVP.
          const prevChar = prevChars[index] || '';
          return (
            <Digit 
              key={index} 
              char={char} 
              prevChar={prevChar} 
              direction={direction} 
            />
          );
        })}
      </span>
    </div>
  );
};

export default FlashValue;