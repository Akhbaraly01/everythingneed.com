import { describe, it, expect } from "vitest";
import { PricingEngine, TaxEngine, CommissionEngine, WalletEngine } from "../index";

describe("PricingEngine", () => {
  it("lineTotal with discount", () => {
    expect(PricingEngine.lineTotal({ unitPrice: 10, quantity: 3, discount: 5 })).toBe(25);
  });
  it("lineTotal clamps to 0", () => {
    expect(PricingEngine.lineTotal({ unitPrice: 5, quantity: 1, discount: 99 })).toBe(0);
  });
  it("subtotal across lines", () => {
    expect(
      PricingEngine.subtotal([
        { unitPrice: 10, quantity: 2 },
        { unitPrice: 4.5, quantity: 1 },
      ]),
    ).toBe(24.5);
  });
});

describe("TaxEngine", () => {
  it("applies VAT", () => {
    expect(TaxEngine.apply(100, 0.2)).toEqual({ tax: 20, total: 120 });
  });
  it("extracts inclusive VAT", () => {
    expect(TaxEngine.extractInclusive(120, 0.2)).toEqual({ net: 100, tax: 20 });
  });
});

describe("CommissionEngine", () => {
  it("computes vendor payout", () => {
    expect(CommissionEngine.vendorPayout(100, 0.15)).toEqual({ commission: 15, payout: 85 });
  });
});

describe("WalletEngine", () => {
  it("credits", () => expect(WalletEngine.credit(10, 5.5)).toBe(15.5));
  it("debits", () => expect(WalletEngine.debit(10, 4)).toBe(6));
  it("rejects negative", () => expect(() => WalletEngine.debit(10, -1)).toThrow());
  it("rejects overdraft", () => expect(() => WalletEngine.debit(10, 11)).toThrow("Insufficient"));
});
