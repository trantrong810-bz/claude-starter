import { createTodo, type Todo } from "@app/shared";

// Placeholder UI-layer code: thay bằng component thật (Next.js / Expo).
// App chỉ gọi client từ @app/shared, không tự viết fetch.
export async function addTodo(baseUrl: string, title: string): Promise<Todo> {
  return createTodo(baseUrl, { title: title.trim() });
}
