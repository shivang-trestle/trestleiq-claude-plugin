---
name: trestle-reverse-address-api
description: Use when the user wants to call the TrestleIQ Reverse Address API via curl, asks for the /location endpoint, wants to look up all identities at an address with demographics+phones+emails, or asks about reverse-address lookups.
---

# TrestleIQ Reverse Address API

Validates an input address, returns relevant metadata, and returns **all identities currently linked to the address** — with demographic data, phone numbers, emails, associated people, and historical addresses for each linked identity.

## Latest version: 3.1 (default, recommended)

```
GET https://api.trestleiq.com/3.1/location
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/3.1/location?street_line_1=800%20Bellevue%20Way%20NE&city=Bellevue&state_code=WA&postal_code=98004" \
  --header "x-api-key: YOUR_API_KEY"
```

## Parameters

| Param | Required | Notes |
|---|---|---|
| `street_line_1` | yes | Street |
| `city` | yes | City |
| `state_code` | yes | 2-letter US state |
| `postal_code` | yes | ZIP |
| `country_code` | optional | ISO 3166-1 alpha-2; defaults to `US` |

## Versions

- **3.1 — latest, default, recommended** — `GET /3.1/location`

## Response highlights

`is_valid` (address validity), normalized address, list of identities currently or historically linked (name, demographics, phones, emails, associated people), standard `error` / `warnings`.

## Don't confuse with

- **Address Validation API** (`/3.0/location_intel`) — only checks deliverability/standardization, doesn't return identities. Cheaper.

## Errors

Standard Trestle 400/403/429/500.

## Related MCP tool

Not yet wrapped in the v0.1 plugin (planned for v0.3). Curl is the way for now.

## Canonical docs

https://docs.trestleiq.com/api-reference/reverse-address-api
