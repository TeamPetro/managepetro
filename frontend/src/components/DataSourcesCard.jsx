import { ChartBarIcon } from "@heroicons/react/24/outline";

function DataSourcesCard({ dataSources }) {
  if (!dataSources) return null;

  const dataItems = [
    {
      label: "Database Stations",
      value: dataSources.database_stations || 0,
      icon: "🏢",
      type: "number",
    },
    {
      label: "Recent Deliveries",
      value: dataSources.recent_deliveries || 0,
      icon: "🚚",
      type: "number",
    },
    {
      label: "Available Trucks",
      value: dataSources.available_trucks || 0,
      icon: "🚛",
      type: "number",
    },
    {
      label: "Weather Data",
      included: !!dataSources.weather_data,
      icon: "🌤️",
      type: "included",
    },
    {
      label: "AI Analysis",
      included: !!dataSources.ai_analysis,
      icon: "🤖",
      type: "included",
    },
  ];

  return (
    <div className="bg-slate-900/60 rounded-2xl shadow-lg border border-slate-800 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
          <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-slate-50">
            Data Sources
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Optimization data availability
          </p>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dataItems.map((item, index) => (
          <div
            key={index}
            className="p-3 bg-slate-900/80 rounded-xl border border-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl flex-shrink-0">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{item.label}</p>

                {item.type === "number" ? (
                  <p className="text-base sm:text-lg font-semibold text-slate-50">
                    {item.value}
                  </p>
                ) : (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      item.included
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {item.included ? "Included" : "Not included"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
        <p className="text-xs text-slate-400 text-center">
          Real-time data integration provides comprehensive route optimization
        </p>
      </div>
    </div>
  );
}

export default DataSourcesCard;
