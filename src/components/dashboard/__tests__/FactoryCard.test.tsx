import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FactoryCard from "../FactoryCard";

const factory = {
  id: "factory-1",
  name: "My Sawmill",
  recipeName: "Sawmill",
  cyclesRun: 5,
  createdAt: "2026-03-12T00:00:00Z",
};

describe("FactoryCard", () => {
  it("renders factory name and recipe name", () => {
    render(<FactoryCard factory={factory} onProduce={vi.fn()} />);
    expect(screen.getByText("My Sawmill")).toBeInTheDocument();
    expect(screen.getByText("Sawmill")).toBeInTheDocument();
  });

  it("renders total cycles run", () => {
    render(<FactoryCard factory={factory} onProduce={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows Start Production button", () => {
    render(<FactoryCard factory={factory} onProduce={vi.fn()} />);
    expect(screen.getByText("Start Production")).toBeInTheDocument();
  });

  it("calls onProduce with factory id when Start Production is clicked", async () => {
    const onProduce = vi.fn();
    render(<FactoryCard factory={factory} onProduce={onProduce} />);
    await userEvent.click(screen.getByText("Start Production"));
    expect(onProduce).toHaveBeenCalledWith("factory-1");
  });

  it("renders the created date", () => {
    render(<FactoryCard factory={factory} onProduce={vi.fn()} />);
    expect(screen.getByText("Created")).toBeInTheDocument();
  });
});
