import * as React from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  label?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({ value, onChange, placeholder, label }) => {
  const [displayValue, setDisplayValue] = React.useState(value === 0 ? '' : value.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setDisplayValue(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      } else {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    if (displayValue !== '') {
      setDisplayValue(value.toFixed(2));
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="text-[12px] font-semibold text-text2 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text font-mono focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 font-mono">DH</span>
      </div>
    </div>
  );
};
