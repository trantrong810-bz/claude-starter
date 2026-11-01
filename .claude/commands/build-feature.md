---
description: Pha 2 (chạy bằng Sonnet) — backend xanh, client trong shared, rồi UI web + mobile. Commit sau mỗi lớp, trên nhánh feat/.
argument-hint: <tên-tính-năng>
---

Tính năng: $ARGUMENTS

1. Đọc `docs/specs/$ARGUMENTS.md`. Đó là nguồn sự thật; không lập lại plan. Nếu spec mâu thuẫn với code hiện tại, dừng và hỏi. Đảm bảo đang ở nhánh `feat/$ARGUMENTS`.
2. Xóa `.claude/.allow-red` (từ giờ verify chạy cả test).
3. Backend: thay stub, làm test pha 1 xanh. Không sửa test để cho qua — nếu test sai, dừng và hỏi.
   `pnpm verify` qua → commit `feat(<tên>): implement backend` (thiếu changelog thì hook chặn: gọi subagent `versioner` rồi commit lại; message sai quy ước thì sửa theo `docs/GIT.md`) → đánh dấu checklist. (Áp dụng cho mọi commit bên dưới.)
4. Client trong `packages/shared`: hàm gọi API theo contract, parse response bằng schema (không ép kiểu `as`), encode mọi tham số đưa vào URL. Viết test với `fetch` giả.
   `pnpm verify` qua → commit `feat(<tên>): add api client in shared` → đánh dấu checklist.
5. UI web và mobile — chỉ gọi client từ `@app/shared`, không viết lại logic gọi API:
   - Nếu Plan ghi cả hai app đều có phần UI đáng kể (màn hình/component mới, nhiều file): giao song song cho 2 subagent `app-builder`.
   - Ngược lại: tự làm trực tiếp. Subagent tốn ~10k token mỗi lần khởi động; không đáng cho vài dòng.
   - Sau đó: `pnpm verify` qua → commit `feat(<tên>): add web and mobile ui` → đánh dấu checklist.
6. Cập nhật spec (checklist + Tiến độ). Chạy `pnpm verify` lần cuối, rồi gọi subagent `code-reviewer` với: phạm vi `git diff main...HEAD`, đường dẫn spec, và kết quả verify. Sửa vấn đề mức cao và trung, commit (`fix(<tên>): ...`).
7. Báo tôi: tóm tắt 3–5 dòng + các vấn đề mức thấp chưa sửa. Hỏi tôi trước khi merge. Được duyệt: `git switch main && git merge --ff-only feat/$ARGUMENTS`; nếu không fast-forward được thì quay lại nhánh, `git rebase main`, `pnpm verify`, rồi merge lại. Sau merge: `git branch -d feat/$ARGUMENTS`. Sau khi merge: nếu `node scripts/version.mjs mode` là `full` thì làm theo `/release`; nếu không, nhắc tôi có thể chạy `/release`. Cuối cùng nhắc tôi chạy `/retro $ARGUMENTS`.
