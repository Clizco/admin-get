import { useEffect, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  label?: string;
  placeholder?: string;
  value?: string;                 // ⬅ opcional
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Elige una opción",
  value,                          // ⬅ ahora lo recibimos
  onChange,
  className = "",
  defaultValue = "",
}) => {
  // estado interno solo si NO es controlado
  const [internal, setInternal] = useState<string>(defaultValue);

  // si el padre pasa `value`, sincronizamos visualmente cuando cambie
  useEffect(() => {
    if (value !== undefined) {
      setInternal(value);
    }
  }, [value]);

  const current = value !== undefined ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (value === undefined) setInternal(v); // no controlado
    onChange(v);                              // notifica al padre
  };

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        current ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={current}
      onChange={handleChange}
    >
      {/* Placeholder */}
      <option
        value=""
        disabled={!!current}  // deshabilita solo si hay algo seleccionado
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>

      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
