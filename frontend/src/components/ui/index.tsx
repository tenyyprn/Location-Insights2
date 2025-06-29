import React from 'react';

// Card Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`card ${className}`} style={style}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`card-header ${className}`} style={style}>
    {children}
  </div>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`card-content ${className}`} style={style}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`card-footer ${className}`} style={style}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '', style }) => (
  <h3 className={`card-title ${className}`} style={style}>
    {children}
  </h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className = '', style }) => (
  <p className={`card-description ${className}`} style={style}>
    {children}
  </p>
);

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'default' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'default',
  className = '',
  style
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`btn ${variant === 'outline' ? 'btn-outline' : ''} ${className}`}
    style={style}
  >
    {children}
  </button>
);

// Input Components
interface InputProps {
  id?: string;
  name?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  min?: string;
  step?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  style,
  min,
  step
}) => (
  <input
    id={id}
    name={name}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`form-input ${className}`}
    style={style}
    min={min}
    step={step}
  />
);

// Label Component
interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Label: React.FC<LabelProps> = ({ htmlFor, children, className = '', style }) => (
  <label htmlFor={htmlFor} className={`form-label ${className}`} style={style}>
    {children}
  </label>
);

// Tabs Components
interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, className = '', style }) => (
  <div className={`tabs ${className}`} data-default-value={defaultValue} style={style}>
    {children}
  </div>
);

export const TabsList: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`tabs-list ${className}`} style={style}>
    {children}
  </div>
);

interface TabsTriggerProps {
  value: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  onClick, 
  className = '', 
  style,
  children 
}) => (
  <button
    onClick={onClick}
    className={`tabs-trigger ${className}`}
    data-value={value}
    style={style}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<TabsTriggerProps> = ({ 
  value, 
  className = '', 
  style,
  children 
}) => (
  <div className={`tabs-content ${className}`} data-value={value} style={style}>
    {children}
  </div>
);

// RadioGroup Components
interface RadioGroupProps {
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ 
  name, 
  value, 
  onValueChange, 
  children,
  className = '',
  style
}) => (
  <div className={`radio-group ${className}`} data-name={name} data-value={value} style={style}>
    {children}
  </div>
);

interface RadioGroupItemProps {
  value: string;
  id?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const RadioGroupItem: React.FC<RadioGroupItemProps> = ({ 
  value, 
  id, 
  name, 
  className = '',
  style 
}) => (
  <input
    type="radio"
    value={value}
    id={id}
    name={name}
    className={`radio-group-item ${className}`}
    style={style}
  />
);
