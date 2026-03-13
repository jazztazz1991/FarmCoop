import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import EventBanner from "../EventBanner";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockEvents = [
  {
    id: "evt-1",
    title: "Spring Harvest Bonus",
    description: "Earn extra coins on all harvests",
    type: "harvest",
    multiplier: 2,
    endsAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "evt-2",
    title: "Market Day",
    description: "Boosted marketplace sales",
    type: "market",
    multiplier: 3,
    endsAt: "2026-03-20T00:00:00.000Z",
  },
];

describe("EventBanner", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders nothing when no serverId is provided", () => {
    const { container } = render(<EventBanner />);
    expect(container.innerHTML).toBe("");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("renders nothing when events response is an empty array", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<EventBanner serverId="server-1" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/servers/server-1/events?view=active"
      );
    });

    expect(container.innerHTML).toBe("");
  });

  it("renders event cards when events exist", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    });

    render(<EventBanner serverId="server-1" />);

    await waitFor(() => {
      expect(screen.getByText("Spring Harvest Bonus")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Earn extra coins on all harvests")
    ).toBeInTheDocument();
    expect(screen.getByText("Market Day")).toBeInTheDocument();
    expect(
      screen.getByText("Boosted marketplace sales")
    ).toBeInTheDocument();
  });

  it("shows multiplier in Nx format and end date", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    });

    render(<EventBanner serverId="server-1" />);

    await waitFor(() => {
      expect(screen.getByText("2x")).toBeInTheDocument();
    });

    expect(screen.getByText("3x")).toBeInTheDocument();

    const formattedDate1 = new Date(
      "2026-04-01T00:00:00.000Z"
    ).toLocaleDateString();
    const formattedDate2 = new Date(
      "2026-03-20T00:00:00.000Z"
    ).toLocaleDateString();

    expect(
      screen.getByText(`Ends ${formattedDate1}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Ends ${formattedDate2}`)
    ).toBeInTheDocument();
  });

  it("links each event card to /dashboard/events", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    });

    render(<EventBanner serverId="server-1" />);

    await waitFor(() => {
      expect(screen.getByText("Spring Harvest Bonus")).toBeInTheDocument();
    });

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/dashboard/events");
    });
  });
});
