# WebSDK KYC Flow Map — canonical step sequences

> **Flow ground truth: file `Lvs3OA19oILUfjyairhb81` "[✳️ PROD] General"**, page node `2:8`, section **"General flow"** (`7130:32503`):
> - **WEB** (desktop) `7130:32504` — screens in 1440×980 `Instructions` wrappers, left→right, with `Scenarios` annotation instances ABOVE each screen
> - **mWEB** (mobile) `9227:299668` — the mobile flow row
>
> Scanned 2026-07-20. When a user asks for a FLOW, the sequence comes from THIS file — never from the prompt's step list alone.

## 🛑 THE FLOW RULE

A prompt like "build the KYC flow: Welcome → Document Type → Tips → Camera → Liveness → Status" names the ANCHOR steps. The canonical flow contains **more screens between them** — tips before EACH capture step, document back side, processing/pending states. Building only the literally-named screens produces a wrong flow (real defect 2026-07-20: the build had doc-tips assembled by guess and **NO tips before Liveness** — user feedback: "used the wrong tips screen before document capture, and didn't place one before liveness at all").

Procedure for ANY flow request:
1. Open `Lvs3OA19oILUfjyairhb81` → section "General flow" → WEB (and mWEB for the mobile row).
2. Map the user's named steps onto the canonical sequence; include the canonical in-between screens for the requested span (at minimum: the per-capture Tips screens; ask before dropping PoA/back-side/pending if the user's list skips them).
3. Replicate each screen from its canonical instance (the General file screen, or the same assembly in the Organisms Examples) — organism VARIANT, Image-slot content, and dims read from the canonical, not guessed.
4. Annotations: mirror the canonical's `Scenarios` row above the screens (X.Y numbering in flow order, English).

## Canonical KYC WEB sequence (17 screens, unique steps collapsed)

| # | Step | Assembly (slot organisms) | Heading |
|---|---|---|---|
| 1 | Steps overview | `Steps NEW[State=Default]` + Step items | "Get verified for Astra" |
| 2–4 | Welcome / Agreement | `Welcome[Type=US Agreement]` + Radio items (3 states) | "Confirm your country of residence" |
| 5 | Document Type | `Document Type[Type=Default]` (+ UK share-code instruction, Select) | "Select document type and issuing country" |
| 6 | **Document Tips** | `Tips[Type=ID \| Live Capture]` + `Image Slot[Type=ID]` | "Get ready to upload your ID" |
| 7–10 | Document capture | `POI camera Desktop`: `Step=Placeholder,Type=Loading` → `Step=Placeholder,Type=ID front side` → `Step=Camera,Type=ID front side` → `Step=Camera,Type=ID back side` | "Uploading" |
| 11–13 | Proof of Address | PoA screens (browser-chrome mockups) | "Verify your address" / "Upload your proof of address document" |
| 14 | **Liveness Tips** | `Tips[Type=Selfie]` + `Image Slot[Type=Liveness]` | "Let's take a selfie" |
| 15 | Liveness | `Selfie Desktop[Type=Liveness, State=In progress - active]` | — |
| 16 | Status Pending | `Final statuses[Status=Pending]` | "Verifying your ID" |
| 17 | Status Success | `Final statuses[Status=Success]` | "Your profile has been verified" |

## Tips screens — per-capture pairing (the part the skill got wrong)

**Every capture step is preceded by ITS OWN Tips screen:**

| Before | Tips assembly | Heading | Canonical example |
|---|---|---|---|
| Document camera (ID) | `Tips[Type=ID \| Live Capture]` + `Image Slot[Type=ID]` | "Get ready to upload your ID" | Organisms Tips page `3044:140189` (desktop) |
| Document camera (Passport) | passport Tips variant | — | Organisms Tips page `3044:155375` |
| Liveness | `Tips[Type=Selfie]` + `Image Slot[Type=Liveness]` | "Let's take a selfie" | General file `9217:69259`; Organisms Tips Examples also ship `Type=Selfie` |
| PoA upload | `Tips[Type=Tips \| Document]` ("Get ready to upload your proof of residence") | — | — |

- ⚠️ The pre-liveness tips variant is **`Type=Selfie`** (canonical flow), NOT `Type=Tips | Liveness`. Don't pick by name similarity — read the flow canonical.
- ⚠️ Tips vary **per selected document type** (ID vs Passport…). The doc-tips screen must match the document chosen on the Document Type step.
- ⚠️ Do NOT assemble a tips screen by swapping illustrations "best-effort" — replicate the canonical example node 1:1 (Override #7a/#8 apply).
- 🛑 **The `Image Slot` VARIANT must match the step — set it explicitly, it does NOT follow the Tips organism.** Real defect (flow re-run 2026-07-20, user feedback: "Again inserted the wrong tips screen before the document upload"): the doc-tips screen had every TEXT right (`Tips[ID | Live Capture]`, "Get ready to upload your ID", items Success/Success/Error) but the Image slot held **`Image Slot[Type=Liveness]`** — the liveness illustration on the document screen → visually the WRONG screen despite all texts matching. Mapping: doc-ID tips → `Image Slot[Type=ID]`, passport → `[Type=Passport]`, liveness → `[Type=Liveness]` (read from the canonical example: `3044:140189` / `3044:155375` / General `9217:69259`). **The audit must assert the slotted instance's VARIANT (`mainComponent.name`), not just that the slot is filled/visible** — this extends Override #8 from slot visibility to slotted-instance variant equality, for EVERY filled slot (Image slot, content Slot, Camera slot). (Post-`setProperties` note: a variant change invalidates the instance ref — re-fetch before verifying.)
- Tips set key: `a4f45db0337fd053bbac9adf11434aaa53bcd664` (variants: Tips|Liveness, Tips|Document, ID|Live Capture, ID|Upload, Selfie with Document, Selfie, Short Video, Bank card, Bank statement, E-wallet). `Guidelines` set (`ee868b662794e83115465a04bd7c253d4c60e79f`: ID/Liveness/PoA) is a SEPARATE do/don't-examples organism — not the flow tips screen.

## Sumsub ID promo block — ONLY on the Steps-overview screen

The `SNS ID | Desktop` (Sumsub-ID promo: "Get verified faster with Sumsub ID" + email input) renders on exactly ONE canonical screen — the **Steps overview** (`9196:199933`, "Get verified for Astra", `Steps NEW[State=Default]`). It reaches other screens only as the **un-purged default content of the Widget's Slot** (the master ships `Steps NEW` as the Slot default — Override #8c). Any screen other than Steps-overview rendering `Steps NEW`/`SNS ID`/that promo text = FAIL.

## Flow presentation

- Screens left→right in canonical order; desktop row + mobile row (mWEB) — the D+M pair rule applies to flows as two rows.
- `Scenarios` annotation instances above each screen (as in the General file), numbering `1.1 … 1.N` in flow order, English "what the user sees/does".
- **Uniform wrappers in flows are canonical:** the General file presents every desktop screen in a 1440×980 wrapper. For flow builds, uniform row height mirrors the canonical (single-screen builds still keep native canonical dims per Override #7a).
