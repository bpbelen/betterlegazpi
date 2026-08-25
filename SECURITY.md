# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.1.x   | Yes       |
| < 1.1   | No        |

## Reporting a Vulnerability

We take security seriously at BetterLegazpi.org. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, open a private [security advisory](https://github.com/bpbelen/betterlegazpi/security/advisories/new) on GitHub, or contact the maintainer directly.

Include in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Action             | Timeframe             |
| ------------------ | ---------------------- |
| Acknowledgment     | Within 48 hours       |
| Initial Assessment | Within 7 days         |
| Resolution Target  | Within 30 days        |
| Public Disclosure  | After fix is deployed |

## Security Measures

### Current Implementations

**Server Security:**

- HTTPS enforced via .htaccess
- HTTP Strict Transport Security (HSTS)
- Content Security Policy (CSP) headers
- X-Frame-Options to prevent clickjacking
- X-Content-Type-Options to prevent MIME sniffing
- Referrer-Policy for privacy

**Application Security:**

- No user authentication or data collection
- No database or server-side processing
- Static site with client-side rendering only
- External API calls limited to weather and exchange rates
- No cookies or local storage for sensitive data

**Data Security:**

- All data sourced from public government portals
- No personal identifiable information (PII) stored
- No user input forms that store data

### Third-Party Services

| Service          | Purpose          | Data Shared                |
| ---------------- | ---------------- | --------------------------- |
| Google Analytics | Usage statistics | Anonymous page views        |
| Open-Meteo API   | Weather data     | Location (Legazpi City)     |
| ExchangeRate API | Currency rates   | None                        |
| OpenStreetMap    | Map tiles        | None                        |

## Best Practices for Contributors

When contributing code:

1. **Never commit secrets** - API keys, passwords, or credentials
2. **Validate inputs** - Sanitize any user-facing inputs
3. **Use HTTPS** - All external resources must use HTTPS
4. **Review dependencies** - Check for known vulnerabilities
5. **Follow CSP** - Ensure new scripts comply with Content Security Policy

## Scope

This security policy covers:

- The BetterLegazpi.org website
- The GitHub repository
- Associated build tools and scripts

Out of scope:

- Third-party services (Google Analytics, APIs)
- User's local environment

## Contact

For security concerns, open a [security advisory](https://github.com/bpbelen/betterlegazpi/security/advisories/new).

For general inquiries, open a [GitHub issue](https://github.com/bpbelen/betterlegazpi/issues).

---

Thank you for helping keep BetterLegazpi.org secure for the community.
