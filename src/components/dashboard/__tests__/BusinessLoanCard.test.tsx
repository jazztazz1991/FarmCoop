import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BusinessLoanCard from "../BusinessLoanCard";

const mockLoan = {
  id: "loan-1",
  businessName: "Test Bank",
  borrowerName: "Borrower",
  principal: "50000",
  interestRate: 500,
  remainingBalance: "45000",
  monthlyPayment: "4280",
  paymentsRemaining: 11,
  status: "active",
  nextPaymentDue: "2026-02-01T00:00:00Z",
};

describe("BusinessLoanCard", () => {
  it("renders principal amount", () => {
    render(<BusinessLoanCard loan={mockLoan} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("renders remaining balance", () => {
    render(<BusinessLoanCard loan={mockLoan} />);
    expect(screen.getByText("$45,000")).toBeInTheDocument();
  });

  it("renders interest rate", () => {
    render(<BusinessLoanCard loan={mockLoan} />);
    expect(screen.getByText("5.00%")).toBeInTheDocument();
  });

  it("shows borrower name for owner view", () => {
    render(<BusinessLoanCard loan={mockLoan} />);
    expect(screen.getByText("Borrower: Borrower")).toBeInTheDocument();
  });

  it("shows bank name for borrower view", () => {
    render(<BusinessLoanCard loan={mockLoan} isBorrower />);
    expect(screen.getByText("Test Bank")).toBeInTheDocument();
  });

  it("shows Make Payment button for borrower", () => {
    render(<BusinessLoanCard loan={mockLoan} isBorrower />);
    expect(screen.getByText("Make Payment")).toBeInTheDocument();
  });

  it("hides payment button for non-borrower", () => {
    render(<BusinessLoanCard loan={mockLoan} />);
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  it("calls onPay when clicked", () => {
    const onPay = vi.fn();
    render(<BusinessLoanCard loan={mockLoan} isBorrower onPay={onPay} />);
    fireEvent.click(screen.getByText("Make Payment"));
    expect(onPay).toHaveBeenCalledWith("loan-1");
  });

  it("renders status badge", () => {
    render(<BusinessLoanCard loan={mockLoan} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
