import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoanApplicationCard from "../LoanApplicationCard";

const mockApp = {
  id: "app-1",
  applicantName: "Borrower",
  principal: "50000",
  termMonths: 12,
  interestRateBp: 500,
  estimatedMonthlyPayment: "4280",
  status: "pending",
  denialReason: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("LoanApplicationCard", () => {
  it("renders principal amount", () => {
    render(<LoanApplicationCard application={mockApp} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("renders applicant name", () => {
    render(<LoanApplicationCard application={mockApp} />);
    expect(screen.getByText("Borrower")).toBeInTheDocument();
  });

  it("renders term and interest rate", () => {
    render(<LoanApplicationCard application={mockApp} />);
    expect(screen.getByText("12 months")).toBeInTheDocument();
    expect(screen.getByText("5.00%")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<LoanApplicationCard application={mockApp} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("shows approve/deny buttons for owner on pending app", () => {
    render(<LoanApplicationCard application={mockApp} isOwner />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Deny")).toBeInTheDocument();
  });

  it("hides buttons for non-owner", () => {
    render(<LoanApplicationCard application={mockApp} />);
    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
  });

  it("calls onApprove when clicked", () => {
    const onApprove = vi.fn();
    render(<LoanApplicationCard application={mockApp} isOwner onApprove={onApprove} />);
    fireEvent.click(screen.getByText("Approve"));
    expect(onApprove).toHaveBeenCalledWith("app-1");
  });

  it("shows denial reason when denied", () => {
    render(
      <LoanApplicationCard
        application={{ ...mockApp, status: "denied", denialReason: "Too risky" }}
      />
    );
    expect(screen.getByText("Reason: Too risky")).toBeInTheDocument();
  });
});
