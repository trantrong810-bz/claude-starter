import { CreateTodoSchema, type Todo } from "@app/shared";

const store = new Map<string, Todo>();

// Framework-agnostic handler: plug it into Hono/NestJS/Express as you like.
export function createTodo(body: unknown): { status: 201; data: Todo } | { status: 400; error: string } {
  const parsed = CreateTodoSchema.safeParse(body);
  if (!parsed.success) return { status: 400, error: parsed.error.issues[0]?.message ?? "invalid" };
  const todo: Todo = { id: String(store.size + 1), title: parsed.data.title, done: false };
  store.set(todo.id, todo);
  return { status: 201, data: todo };
}

export function listTodos(): Todo[] {
  return [...store.values()];
}
