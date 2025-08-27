import React, { useState } from 'react';
import { MetricDefinition } from '../types';

interface MetricInputProps {
  metric: MetricDefinition;
  value?: any;
  onChange: (value: any) => void;
  className?: string;
}

const MetricInput: React.FC<MetricInputProps> = ({
  metric,
  value,
  onChange,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value ?? metric.defaultValue);

  const handleChange = (newValue: any) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const renderInput = () => {
    switch (metric.type) {
      case 'rating':
        return (
          <div className="rating-input">
            <div className="flex gap-2 items-center">
              {Array.from({ length: metric.max! - metric.min! + 1 }, (_, i) => {
                const ratingValue = metric.min! + i;
                return (
                  <button
                    key={ratingValue}
                    type="button"
                    className={`rating-star ${
                      ratingValue <= inputValue ? 'active' : ''
                    }`}
                    onClick={() => handleChange(ratingValue)}
                    style={{
                      backgroundColor: ratingValue <= inputValue ? metric.color : '#e5e7eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {ratingValue}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="slider-input">
            <input
              type="range"
              min={metric.min}
              max={metric.max}
              step={metric.step}
              value={inputValue}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: metric.color }}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{metric.min}</span>
              <span className="font-semibold" style={{ color: metric.color }}>
                {inputValue}
              </span>
              <span>{metric.max}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="number-input">
            <input
              type="number"
              min={metric.min}
              max={metric.max}
              step={metric.step}
              value={inputValue}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ borderColor: metric.color }}
            />
            {metric.unit && (
              <span className="text-sm text-gray-500 mt-1">{metric.unit}</span>
            )}
          </div>
        );

      case 'time':
        return (
          <input
            type="time"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ borderColor: metric.color }}
          />
        );

      case 'boolean':
        return (
          <div className="boolean-input">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inputValue}
                onChange={(e) => handleChange(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`toggle-switch ${inputValue ? 'active' : ''}`}
                style={{
                  width: '48px',
                  height: '24px',
                  backgroundColor: inputValue ? metric.color : '#e5e7eb',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  className="toggle-thumb"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: inputValue ? '26px' : '2px',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
              <span className="ml-2 text-sm text-gray-700">
                {inputValue ? 'Yes' : 'No'}
              </span>
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
          />
        );
    }
  };

  return (
    <div className={`metric-input ${className}`}>
      <div className="flex items-center mb-2">
        {metric.icon && <span className="mr-2 text-lg">{metric.icon}</span>}
        <label className="font-medium text-gray-900">{metric.name}</label>
        {metric.unit && (
          <span className="ml-2 text-sm text-gray-500">({metric.unit})</span>
        )}
      </div>
      {metric.description && (
        <p className="text-sm text-gray-600 mb-2">{metric.description}</p>
      )}
      {renderInput()}
    </div>
  );
};

export default MetricInput;