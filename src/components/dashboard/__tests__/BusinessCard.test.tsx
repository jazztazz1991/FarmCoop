import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BusinessCard from "../BusinessCard";

const mockBusiness = {
  id: "biz-1",
  type: "bank",
  name: "Jazz's Bank",
  ownerName: "Jazz",
  serverName: "Test Server",
  status: "active",
  description: "A player-run bank",
};

describe("BusinessCard", () => {
  it("renders business name", () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText("Jazz's Bank")).toBeInTheDocument();
  });

  it("renders business type label", () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText("Bank")).toBeInTheDocument();
  });

  it("renders owner name", () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText("Owner: Jazz")).toBeInTheDocument();
  });

  it("renders server name", () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText("Test Server")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText("A player-run bank")).toBeInTheDocument();
  });

  it("links to business detail page", () => {
    render(<BusinessCard business={mockBusiness} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/businesses/biz-1");
  });

  it("renders different business types", () => {
    render(
      <BusinessCard
        business={{ ...mockBusiness, type: "trucking", name: "Fast Haulers" }}
      />
    );
    expect(screen.getByText("Trucking")).toBeInTheDocument();
    expect(screen.getByText("Fast Haulers")).toBeInTheDocument();
  });

  it("renders closed status with correct styling", () => {
    render(
      <BusinessCard business={{ ...mockBusiness, status: "closed" }} />
    );
    const badge = screen.getByText("closed");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-gray-400");
  });
});
