# Quyết định (ADR)

> File này do `node scripts/adr.mjs index` sinh ra — đừng sửa tay.
> Mọi quyết định có tranh cãi đều có ADR. Tra cứu nhanh: `/why <câu hỏi>`.

## Ảnh hưởng rộng (R)

Ảnh hưởng từ 2 phần trở lên, đổi quy trình hoặc contract dùng chung, hoặc khó đảo ngược.

| Số   | Quyết định                                                                                                                       | Trạng thái | Ngày       | Model           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | --------------- |
| 0001 | [Monorepo TypeScript ở cả ba tầng, types dùng chung trong packages/shared](0001R-monorepo-typescript-va-shared.md)               | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0002 | [Client gọi API đặt trong packages/shared, các app chỉ chứa UI](0002R-client-api-trong-shared.md)                                | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0003 | [Phân loại task nhỏ / vừa / lớn trước khi làm](0003R-phan-loai-task.md)                                                          | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0004 | [Task lớn chạy hai pha, hai session: Opus lập kế hoạch, Sonnet thực thi](0004R-hai-pha-opus-sonnet.md)                           | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0005 | [Contract và test viết trước; stub 'not implemented'; cờ .allow-red chỉ bỏ qua test](0005R-contract-va-test-truoc.md)            | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0006 | [Stop hook chặn Claude báo xong khi verify còn lỗi](0006R-stop-hook-chan-khi-verify-do.md)                                       | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0007 | [Tính năng lớn làm trên nhánh feat/, merge vào main là điểm duyệt](0007R-nhanh-feat-va-duyet-merge.md)                           | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0008 | [Chỉ dùng subagent cho web/mobile khi mỗi app có phần UI đáng kể](0008R-subagent-chi-khi-ui-lon.md)                              | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0009 | [Version và changelog riêng cho từng phần; mức bump suy ra từ changelog; chỉ tag version dự án](0009R-version-theo-tung-phan.md) | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0010 | [Log prompt commit lên git, nằm ngoài versioning, ghi model xử lý, không ghi câu trả lời](0010R-log-prompt-trong-git.md)         | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |
| 0011 | [Mọi quyết định có tranh cãi đều có ADR; quyết định ảnh hưởng rộng được đánh dấu R](0011R-adr-cho-quyet-dinh-tranh-cai.md)       | Chấp nhận  | 2026-11-01 | claude-opus-5-5 |

## Cấp tính năng

_Chưa có._
