# AML Screening — Component Catalog

> Source file: `3N6oxnOdDfsULIQ5teXKbw`
> Scanned 2026-04-30 — 12 sets + 18 standalone = 30 total.

## Component sets (12)

| Component | Key | Variants |
|---|---|---|
| `Search configuration` | `bf9812ee3ba284f31a01fd1bb6b281e0b4cb4095` | 7 |
| `Ongoing AML monitoring` | `263f699ffd51380e53e8c2e068c987f7bde3deff` | 4 |
| `World check one` | `0c2f0bddd8f955cb7150878cd27b18a19fe757a2` | 2 |
| `Quantifind` | `af86890d0655ce261100ee1fe13368cd603614d9` | 2 |
| `AML preset events` | `be66305ad6f9f2ae1e49ecb695dc9ed3241a84d5` | **11** |
| `Review desicion` | `5775f1728776ee739f236d809f906fc7ee2a645f` | 2 |
| `*Collapsible Card*` | `c8d13d21f693ed5f362f75d3cbcf1396f44189c1` | 3 |
| `Condition` | `21401efe65d27d81263d42acb8de4fc2a005f7c3` | 2 |
| `Rule` | `bef32613cf82dfb4910e7b80e1308958149d0802` | 2 |
| `Match status` | `4fee66bae5d68b6469edbef56a2be2e01b790101` | 4 |
| `Risk level` | `0f32902a1e99db3c3331e4be72c3b58c7e092c33` | 4 |
| `Modal / Templates` | `0e395d531723fbf7728a90f48ada1512bd25a763` | 6 |

## Standalone components (top 8 of 18)

| Component | Key |
|---|---|
| `Comply advantage` | `c07caf33ed2a3e53e8d2bfe88eb5a797d6f67cf0` |
| `Events log` | `5cb08cf522f7b1802f16a8c0cf1b4cf938e13eda` |
| `Step group` | `acabe200678083be99e8b652e16dcf5dc21f3e73` |
| `Edit condition` | `7d0404c01017461f1d365a613d510b8175e5f96c` |
| `Stepper row` | `5bf237797921957170df05f5429a82e1ae9454c3` |
| `library table` | `472aec4dfa1dd1e432bcbe556c784825e8dc2953` |
| `Note` | `9169bf4c3f5719527f8272b689ee3cc003282c97` |
| `Whitelisted` | `60b8297c04d5e6a9ae2aeeb06bb972b923c01bee` |

---

## Pattern

See `aml-screening-pattern.md`. Pattern A (Vendors / Ongoing monitoring): 1920+276+Body 1644. Pattern B (Resolution rule chain editor): 1440+collapsed Sidebar 52+Body 1388.

## Notes

- **`AML preset events` has 11 variants** — biggest set in the file. Likely covers all event types (rule triggered / rule passed / case escalated / etc.).
- **`Search configuration` has 7 variants** — different vendor configs (Comply Advantage / World-Check / Quantifind / etc.).
- **Vendor-specific components**: `Comply advantage`, `World check one`, `Quantifind` are dedicated per-vendor blocks. Use the matching one based on which vendor the canonical references.
- **Rule chain editor uses `Condition` + `Rule` + `Step group` + `Stepper row`** combined into the editor canvas (Pattern B).
- For Resolution rule chain, the body is a custom rule-flow visualization, not a standard list.
