---
so: 0015
pham-vi: rong # rong | tinh-nang
trang-thai: chap-nhan # de-xuat | chap-nhan | bi-thay-the
thay-the-boi: # số ADR mới, chỉ khi bi-thay-the
ngay: 2026-11-01
model: claude-opus-5-5
nguon: yêu cầu "thêm thông tin môi trường làm việc: windows 11, VSCode"; ADR 0014R
---

# Windows 11 + VSCode là môi trường chuẩn của kit, script giữ POSIX

## Bối cảnh

Kit được dùng thực tế trên Windows 11 với VSCode và extension Claude Code, nhưng tài liệu không nói điều đó. Các lỗi đã gặp đều đến từ khác biệt nền tảng: file checkout CRLF làm `adr.mjs` không đọc được frontmatter, nháy đơn trong `execSync` (cmd.exe) làm `version.mjs` không tìm thấy tag, `chmod +x` không lưu vào git. Mỗi session Claude phải tự phát hiện lại.

## Phương án

- Không khai báo môi trường, viết đa nền tảng chung chung: linh hoạt, nhưng lỗi nền tảng chỉ lộ ra khi chạy.
- Khai báo Windows 11 + VSCode là môi trường chuẩn, lưu ý nằm trong CLAUDE.md, có `.vscode/` dùng chung; script vẫn POSIX (Git Bash) để chạy được trên macOS/Linux.
- Chuyển script sang PowerShell: tự nhiên trên Windows nhưng mất macOS/Linux và hook hiện có.

## Quyết định

Chọn phương án 2. CLAUDE.md có mục "Môi trường" (nạp mọi session); `.vscode/settings.json` ép LF, format on save bằng Prettier, terminal Git Bash; `.vscode/extensions.json` gợi ý Claude Code, Prettier, ESLint, Markdown Mermaid.

## Hệ quả

- Claude biết trước các bẫy của Windows; tốn thêm vài dòng context mỗi session.
- Người dùng macOS/Linux vẫn dùng được kit; `defaultProfile.windows` không ảnh hưởng họ.
- Thay đổi script phải kiểm thử trên Git Bash (Windows); khác biệt nền tảng mới phát hiện → thêm một dòng vào mục "Môi trường".
