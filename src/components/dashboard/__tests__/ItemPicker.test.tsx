import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemPicker from "../ItemPicker";
import type { FS25Item } from "@/domain/business/dealership/fs25-catalog";

const catalog: FS25Item[] = [
  {
    itemId: "FENDT_724_VARIO",
    itemName: "Fendt 724 Vario",
    brand: "Fendt",
    type: "tractor",
    category: "equipment",
  },
  {
    itemId: "FENDT_942_VARIO",
    itemName: "Fendt 942 Vario",
    brand: "Fendt",
    type: "tractor",
    category: "equipment",
  },
  {
    itemId: "JOHN_DEERE_8R_370",
    itemName: "John Deere 8R 370",
    brand: "John Deere",
    type: "tractor",
    category: "equipment",
  },
  {
    itemId: "CLAAS_LEXION_8900",
    itemName: "CLAAS LEXION 8900",
    brand: "CLAAS",
    type: "harvester",
    category: "equipment",
  },
  {
    itemId: "COMMODITY_WHEAT",
    itemName: "Wheat",
    brand: "Commodity",
    type: "commodity",
    category: "commodity",
  },
];

describe("ItemPicker", () => {
  /* ── Initial render ─────────────────────────────────────────────── */
  it("renders all three dropdowns", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox", { name: "Equipment Type" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Make" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Model" })).toBeInTheDocument();
  });

  it("populates Equipment Type with unique types from catalog", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    const typeSelect = screen.getByRole("combobox", { name: "Equipment Type" });
    expect(typeSelect).toHaveTextContent("Tractor");
    expect(typeSelect).toHaveTextContent("Harvester");
    expect(typeSelect).toHaveTextContent("Commodity");
  });

  it("Make and Model dropdowns are disabled until a type is selected", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox", { name: "Make" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Model" })).toBeDisabled();
  });

  /* ── Cascade: Type → Make ───────────────────────────────────────── */
  it("enables Make and populates brands after selecting a type", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment Type" }), {
      target: { value: "tractor" },
    });
    const makeSelect = screen.getByRole("combobox", { name: "Make" });
    expect(makeSelect).not.toBeDisabled();
    expect(makeSelect).toHaveTextContent("Fendt");
    expect(makeSelect).toHaveTextContent("John Deere");
    expect(makeSelect).not.toHaveTextContent("CLAAS"); // harvester brand, not tractor
  });

  it("resets Make when type changes", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment Type" }), {
      target: { value: "tractor" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Make" }), {
      target: { value: "Fendt" },
    });
    // Change type → brand should reset, Model should be disabled
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment Type" }), {
      target: { value: "harvester" },
    });
    expect(screen.getByRole("combobox", { name: "Model" })).toBeDisabled();
  });

  /* ── Cascade: Make → Model ──────────────────────────────────────── */
  it("enables Model and populates items after selecting a brand", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment Type" }), {
      target: { value: "tractor" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Make" }), {
      target: { value: "Fendt" },
    });
    const modelSelect = screen.getByRole("combobox", { name: "Model" });
    expect(modelSelect).not.toBeDisabled();
    expect(modelSelect).toHaveTextContent("Fendt 724 Vario");
    expect(modelSelect).toHaveTextContent("Fendt 942 Vario");
    expect(modelSelect).not.toHaveTextContent("John Deere 8R 370");
  });

  /* ── Selection ──────────────────────────────────────────────────── */
  it("calls onSelect with the correct item when a model is chosen", () => {
    const onSelect = vi.fn();
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={onSelect}
        onSwitchToManual={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment Type" }), {
      target: { value: "tractor" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Make" }), {
      target: { value: "Fendt" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Model" }), {
      target: { value: "FENDT_724_VARIO" },
    });
    expect(onSelect).toHaveBeenCalledWith(catalog[0]);
  });

  /* ── Selected display ───────────────────────────────────────────── */
  it("shows selected item name and clear button when item is selected", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={catalog[0]}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    expect(screen.getByText("Fendt 724 Vario")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
    // Dropdowns should not be shown when item is selected
    expect(screen.queryByRole("combobox", { name: "Equipment Type" })).not.toBeInTheDocument();
  });

  it("calls onSelect(null) and shows dropdowns when clear is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ItemPicker
        catalog={catalog}
        selected={catalog[0]}
        onSelect={onSelect}
        onSwitchToManual={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  /* ── Manual fallback ────────────────────────────────────────────── */
  it("shows Enter manually instead link", () => {
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={vi.fn()}
      />
    );
    expect(screen.getByText(/enter manually instead/i)).toBeInTheDocument();
  });

  it("calls onSwitchToManual when the link is clicked", () => {
    const onSwitchToManual = vi.fn();
    render(
      <ItemPicker
        catalog={catalog}
        selected={null}
        onSelect={vi.fn()}
        onSwitchToManual={onSwitchToManual}
      />
    );
    fireEvent.click(screen.getByText(/enter manually instead/i));
    expect(onSwitchToManual).toHaveBeenCalled();
  });
});
