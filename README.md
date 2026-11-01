# claude-starter

Bộ cấu hình Claude Code cho monorepo fullstack (backend + web + mobile), tối ưu cho làm việc một mình trên một máy Windows 11 + VSCode.

Ba nguyên tắc:

1. **Claude tự kiểm chứng được** — `pnpm verify` + Stop hook không cho báo "xong" khi còn lỗi.
2. **Context luôn gọn** — CLAUDE.md ngắn, output verify chỉ hiện lỗi, review chạy trong subagent, tiến độ lưu vào spec để `/clear` thoải mái.
3. **Quy tắc ép bằng công cụ** — permissions deny `.env`/migration/lệnh phá hoại, hook tự format, ESLint chặn import vượt ranh giới (app chỉ được import `@app/shared`).

## Stack giả định

pnpm workspaces + Turborepo · `apps/backend` (Node) · `apps/web` (Next.js) · `apps/mobile` (Expo) · `packages/shared` (Zod schemas, types, API client).

## Môi trường

Windows 11 · VSCode + extension Claude Code · Git for Windows (hook và script chạy bằng Git Bash) · Node ≥ 20 · pnpm. Script viết theo POSIX nên vẫn chạy trên macOS/Linux, nhưng chỉ Windows được kiểm thử thường xuyên. Lưu ý cho Claude nằm trong mục "Môi trường" của `CLAUDE.md` (ADR 0015R).

## Nội dung

```
CLAUDE.md                        # bộ nhớ dự án — điền tên & stack thật
SETUP.md                         # hướng dẫn cài đặt chi tiết
.vscode/                         # LF, format on save, terminal Git Bash, extension gợi ý
.claude/
  settings.json                  # permissions + đăng ký hooks
  hooks/format.sh                # Prettier sau mỗi lần sửa file
  hooks/session-context.sh       # đầu session: báo việc đang dở
  hooks/verify-on-stop.sh        # chặn kết thúc khi verify đỏ
  commands/plan-feature.md       # /plan-feature — pha 1: plan, contract, test đỏ
  commands/build-feature.md      # /build-feature — pha 2: test xanh, web+mobile song song
  commands/handoff.md            # /handoff — ghi tiến độ trước /clear
  commands/retro.md              # /retro — biến lỗi thành lint/hook/CLAUDE.md
  commands/why.md                # /why — tra cứu quyết định và lịch sử prompt
  commands/release.md            # /release — điền changelog thiếu, xem trước, phát hành
  agents/versioner.md            # subagent điền changelog từ diff (Haiku)
  hooks/version-guard.sh         # chặn git commit thiếu changelog
  hooks/commit-guard.sh          # chặn git commit sai quy ước (message, nhánh, --no-verify)
  hooks/prompt-log.mjs           # ghi prompt + model xử lý vào history/
  agents/app-builder.md          # subagent làm một app (web hoặc mobile)
  agents/code-reviewer.md        # subagent review diff (Sonnet)
scripts/verify.sh                # typecheck + lint + test phần bị ảnh hưởng
scripts/try-example.sh           # dựng demo chạy được từ example/
scripts/adr.mjs                  # tạo, đánh mục lục, kiểm tra ADR
scripts/version.mjs              # init / list / mode / check / release
scripts/commit-msg.mjs           # kiểm tra commit message (Conventional Commits)
.githooks/                       # commit-msg + pre-commit cho người (core.hooksPath)
.gitattributes                   # LF cho mọi file text
docs/GIT.md                      # quy ước git — nạp vào mọi session
example/                         # monorepo mẫu tối giản
docs/specs/_template.md          # mẫu spec cho mỗi tính năng
docs/WORKFLOW.md                 # sơ đồ Mermaid: quy trình, lớp bảo vệ, tra cứu, phát hành
docs/decisions/                  # ADR — mọi quyết định có tranh cãi; R = ảnh hưởng rộng
history/prompts/                 # log prompt (commit, ngoài versioning)
versions.json                    # bảng phần → đường dẫn, version
CHANGELOG.md                     # changelog toàn dự án; mỗi phần có CHANGELOG.md riêng
```

Sơ đồ quy trình đầy đủ: [docs/WORKFLOW.md](docs/WORKFLOW.md) (GitHub hiển thị Mermaid trực tiếp).

