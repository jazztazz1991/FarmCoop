import { describe, it, expect } from "vitest";
import { buildTransactionsXml } from "../file-writer";
import type { PendingTransaction } from "../poller";

describe("buildTransactionsXml", () => {
  it("builds valid XML for money transaction", () => {
    const transactions: PendingTransaction[] = [
      { id: "tx-1", type: "money", farmId: 1, amount: 50000, equipmentId: null },
    ];

    const xml = buildTransactionsXml(transactions);

    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<transactions writtenAt="');
    expect(xml).toContain('id="tx-1"');
    expect(xml).toContain('type="money"');
    expect(xml).toContain('farmId="1"');
    expect(xml).toContain('amount="50000"');
    expect(xml).not.toContain("equipmentId");
  });

  it("builds valid XML for equipment transaction", () => {
    const transactions: PendingTransaction[] = [
      {
        id: "tx-2",
        type: "equipment",
        farmId: 2,
        amount: null,
        equipmentId: "data/vehicles/fendt/vario700/vario700.xml",
      },
    ];

    const xml = buildTransactionsXml(transactions);

    expect(xml).toContain('type="equipment"');
    expect(xml).toContain(
      'equipmentId="data/vehicles/fendt/vario700/vario700.xml"'
    );
    expect(xml).not.toContain("amount=");
  });

  it("handles multiple transactions", () => {
    const transactions: PendingTransaction[] = [
      { id: "tx-1", type: "money", farmId: 1, amount: 10000, equipmentId: null },
      { id: "tx-2", type: "money", farmId: 3, amount: 20000, equipmentId: null },
    ];

    const xml = buildTransactionsXml(transactions);

    expect(xml).toContain('id="tx-1"');
    expect(xml).toContain('id="tx-2"');
    expect(xml).toContain('farmId="1"');
    expect(xml).toContain('farmId="3"');
  });

  it("handles empty array", () => {
    const xml = buildTransactionsXml([]);
    expect(xml).toContain("<transactions");
    expect(xml).toContain("</transactions>");
  });
});
