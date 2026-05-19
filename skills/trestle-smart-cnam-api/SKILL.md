---
name: trestle-smart-cnam-api
description: Use when the user wants the TrestleIQ Smart CNAM API via curl, asks for the cnam endpoint, only needs the top name for a phone number (no address/email), or asks about CNAM lookups. Cheapest phone-to-name lookup.
---

# TrestleIQ Smart CNAM API

Validates the phone number and returns the **top associated name** — nothing else. Cheapest option when all you need is "who is this name attached to."

## Latest version: 3.1 (default, recommended)

```
GET https://api.trestleiq.com/3.1/cnam
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/3.1/cnam?phone=2069735100" \
  --header "x-api-key: YOUR_API_KEY"
```

## Parameters

| Param | Required | Notes |
|---|---|---|
| `phone` | yes | 10-digit US number |

## Versions

- **3.1 — latest, default, recommended** — `GET /3.1/cnam`

## When to choose this over alternatives

- vs `caller_id` (Caller Identification): CNAM is cheaper and only returns name. Pick CNAM if you don't need address/email/alt-phone.
- vs `phone` (Reverse Phone): CNAM is far cheaper. Pick CNAM unless you need the full owner list with linked records.

## Response highlights

`is_valid`, `phone_type`, `name` (top associated name string), standard `error` / `warnings`.

## Errors

Standard Trestle 400/403/429/500.

## Related MCP tool

Not yet wrapped in the v0.1 plugin (planned for v0.2). Curl is the way for now.

## Canonical docs

https://docs.trestleiq.com/api-reference/smart-cnam-api
