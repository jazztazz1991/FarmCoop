import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PremiumCalculator from "../PremiumCalculator";

describe("PremiumCalculator", () => {
  it("renders type selector, coverage input, and term selector", () => {
    render(<PremiumCalculator onQuote={vi.fn()} quote={null} />);
    expect(screen.getByText("Insurance Type")).toBeInTheDocument();
    expect(screen.getByText("Coverage Amount")).toBeInTheDocument();
    expect(screen.getByText("Term (days)")).toBeInTheDocument();
  });

  it("renders Calculate button", () => {
    render(<PremiumCalculator onQuote={vi.fn()} quote={null} />);
    expect(screen.getByText("Calculate")).toBeInTheDocument();
  });

  it("Calculate button is disabled when coverage is empty", () => {
    render(<PremiumCalculator onQuote={vi.fn()} quote={null} />);
    expect(screen.getByText("Calculate")).toBeDisabled();
  });

  it("calls onQuote with type, coverage, and termDays when Calculate is clicked", async () => {
    const onQuote = vi.fn();
    render(<PremiumCalculator onQuote={onQuote} quote={null} />);

    const coverageInput = screen.getByPlaceholderText("Coverage amount");
    await userEvent.type(coverageInput, "50000");
    await userEvent.click(screen.getByText("Calculate"));

    expect(onQuote).toHaveBeenCalledWith("crop", 50000, 90);
  });

  it("shows quote result when quote prop is provided", () => {
    render(<PremiumCalculator onQuote={vi.fn()} quote="5000" />);
    expect(screen.getByText("Estimated Premium: $5,000")).toBeInTheDocument();
  });

  it("does not show quote result when quote prop is null", () => {
    render(<PremiumCalculator onQuote={vi.fn()} quote={null} />);
    expect(screen.queryByText(/Estimated Premium/)).not.toBeInTheDocument();
  });
});
