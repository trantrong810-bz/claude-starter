import { afterEach, describe, expect, it, vi } from "vitest";
import { createTodo } from "./client";

afterEach(() => vi.unstubAllGlobals());

const mockFetch = (status: number, body: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );

describe("createTodo client", () => {
  it("returns a parsed todo", async () => {
    mockFetch(201, { id: "1", title: "a", done: false });
    await expect(createTodo("http://x", { title: "a" })).resolves.toEqual({
      id: "1",
      title: "a",
      done: false,
    });
  });

  it("rejects a response that breaks the contract", async () => {
    mockFetch(201, { id: 1, title: "a" });
    await expect(createTodo("http://x", { title: "a" })).rejects.toThrow();
  });
});
