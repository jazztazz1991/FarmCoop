import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ count: 0 }),
  }) as any;
});

describe("Header", () => {
  it("renders the user display name", () => {
    render(<Header user={{ displayName: "JohnFarmer", avatarUrl: null }} />);
    expect(screen.getByText("JohnFarmer")).toBeInTheDocument();
  });

  it("renders the initial when no avatar URL is provided", () => {
    render(<Header user={{ displayName: "JohnFarmer", avatarUrl: null }} />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders an avatar image when avatarUrl is provided", () => {
    render(
      <Header
        user={{
          displayName: "JohnFarmer",
          avatarUrl: "https://example.com/avatar.png",
        }}
      />
    );
    const img = screen.getByAltText("JohnFarmer");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("does not render an avatar image when avatarUrl is null", () => {
    render(<Header user={{ displayName: "JohnFarmer", avatarUrl: null }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the sign out button", () => {
    render(<Header user={{ displayName: "JohnFarmer", avatarUrl: null }} />);
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("renders the notification bell link", () => {
    render(<Header user={{ displayName: "JohnFarmer", avatarUrl: null }} />);
    expect(screen.getByRole("link", { name: "Notifications" })).toBeInTheDocument();
  });
});
