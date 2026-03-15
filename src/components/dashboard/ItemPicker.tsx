"use client";

import { useState } from "react";
import type { FS25Item } from "@/domain/business/dealership/fs25-catalog";

const TYPE_LABELS: Record<FS25Item["type"], string> = {
  tractor: "Tractor",
  harvester: "Combine Harvester",
  forage_harvester: "Forage Harvester",
  telehandler: "Telehandler",
  truck: "Truck",
  trailer: "Trailer",
  auger_wagon: "Auger Wagon",
  plow: "Plow",
  cultivator: "Cultivator",
  disc_harrow: "Disc Harrow",
  subsoiler: "Subsoiler",
  mulcher: "Mulcher",
  seeder: "Seeder / Planter",
  sprayer: "Sprayer",
  spreader: "Fertilizer Spreader",
  manure_spreader: "Manure Spreader",
  slurry_tanker: "Slurry Tanker",
  mower: "Mower",
  tedder: "Tedder",
  windrower: "Windrower / Rake",
  baler: "Baler",
  grain_header: "Grain Header",
  corn_header: "Corn Header",
  commodity: "Commodity",
};

const selectClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none disabled:opacity-40 disabled:cursor-not-allowed";

const chevron = (
  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

interface ItemPickerProps {
  catalog: FS25Item[];
  selected: FS25Item | null;
  onSelect: (item: FS25Item | null) => void;
  onSwitchToManual: () => void;
  disabled?: boolean;
}

export default function ItemPicker({
  catalog,
  selected,
  onSelect,
  onSwitchToManual,
  disabled,
}: ItemPickerProps) {
  const [selectedType, setSelectedType] = useState<FS25Item["type"] | "">("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const types = [...new Set(catalog.map((i) => i.type))].sort() as FS25Item["type"][];

  const brands =
    selectedType
      ? [...new Set(catalog.filter((i) => i.type === selectedType).map((i) => i.brand))].sort()
      : [];

  const models =
    selectedType && selectedBrand
      ? catalog.filter((i) => i.type === selectedType && i.brand === selectedBrand)
      : [];

  const handleTypeChange = (type: FS25Item["type"] | "") => {
    setSelectedType(type);
    setSelectedBrand("");
    if (selected) onSelect(null);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    if (selected) onSelect(null);
  };

  const handleModelChange = (itemId: string) => {
    if (!itemId) { onSelect(null); return; }
    const item = catalog.find((i) => i.itemId === itemId) ?? null;
    if (item) onSelect(item);
  };

  const handleClear = () => {
    onSelect(null);
    setSelectedType("");
    setSelectedBrand("");
  };

  /* ── Selected state ───────────────────────────────────────────────── */
  if (selected) {
    return (
      <div className="col-span-2 flex items-center justify-between bg-gray-800 border border-indigo-500 rounded-lg px-3 py-2.5">
        <div>
          <p className="text-white text-sm font-medium">{selected.itemName}</p>
          <p className="text-gray-500 text-xs">
            {selected.brand} &middot; {TYPE_LABELS[selected.type]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Clear selection"
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 ml-3 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  /* ── Cascading dropdowns ──────────────────────────────────────────── */
  return (
    <div className="col-span-2 space-y-3">
      {/* Row 1: Equipment Type (full width) */}
      <div className="relative">
        <select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value as FS25Item["type"] | "")}
          disabled={disabled}
          aria-label="Equipment Type"
          className={selectClass}
        >
          <option value="">Equipment Type</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {chevron}
      </div>

      {/* Row 2: Make + Model side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <select
            value={selectedBrand}
            onChange={(e) => handleBrandChange(e.target.value)}
            disabled={disabled || !selectedType}
            aria-label="Make"
            className={selectClass}
          >
            <option value="">Make</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          {chevron}
        </div>

        <div className="relative">
          <select
            value=""
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={disabled || !selectedBrand}
            aria-label="Model"
            className={selectClass}
          >
            <option value="">Model</option>
            {models.map((item) => (
              <option key={item.itemId} value={item.itemId}>
                {item.itemName}
              </option>
            ))}
          </select>
          {chevron}
        </div>
      </div>

      {/* Enter manually fallback */}
      <div>
        <button
          type="button"
          onClick={onSwitchToManual}
          disabled={disabled}
          className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors disabled:opacity-50"
        >
          Enter manually instead →
        </button>
      </div>
    </div>
  );
}
