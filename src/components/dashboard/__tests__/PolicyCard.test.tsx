import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PolicyCard from "../PolicyCard";

const activePolicy = {
  id: "policy-1",
  type: "crop" as const,
  coverageAmount: "100000",
  premium: "5000",
  deductible: "2000",
  status: "active" as const,
  expiresAt: "2026-12-31T00:00:00Z",
  commodityName: "Wheat",
  equipmentName: null,
};

const expiredPolicy = {
  id: "policy-2",
  type: "vehicle" as const,
  coverageAmount: "50000",
  premium: "3000",
  deductible: "1000",
  status: "expired" as const,
  expiresAt: "2025-06-01T00:00:00Z",
  equipmentName: "John Deere 8R",
  commodityName: null,
};

const liabilityPolicy = {
  id: "policy-3",
  type: "liability" as const,
  coverageAmount: "200000",
  premium: "8000",
  deductible: "5000",
  status: "active" as const,
  expiresAt: "2027-01-01T00:00:00Z",
  commodityName: null,
  equipmentName: null,
};

describe("PolicyCard", () => {
  it("renders coverage amount, premium paid, and deductible", () => {
    render(<PolicyCard policy={activePolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("$2,000")).toBeInTheDocument();
  });

  it("shows type badge for crop policy", () => {
    render(<PolicyCard policy={activePolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("Crop")).toBeInTheDocument();
  });

  it("shows type badge for vehicle policy", () => {
    render(<PolicyCard policy={expiredPolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
  });

  it("shows type badge for liability policy", () => {
    render(<PolicyCard policy={liabilityPolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("Liability")).toBeInTheDocument();
  });

  it("shows Active status badge for active policies", () => {
    render(<PolicyCard policy={activePolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Expired status badge for expired policies", () => {
    render(<PolicyCard policy={expiredPolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("shows commodity name for crop policies", () => {
    render(<PolicyCard policy={activePolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("Wheat")).toBeInTheDocument();
  });

  it("shows equipment name for vehicle policies", () => {
    render(<PolicyCard policy={expiredPolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("John Deere 8R")).toBeInTheDocument();
  });

  it("shows File Claim button for active policies", () => {
    render(<PolicyCard policy={activePolicy} onClaim={vi.fn()} />);
    expect(screen.getByText("File Claim")).toBeInTheDocument();
  });

  it("hides File Claim button for expired policies", () => {
    render(<PolicyCard policy={expiredPolicy} onClaim={vi.fn()} />);
    expect(screen.queryByText("File Claim")).not.toBeInTheDocument();
  });

  it("calls onClaim with policy id when File Claim is clicked", async () => {
    const onClaim = vi.fn();
    render(<PolicyCard policy={activePolicy} onClaim={onClaim} />);
    await userEvent.click(screen.getByText("File Claim"));
    expect(onClaim).toHaveBeenCalledWith("policy-1");
  });

  it("shows expiry date", () => {
    render(<PolicyCard policy={activePolicy} onClaim={vi.fn()} />);
    expect(screen.getByText(/Expires:/)).toBeInTheDocument();
  });
});
