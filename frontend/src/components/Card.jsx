/**
 * Reusable Card component for consistent styling across the application
 * Replaces repeated card styling patterns
 */

function Card({ children, className = "", padding = "default", ...props }) {
  const paddingClasses = {
    default: "p-4 sm:p-6",
    large: "p-6 sm:p-8",
    small: "p-3 sm:p-4",
    none: "",
  };

  const baseClasses = "bg-white rounded-xl shadow-sm border border-gray-200";
  const classes =
    `${baseClasses} ${paddingClasses[padding]} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export default Card;
