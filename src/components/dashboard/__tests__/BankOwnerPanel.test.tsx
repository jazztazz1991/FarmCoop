import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BankOwnerPanel from "../BankOwnerPanel";

const mockApplications = [
  {
    id: "app-1",
    businessId: "biz-1",
    businessName: "Test Bank",
    applicantId: "user-2",
    applicantName: "Alice Farmer",
    principal: "50000",
    termMonths: 12,
    interestRateBp: 500,
    estimatedMonthlyPayment: "4280",
    status: "pending",
    denialReason: null,
    reviewedAt: null,
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "app-2",
    businessId: "biz-1",
    businessName: "Test Bank",
    applicantId: "user-3",
    applicantName: "Bob Rancher",
    principal: "25000",
    termMonths: 6,
    interestRateBp: 750,
    estimatedMonthlyPayment: "4350",
    status: "pending",
    denialReason: null,
    reviewedAt: null,
    createdAt: "2026-01-20T00:00:00Z",
  },
];

const mockLoans = [
  {
    id: "loan-1",
    businessId: "biz-1",
    businessName: "Test Bank",
    borrowerId: "user-4",
    borrowerName: "Charlie Fields",
    principal: "100000",
    interestRate: 500,
    remainingBalance: "85000",
    monthlyPayment: "8750",
    termMonths: 12,
    paymentsRemaining: 10,
    status: "active",
    nextPaymentDue: "2026-03-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const mockApiFetch = vi.fn();

vi.mock("@/lib/fetch", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

function mockFetchResponses() {
  global.fetch = vi.fn((url: string | RequestInfo | URL) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("/loans/applications")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApplications),
      });
    }
    if (urlStr.includes("/loans")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLoans),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  }) as unknown as typeof fetch;
}

describe("BankOwnerPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchResponses();
  });

  it("renders the Applications tab as active by default", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });
  });

  it("shows pending application count badge", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("renders pending application details", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });
    expect(screen.getByText("$50,000")).toBeInTheDocument();
    expect(screen.getByText("12 months")).toBeInTheDocument();
    expect(screen.getByText("5.00%")).toBeInTheDocument();
    expect(screen.getByText("$4,280")).toBeInTheDocument();
  });

  it("renders second application details", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Bob Rancher")).toBeInTheDocument();
    });
    expect(screen.getByText("$25,000")).toBeInTheDocument();
    expect(screen.getByText("6 months")).toBeInTheDocument();
    expect(screen.getByText("7.50%")).toBeInTheDocument();
  });

  it("shows Approve and Deny buttons for each pending application", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });
    const approveButtons = screen.getAllByText("Approve");
    const denyButtons = screen.getAllByText("Deny");
    expect(approveButtons).toHaveLength(2);
    expect(denyButtons).toHaveLength(2);
  });

  it("calls approve endpoint when Approve is clicked", async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText("Approve");
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/loans/applications/app-1/review",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ decision: "approve" }),
        })
      );
    });
  });

  it("shows denial reason input when Deny is clicked", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    const denyButtons = screen.getAllByText("Deny");
    fireEvent.click(denyButtons[0]);

    expect(screen.getByPlaceholderText("Reason for denial...")).toBeInTheDocument();
    expect(screen.getByText("Confirm Deny")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("submits denial with reason", async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    const denyButtons = screen.getAllByText("Deny");
    fireEvent.click(denyButtons[0]);

    const input = screen.getByPlaceholderText("Reason for denial...");
    fireEvent.change(input, { target: { value: "Insufficient collateral" } });
    fireEvent.click(screen.getByText("Confirm Deny"));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/loans/applications/app-1/review",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            decision: "deny",
            denialReason: "Insufficient collateral",
          }),
        })
      );
    });
  });

  it("shows error when deny submitted without reason", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    const denyButtons = screen.getAllByText("Deny");
    fireEvent.click(denyButtons[0]);
    fireEvent.click(screen.getByText("Confirm Deny"));

    expect(screen.getByText("Please provide a denial reason")).toBeInTheDocument();
  });

  it("cancels denial and hides input", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    const denyButtons = screen.getAllByText("Deny");
    fireEvent.click(denyButtons[0]);
    expect(screen.getByPlaceholderText("Reason for denial...")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByPlaceholderText("Reason for denial...")).not.toBeInTheDocument();
  });

  it("switches to Active Loans tab and shows loan data", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Active Loans"));

    await waitFor(() => {
      expect(screen.getByText("Borrower: Charlie Fields")).toBeInTheDocument();
    });
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$85,000")).toBeInTheDocument();
    expect(screen.getByText("$8,750")).toBeInTheDocument();
    expect(screen.getByText("5.00%")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows next payment due date for active loans", async () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice Farmer")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Active Loans"));

    await waitFor(() => {
      expect(screen.getByText(/Next payment due:/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no pending applications", async () => {
    global.fetch = vi.fn((url: string | RequestInfo | URL) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/loans/applications")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (urlStr.includes("/loans")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }) as unknown as typeof fetch;

    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("No pending loan applications.")).toBeInTheDocument();
    });
  });

  it("shows empty state on Active Loans tab with no loans", async () => {
    global.fetch = vi.fn((url: string | RequestInfo | URL) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/loans/applications")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (urlStr.includes("/loans")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }) as unknown as typeof fetch;

    render(<BankOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("No pending loan applications.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Active Loans"));
    expect(screen.getByText("No active loans.")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(<BankOwnerPanel businessId="biz-1" />);
    expect(screen.getByText("Loading applications...")).toBeInTheDocument();
  });

  it("fetches from correct API endpoints", () => {
    render(<BankOwnerPanel businessId="biz-42" />);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/businesses/biz-42/loans/applications"
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/businesses/biz-42/loans"
    );
  });
});
