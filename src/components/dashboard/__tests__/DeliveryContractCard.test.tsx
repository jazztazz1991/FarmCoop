import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DeliveryContractCard from "../DeliveryContractCard";

const mockContract = {
  id: "del-1",
  businessName: "Fast Haulers",
  posterName: "Poster",
  serverName: "TestServer",
  farmName: "My Farm",
  farmSlot: 2,
  itemDescription: "100 bags of wheat",
  payout: "5000",
  status: "open",
};

describe("DeliveryContractCard", () => {
  it("renders item description", () => {
    render(<DeliveryContractCard contract={mockContract} />);
    expect(screen.getByText("100 bags of wheat")).toBeInTheDocument();
  });

  it("renders payout amount", () => {
    render(<DeliveryContractCard contract={mockContract} />);
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });

  it("renders poster name", () => {
    render(<DeliveryContractCard contract={mockContract} />);
    expect(screen.getByText("Poster")).toBeInTheDocument();
  });

  it("renders destination info", () => {
    render(<DeliveryContractCard contract={mockContract} />);
    expect(screen.getByText("My Farm (Slot 2)")).toBeInTheDocument();
  });

  it("shows Accept button for owner on open delivery", () => {
    render(<DeliveryContractCard contract={mockContract} isOwner />);
    expect(screen.getByText("Accept")).toBeInTheDocument();
  });

  it("shows Cancel button for poster on open delivery", () => {
    render(<DeliveryContractCard contract={mockContract} isPoster />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows Mark Delivered for owner on accepted", () => {
    render(
      <DeliveryContractCard
        contract={{ ...mockContract, status: "accepted" }}
        isOwner
      />
    );
    expect(screen.getByText("Mark Delivered")).toBeInTheDocument();
  });

  it("shows Confirm Receipt for poster on delivered", () => {
    render(
      <DeliveryContractCard
        contract={{ ...mockContract, status: "delivered" }}
        isPoster
      />
    );
    expect(screen.getByText("Confirm Receipt")).toBeInTheDocument();
  });

  it("calls onAccept", () => {
    const onAccept = vi.fn();
    render(<DeliveryContractCard contract={mockContract} isOwner onAccept={onAccept} />);
    fireEvent.click(screen.getByText("Accept"));
    expect(onAccept).toHaveBeenCalledWith("del-1");
  });

  it("renders status badge", () => {
    render(<DeliveryContractCard contract={mockContract} />);
    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
