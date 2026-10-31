import { describe, expect, it } from "vitest";
import { CreateTodoSchema } from "./index";

describe("CreateTodoSchema", () => {
  it("rejects empty title", () => {
    expect(CreateTodoSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
