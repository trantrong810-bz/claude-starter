# Todo — tổng quan

> Sinh tự động bởi `node scripts/todo.mjs sync` — đừng sửa tay. Sửa file viết tay hoặc file auto của từng phần.

| Phần     | Viết tay                         | Tự động                                    | WIP   | Todo tay | Todo auto | P1    | Đang làm |
| -------- | -------------------------------- | ------------------------------------------ | ----- | -------- | --------- | ----- | -------- |
| root     | [root.md](docs/todo/root.md)     | [root.auto.md](docs/todo/root.auto.md)     | 0     | 0        | 0         | 0     | —        |
| shared   | [shared.md](docs/todo/shared.md) | [shared.auto.md](docs/todo/shared.auto.md) | 0     | 0        | 0         | 0     | —        |
| be       | [be.md](docs/todo/be.md)         | [be.auto.md](docs/todo/be.auto.md)         | 0     | 0        | 0         | 0     | —        |
| fe       | [fe.md](docs/todo/fe.md)         | [fe.auto.md](docs/todo/fe.auto.md)         | 0     | 0        | 0         | 0     | —        |
| mobile   | [mobile.md](docs/todo/mobile.md) | [mobile.auto.md](docs/todo/mobile.auto.md) | 0     | 0        | 0         | 0     | —        |
| **Tổng** |                                  |                                            | **0** | **0**    | **0**     | **0** |          |

## Cách dùng

- **Viết tay**: `docs/todo/<phần>.md` — của bạn, viết tự do; việc là dòng `- [ ] ...` (`[P1]` nếu gấp). Claude chỉ đọc, chỉ được đánh `[x]` khi xong.
- **Tự động**: `docs/todo/<phần>.auto.md` — Claude ghi việc đang làm (đang dở, bước tiếp), việc phát hiện thêm, việc đã xong. Mục "Từ viết tay" là bản sao các việc còn mở của file viết tay.
- Commit file viết tay → hook tự đồng bộ file auto và `TODO.md` vào cùng commit.
- `/todo` xem/thêm việc · `/handoff` trước khi đổi máy hoặc tài khoản (lưu WIP, đẩy code dở lên `wip/<nhánh>`) · máy mới: `git pull` rồi `/resume`.
