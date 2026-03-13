import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoanCard from "../LoanCard";

const activeLoan = {
  id: "loan-1",
  principal: "50000",
  remainingBalance: "35000",
  monthlyPayment: "2500",
  interestRate: "550",
  paymentsRemaining: 14,
  status: "active" as const,
  nextPaymentDue: "2026-04-01T00:00:00Z",
};

const paidOffLoan = {
  id: "loan-2",
  principal: "20000",
  remainingBalance: "0",
  monthlyPayment: "1000",
  interestRate: "400",
  paymentsRemaining: 0,
  status: "paid_off" as const,
  nextPaymentDue: null,
};

const defaultedLoan = {
  id: "loan-3",
  principal: "30000",
  remainingBalance: "28000",
  monthlyPayment: "1500",
  interestRate: "600",
  paymentsRemaining: 20,
  status: "defaulted" as const,
  nextPaymentDue: null,
};

describe("LoanCard", () => {
  it("renders loan principal and remaining balance", () => {
    render(<LoanCard loan={activeLoan} onPay={vi.fn()} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
    expect(screen.getByText("$35,000")).toBeInTheDocument();
  });

  it("renders monthly payment and interest rate", () => {
    render(<LoanCard loan={activeLoan} onPay={vi.fn()} />);
    expect(screen.getByText("$2,500")).toBeInTheDocument();
    expect(screen.getByText("5.50%")).toBeInTheDocument();
  });

  it("shows Active status badge for active loans", () => {
    render(<LoanCard loan={activeLoan} onPay={vi.fn()} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Paid Off status badge for paid_off loans", () => {
    render(<LoanCard loan={paidOffLoan} onPay={vi.fn()} />);
    expect(screen.getByText("Paid Off")).toBeInTheDocument();
  });

  it("shows Defaulted status badge for defaulted loans", () => {
    render(<LoanCard loan={defaultedLoan} onPay={vi.fn()} />);
    expect(screen.getByText("Defaulted")).toBeInTheDocument();
  });

  it("shows Make Payment button for active loans", () => {
    render(<LoanCard loan={activeLoan} onPay={vi.fn()} />);
    expect(screen.getByText("Make Payment")).toBeInTheDocument();
  });

  it("hides Make Payment button for paid_off loans", () => {
    render(<LoanCard loan={paidOffLoan} onPay={vi.fn()} />);
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  it("hides Make Payment button for defaulted loans", () => {
    render(<LoanCard loan={defaultedLoan} onPay={vi.fn()} />);
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  it("calls onPay with loan id when Make Payment is clicked", async () => {
    const onPay = vi.fn();
    render(<LoanCard loan={activeLoan} onPay={onPay} />);
    await userEvent.click(screen.getByText("Make Payment"));
    expect(onPay).toHaveBeenCalledWith("loan-1");
  });

  it("shows next payment due date for active loans", () => {
    render(<LoanCard loan={activeLoan} onPay={vi.fn()} />);
    expect(screen.getByText(/Next payment due/)).toBeInTheDocument();
  });
});
