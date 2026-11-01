import { API, TodoSchema, type CreateTodoInput, type Todo } from "./schema";

// API client shared by web and mobile.
// Rules: parse responses with the schema (no `as` casts), encode every parameter that goes into a URL.
export async function createTodo(baseUrl: string, input: CreateTodoInput): Promise<Todo> {
  const res = await fetch(baseUrl + API.todos, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`createTodo failed: ${res.status}`);
  return TodoSchema.parse(await res.json());
}
