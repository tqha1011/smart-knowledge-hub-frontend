interface CategoryFilterChipsProps {
  categories: string[];
  /** `null` = the "All" chip is active. */
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
}

// Pill-style, single active state — filters the Document Library table
// within the current Space. Only rendered above the "All documents" tab.
export function CategoryFilterChips({
  categories,
  activeCategory,
  onSelect,
}: CategoryFilterChipsProps) {
  const chipClass = (isActive: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      isActive
        ? "bg-accent text-white"
        : "bg-surface-sunken text-ink-muted hover:text-ink"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={chipClass(activeCategory === null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={chipClass(activeCategory === category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
