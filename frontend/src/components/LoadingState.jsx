import Card from "./Card";

/**
 * Reusable LoadingState component for consistent loading UI
 * Can be used as a full page loader or inline loader
 */

function LoadingState({
  message = "Loading...",
  fullPage = false,
  size = "default",
  className = "",
  ...props
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-5 h-5 sm:w-6 sm:h-6",
    large: "w-8 h-8 sm:w-10 sm:h-10",
  };

  const spinnerClasses = `animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`;

  const content = (
    <div className="flex items-center justify-center space-x-3">
      <div className={spinnerClasses}></div>
      <span className="text-sm sm:text-base text-gray-600">{message}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div
        className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}
        {...props}
      >
        <Card padding="large" className="max-w-md w-full mx-4">
          {content}
        </Card>
      </div>
    );
  }

  return (
    <Card padding="large" className={className} {...props}>
      {content}
    </Card>
  );
}

export default LoadingState;
