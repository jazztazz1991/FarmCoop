import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InsuranceOwnerPanel from "../InsuranceOwnerPanel";

const mockClaims = [
  {
    id: "claim-1",
    businessId: "biz-1",
    policyId: "pol-1",
    claimAmount: "50000",
    payout: "0",
    reason: "Crop failed due to drought",
    status: "pending",
    resolvedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "claim-2",
    businessId: "biz-1",
    policyId: "pol-2",
    claimAmount: "25000",
    payout: "20000",
    reason: "Vehicle damage",
    status: "approved",
    resolvedAt: "2026-01-15T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const mockPolicies = [
  {
    id: "pol-1",
    businessId: "biz-1",
    businessName: "Farm Insurance Co",
    holderId: "user-1",
    holderName: "John Smith",
    type: "crop",
    coverageAmount: "100000",
    premium: "5000",
    deductible: "2500",
    status: "active",
    commodityId: "corn-1",
    commodityName: "Corn",
    equipmentId: null,
    equipmentName: null,
    startsAt: "2026-01-01T00:00:00Z",
    expiresAt: "2027-01-01T00:00:00Z",
    createdAt: "2025-12-15T00:00:00Z",
  },
  {
    id: "pol-2",
    businessId: "biz-1",
    businessName: "Farm Insurance Co",
    holderId: "user-2",
    holderName: null,
    type: "vehicle",
    coverageAmount: "50000",
    premium: "3000",
    deductible: "1000",
    status: "expired",
    commodityId: null,
    commodityName: null,
    equipmentId: "eq-1",
    equipmentName: "Tractor X200",
    startsAt: "2025-01-01T00:00:00Z",
    expiresAt: "2025-12-31T00:00:00Z",
    createdAt: "2024-12-15T00:00:00Z",
  },
];

const mockFetch = vi.fn();

vi.mock("@/lib/fetch", () => ({
  apiFetch: (...args: unknown[]) => mockFetch(...args),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();

  // Default: global fetch returns claims and policies
  global.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("/claims")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClaims),
      });
    }
    if (urlStr.includes("/policies")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPolicies),
      });
    }
    return Promise.resolve({ ok: false });
  }) as unknown as typeof fetch;
});

describe("InsuranceOwnerPanel", () => {
  describe("Tab navigation", () => {
    it("renders both tab buttons", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      expect(screen.getByText("Pending Claims")).toBeInTheDocument();
      expect(screen.getByText("Policies")).toBeInTheDocument();
    });

    it("shows claims tab by default", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Crop failed due to drought")).toBeInTheDocument();
      });
    });

    it("switches to policies tab on click", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("Crop Insurance")).toBeInTheDocument();
      });
    });
  });

  describe("Pending Claims tab", () => {
    it("shows only pending claims", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        // Pending claim visible
        expect(screen.getByText("Crop failed due to drought")).toBeInTheDocument();
        expect(screen.getByText("$50,000")).toBeInTheDocument();
      });
      // Approved claim not shown (filtered out)
      expect(screen.queryByText("Vehicle damage")).not.toBeInTheDocument();
    });

    it("shows claim status badge", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("pending")).toBeInTheDocument();
      });
    });

    it("shows approve and deny buttons", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Approve")).toBeInTheDocument();
        expect(screen.getByText("Deny")).toBeInTheDocument();
      });
    });

    it("shows payout amount input", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Payout Amount")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter payout amount...")
        ).toBeInTheDocument();
      });
    });

    it("shows no pending claims message when none exist", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("No pending claims")).toBeInTheDocument();
      });
    });

    it("shows error when approve is clicked without payout amount", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Approve")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid payout amount")
        ).toBeInTheDocument();
      });
    });

    it("calls apiFetch with approve decision and payout", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Approve")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("Enter payout amount..."), {
        target: { value: "40000" },
      });
      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/businesses/biz-1/claims/claim-1/review",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ decision: "approve", payout: "40000" }),
          })
        );
      });
    });

    it("calls apiFetch with deny decision", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Deny")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Deny"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/businesses/biz-1/claims/claim-1/review",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ decision: "deny" }),
          })
        );
      });
    });

    it("shows loading state for claims", () => {
      // Make fetch hang to keep loading state visible
      global.fetch = vi.fn(
        () => new Promise(() => {})
      ) as unknown as typeof fetch;

      render(<InsuranceOwnerPanel businessId="biz-1" />);
      expect(screen.getByText("Loading claims...")).toBeInTheDocument();
    });
  });

  describe("Policies tab", () => {
    it("shows policy type label", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("Crop Insurance")).toBeInTheDocument();
        expect(screen.getByText("Vehicle Insurance")).toBeInTheDocument();
      });
    });

    it("shows holder name when available", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("Holder: John Smith")).toBeInTheDocument();
      });
    });

    it("shows coverage amount", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("$100,000")).toBeInTheDocument();
      });
    });

    it("shows premium and deductible", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("$5,000")).toBeInTheDocument();
        expect(screen.getByText("$2,500")).toBeInTheDocument();
      });
    });

    it("shows policy status badge", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("active")).toBeInTheDocument();
        expect(screen.getByText("expired")).toBeInTheDocument();
      });
    });

    it("shows commodity name when present", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("Corn")).toBeInTheDocument();
      });
    });

    it("shows equipment name when present", async () => {
      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.queryByText("Loading claims...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("Tractor X200")).toBeInTheDocument();
      });
    });

    it("shows no policies message when none exist", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      render(<InsuranceOwnerPanel businessId="biz-1" />);

      fireEvent.click(screen.getByText("Policies"));

      await waitFor(() => {
        expect(screen.getByText("No policies found")).toBeInTheDocument();
      });
    });

    it("shows loading state for policies", () => {
      global.fetch = vi.fn(
        () => new Promise(() => {})
      ) as unknown as typeof fetch;

      render(<InsuranceOwnerPanel businessId="biz-1" />);

      fireEvent.click(screen.getByText("Policies"));

      expect(screen.getByText("Loading policies...")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("shows error when claims fetch fails", async () => {
      global.fetch = vi.fn((url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("/claims")) {
          return Promise.resolve({ ok: false });
        }
        if (urlStr.includes("/policies")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPolicies),
          });
        }
        return Promise.resolve({ ok: false });
      }) as unknown as typeof fetch;

      render(<InsuranceOwnerPanel businessId="biz-1" />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load claims")).toBeInTheDocument();
      });
    });

    it("shows error when approve API call fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Insufficient funds" }),
      });

      render(<InsuranceOwnerPanel businessId="biz-1" />);
      await waitFor(() => {
        expect(screen.getByText("Approve")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("Enter payout amount..."), {
        target: { value: "40000" },
      });
      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(screen.getByText("Insufficient funds")).toBeInTheDocument();
      });
    });
  });
});
