function ActionButtons({ onEditParameters, onViewReferences }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={onEditParameters}
        className="inline-flex items-center rounded-lg border border-slate-600 bg-slate-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-700 hover:border-slate-500 transition-colors"
      >
        Edit Parameters
      </button>

      <button
        type="button"
        onClick={onViewReferences}
        className="inline-flex items-center rounded-lg border border-slate-600 bg-slate-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-700 hover:border-slate-500 transition-colors"
      >
        View References
      </button>
    </div>
  );
}

export default ActionButtons;
