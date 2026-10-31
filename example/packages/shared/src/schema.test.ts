import { describe, expect, it } from "vitest";
import { CreateTodoSchema } from "./schema";

describe("CreateTodoSchema", () => {
  it("rejects empty title", () => {
    expect(CreateTodoSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
