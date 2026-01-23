/**
 * SliderControl Component
 * Reusable slider control with label, value display, and units
 */
import { useSliderStyles } from '../../hooks/useSliderStyles';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
  disabled?: boolean;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  className = 'leva-slider',
  disabled = false
}: SliderControlProps) {
  useSliderStyles('slider-control-styles', className);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '4px',
        fontSize: '11px',
        color: '#aaa'
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500, color: '#fff' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={className}
        disabled={disabled}
        style={{ width: '100%' }}
      />
    </div>
  );
}
