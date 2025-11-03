/**
 * Reusable StatusBadge component for consistent badge styling
 * Supports different variants and colors
 */

const badgeVariants = {
  default: "bg-gray-100 text-gray-800",
  primary: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-indigo-100 text-indigo-800",
  ai: "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800",
  outline: "bg-white text-gray-700 border border-gray-200",
};

function StatusBadge({
  children,
  variant = "default",
  className = "",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium";
  const variantClasses = badgeVariants[variant] || badgeVariants.default;
  const classes = `${baseClasses} ${variantClasses} ${className}`.trim();

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default StatusBadge;
