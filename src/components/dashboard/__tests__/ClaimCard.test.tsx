import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClaimCard from "../ClaimCard";

const approvedClaim = {
  id: "claim-1",
  claimAmount: "25000",
  payout: "20000",
  reason: "Hail damage to wheat crop",
  status: "approved" as const,
};

const deniedClaim = {
  id: "claim-2",
  claimAmount: "15000",
  payout: "0",
  reason: "Pre-existing condition",
  status: "denied" as const,
};

const pendingClaim = {
  id: "claim-3",
  claimAmount: "10000",
  payout: "0",
  reason: "Equipment malfunction",
  status: "pending" as const,
};

describe("ClaimCard", () => {
  it("renders claim amount and payout", () => {
    render(<ClaimCard claim={approvedClaim} />);
    expect(screen.getByText("$25,000")).toBeInTheDocument();
    expect(screen.getByText("$20,000")).toBeInTheDocument();
  });

  it("renders reason text", () => {
    render(<ClaimCard claim={approvedClaim} />);
    expect(screen.getByText("Hail damage to wheat crop")).toBeInTheDocument();
  });

  it("shows Approved status badge for approved claims", () => {
    render(<ClaimCard claim={approvedClaim} />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("shows Denied status badge for denied claims", () => {
    render(<ClaimCard claim={deniedClaim} />);
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });

  it("shows Pending status badge for pending claims", () => {
    render(<ClaimCard claim={pendingClaim} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders payout as $0 for denied claims", () => {
    render(<ClaimCard claim={deniedClaim} />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });
});
