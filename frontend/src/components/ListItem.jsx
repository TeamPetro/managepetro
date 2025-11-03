/**
 * Reusable ListItem component for consistent list item styling
 * Commonly used in cards displaying lists of items
 */

function ListItem({ children, className = "", icon, ...props }) {
  const baseClasses =
    "flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100";
  const classes = `${baseClasses} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default ListItem;
