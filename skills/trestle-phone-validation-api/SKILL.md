---
name: trestle-phone-validation-api
description: Use when the user wants to call the TrestleIQ Phone Validation API directly via curl, asks for the phone_intel endpoint, wants to know how to validate a phone number against api.trestleiq.com, or asks about Phone Validation API versions. Returns line type, carrier, prepaid status, and phone activity.
---

# TrestleIQ Phone Validation API

Validates an input phone number and returns real-time metadata signals — carrier, line type (Mobile/Landline/VOIP), prepaid status, and a phone activity score that flags disconnected numbers.

## Latest version: 3.0 (default, recommended)

```
GET https://api.trestleiq.com/3.0/phone_intel
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/3.0/phone_intel?phone=2069735100" \
  --header "x-api-key: YOUR_API_KEY"
```

## Parameters

| Param | Required | Notes |
|---|---|---|
| `phone` | yes | 10-digit US number (no `+1` prefix needed). International support is gated — see warnings in response. |

## Versions

- **3.0 — latest, default, recommended** — `GET /3.0/phone_intel`

No earlier versions are publicly documented for this endpoint at https://docs.trestleiq.com/api-reference/phone-validation-api. If you have an integration on an older version, contact support@trestleiq.com.

## Response highlights

Top-level fields (verified against portal product page):

- `id` — Trestle's persistent ID of the phone record
- `phone_number` — input number, normalized
- `is_valid` — boolean (syntax/basic validity)
- `activity_score` — connect/disconnect + phone activity signal
- `country_calling_code`, `country_code`, `country_name`
- `line_type` — Mobile / Landline / VoIP / Non-Fixed VoIP / etc.
- `carrier`
- `is_prepaid` — boolean
- `is_litigator_risk` — boolean, only present when Litigator Check add-on is enabled (+$0.005/query)
- `error`, `warnings`

## Pricing (Self-Serve)

- Base: **$0.015 / query**
- Litigator Check add-on: **+$0.005 / query**

## Errors

Uniform across Trestle APIs:

| Status | Meaning |
|---|---|
| 400 | Bad request — malformed params |
| 403 | Invalid/missing/disabled/expired API key, **or** key lacks product access for this endpoint or version |
| 429 | Rate limit or quota exceeded |
| 500 | Trestle-side error — contact support |

## Related MCP tool

The `trestleiq` plugin's `trestle_phone_validation` MCP tool wraps this endpoint. Use that for conversational queries; reach for curl when the user wants the raw response, wants to script outside Claude, or wants to debug fields the tool doesn't surface.

## Canonical docs

https://docs.trestleiq.com/api-reference/phone-validation-api
