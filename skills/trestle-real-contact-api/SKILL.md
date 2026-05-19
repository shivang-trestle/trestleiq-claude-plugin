---
name: trestle-real-contact-api
description: Use when the user wants to call the TrestleIQ Real Contact API via curl, asks how to verify an identity profile across name+phone+email+address+IP, wants Phone Activity Score plus name match results, or asks about real_contact versions. Comprehensive lead verification.
---

# TrestleIQ Real Contact API

Comprehensive lead verification — verifies and grades phone numbers, emails, and addresses against a single named identity. Returns Phone Activity Score, line type, name matches, and IP-based intelligence signals. Add-ons available for email deliverability, email age, and TCPA litigator checks.

## Latest version: 2.0 (default, recommended)

```
GET https://api.trestleiq.com/2.0/real_contact
```

## Quick curl

```bash
curl --request GET \
  --url "https://api.trestleiq.com/2.0/real_contact?name=John%20Doe&phone=4259853735&email=john.doe@example.com&ip_address=192.0.0.1" \
  --header "x-api-key: YOUR_API_KEY"
```

## Parameters

| Param | Required | Notes |
|---|---|---|
| `name` | recommended | Full name. Improves grading. |
| `phone` | one of phone/email/address recommended | 10-digit US number |
| `email` | one of phone/email/address recommended | Standard email format |
| `ip_address` | optional | IPv4 (e.g. `192.0.0.1`). Adds geo/risk signals. |
| `address.street_line_1` | optional | Street |
| `address.city` | optional | City |
| `address.state_code` | optional | 2-letter US state |
| `address.postal_code` | optional | ZIP |
| `address.country_code` | optional | ISO 3166-1 alpha-2 |

At minimum supply enough fields to identify the contact. Combinations are graded — Real Contact is most useful with several fields.

## Versions

- **2.0 — newest, recommended** — `GET /2.0/real_contact`. **Access-gated:** at the time of writing, the portal only exposes 2.0 in the version dropdown to keys that have been granted v2.0 access by Trestle. Most existing self-serve keys still default to 1.1.
- **1.1 — current default for most self-serve keys** — `GET /1.1/real_contact`. Stable. Use this if your key doesn't yet show v2.0 in the portal product page version dropdown.

If you don't know which your key has access to, open the Real Contact API product page in the portal — the disabled version dropdown shows the version your key is wired for.

## Response highlights

Response is **nested by contact attribute** (verified against portal product page for v1.1):

```
{
  "phone": { "is_valid", "activity_score", "line_type", "name_match", "contact_grade" },
  "address": { "is_valid", "name_match" },
  "email": { "is_valid", "name_match", "contact_grade", "is_deliverable" /* add-on */, "age_score" /* add-on */ },
  "is_litigator_risk" /* add-on */,
  "error", "warnings"
}
```

## Pricing (Self-Serve)

- Base: **$0.03 / query**
- Add-ons: Litigator Check **+$0.005**, Email Deliverability **+$0.005**, Email Age Score **+$0.005**

## Errors

Standard Trestle 400/403/429/500.

## Related MCP tool

Not yet wrapped in the v0.1 plugin (planned for v0.2). Curl is the way for now.

## Canonical docs

- v2.0: https://docs.trestleiq.com/api-reference/real-contact-api
- v1.1: https://docs.trestleiq.com/api-reference/real-contact-api-11
