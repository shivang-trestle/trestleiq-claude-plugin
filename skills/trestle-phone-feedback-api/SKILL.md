---
name: trestle-phone-feedback-api
description: Use when the user wants to submit phone-call feedback to TrestleIQ via curl — reporting whether a number was connected/disconnected or whether it was the right-party contact. The only Trestle API that uses POST.
---

# TrestleIQ Phone Feedback API

Lets you submit feedback to Trestle about dialed numbers — whether the call connected, and whether it was the right-party contact. Improves Trestle's phone activity scoring over time. **Only Trestle API that uses POST.**

## Latest version: 1.0 (default, recommended)

```
POST https://api.trestleiq.com/1.0/phone_feedback
```

## Quick curl

```bash
curl --location --request POST \
  --url "https://api.trestleiq.com/1.0/phone_feedback" \
  --header "x-api-key: YOUR_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "phone": "2069735100",
    "connected": true,
    "right_party_contact": true
  }'
```

## Request body (JSON)

| Field | Required | Notes |
|---|---|---|
| `phone` | yes | 10-digit US number dialed |
| `connected` | yes | Boolean — did the call connect? |
| `right_party_contact` | optional | Boolean — was it the right person? |
| `dialed_at` | optional | ISO 8601 timestamp of the dial |

## Versions

- **1.0 — latest, default, recommended** — `POST /1.0/phone_feedback`

## Response

Acknowledgement only (`status` / `accepted`). No enrichment data is returned — this is a one-way signal.

## Errors

Standard Trestle 400/403/429/500.

## Related MCP tool

Not yet wrapped in the v0.1 plugin (planned for v0.3 — POST-style tools need extra handling). Curl is the way for now.

## Canonical docs

https://docs.trestleiq.com/api-reference/phone-feedback-api
