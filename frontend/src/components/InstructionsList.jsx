import DirectionIcon from "./DirectionIcon";

function InstructionsList({ instructions }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Turn-by-Turn Directions
      </h3>

      <div className="space-y-2 sm:space-y-3">
        {instructions.map((instruction, index) => (
          <div
            key={instruction.id}
            className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Step Number */}
            <div className="flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                {index + 1}
              </div>
            </div>

            {/* Dynamic Direction Icon */}
            <DirectionIcon
              directionType={instruction.direction_type}
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0"
            />

            {/* Instruction Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base text-gray-900 font-medium">{instruction.text}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs sm:text-sm text-gray-500">{instruction.distance}</p>
                {instruction.compass_direction && (
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {instruction.compass_direction}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {instructions.length === 0 && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-sm sm:text-base text-gray-500">No route instructions available</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Enter a route to see step-by-step directions
          </p>
        </div>
      )}
    </div>
  );
}

export default InstructionsList;
