import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  label?: string;
  helpText?: string;
}

/**
 * Custom select component with dropdown functionality
 * Provides consistent styling matching the navbar dropdown
 * Supports options, value selection, and various customizations
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  name,
  label,
  helpText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  // Get the selected option label to display
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle option selection
  const handleSelectOption = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    // Open dropdown on arrow down or up
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    // Close dropdown on Escape
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      return;
    }

    // Select option with Enter
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      // Find the currently focused option
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement && focusedElement.dataset.value) {
        const option = options.find(opt => opt.value === focusedElement.dataset.value);
        if (option) {
          handleSelectOption(option);
        }
      }
    }

    // Navigate options with arrow keys when open
    if (isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      
      const focusedElement = document.activeElement as HTMLElement;
      const optionElements = selectRef.current?.querySelectorAll('[role="option"]');
      
      if (!optionElements || optionElements.length === 0) return;
      
      // Convert to array for easier manipulation
      const optionsArray = Array.from(optionElements) as HTMLElement[];
      
      if (!focusedElement || !focusedElement.dataset.value) {
        // No option is focused yet, focus the first or last one
        const targetIndex = e.key === 'ArrowDown' ? 0 : optionsArray.length - 1;
        optionsArray[targetIndex]?.focus();
        return;
      }
      
      // Find the currently focused option index
      const currentIndex = optionsArray.findIndex(opt => 
        opt.dataset.value === focusedElement.dataset.value);
      
      if (currentIndex === -1) return;
      
      // Calculate new index
      const newIndex = e.key === 'ArrowDown' 
        ? (currentIndex + 1) % optionsArray.length
        : (currentIndex - 1 + optionsArray.length) % optionsArray.length;
      
      optionsArray[newIndex]?.focus();
    }
  };
  
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div ref={selectRef} className="relative" onKeyDown={handleKeyDown}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white flex items-center justify-between ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto"
              role="listbox"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-4 py-2 ${
                    value === option.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } transition-colors duration-150`}
                  role="option"
                  aria-selected={value === option.value}
                  data-value={option.value}
                  tabIndex={0}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {helpText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};