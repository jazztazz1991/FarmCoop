import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BusinessWalletCard from "../BusinessWalletCard";

const mockLedger = [
  {
    id: "entry-1",
    amount: "5000",
    type: "owner_deposit",
    description: "Owner deposit",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "entry-2",
    amount: "-2000",
    type: "owner_withdrawal",
    description: "Owner withdrawal",
    createdAt: "2026-01-02T00:00:00Z",
  },
];

describe("BusinessWalletCard", () => {
  const defaultProps = {
    balance: "10000",
    ledger: mockLedger,
    onDeposit: vi.fn().mockResolvedValue(undefined),
    onWithdraw: vi.fn().mockResolvedValue(undefined),
  };

  it("renders formatted balance", () => {
    render(<BusinessWalletCard {...defaultProps} />);
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("renders Business Wallet heading", () => {
    render(<BusinessWalletCard {...defaultProps} />);
    expect(screen.getByText("Business Wallet")).toBeInTheDocument();
  });

  it("renders balance subtitle with USD label", () => {
    render(<BusinessWalletCard {...defaultProps} />);
    expect(screen.getByText("Balance: $10000.00 USD")).toBeInTheDocument();
  });

  it("renders deposit and withdraw buttons", () => {
    render(<BusinessWalletCard {...defaultProps} />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Withdraw")).toBeInTheDocument();
  });

  it("shows error for empty amount", () => {
    render(<BusinessWalletCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Deposit"));
    expect(screen.getByText("Enter a valid amount")).toBeInTheDocument();
  });

  it("calls onDeposit with amount", async () => {
    const onDeposit = vi.fn().mockResolvedValue(undefined);
    render(<BusinessWalletCard {...defaultProps} onDeposit={onDeposit} />);

    const input = screen.getByPlaceholderText("Amount (e.g., 100.00)");
    fireEvent.change(input, { target: { value: "3000" } });
    fireEvent.click(screen.getByText("Deposit"));

    expect(onDeposit).toHaveBeenCalledWith("3000");
  });

  it("calls onWithdraw with amount", async () => {
    const onWithdraw = vi.fn().mockResolvedValue(undefined);
    render(<BusinessWalletCard {...defaultProps} onWithdraw={onWithdraw} />);

    const input = screen.getByPlaceholderText("Amount (e.g., 100.00)");
    fireEvent.change(input, { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Withdraw"));

    expect(onWithdraw).toHaveBeenCalledWith("1000");
  });
});
