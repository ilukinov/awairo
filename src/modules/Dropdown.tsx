import React from 'react';

interface DropdownProps {
  options: string[];
  onChange: (selectedOption: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <select onChange={handleChange}>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
};

export default Dropdown;