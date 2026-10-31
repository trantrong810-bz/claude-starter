import { API, TodoSchema, type CreateTodoInput, type Todo } from "./schema";

// Client gọi API dùng chung cho web và mobile.
// Quy tắc: parse response bằng schema (không ép kiểu `as`), encode tham số đưa vào URL.
export async function createTodo(baseUrl: string, input: CreateTodoInput): Promise<Todo> {
  const res = await fetch(baseUrl + API.todos, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`createTodo failed: ${res.status}`);
  return TodoSchema.parse(await res.json());
}
