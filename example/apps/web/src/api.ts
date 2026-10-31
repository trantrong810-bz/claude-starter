import { API, type CreateTodoInput, type Todo } from "@app/shared";

// Placeholder: thay app này bằng create-next-app / create-expo-app, giữ client gọi API qua @app/shared.
export async function createTodo(baseUrl: string, input: CreateTodoInput): Promise<Todo> {
  const res = await fetch(baseUrl + API.todos, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`createTodo failed: ${res.status}`);
  return (await res.json()) as Todo;
}
