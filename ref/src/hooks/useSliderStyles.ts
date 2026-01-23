/**
 * useSliderStyles Hook
 * Injects Leva-style slider CSS into the document
 * Reusable across all components that need styled sliders
 */
import { useEffect } from 'react';

export function useSliderStyles(styleId: string = 'leva-slider-style', className: string = 'leva-slider') {
  useEffect(() => {
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .${className} {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #2b2d30;
          outline: none;
        }
        
        .${className}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 16px;
          border-radius: 2px;
          background: #007bff;
          cursor: pointer;
        }
        
        .${className}::-moz-range-thumb {
          width: 8px;
          height: 16px;
          border-radius: 2px;
          background: #007bff;
          cursor: pointer;
          border: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, [styleId, className]);
}
