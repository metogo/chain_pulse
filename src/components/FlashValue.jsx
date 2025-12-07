import React, { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

const FlashValue = ({ value, children, className }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      if (value > prevValueRef.current) {
        setFlashClass('price-flash-up');
      } else if (value < prevValueRef.current) {
        setFlashClass('price-flash-down');
      }
      
      prevValueRef.current = value;

      const timer = setTimeout(() => {
        setFlashClass('');
      }, 1000); // Match animation duration (1s)

      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className={clsx("transition-colors duration-500 rounded px-1 -mx-1 inline-block", flashClass, className)}>
      <span className="price-text">
        {children || value}
      </span>
    </div>
  );
};

export default FlashValue;