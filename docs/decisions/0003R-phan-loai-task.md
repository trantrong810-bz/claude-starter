---
number: 0003
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-11, ca-20261101-12, commit 4f1b848
---

# Phân loại task nhỏ / vừa / lớn trước khi làm

## Bối cảnh

Ép mọi việc qua quy trình đầy đủ tốn thời gian và token, trong khi phần lớn việc hằng ngày là sửa nhỏ.

## Phương án

- Một quy trình cho mọi việc: đơn giản nhưng lãng phí.
- Phân loại theo phạm vi: nhỏ làm thẳng, vừa plan trong chat, lớn (đổi contract) mới qua hai pha.

## Quyết định

Phân loại theo việc có đổi contract API hay không và số lớp bị chạm. Quy tắc nằm trong CLAUDE.md.

## Hệ quả

Việc nhỏ nhanh hơn nhiều; Stop hook vẫn bảo vệ mọi loại. Ranh giới vừa/lớn phụ thuộc phán đoán của Claude.
