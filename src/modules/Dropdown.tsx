import React from 'react';

interface DropdownProps {
  options: string[];
  onChange: (selectedOption: string) => void;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, onChange, className }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <select className={className} onChange={handleChange}>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
};

export default Dropdown;