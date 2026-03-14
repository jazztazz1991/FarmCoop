import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DealershipItemCard from "../DealershipItemCard";

const mockItem = {
  id: "item-1",
  itemName: "Fendt Vario 900",
  category: "equipment",
  quantity: 1,
  pricePerUnit: "350000",
  status: "active",
};

describe("DealershipItemCard", () => {
  it("renders item name", () => {
    render(<DealershipItemCard item={mockItem} />);
    expect(screen.getByText("Fendt Vario 900")).toBeInTheDocument();
  });

  it("renders category", () => {
    render(<DealershipItemCard item={mockItem} />);
    expect(screen.getByText("equipment")).toBeInTheDocument();
  });

  it("renders price", () => {
    render(<DealershipItemCard item={mockItem} />);
    expect(screen.getByText("$350,000")).toBeInTheDocument();
  });

  it("shows Buy button for non-owner", () => {
    render(<DealershipItemCard item={mockItem} />);
    expect(screen.getByText("Buy")).toBeInTheDocument();
  });

  it("shows Remove button for owner", () => {
    render(<DealershipItemCard item={mockItem} isOwner />);
    expect(screen.getByText("Remove")).toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });

  it("calls onBuy when clicked", () => {
    const onBuy = vi.fn();
    render(<DealershipItemCard item={mockItem} onBuy={onBuy} />);
    fireEvent.click(screen.getByText("Buy"));
    expect(onBuy).toHaveBeenCalledWith("item-1");
  });

  it("hides buttons for sold items", () => {
    render(<DealershipItemCard item={{ ...mockItem, status: "sold" }} />);
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });
});
