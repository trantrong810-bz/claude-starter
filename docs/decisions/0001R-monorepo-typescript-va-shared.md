---
number: 0001
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-03, ca-20261101-04, commit 1eb4579
---

# Monorepo TypeScript ở cả ba tầng, types dùng chung trong packages/shared

## Bối cảnh

Dự án fullstack (backend, web, mobile) làm một mình trên một máy. Cần để Claude thấy cả hệ thống và phát hiện ngay khi contract API lệch giữa các tầng.

## Phương án

- Repo riêng cho từng tầng: tách biệt, nhưng Claude không thấy contract chung; đổi API phải sửa nhiều repo.
- Monorepo, backend Java + OpenAPI sinh client: hợp kinh nghiệm Java, nhưng hai ngôn ngữ và thêm bước sinh mã.
- Monorepo TypeScript ở cả ba tầng (Next.js, Expo, Node) + `packages/shared`: một ngôn ngữ, type dùng chung trực tiếp.

## Quyết định

Chọn monorepo pnpm + Turborepo, TypeScript strict ở cả ba tầng, schema Zod trong `packages/shared` là nguồn sự thật duy nhất cho contract.

## Hệ quả

Đổi contract làm typecheck báo lỗi ở mọi nơi bị ảnh hưởng. Backend Java vẫn khả thi nhưng phải chuyển sang contract-first bằng OpenAPI.
