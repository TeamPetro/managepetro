/**
 * Reusable Icon wrapper component for consistent icon sizing
 * Provides standard sizes and colors for Heroicons
 */

const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  default: "w-4 h-4 sm:w-5 sm:h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

function Icon({ children, size = "default", className = "", ...props }) {
  const sizeClasses = iconSizes[size] || iconSizes.default;
  const classes = `${sizeClasses} ${className}`.trim();

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Icon;
