import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TransactionTable from "../TransactionTable";

const mockTransactions = [
  {
    id: "tx-1",
    type: "money",
    amount: 25000,
    equipmentId: null,
    status: "pending",
    farmSlot: 1,
    createdAt: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "tx-2",
    type: "equipment",
    amount: null,
    equipmentId: "data/vehicles/fendt/vario700.xml",
    status: "confirmed",
    farmSlot: 2,
    createdAt: "2026-03-12T01:00:00.000Z",
  },
];

describe("TransactionTable", () => {
  it("renders 'No transactions yet' when the list is empty", () => {
    render(<TransactionTable transactions={[]} />);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("does not render a table when the list is empty", () => {
    const { container } = render(<TransactionTable transactions={[]} />);
    expect(container.querySelector("table")).toBeNull();
  });

  it("renders table column headers", () => {
    render(<TransactionTable transactions={mockTransactions} />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Farm Slot")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("renders transaction rows with correct data", () => {
    render(<TransactionTable transactions={mockTransactions} />);
    expect(screen.getByText("money")).toBeInTheDocument();
    expect(screen.getByText("equipment")).toBeInTheDocument();
    expect(screen.getByText("$25,000")).toBeInTheDocument();
    expect(screen.getByText("data/vehicles/fendt/vario700.xml")).toBeInTheDocument();
  });

  it("renders status badges for each transaction", () => {
    render(<TransactionTable transactions={mockTransactions} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });

  it("renders farm slot numbers", () => {
    render(<TransactionTable transactions={mockTransactions} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
