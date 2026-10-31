import { z } from "zod";

// Nguồn sự thật duy nhất cho contract API. Đổi ở đây → typecheck báo lỗi mọi nơi bị ảnh hưởng.
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
