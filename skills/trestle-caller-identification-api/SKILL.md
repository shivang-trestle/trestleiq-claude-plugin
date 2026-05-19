---
name: trestle-caller-identification-api
description: Use when the user wants to call the TrestleIQ Caller Identification API via curl, asks for the caller_id endpoint, wants the single top-ranked owner of a phone number (not all owners), or asks how to do caller-ID lookups. Cheaper than Reverse Phone when only the primary owner is needed.
---

# TrestleIQ Caller Identification API

Validates the phone, provides real-time metadata, and returns **only the highest-ranked phone owner** along with their current address, emails, and alternate phone numbers. Use this when you need one owner — not all of them.

## Latest version: 3.1 (default, recommended)

```
GET https://api.trestleiq.com/3.1/caller_id
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/3.1/caller_id?phone=2069735100" \
  --header "x-api-key: YOUR_API_KEY"
```

## Parameters

| Param | Required | Notes |
|---|---|---|
| `phone` | yes | 10-digit US number |

## Versions

- **3.1 — latest, default, recommended** — `GET /3.1/caller_id`

## When to choose this over alternatives

- vs `reverse_phone` (`/3.2/phone`): pick Caller Identification when you only need the **top** owner. Reverse Phone returns the full owner list and costs more.
- vs `cnam` (`/3.1/cnam`, Smart CNAM): pick Caller Identification when you need address/email/alt-phone of the owner. CNAM only returns name.

## Response highlights

Top-level: `is_valid`, `phone_type`, `carrier`, `owner` (single identity — name, address, emails, alternate phones), plus standard `error` / `warnings`. Owner can be null if no record.

## Errors

Standard Trestle 400/403/429/500.

## Related MCP tool

Not yet wrapped in the v0.1 plugin (planned for v0.2). Curl is the way for now.

## Canonical docs

https://docs.trestleiq.com/api-reference/caller-identification-api
