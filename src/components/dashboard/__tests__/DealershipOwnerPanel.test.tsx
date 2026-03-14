import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DealershipOwnerPanel from "../DealershipOwnerPanel";

/* ── mock apiFetch ─────────────────────────────────────────────────── */
const mockApiFetch = vi.fn();
vi.mock("@/lib/fetch", () => ({ apiFetch: (...args: unknown[]) => mockApiFetch(...args) }));

/* ── mock global fetch (used for GET) ──────────────────────────────── */
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/* ── fixtures ──────────────────────────────────────────────────────── */
const activeItem = {
  id: "listing-1",
  businessId: "biz-1",
  businessName: "Green Acres Dealership",
  itemId: "tractor-100",
  itemName: "Fendt Vario 900",
  category: "equipment",
  quantity: 2,
  pricePerUnit: "350000",
  status: "active",
  createdAt: "2026-01-15T00:00:00Z",
};

const soldItem = {
  id: "listing-2",
  businessId: "biz-1",
  businessName: "Green Acres Dealership",
  itemId: "wheat-50",
  itemName: "Premium Wheat Seed",
  category: "commodity",
  quantity: 50,
  pricePerUnit: "120",
  status: "sold",
  createdAt: "2026-01-10T00:00:00Z",
};

function jsonOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

function jsonError(status: number, body?: unknown) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body ?? {}),
  } as Response);
}

/* ── tests ─────────────────────────────────────────────────────────── */
describe("DealershipOwnerPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReturnValue(jsonOk([activeItem, soldItem]));
  });

  /* ── loading & rendering ────────────────────────────────────────── */
  it("shows loading indicator while fetching", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();
  });

  it("renders fetched items", async () => {
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(await screen.findByText("Fendt Vario 900")).toBeInTheDocument();
    expect(screen.getByText("Premium Wheat Seed")).toBeInTheDocument();
  });

  it("displays formatted price as currency", async () => {
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(await screen.findByText("$350,000")).toBeInTheDocument();
    expect(screen.getByText("$120")).toBeInTheDocument();
  });

  it("renders category labels", async () => {
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(await screen.findByText("equipment")).toBeInTheDocument();
    expect(screen.getByText("commodity")).toBeInTheDocument();
  });

  it("renders status badges", async () => {
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(await screen.findByText("active")).toBeInTheDocument();
    expect(screen.getByText("sold")).toBeInTheDocument();
  });

  it("shows empty state when no items exist", async () => {
    mockFetch.mockReturnValue(jsonOk([]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(
      await screen.findByText("No inventory items yet.")
    ).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    mockFetch.mockReturnValue(jsonError(500));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(
      await screen.findByText("Failed to load inventory")
    ).toBeInTheDocument();
  });

  /* ── Add Item form ──────────────────────────────────────────────── */
  it("renders the Add Item form with all fields", () => {
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(screen.getByRole("heading", { name: "Add Item" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Item" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Item ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Item Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Quantity")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Price per Unit")).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    render(<DealershipOwnerPanel businessId="biz-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));
    expect(
      screen.getByText("All fields are required with valid values")
    ).toBeInTheDocument();
  });

  it("calls POST with form data and refreshes list", async () => {
    mockApiFetch.mockReturnValue(jsonOk({ id: "listing-3" }));

    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Fendt Vario 900");

    fireEvent.change(screen.getByPlaceholderText("Item ID"), {
      target: { value: "combine-5" },
    });
    fireEvent.change(screen.getByPlaceholderText("Item Name"), {
      target: { value: "Combine Harvester" },
    });
    fireEvent.change(screen.getByPlaceholderText("Quantity"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByPlaceholderText("Price per Unit"), {
      target: { value: "500000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/inventory",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            itemId: "combine-5",
            itemName: "Combine Harvester",
            category: "equipment",
            quantity: 3,
            pricePerUnit: "500000",
          }),
        })
      );
    });
  });

  it("shows error when add item request fails", async () => {
    mockApiFetch.mockReturnValue(
      jsonError(400, { error: "Duplicate item ID" })
    );

    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Fendt Vario 900");

    fireEvent.change(screen.getByPlaceholderText("Item ID"), {
      target: { value: "tractor-100" },
    });
    fireEvent.change(screen.getByPlaceholderText("Item Name"), {
      target: { value: "Duplicate" },
    });
    fireEvent.change(screen.getByPlaceholderText("Quantity"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Price per Unit"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    expect(await screen.findByText("Duplicate item ID")).toBeInTheDocument();
  });

  /* ── active item actions ────────────────────────────────────────── */
  it("shows Update Price and Remove buttons for active items", async () => {
    mockFetch.mockReturnValue(jsonOk([activeItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    expect(await screen.findByText("Update Price")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("does not show action buttons for sold items", async () => {
    mockFetch.mockReturnValue(jsonOk([soldItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Premium Wheat Seed");
    expect(screen.queryByText("Update Price")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  /* ── Update Price flow ──────────────────────────────────────────── */
  it("shows inline price input when Update Price is clicked", async () => {
    mockFetch.mockReturnValue(jsonOk([activeItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Update Price");

    fireEvent.click(screen.getByText("Update Price"));

    expect(screen.getByPlaceholderText("New price")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls PATCH with new price on Save", async () => {
    mockApiFetch.mockReturnValue(jsonOk({}));
    mockFetch.mockReturnValue(jsonOk([activeItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Update Price");

    fireEvent.click(screen.getByText("Update Price"));
    fireEvent.change(screen.getByPlaceholderText("New price"), {
      target: { value: "400000" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/inventory/tractor-100",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ pricePerUnit: "400000" }),
        })
      );
    });
  });

  it("hides inline input when Cancel is clicked", async () => {
    mockFetch.mockReturnValue(jsonOk([activeItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Update Price");

    fireEvent.click(screen.getByText("Update Price"));
    expect(screen.getByPlaceholderText("New price")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByPlaceholderText("New price")).not.toBeInTheDocument();
    expect(screen.getByText("Update Price")).toBeInTheDocument();
  });

  /* ── Remove flow ────────────────────────────────────────────────── */
  it("calls DELETE when Remove is clicked", async () => {
    mockApiFetch.mockReturnValue(jsonOk({}));
    mockFetch.mockReturnValue(jsonOk([activeItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Remove");

    fireEvent.click(screen.getByText("Remove"));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/businesses/biz-1/inventory/tractor-100",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  /* ── fetches with correct URL ───────────────────────────────────── */
  it("fetches inventory from correct API endpoint", async () => {
    render(<DealershipOwnerPanel businessId="biz-42" />);
    expect(mockFetch).toHaveBeenCalledWith("/api/businesses/biz-42/inventory");
  });

  /* ── pre-fills current price in edit mode ───────────────────────── */
  it("pre-fills new price input with current price", async () => {
    mockFetch.mockReturnValue(jsonOk([activeItem]));
    render(<DealershipOwnerPanel businessId="biz-1" />);
    await screen.findByText("Update Price");

    fireEvent.click(screen.getByText("Update Price"));
    const input = screen.getByPlaceholderText("New price") as HTMLInputElement;
    expect(input.value).toBe("350000");
  });
});
