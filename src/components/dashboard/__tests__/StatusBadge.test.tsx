import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("replaces underscores with spaces in status text", () => {
    render(<StatusBadge status="picked_up" />);
    expect(screen.getByText("picked up")).toBeInTheDocument();
  });

  it("applies yellow color classes for pending status", () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText("pending");
    expect(badge.className).toContain("bg-yellow-900/50");
    expect(badge.className).toContain("text-yellow-300");
    expect(badge.className).toContain("border-yellow-700");
  });

  it("applies green color classes for confirmed status", () => {
    render(<StatusBadge status="confirmed" />);
    const badge = screen.getByText("confirmed");
    expect(badge.className).toContain("bg-green-900/50");
    expect(badge.className).toContain("text-green-300");
  });

  it("applies red color classes for failed status", () => {
    render(<StatusBadge status="failed" />);
    const badge = screen.getByText("failed");
    expect(badge.className).toContain("bg-red-900/50");
    expect(badge.className).toContain("text-red-300");
  });

  it("applies default gray classes for unknown status", () => {
    render(<StatusBadge status="unknown" />);
    const badge = screen.getByText("unknown");
    expect(badge.className).toContain("bg-gray-800");
    expect(badge.className).toContain("text-gray-400");
  });
});
