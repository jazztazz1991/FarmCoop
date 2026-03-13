import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WalletCard from "../WalletCard";

describe("WalletCard", () => {
  it("renders formatted balance with dollar sign", () => {
    render(<WalletCard balance="50000" />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("renders the Wallet Balance heading", () => {
    render(<WalletCard balance="1000" />);
    expect(screen.getByText("Wallet Balance")).toBeInTheDocument();
  });

  it("has a 'View ledger' link pointing to /dashboard/wallet", () => {
    render(<WalletCard balance="0" />);
    const link = screen.getByText("View ledger");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/wallet");
  });

  it("formats large balances with commas", () => {
    render(<WalletCard balance="1234567" />);
    expect(screen.getByText("$1,234,567")).toBeInTheDocument();
  });
});
