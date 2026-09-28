# Meridian Pay CI/CD Pipeline — Security Controls Documentation

**Version:** 1.0.0  
**Last updated:** 2026-09-27  
**Owner:** DevOps / Platform Engineering

---

## Overview

This document describes the four supply chain security controls implemented in the Meridian Pay CI/CD pipeline to satisfy SOC 2 Trust Service Criteria related to change management and logical access.

The pipeline is defined in `.github/workflows/pipeline.yml` and runs on GitHub Actions for every push to `main` and every pull request targeting `main`.

---

## Control 1 — Automated Testing

**Job:** `test`  
**Tool:** Jest + Supertest  
**Artifact:** `coverage-report` (uploaded to GitHub Actions)

Every code change must pass the full Jest test suite before proceeding. The suite covers:

- HTTP contract tests for all API endpoints
- Input validation logic
- Error handling paths

Coverage reports are uploaded as a build artifact and retained for 30 days for audit trail purposes.

**Auditor verification:** Navigate to any pipeline run → Artifacts → download `coverage-report`. The `lcov-report/index.html` shows per-file coverage percentages.

---

## Control 2 — Vulnerability Scanning

**Job:** `vulnerability-scan`  
**Tools:** `npm audit`, Trivy (Aqua Security)  
**Artifact:** `trivy-scan-results` (uploaded to GitHub Actions)

Two independent scanners run sequentially:

1. **`npm audit --production`** — checks all production dependencies against the npm advisory database for known CVEs.
2. **Trivy filesystem scan** — scans the source tree for vulnerabilities in application dependencies and configuration files, reporting CRITICAL and HIGH severity findings.

Both steps use `continue-on-error: true` / `exit-code: 0` so the pipeline proceeds to SBOM generation even if findings are present (acceptable for demo; tighten for production).

**Auditor verification:** Navigate to any pipeline run → Artifacts → download `trivy-scan-results`. Review the table for CRITICAL/HIGH CVEs. Cross-reference with npm advisory database at https://github.com/advisories.

---

## Control 3 — SBOM Generation

**Job:** `sbom`  
**Tool:** Syft (via `anchore/sbom-action`)  
**Format:** CycloneDX JSON  
**Artifact:** `sbom.cdx.json` (uploaded to GitHub Actions, retained 90 days)

A Software Bill of Materials (SBOM) is generated for every Docker image pushed to the container registry. The SBOM lists every package and dependency included in the final image, enabling:

- License compliance audits
- Rapid CVE impact assessment ("which images include log4j?")
- Regulatory reporting (NIST SP 800-218, Executive Order 14028)

**Auditor verification:** Download `sbom.cdx.json` from any pipeline run artifacts and open in any CycloneDX-compatible viewer (e.g., https://cyclonedx.org/tool-center/). Review the `components` array for all declared packages and versions.

---

## Control 4 — Artifact Signing

**Job:** `sign`  
**Tool:** Cosign (Sigstore) — keyless OIDC signing  
**Registry:** GitHub Container Registry (ghcr.io)

Every Docker image digest is cryptographically signed using Cosign's keyless mode. The signing identity is bound to the GitHub Actions OIDC token, which encodes:

- Repository name
- Workflow file path
- Git commit SHA
- GitHub Actions run ID

The SBOM is also attached as a signed attestation (predicate type: `cyclonedx`) to the image digest in the registry.

**Auditor verification:**

```bash
# Install cosign
brew install cosign   # macOS
# or: https://docs.sigstore.dev/cosign/installation/

# Verify image signature
cosign verify \
  --certificate-identity-regexp "https://github.com/martineh4/meridian-pay-pipeline" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  ghcr.io/martineh4/meridian-pay-pipeline:latest

# Verify SBOM attestation
cosign verify-attestation \
  --certificate-identity-regexp "https://github.com/martineh4/meridian-pay-pipeline" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  --type cyclonedx \
  ghcr.io/martineh4/meridian-pay-pipeline:latest
```

A successful verification output confirms the image was built by this repository's workflow and has not been tampered with.

---

## Pipeline job dependency graph

```
push to main
     │
     ▼
  [test] ──────────────────────────────────────────────────────────┐
     │                                                              │
     ▼                                                              │
[vulnerability-scan]                                               │
     │                                                              │
     ▼                                                              │
[build-and-push] ──────────────────┐                               │
     │                             │                               │
     ▼                             ▼                               │
  [sbom]                        [sign] ◄────── needs both ─────────┘
```

---

## Local development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start API (port 3000)
node src/index.js

# Build Docker image locally
docker build -t meridian-pay-api .
docker run -p 3000:3000 meridian-pay-api
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port the API listens on |

No secrets are required for local development. The pipeline uses `GITHUB_TOKEN` (automatically provisioned by GitHub Actions) for registry authentication and OIDC signing.
