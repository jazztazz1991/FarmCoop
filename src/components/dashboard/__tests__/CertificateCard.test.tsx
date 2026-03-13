import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CertificateCard from "../CertificateCard";

const activeCert = {
  id: "cd-1",
  principal: "10000",
  apyBasisPoints: 500,
  termDays: 90,
  maturesAt: "2026-06-15T00:00:00Z",
  status: "active" as const,
};

const withdrawnCert = {
  id: "cd-2",
  principal: "25000",
  apyBasisPoints: 300,
  termDays: 180,
  maturesAt: "2026-09-01T00:00:00Z",
  status: "withdrawn" as const,
};

const maturedCert = {
  id: "cd-3",
  principal: "15000",
  apyBasisPoints: 400,
  termDays: 30,
  maturesAt: "2026-03-01T00:00:00Z",
  status: "matured" as const,
};

describe("CertificateCard", () => {
  it("renders principal amount with formatting", () => {
    render(<CertificateCard certificate={activeCert} onWithdraw={vi.fn()} />);
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("converts basis points to APY percentage", () => {
    render(<CertificateCard certificate={activeCert} onWithdraw={vi.fn()} />);
    expect(screen.getByText("5.00%")).toBeInTheDocument();
  });

  it("renders term in days", () => {
    render(<CertificateCard certificate={activeCert} onWithdraw={vi.fn()} />);
    expect(screen.getByText("90 days")).toBeInTheDocument();
  });

  it("renders maturity date", () => {
    render(<CertificateCard certificate={activeCert} onWithdraw={vi.fn()} />);
    expect(screen.getByText("Maturity Date")).toBeInTheDocument();
    // The date is rendered via toLocaleDateString so we check the label exists
    expect(
      screen.getByText(
        new Date("2026-06-15T00:00:00Z").toLocaleDateString()
      )
    ).toBeInTheDocument();
  });

  it("shows Active status badge for active CDs", () => {
    render(<CertificateCard certificate={activeCert} onWithdraw={vi.fn()} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Withdrawn status badge for withdrawn CDs", () => {
    render(
      <CertificateCard certificate={withdrawnCert} onWithdraw={vi.fn()} />
    );
    expect(screen.getByText("Withdrawn")).toBeInTheDocument();
  });

  it("shows Matured status badge for matured CDs", () => {
    render(
      <CertificateCard certificate={maturedCert} onWithdraw={vi.fn()} />
    );
    expect(screen.getByText("Matured")).toBeInTheDocument();
  });

  it("shows Withdraw button for active CDs", () => {
    render(<CertificateCard certificate={activeCert} onWithdraw={vi.fn()} />);
    expect(screen.getByText("Withdraw")).toBeInTheDocument();
  });

  it("hides Withdraw button for withdrawn CDs", () => {
    render(
      <CertificateCard certificate={withdrawnCert} onWithdraw={vi.fn()} />
    );
    expect(screen.queryByText("Withdraw")).not.toBeInTheDocument();
  });

  it("calls onWithdraw with certificate id when Withdraw is clicked", async () => {
    const onWithdraw = vi.fn();
    render(
      <CertificateCard certificate={activeCert} onWithdraw={onWithdraw} />
    );
    await userEvent.click(screen.getByText("Withdraw"));
    expect(onWithdraw).toHaveBeenCalledWith("cd-1");
  });
});