## Thử ngay với monorepo mẫu

```bash
bash scripts/try-example.sh ~/claude-starter-demo
cd ~/claude-starter-demo && pnpm verify && claude
```

Script ghép `example/` (shared + backend + web + mobile, có Zod schema và test thật) với toàn bộ cấu hình, chạy `git init` và `pnpm install`. Muốn thấy cơ chế hoạt động: đổi `title` thành `name` trong `packages/shared/src/schema.ts` rồi chạy `pnpm verify` — typecheck báo lỗi đúng dòng ở cả 4 package (shared, backend, web, mobile), và Stop hook sẽ không cho Claude báo xong.

Mẫu có sẵn Prettier (hook format chạy thật) và `eslint.config.js` với quy tắc ranh giới: thử thêm `import { listTodos } from "@app/backend"` vào `apps/web` — `pnpm verify` báo lỗi kèm hướng dẫn đưa code vào `packages/shared`. Chép file này sang dự án thật để giữ nguyên ranh giới.

Client gọi API nằm trong `packages/shared/src/client.ts` (parse response bằng Zod, có test với `fetch` giả); `web` và `mobile` chỉ gọi client đó. Khi dùng thật, thay hai app bằng `create-next-app` / `create-expo-app` và giữ nguyên cách này.

## Áp vào dự án có sẵn

```bash
# chép vào gốc monorepo của bạn
cp -r CLAUDE.md SETUP.md .claude scripts docs /path/to/your-monorepo/
cd /path/to/your-monorepo
chmod +x .claude/hooks/*.sh scripts/*.sh
npm pkg set scripts.verify="bash scripts/verify.sh"
printf 'CLAUDE.local.md\n.claude/.allow-red\n' >> .gitignore
```

Sau đó mở `claude`, gõ `/hooks` để kiểm tra hook đã được nhận. Chi tiết xem [SETUP.md](SETUP.md).

## Quy trình

### Phân loại task trước

| Loại | Dấu hiệu                          | Cách làm                                       |
| ---- | --------------------------------- | ---------------------------------------------- |
| Nhỏ  | Sửa 1 chỗ, bug rõ ràng            | Làm thẳng. Stop hook là đủ kiểm soát.          |
| Vừa  | 1–2 lớp, không đổi contract API   | Plan ngắn trong chat, duyệt, làm.              |
| Lớn  | Đổi contract API hoặc chạm 3+ lớp | `/plan-feature` → `/build-feature` → `/retro`. |

Phần lớn việc hằng ngày là loại nhỏ và vừa — đừng ép chúng qua quy trình lớn.

### Task lớn: hai pha, hai session

```
Session 1 (Opus)                         Session 2 (Sonnet)
/plan-feature <tên> <mô tả>              /build-feature <tên>
  → DUYỆT plan + contract  ◀── bạn         → backend: test xanh → commit
  → nhánh feat/<tên>                       → client trong shared + test → commit
  → schema + stub + test backend đỏ        → UI web + mobile → commit
  → commit → /handoff                        (subagent song song nếu UI lớn)
        │                                  → code-reviewer → sửa
        └── /clear, /model sonnet ──▶      → DUYỆT merge vào main  ◀── bạn
                                           → /retro  ◀── bạn chọn cải tiến
```

Vì sao như vậy:

- **Model đúng việc, không phá cache.** Phần cần tư duy (plan, contract, test) dùng Opus; phần nhiều token (viết code) dùng Sonnet. Đổi model ở ranh giới `/clear` nên không làm mất prompt cache giữa session.
- **Contract + test chốt trước.** Pha 2 có "trọng tài" sẵn: làm cho test xanh, không phải tự phán đoán khi nào xong.
- **Client dùng chung, app chỉ là UI.** Hàm gọi API viết một lần trong `shared`, có test; web và mobile không lặp lại logic.
- **Song song chỉ khi đáng.** Mỗi subagent tốn ~10k token khởi động. Chỉ giao web/mobile cho subagent khi mỗi app có phần UI đáng kể; việc nhỏ thì làm thẳng.
- **Nhánh `feat/`, commit mỗi lớp.** `main` luôn xanh dù test pha 1 đỏ; mỗi lớp là một điểm quay lại; reviewer xem đúng `main...HEAD`. Commit message theo Conventional Commits, merge chỉ fast-forward — đầy đủ trong [docs/GIT.md](docs/GIT.md), ép bằng hook.
- **Bạn chỉ cần có mặt ở 3 điểm:** duyệt plan/contract (sửa ở đây rẻ nhất), duyệt merge vào `main`, và chọn đề xuất của `/retro`.

