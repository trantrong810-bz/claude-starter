import { z } from "zod";

// Single source of truth for the API contract. Change it here → typecheck flags every affected place.
export const TodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  done: z.boolean(),
});
export type Todo = z.infer<typeof TodoSchema>;

export const CreateTodoSchema = TodoSchema.pick({ title: true });
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const API = {
  todos: "/api/todos",
} as const;
