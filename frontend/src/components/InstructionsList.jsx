import DirectionIcon from "./DirectionIcon";
import { useState } from "react";

function InstructionsList({ instructions, maneuvers, onInstructionHover, onInstructionClick }) {
  const [activeInstruction, setActiveInstruction] = useState(null);

  // Use real TomTom maneuvers if available, otherwise fall back to AI instructions
  const displayInstructions = maneuvers && maneuvers.length > 0 ? maneuvers : instructions;
  const usingRealData = maneuvers && maneuvers.length > 0;

  const handleInstructionHover = (instruction, index) => {
    setActiveInstruction(index);
    if (onInstructionHover) {
      onInstructionHover(instruction, index);
    }
  };

  const handleInstructionClick = (instruction, index) => {
    if (onInstructionClick) {
      onInstructionClick(instruction, index);
    }
  };

  const formatInstruction = (item, index) => {
    if (usingRealData) {
      // Format TomTom maneuver data
      return {
        id: `maneuver-${index}`,
        text: item.instruction || 'Continue straight',
        distance: item.distance_display || 'Unknown distance',
        time: item.time_display || '',
        direction_type: item.maneuver_type || 'straight',
        compass_direction: '',
        coordinates: item.coordinates,
        step_number: item.step_number || index + 1,
        isReal: true
      };
    } else {
      // Format AI-generated instruction data
      return {
        id: item.id || `instruction-${index}`,
        text: item.text || item.instruction || 'Continue',
        distance: item.distance || 'Unknown',
        time: item.duration || '',
        direction_type: item.direction_type || 'straight',
        compass_direction: item.compass_direction || '',
        coordinates: null,
        step_number: index + 1,
        isReal: false
      };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Turn-by-Turn Directions
        </h3>
        {usingRealData && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Real-time GPS Data
          </span>
        )}
        {!usingRealData && instructions.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            AI Generated
          </span>
        )}
      </div>

      <div className="space-y-2 sm:space-y-3">
        {displayInstructions.map((item, index) => {
          const instruction = formatInstruction(item, index);
          const isActive = activeInstruction === index;
          
          return (
            <div
              key={instruction.id}
              className={`flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg transition-all cursor-pointer ${
                isActive 
                  ? 'bg-blue-50 border-l-4 border-blue-400 shadow-sm' 
                  : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => handleInstructionHover(instruction, index)}
              onMouseLeave={() => setActiveInstruction(null)}
              onClick={() => handleInstructionClick(instruction, index)}
            >
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {instruction.step_number}
                </div>
              </div>

              {/* Dynamic Direction Icon */}
              <DirectionIcon
                directionType={instruction.direction_type}
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-blue-500'
                }`}
              />

              {/* Instruction Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm sm:text-base font-medium ${
                  isActive ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {instruction.text}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs sm:text-sm ${
                      isActive ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {instruction.distance}
                    </span>
                    {instruction.time && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className={`text-xs sm:text-sm ${
                          isActive ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {instruction.time}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {instruction.coordinates && (
                      <span className="text-xs text-green-600">📍</span>
                    )}
                    {instruction.compass_direction && (
                      <span className={`text-xs uppercase tracking-wide ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {instruction.compass_direction}
                      </span>
                    )}
                    {instruction.isReal && (
                      <span className="text-xs text-green-600">GPS</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayInstructions.length === 0 && (
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
