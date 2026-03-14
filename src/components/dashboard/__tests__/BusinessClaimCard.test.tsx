import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BusinessClaimCard from "../BusinessClaimCard";

const mockClaim = {
  id: "claim-1",
  claimAmount: "50000",
  payout: "0",
  reason: "Crop failed due to drought",
  status: "pending",
  resolvedAt: null,
};

describe("BusinessClaimCard", () => {
  it("renders claim amount", () => {
    render(<BusinessClaimCard claim={mockClaim} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("renders reason", () => {
    render(<BusinessClaimCard claim={mockClaim} />);
    expect(screen.getByText("Crop failed due to drought")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<BusinessClaimCard claim={mockClaim} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("shows approve/deny buttons for owner", () => {
    render(<BusinessClaimCard claim={mockClaim} isOwner />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Deny")).toBeInTheDocument();
  });

  it("hides buttons for non-owner", () => {
    render(<BusinessClaimCard claim={mockClaim} />);
    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
  });

  it("calls onApprove", () => {
    const onApprove = vi.fn();
    render(<BusinessClaimCard claim={mockClaim} isOwner onApprove={onApprove} />);
    fireEvent.click(screen.getByText("Approve"));
    expect(onApprove).toHaveBeenCalledWith("claim-1");
  });

  it("shows payout for approved claim", () => {
    render(
      <BusinessClaimCard claim={{ ...mockClaim, status: "approved", payout: "40000" }} />
    );
    expect(screen.getByText("Payout: $40,000")).toBeInTheDocument();
  });
});
