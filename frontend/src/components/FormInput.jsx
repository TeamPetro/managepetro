/**
 * Reusable FormInput component for consistent input styling
 */

function FormInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  icon: IconComponent,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${
            IconComponent ? "pl-9 sm:pl-10" : "pl-3 sm:pl-4"
          } pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {IconComponent && (
          <IconComponent className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}

export default FormInput;
