import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FarmCard from "../FarmCard";

const mockFarm = {
  id: "farm-1",
  name: "Green Acres",
  farmSlot: 3,
  serverName: "US East Server",
};

describe("FarmCard", () => {
  it("renders the farm name", () => {
    render(<FarmCard farm={mockFarm} />);
    expect(screen.getByText("Green Acres")).toBeInTheDocument();
  });

  it("renders the slot number", () => {
    render(<FarmCard farm={mockFarm} />);
    expect(screen.getByText("Slot 3")).toBeInTheDocument();
  });

  it("renders the server name", () => {
    render(<FarmCard farm={mockFarm} />);
    expect(screen.getByText("US East Server")).toBeInTheDocument();
  });
});
