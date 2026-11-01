# Quy trình làm việc với Claude Code

> File này do `node scripts/workflow.mjs index` sinh ra — đừng sửa tay.
> Sơ đồ phản ánh cấu hình hiện tại trong `.claude/`. Đổi command, hook, subagent hay quy tắc phân loại task → cập nhật sơ đồ trong `docs/workflows/` cùng commit.

Ô vàng trong sơ đồ là điểm bạn cần có mặt. Mọi bước khác Claude tự làm.

| #   | Quy trình                                          | Mô tả                                                                      |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | [Tổng quan](workflows/tong-quan.md)                | Phân loại task; task lớn qua pha 1 (Opus) và pha 2 (Sonnet), merge, retro. |
| 2   | [Lớp bảo vệ chạy tự động](workflows/lop-bao-ve.md) | Hook, permission và verify chạy ở mọi task mà không cần gọi.               |
| 3   | [Đổi máy hoặc tài khoản](workflows/doi-may.md)     | /handoff lưu todo, spec và code dở lên remote; /resume làm tiếp ở nơi mới. |
| 4   | [Lịch sử và tra cứu](workflows/tra-cuu.md)         | /why tìm câu trả lời trong ADR, spec, git, changelog và log prompt.        |
| 5   | [Khi nào đổi model](workflows/doi-model.md)        | Opus cho plan và contract, Sonnet cho code; chỉ đổi ngay sau /clear.       |
| 6   | [Phát hành version](workflows/phat-hanh.md)        | Changelog theo phần, automation.mode, /release bump và tag.                |

Thêm workflow: chép `workflows/_template.md` sang `workflows/<ten>.md`, điền front-matter và sơ đồ, rồi chạy `node scripts/workflow.mjs index`.
