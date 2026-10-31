import { describe, expect, it } from "vitest";
import { createTodo, listTodos } from "./todos";

describe("createTodo", () => {
  it("creates a todo", () => {
    const res = createTodo({ title: "Viết spec" });
    expect(res.status).toBe(201);
    expect(listTodos()).toHaveLength(1);
  });
  it("rejects invalid body", () => {
    expect(createTodo({ title: "" }).status).toBe(400);
  });
});
