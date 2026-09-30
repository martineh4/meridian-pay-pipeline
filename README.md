# Meridian Pay Pipeline

A Node.js/Express payment API with a GitHub Actions CI/CD pipeline demonstrating the four supply chain security controls required for SOC 2 audit.

## The four security controls

| # | Control | Job | Tool | Artifact |
|---|---------|-----|------|----------|
| 1 | **Automated testing** | `test` | Jest + Supertest | `coverage-report` (30 days) |
| 2 | **Vulnerability scanning** | `vulnerability-scan` | npm audit + Trivy | `trivy-scan-results` (30 days) |
| 3 | **SBOM generation** | `sbom` | Syft → CycloneDX JSON | `sbom.cdx.json` (90 days) |
| 4 | **Artifact signing** | `sign` | Cosign keyless OIDC | Signature + attestation in GHCR |

The pipeline runs on every push to `main` and every pull request. Controls run in order: tests must pass before scanning, scanning must pass before the image is built, and the image must exist before it can be signed.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/payments` | Create a payment (`from`, `to`, `amount`) |
| `GET` | `/payments/:id` | Get payment by ID |

## Local development

```bash
npm install
npm test          # run Jest unit tests with coverage
node src/index.js # start API on port 3000
docker build -t meridian-pay-api .
docker run -p 3000:3000 meridian-pay-api
```

## Auditor guidance

See [`docs/pipeline.md`](docs/pipeline.md) for a full description of each control, what evidence each job produces, and the exact `cosign verify` commands to confirm artifact signatures independently.
