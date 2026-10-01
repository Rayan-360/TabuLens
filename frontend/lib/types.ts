export interface Confidence {
  description?: number;
  qty?: number;
  unit_price?: number;
  line_total?: number;
}

export interface LineItem {
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  confidence?: Confidence;
}

export interface Table {
  vendor?: string;
  invoice_no?: string;
  line_items: LineItem[];
  subtotal?: number;
  tax?: number;
  grand_total?: number;
  _provider?: string;
}

export interface Issue {
  location: string;
  kind: "line" | "subtotal" | "total";
  expected: number;
  actual: number;
  message: string;
}

export interface Validation {
  status: "ok" | "error";
  issues: Issue[];
}

export interface ExtractResult {
  table: Table;
  validation: Validation;
}
