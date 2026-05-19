---
name: trestle-address-validation-api
description: Use when the user wants to call the TrestleIQ Address Validation API via curl, asks for the location_intel endpoint, wants to verify/standardize an address (without identity enrichment), or asks about address validation.
---

# TrestleIQ Address Validation API

Validates an address and returns standardization metadata — deliverability, normalized form, USPS-style components. **Does not return identities** linked to the address. For identity enrichment use the Reverse Address API instead.

## Latest version: 3.0 (default, recommended)

```
GET https://api.trestleiq.com/3.0/location_intel
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/3.0/location_intel?street_line_1=800%20Bellevue%20Way%20NE&city=Bellevue&state_code=WA&postal_code=98004" \
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

- **3.0 — latest, default, recommended** — `GET /3.0/location_intel`

## Choose this vs Reverse Address

- **Address Validation (this)** — cheap; "is this address valid and what's the canonical form?"
- **Reverse Address (`/3.1/location`)** — more expensive; "give me the identities linked to this address."

## Response highlights

Validity flag, normalized/standardized address components, geo (lat/lon), standard `error` / `warnings`.

## Errors

Standard Trestle 400/403/429/500.

## Related MCP tool

Not yet wrapped in the v0.1 plugin. Curl is the way for now.

## Canonical docs

https://docs.trestleiq.com/api-reference/address-validation-api
