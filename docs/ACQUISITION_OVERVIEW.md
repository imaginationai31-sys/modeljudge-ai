# ModelJudge AI — Acquisition & Technical Overview

## Software Asset

ModelJudge AI is a deployable AI evaluation platform for collecting, reviewing, verifying, scoring, and releasing structured human preference evaluations.

The project is positioned as a **software asset**, not as a standalone dataset sale. An acquirer can take the existing codebase, deployment architecture, evaluation workflows, API layer, release infrastructure, and documentation and continue development under their own operating model.

## What the Acquirer Receives

- Complete ModelJudge AI application source code
- Responsive web frontend
- Node.js/Express backend API
- PostgreSQL persistence layer
- Database migration system
- Human evaluation workflow
- Reviewer and verification workflow
- Gold calibration capability
- Reviewer quality and reliability reporting
- Buyer API with scoped authentication
- Versioned dataset release system
- JSONL and CSV export pipeline
- SHA-256 release integrity verification
- Buyer Developer Console
- Public API documentation
- Deployment and security documentation
- Existing Render deployment configuration

## Current Live Demonstration

**Live application:** https://modeljudge-api.onrender.com

**Current software version:** v1.0.0

The live demonstration has successfully exercised the evaluation → pending verification → reviewer approval → verified workflow. The authoritative current counts should be read from the live API rather than copied into static marketing pages.

Historical v0.9.1 references are retained where they describe the previous demonstration release.

## Core Platform Capabilities

### Evaluation Workspace

Collect structured judgments across defined quality dimensions and evaluation categories, with human rationale preserved alongside the evaluation result.

### Human Verification

Reviewer actions can approve, reject, or request revision. Verification state is explicit and is not inferred from free-form reviewer reason text.

### Calibration

Gold calibration workflows provide a foundation for reviewer consistency checks before or during evaluation operations.

### Reviewer Quality

The platform exposes reviewer-level evidence including review counts, average scores, and tie-rate information for release-level quality assessment.

### Buyer API

Authenticated buyers can access release catalogs, manifests, quality evidence, reviewer-quality evidence, and dataset exports. Buyer access uses scoped API keys and records usage.

### Release Management

Releases are versioned and immutable. Release manifests contain record counts, file sizes, SHA-256 checksums, provenance information, and format metadata.

## Technical Architecture

```text
                    ┌──────────────────────┐
                    │      Web Browser     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Frontend Web App    │
                    │ HTML / CSS / JS      │
                    └──────────┬───────────┘
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │ Node.js / Express    │
                    │ Application Backend  │
                    └───────┬───────┬──────┘
                            │       │
              ┌─────────────┘       └──────────────┐
              ▼                                    ▼
      ┌─────────────────┐                  ┌─────────────────┐
      │   PostgreSQL    │                  │   Buyer API     │
      │ evaluations     │                  │ authentication  │
      │ reviews         │                  │ releases        │
      │ calibration     │                  │ usage logging   │
      │ migrations      │                  └────────┬────────┘
      └─────────────────┘                           │
                                                    ▼
                                          ┌─────────────────┐
                                          │ Release Pipeline│
                                          │ JSONL / CSV     │
                                          │ SHA-256         │
                                          └─────────────────┘
```

## Technology Stack

- **Runtime:** Node.js 20+
- **Backend:** Express
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript
- **API:** REST-style HTTP endpoints
- **Deployment:** Render-compatible production configuration
- **Repository:** GitHub
- **Data formats:** JSONL and CSV
- **Integrity:** SHA-256 checksums

## Buyer / Operator Workflow

```text
Deploy
  ↓
Configure PostgreSQL + environment variables
  ↓
Run database migrations
  ↓
Create evaluation workflows
  ↓
Collect human judgments
  ↓
Review / verify evaluations
  ↓
Monitor reviewer quality
  ↓
Generate versioned release
  ↓
Expose release through authenticated Buyer API
```

## Existing Buyer Infrastructure

The software already includes a buyer-oriented access layer with:

- API-key authentication
- `dataset:read` scope
- Release catalog endpoint
- Immutable release manifest endpoint
- Quality evidence endpoint
- Reviewer-quality endpoint
- JSONL dataset endpoint
- CSV dataset endpoint
- Usage endpoint
- Download tracking
- Rate-limit handling
- SHA-256 verification workflow

See [API Quickstart](API_QUICKSTART.md) and [Buyer API](BUYER_API.md).

## Deployment

The application is designed to run as a web service with PostgreSQL persistence. Startup performs database migrations and application diagnostics before serving the application.

See [Production Deployment](PRODUCTION_DEPLOYMENT.md) and [Asset Transfer](ASSET_TRANSFER.md) for deployment and handover requirements.

## Security Foundation

The repository includes documented security practices around buyer API authentication, scoped access, API-key handling, rate limits, usage logging, release integrity, reviewer authentication, and explicit verification state.

Real production secrets must be supplied by the operator through the deployment environment. API keys should never be committed to the repository or exposed in public client-side code.

See [Security Hardening](SECURITY_HARDENING.md).

## Documentation Included

- [Buyer Onboarding](BUYER_ONBOARDING.md)
- [API Quickstart](API_QUICKSTART.md)
- [Buyer API](BUYER_API.md)
- [Buyer Releases](BUYER_RELEASES.md)
- [Certification](CERTIFICATION.md)
- [Reliability](RELIABILITY.md)
- [Demo Guide](DEMO_GUIDE.md)
- [Production Deployment](PRODUCTION_DEPLOYMENT.md)
- [Security Hardening](SECURITY_HARDENING.md)
- [Asset Transfer](ASSET_TRANSFER.md)
- [Data Provenance](DATA_PROVENANCE.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Third-Party Licenses](THIRD_PARTY_LICENSES.md)

## Expansion Opportunities

An acquirer can extend the existing foundation with features such as:

- Larger evaluation datasets
- Additional reviewer roles and teams
- Organization and workspace management
- Billing and subscription infrastructure
- More AI model/provider integrations
- Advanced analytics and dashboards
- Automated evaluation pipelines
- Enterprise authentication
- Additional export formats
- Marketplace or licensing workflows
- Automated benchmark generation

## Current Maturity

**Status: v1.0.0 — buyer-ready software foundation.**

The live deployment demonstrates the core evaluation, verification, release, and buyer API workflows. The project should not be interpreted as independently audited enterprise software or as evidence of production-scale dataset volume.

Before commercial operation at larger scale, an operator should perform its own security review, infrastructure review, testing, data-provenance review, and licensing/commercial-use review.

## Acquisition Positioning

ModelJudge AI is best understood as an existing **AI evaluation software foundation** that reduces the engineering work required to build a human-preference evaluation and release platform from scratch.

The primary asset is the software and its reusable infrastructure: application code, workflows, API architecture, persistence model, release pipeline, documentation, and deployment foundation.

Ownership transfer, commercial rights, branding, third-party dependencies, and any data licensing obligations should be explicitly documented as part of any acquisition agreement.
