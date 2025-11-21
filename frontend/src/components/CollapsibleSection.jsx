import { useState, useRef, useEffect } from "react";

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [maxHeight, setMaxHeight] = useState(defaultOpen ? "9999px" : "0px");
  const contentRef = useRef(null);

  // Recalculate height when open/close or children change
  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      const scrollHeight = contentRef.current.scrollHeight;
      setMaxHeight(scrollHeight ? `${scrollHeight}px` : "9999px");
    } else {
      setMaxHeight("0px");
    }
  }, [isOpen, children]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900/40 shadow-sm">
      {/* Header / toggle button */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-900/80 transition-colors"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 truncate">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Chevron icon */}
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/60 text-xs text-slate-300 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 5l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Animated content container */}
      <div
        ref={contentRef}
        style={{ maxHeight }}
        className="overflow-hidden border-t border-slate-800/80 transition-all duration-300 ease-out"
      >
        <div
          className={`px-4 py-3 transition-all duration-300 ease-out ${
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1"
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export default CollapsibleSection;
