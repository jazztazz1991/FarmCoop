import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BusinessPolicyCard from "../BusinessPolicyCard";

const mockPolicy = {
  id: "pol-1",
  businessName: "Test Insurance",
  type: "crop",
  coverageAmount: "100000",
  premium: "2466",
  deductible: "10000",
  status: "active",
  commodityName: "Wheat",
  equipmentName: null,
  expiresAt: "2026-03-01T00:00:00Z",
};

describe("BusinessPolicyCard", () => {
  it("renders coverage amount", () => {
    render(<BusinessPolicyCard policy={mockPolicy} />);
    expect(screen.getByText("$100,000")).toBeInTheDocument();
  });

  it("renders policy type", () => {
    render(<BusinessPolicyCard policy={mockPolicy} />);
    expect(screen.getByText("Crop Insurance")).toBeInTheDocument();
  });

  it("renders premium", () => {
    render(<BusinessPolicyCard policy={mockPolicy} />);
    expect(screen.getByText("$2,466")).toBeInTheDocument();
  });

  it("renders commodity name", () => {
    render(<BusinessPolicyCard policy={mockPolicy} />);
    expect(screen.getByText("Wheat")).toBeInTheDocument();
  });

  it("shows File Claim button for holder", () => {
    render(<BusinessPolicyCard policy={mockPolicy} isHolder />);
    expect(screen.getByText("File Claim")).toBeInTheDocument();
  });

  it("hides File Claim for non-holder", () => {
    render(<BusinessPolicyCard policy={mockPolicy} />);
    expect(screen.queryByText("File Claim")).not.toBeInTheDocument();
  });

  it("calls onFileClaim when clicked", () => {
    const onFileClaim = vi.fn();
    render(<BusinessPolicyCard policy={mockPolicy} isHolder onFileClaim={onFileClaim} />);
    fireEvent.click(screen.getByText("File Claim"));
    expect(onFileClaim).toHaveBeenCalledWith("pol-1");
  });

  it("renders status badge", () => {
    render(<BusinessPolicyCard policy={mockPolicy} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
