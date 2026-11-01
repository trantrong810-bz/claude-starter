import { createTodo, type Todo } from "@app/shared";

// Placeholder UI-layer code: replace with real components (Next.js / Expo).
// The app only calls the client from @app/shared and never writes fetch itself.
export async function addTodo(baseUrl: string, title: string): Promise<Todo> {
  return createTodo(baseUrl, { title: title.trim() });
}
