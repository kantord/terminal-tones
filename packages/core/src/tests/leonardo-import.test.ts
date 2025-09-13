import { describe, it, expect } from "vitest";
import * as Leonardo from "@adobe/leonardo-contrast-colors";

describe("leonardo import", () => {
  it("exposes expected exports", () => {
    // Minimal assertion to prove import works and shape is reasonable
    expect(Leonardo).toBeTruthy();
    expect(typeof Leonardo).toBe("object");
    expect(Object.keys(Leonardo).length).toBeGreaterThan(0);
    expect("createScale" in Leonardo).toBe(true);
    expect(typeof (Leonardo as any).createScale).toBe("function");
  });
});
