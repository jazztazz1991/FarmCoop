import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionLog } from "../TransactionLog";
import type { TransactionDTO } from "@/domain/transaction/transaction.model";

const mockTransactions: TransactionDTO[] = [
  {
    id: "1",
    type: "money",
    farmId: 1,
    amount: 50000,
    equipmentId: null,
    status: "pending",
    createdAt: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "2",
    type: "equipment",
    farmId: 2,
    amount: null,
    equipmentId: "data/vehicles/fendt/vario700/vario700.xml",
    status: "confirmed",
    createdAt: "2026-03-12T01:00:00.000Z",
  },
];

describe("TransactionLog", () => {
  it("shows empty state when no transactions", () => {
    render(<TransactionLog transactions={[]} />);
    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });

  it("renders transaction rows", () => {
    render(<TransactionLog transactions={mockTransactions} />);

    expect(screen.getByText("money")).toBeInTheDocument();
    expect(screen.getByText("equipment")).toBeInTheDocument();
    expect(screen.getByText("Farm 1")).toBeInTheDocument();
    expect(screen.getByText("Farm 2")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });

  it("displays equipment path for equipment transactions", () => {
    render(<TransactionLog transactions={mockTransactions} />);
    expect(
      screen.getByText("data/vehicles/fendt/vario700/vario700.xml")
    ).toBeInTheDocument();
  });
});
