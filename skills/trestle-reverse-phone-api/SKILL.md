---
name: trestle-reverse-phone-api
description: Use when the user wants to call the TrestleIQ Reverse Phone API directly via curl, asks who owns a phone number with full enrichment, wants all linked addresses/emails/alternate numbers, or asks about the /phone endpoint. Trestle's most robust phone enrichment.
---

# TrestleIQ Reverse Phone API

Validates an input phone, returns relevant metadata, and returns **all potential phone owners** — each with linked addresses, emails, and alternate phone numbers. Most expensive of the Trestle phone enrichments — use Smart CNAM or Caller Identification if you only need name or top-owner.

## Latest version: 3.2 (default, recommended)

```
GET https://api.trestleiq.com/3.2/phone
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/3.2/phone?phone=2069735100" \
  --header "x-api-key: YOUR_API_KEY"
```

## Parameters

| Param | Required | Notes |
|---|---|---|
| `phone` | yes | 10-digit US number |

## Versions

- **3.2 — latest, default, recommended** — `GET /3.2/phone`

Earlier versions exist as billed integrations but aren't surfaced in the public docs. Don't reach for them unless you have a contract reason.

## Response highlights

Includes: `is_valid`, `phone_type`, `carrier`, `country_calling_code`, `owners[]` (array of identity records — name, age range, addresses, emails, associated people), plus the standard `error` / `warnings`. Owners array can be empty if no record is found. Full schema at the docs URL.

## Errors

Same as all Trestle APIs (see [Phone Validation skill](../trestle-phone-validation-api/SKILL.md)).

## Related MCP tool

The `trestleiq` plugin's `trestle_reverse_phone` MCP tool wraps this endpoint. Curl is the right call when the user wants raw owner records or needs to dig into fields the tool doesn't summarize.

## Canonical docs

https://docs.trestleiq.com/api-reference/reverse-phone-api
