"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";

interface FeedFiltersProps {
  onFilterChange: (filters: {
    impact?: string;
    category?: string;
    minRelevance?: number;
  }) => void;
  activeFilters: {
    impact?: string;
    category?: string;
    minRelevance?: number;
  };
}

const impactLevels = ["critical", "high", "medium", "low", "informational"];
const categories = ["cybersecurity", "AI", "cloud", "enterprise", "ransomware", "vulnerability"];

export function FeedFilters({ onFilterChange, activeFilters }: FeedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = activeFilters.impact || activeFilters.category || (activeFilters.minRelevance && activeFilters.minRelevance > 0);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            hasActiveFilters
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-text-secondary hover:border-border-bright"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {[activeFilters.impact, activeFilters.category, activeFilters.minRelevance ? "r" : null].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => onFilterChange({})}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-muted hover:text-text-secondary"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 p-4 bg-surface border border-border rounded-lg space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Impact Level</label>
            <div className="flex flex-wrap gap-1.5">
              {impactLevels.map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    onFilterChange({
                      ...activeFilters,
                      impact: activeFilters.impact === level ? undefined : level,
                    })
                  }
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeFilters.impact === level
                      ? "bg-accent/15 text-accent"
                      : "bg-border text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    onFilterChange({
                      ...activeFilters,
                      category: activeFilters.category === cat ? undefined : cat,
                    })
                  }
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeFilters.category === cat
                      ? "bg-accent/15 text-accent"
                      : "bg-border text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">
              Min Relevance: {activeFilters.minRelevance || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={(activeFilters.minRelevance || 0) * 100}
              onChange={(e) =>
                onFilterChange({
                  ...activeFilters,
                  minRelevance: parseInt(e.target.value) / 100,
                })
              }
              className="w-full accent-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