### Cải tiến dần — tự động qua `/retro`

Sau mỗi task lớn, `/retro` đề xuất cách khắc phục rẻ nhất cho từng lỗi đã gặp, theo thứ tự: lint rule/hook → một dòng CLAUDE.md → command mới. Nó cũng đề xuất xóa dòng CLAUDE.md đã thừa, để file luôn ngắn.

## Lịch sử prompt và quyết định

- **Prompt:** hook ghi mọi prompt vào `history/prompts/YYYY-MM.jsonl`: thời gian, nhánh, prompt (đã che secret), **model và effort xử lý**, subagent kèm model của chúng, và commit tạo ra. Không ghi câu trả lời. Được commit nhưng nằm ngoài versioning; `pnpm verify` chặn nếu còn chuỗi giống secret. Định dạng: [history/README.md](history/README.md).
- **Quyết định:** mọi quyết định có tranh cãi là một ADR trong `docs/decisions/`. Quyết định ảnh hưởng rộng có `pham-vi: rong`, chữ **R** trong tên file và bảng riêng trong [mục lục](docs/decisions/README.md).
- **Tra cứu:** `/why vì sao dùng nhánh feat?` — tìm ADR → spec → git → log prompt, trả lời kèm nguồn và model.

Log prompt chứa nguyên văn những gì bạn gõ. Chỉ dùng khi repo riêng tư (xem ADR 0010); với repo công khai, đặt `CLAUDE_PROMPT_LOG=off` hoặc thêm `history/` vào `.gitignore`.

## Versioning

Mỗi phần có version SemVer và `CHANGELOG.md` riêng; toàn dự án có version và tag `vX.Y.Z`.

| Phần    | Đường dẫn                              |
| ------- | -------------------------------------- |
| .claude | `.claude/`, `CLAUDE.md`                |
| docs    | `docs/`, `README.md`, `SETUP.md`       |
| scripts | `scripts/`                             |
| example | `example/` (cấu hình gốc của monorepo) |
| shared  | `example/packages/shared/`             |
| be      | `example/apps/backend/`                |
| fe      | `example/apps/web/`                    |
| mobile  | `example/apps/mobile/`                 |

File khớp nhiều đường dẫn thuộc về đường dẫn dài nhất, nên mỗi thay đổi chỉ tính cho một phần.

```bash
node scripts/version.mjs init               # dự án mới: tạo versions.json + CHANGELOG.md
node scripts/version.mjs list               # version hiện tại
node scripts/version.mjs mode               # chế độ tự động đang áp dụng
node scripts/version.mjs check              # phần nào đổi file mà chưa ghi changelog
node scripts/version.mjs release --dry-run  # xem trước
node scripts/version.mjs release            # bump, ghi changelog, commit, tag
git push && git push --tags
```

**Tự động** (cấu hình trong `versions.json`): `"automation": { "mode": "changelog", "confirmRelease": true }`.

| mode                   | Hành vi                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `off`                  | Không tự động, không chặn commit; `check` chỉ chạy lúc phát hành.                                       |
| `changelog` (mặc định) | Hook chặn `git commit` thiếu changelog; subagent `versioner` (Haiku) đọc diff và tự điền `Unreleased`.  |
| `full`                 | Như `changelog`, thêm tự chạy `/release` sau khi merge vào main (hỏi trước nếu `confirmRelease: true`). |

Tắt cho một session trên máy mà không sửa repo: `CLAUDE_AUTO_VERSION=off`. Dự án mới: `node scripts/version.mjs init` tạo `versions.json` và changelog cho mỗi app/package.

Không tự sửa số version. Mức bump suy ra từ changelog: `### Removed` hoặc `BREAKING` → major, `### Added` → minor, còn lại → patch (ở `0.x`, major hạ xuống minor). Sơ đồ: [docs/WORKFLOW.md](docs/WORKFLOW.md#phát-hành-version).
