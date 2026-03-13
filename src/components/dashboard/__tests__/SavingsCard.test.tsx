import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SavingsCard from "../SavingsCard";

const mockSavings = {
  balance: "125000",
  apyBasisPoints: 200,
};

describe("SavingsCard", () => {
  it("renders the balance with formatting", () => {
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
      />
    );
    expect(screen.getByText("$125,000")).toBeInTheDocument();
  });

  it("converts basis points to APY percentage", () => {
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
      />
    );
    expect(screen.getByText("2.00% APY")).toBeInTheDocument();
  });

  it("converts 350 basis points correctly", () => {
    render(
      <SavingsCard
        savings={{ balance: "1000", apyBasisPoints: 350 }}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
      />
    );
    expect(screen.getByText("3.50% APY")).toBeInTheDocument();
  });

  it("renders Deposit button", () => {
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
      />
    );
    expect(screen.getByText("Deposit")).toBeInTheDocument();
  });

  it("renders Withdraw button", () => {
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
      />
    );
    expect(screen.getByText("Withdraw")).toBeInTheDocument();
  });

  it("calls onDeposit when Deposit button is clicked", async () => {
    const onDeposit = vi.fn();
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={onDeposit}
        onWithdraw={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText("Deposit"));
    expect(onDeposit).toHaveBeenCalledOnce();
  });

  it("calls onWithdraw when Withdraw button is clicked", async () => {
    const onWithdraw = vi.fn();
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={vi.fn()}
        onWithdraw={onWithdraw}
      />
    );
    await userEvent.click(screen.getByText("Withdraw"));
    expect(onWithdraw).toHaveBeenCalledOnce();
  });

  it("renders the Savings Account heading", () => {
    render(
      <SavingsCard
        savings={mockSavings}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
      />
    );
    expect(screen.getByText("Savings Account")).toBeInTheDocument();
  });
});
