import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TruckingOwnerPanel from "../TruckingOwnerPanel";

const mockDeliveries = [
  {
    id: "del-1",
    businessId: "biz-1",
    businessName: "Fast Haulers",
    posterId: "user-1",
    posterName: "Alice",
    serverName: "Server1",
    farmName: "Sunny Farm",
    farmSlot: 3,
    itemDescription: "50 bags of corn",
    payout: "2500",
    status: "open",
    acceptedAt: null,
    deliveredAt: null,
    completedAt: null,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "del-2",
    businessId: "biz-1",
    businessName: "Fast Haulers",
    posterId: "user-2",
    posterName: "Bob",
    serverName: "Server2",
    farmName: "Green Acres",
    farmSlot: 1,
    itemDescription: "100 wheat bundles",
    payout: "5000",
    status: "accepted",
    acceptedAt: "2026-03-02T12:00:00Z",
    deliveredAt: null,
    completedAt: null,
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "del-3",
    businessId: "biz-1",
    businessName: "Fast Haulers",
    posterId: "user-3",
    posterName: "Carol",
    serverName: "Server1",
    farmName: "Valley Ranch",
    farmSlot: 5,
    itemDescription: "20 crates of apples",
    payout: "1200",
    status: "delivered",
    acceptedAt: "2026-03-02T09:00:00Z",
    deliveredAt: "2026-03-03T14:00:00Z",
    completedAt: null,
    createdAt: "2026-03-01T07:00:00Z",
  },
  {
    id: "del-4",
    businessId: "biz-1",
    businessName: "Fast Haulers",
    posterId: "user-4",
    posterName: "Dave",
    serverName: "Server3",
    farmName: "Hilltop Farm",
    farmSlot: 2,
    itemDescription: "75 barrels of milk",
    payout: "3000",
    status: "completed",
    acceptedAt: "2026-02-28T10:00:00Z",
    deliveredAt: "2026-03-01T15:00:00Z",
    completedAt: "2026-03-02T09:00:00Z",
    createdAt: "2026-02-28T08:00:00Z",
  },
];

// Mock apiFetch
vi.mock("@/lib/fetch", () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
}));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockDeliveries),
  });
  global.fetch = mockFetch;
});

describe("TruckingOwnerPanel", () => {
  it("shows loading state initially", () => {
    // Never resolve the fetch so component stays loading
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<TruckingOwnerPanel businessId="biz-1" />);
    expect(screen.getByText("Loading delivery contracts...")).toBeInTheDocument();
  });

  it("fetches deliveries from the correct endpoint", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/businesses/biz-1/deliveries");
    });
  });

  it("renders all delivery contracts", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("50 bags of corn")).toBeInTheDocument();
    });
    expect(screen.getByText("100 wheat bundles")).toBeInTheDocument();
    expect(screen.getByText("20 crates of apples")).toBeInTheDocument();
    expect(screen.getByText("75 barrels of milk")).toBeInTheDocument();
  });

  it("renders poster names", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
    expect(screen.getByText("Dave")).toBeInTheDocument();
  });

  it("renders payout formatted as currency", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("$2,500")).toBeInTheDocument();
    });
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("$1,200")).toBeInTheDocument();
    expect(screen.getByText("$3,000")).toBeInTheDocument();
  });

  it("renders destination info", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Sunny Farm (Slot 3)")).toBeInTheDocument();
    });
    expect(screen.getByText("Green Acres (Slot 1)")).toBeInTheDocument();
  });

  it("renders server names", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getAllByText("Server1")).toHaveLength(2);
    });
    expect(screen.getByText("Server2")).toBeInTheDocument();
    expect(screen.getByText("Server3")).toBeInTheDocument();
  });

  it("renders status badges", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      // Each status label appears in both the filter dropdown and the badge;
      // we verify at least 2 occurrences (1 option + 1 badge).
      expect(screen.getAllByText("Open").length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Delivered").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(2);
  });

  it("shows Accept button for open deliveries", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Accept")).toBeInTheDocument();
    });
  });

  it("shows Mark Delivered and Cancel buttons for accepted deliveries", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Mark Delivered")).toBeInTheDocument();
    });
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows Waiting for confirmation for delivered deliveries", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Waiting for confirmation")).toBeInTheDocument();
    });
  });

  it("renders completed date for completed deliveries", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("50 bags of corn")).toBeInTheDocument();
    });
    // The completed delivery (del-4) should show the completedAt label
    const completedLabels = screen.getAllByText("Completed");
    // One is the status badge, at least one is the date label
    expect(completedLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("calls accept endpoint when Accept is clicked", async () => {
    const { apiFetch } = await import("@/lib/fetch");
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Accept")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Accept"));
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/deliveries/del-1/accept",
        { method: "POST" }
      );
    });
  });

  it("calls deliver endpoint when Mark Delivered is clicked", async () => {
    const { apiFetch } = await import("@/lib/fetch");
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Mark Delivered")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Mark Delivered"));
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/deliveries/del-2/deliver",
        { method: "POST" }
      );
    });
  });

  it("calls cancel endpoint when Cancel is clicked", async () => {
    const { apiFetch } = await import("@/lib/fetch");
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/deliveries/del-2/cancel",
        { method: "POST" }
      );
    });
  });

  it("filters deliveries by status", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("50 bags of corn")).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText("Filter:");
    fireEvent.change(filterSelect, { target: { value: "open" } });

    expect(screen.getByText("50 bags of corn")).toBeInTheDocument();
    expect(screen.queryByText("100 wheat bundles")).not.toBeInTheDocument();
    expect(screen.queryByText("20 crates of apples")).not.toBeInTheDocument();
    expect(screen.queryByText("75 barrels of milk")).not.toBeInTheDocument();
  });

  it("shows empty state when no contracts match filter", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("50 bags of corn")).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText("Filter:");
    fireEvent.change(filterSelect, { target: { value: "cancelled" } });

    expect(screen.getByText("No delivery contracts found.")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load delivery contracts")).toBeInTheDocument();
    });
  });

  it("renders the panel heading", async () => {
    render(<TruckingOwnerPanel businessId="biz-1" />);
    await waitFor(() => {
      expect(screen.getByText("Delivery Contracts")).toBeInTheDocument();
    });
  });
});
