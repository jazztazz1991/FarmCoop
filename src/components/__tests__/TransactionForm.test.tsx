import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "../TransactionForm";

describe("TransactionForm", () => {
  it("renders money form by default", () => {
    render(<TransactionForm onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Send Transaction" })).toBeInTheDocument();
    expect(screen.getByLabelText("Send Money")).toBeChecked();
    expect(screen.getByLabelText("Farm ID (1-16)")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount ($)")).toBeInTheDocument();
  });

  it("switches to equipment form", async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={vi.fn()} />);

    await user.click(screen.getByLabelText("Send Equipment"));

    expect(screen.getByLabelText("Equipment")).toBeInTheDocument();
    expect(screen.queryByLabelText("Amount ($)")).not.toBeInTheDocument();
  });

  it("submits money transaction", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TransactionForm onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText("Farm ID (1-16)"));
    await user.type(screen.getByLabelText("Farm ID (1-16)"), "3");
    await user.clear(screen.getByLabelText("Amount ($)"));
    await user.type(screen.getByLabelText("Amount ($)"), "25000");
    await user.click(screen.getByRole("button", { name: /send transaction/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: "money",
      farmId: 3,
      amount: 25000,
    });
  });

  it("shows sending state while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; })
    );
    render(<TransactionForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /send transaction/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    await act(async () => {
      resolveSubmit!();
    });
  });
});
