import React, { useState } from 'react';

const PasswordField = ({
  id,
  label,
  name,
  value,
  onChange,
  autoComplete,
  required = true,
  helpText
}) => {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          className="form-input pr-16"
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-academic-primary hover:text-academic-primary-dark"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {helpText && <p className="mt-1 text-xs text-academic-muted mb-0">{helpText}</p>}
    </div>
  );
};

export default PasswordField;
