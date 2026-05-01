# Settings (Dashboard project) — Component Catalog

> Source file: `Sr2T9AUlfHC2MCvLcvjBlm`
> Local components page scanned 2026-04-30 — 22 sets + 25 standalone = 47 total.

---

## Component sets (22)

| Component | Key | Variants |
|---|---|---|
| `branding` | `0b663a7386c76ed9691a9a60329bda952f7a2543` | 2 |
| `Roles` | `eb898747d6aa37f1f7b01765d43eb43f4c258c84` | 3 |
| `Modal Invite new member` | `b0c8ddcba54a9b537cb9effd99959357aa54c53b` | 2 |
| `Invite member` | `596baf9353e320208ebe2b1292b08015cab137af` | 2 |
| `Members table` | `8b31faa9a01ab953e261877c942216bd32033ae6` | 2 |
| `Autorization QR-code` | `6bd8d4148080b30256bf8c427f15df2081c4c38e` | 1 |
| `Badge` | `2320047230961ef565d538c2a5fbd384732c2f19` | 8 |
| `Branding New layout` | `2432bba2bcea19e834bd82e54d22da251b62617a` | 2 |
| `Company verification` | `fff8a4d1bd791fd418fb73c4fe862047d339b0a2` | 6 |
| `Members Table` (alt) | `ed8a4235de79285d70349a602bb370dff681624e` | 9 |
| `Invite member` (alt) | `19bbe3f9b7564938c7600d7989f283334150b549` | 4 |
| `Main content` | `275601e081f6016827de0402071cfcf27f844378` | 5 |
| `Side content` | `cc98f4b3980d41a7a7c3ed00d1449bd318f32315` | 2 |
| `Groups Table` | `e684f5a53234f74ac8e293ea8d4cc68938e82ffb` | 3 |
| `Delete_modal` | `ed8fd540c26fc19e617e359a275a4cdf39cce823` | 6 |
| `Role table` | `57a349bad9d46e4e88a94533e22907c5fd0d7a42` | 5 |
| `Admin settings` | `2a380a2a14b0183ec9c2950b431e081a7533b935` | 4 |
| `Permissions list` | `5a818eff62e5b3f1bf2f5719959d0047fbb00c91` | 2 |
| `Cell Content` | `c8c3c1ada8e18378663a94261478dd7d3476759f` | 1 |
| `2FA_Reauthentication` | `763fbb43764d5c2e38d664d5d3951ea9a61924de` | 2 |
| `.Modal Meet Owner` | `9836abe95cb224a1ba6a244005f9c2a63a1f8723` | 3 |
| `Owner modal Illustration` | `7fe071a93c20608c2a5feed7ce71f66a775ddf2a` | 2 |

## Standalone components (25)

| Component | Key |
|---|---|
| `Account details` | `2695271ff44404833b5e5c1716595ebed61e5bdf` |
| `Activity log` | `f199a845f1bf3ef0df52fe1a37eb6417747b2cdb` |
| `Activity log / Row` | `c8d00953d058dfe47660b583dff2df847d7628e3` |
| `code` | `9232b96f159992f59adb67f93ec719e5b9de29f7` |
| `JSON` | `bc005bb0968a4f2ba875500cd7af088c0138646d` |
| `Active sessions` | `e0a322f499f0a6439c9a6bd805690dd7abcf5f8d` |
| `data-table/content-row` | `c793c9f268b5a894d4109ce1dabe25fb73c092a0` |
| `Roles table` | `54ec3705bf0ea5759ae32e6b0a02e1369bb8f8da` |
| `Permission table / Row / Content` | `eddeee561898182a41bbf044393f0283ee55465c` |
| `Permission table / Row / Group header` | `deb7eeacd0e1efe3f69e4bcb4f4cb6c66fcfa064` |
| `Members role table` | `5d173f9366f03f5c0f27c979cc8cccbae2bc0ef2` |
| `data-table/content-row` (alt) | `6f8761bd55a781c010c44ef20f2e07a4348058b1` |
| `Roles/confirming deletion` | `84e6c4f4fc59343c7f5e6abf26cf1dd5da1cd73a` |
| `Profile` | `ee45cdf9b8b7cc8b40986c83ef5587c44997a653` |
| `Password` | `f8e35c276fd02f76b06332ab02ea0ceb099c37c9` |

---

## Notes

- Settings file uses unique **dual-sidebar P2 pattern** (`Menu / Group` 80 + `*Additional Menu*` 191 + Header 1649) — see `settings-pattern.md`.
- Many components are **internal** (dot prefix or generic names like `Cell Content`) — usually not imported standalone, used through their parent organisms.
- For Member/Roles/Groups tables, Settings has **multiple table variants** (Members table, Members Table, Roles table, Groups Table, Role table) — likely older/newer iterations. When reproducing, prefer the v9-variant `Members Table` (`ed8a4235...`) and v5-variant `Role table` (`57a349ba...`).
- 2FA flow uses `2FA_Reauthentication` set (2 variants) for the re-auth prompt before sensitive actions.
- Owner transfer flow uses `.Modal Meet Owner` (3 variants — likely Default / Pending / Confirmed) + `Owner modal Illustration`.
