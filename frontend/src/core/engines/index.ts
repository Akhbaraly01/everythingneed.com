/**
 * Shared business engines. Single source of truth for cross-cutting
 * computation: pricing, tax, commission, etc. Modules MUST NOT
 * recompute these inline. Mirrors Laravel `app/Domain/Engines/*`.
 */

export interface PriceLine {
  unitPrice: number;
  quantity: number;
  discount?: number; // absolute, per line
}

export const PricingEngine = {
  lineTotal({ unitPrice, quantity, discount = 0 }: PriceLine): number {
    return Math.max(0, unitPrice * quantity - discount);
  },
  subtotal(lines: PriceLine[]): number {
    return lines.reduce((s, l) => s + PricingEngine.lineTotal(l), 0);
  },
};

export const TaxEngine = {
  /** @param rate e.g. 0.2 for 20% VAT */
  apply(amount: number, rate: number): { tax: number; total: number } {
    const tax = +(amount * rate).toFixed(2);
    return { tax, total: +(amount + tax).toFixed(2) };
  },
  extractInclusive(grossAmount: number, rate: number): { net: number; tax: number } {
    const net = +(grossAmount / (1 + rate)).toFixed(2);
    return { net, tax: +(grossAmount - net).toFixed(2) };
  },
};

export const CommissionEngine = {
  vendorPayout(gross: number, commissionRate: number): { commission: number; payout: number } {
    const commission = +(gross * commissionRate).toFixed(2);
    return { commission, payout: +(gross - commission).toFixed(2) };
  },
};

export const WalletEngine = {
  debit(balance: number, amount: number): number {
    if (amount < 0) throw new Error("Amount must be >= 0");
    if (balance < amount) throw new Error("Insufficient funds");
    return +(balance - amount).toFixed(2);
  },
  credit(balance: number, amount: number): number {
    if (amount < 0) throw new Error("Amount must be >= 0");
    return +(balance + amount).toFixed(2);
  },
};
