# Known Limitations — v1.0.0

ModelJudge AI is a buyer-ready software foundation, not a claim of enterprise-scale operation or independent certification.

## Current limitations

- The repository does not include a production-scale commercial dataset.
- Demo records are illustrative and require provenance review before redistribution.
- Production infrastructure, backups, monitoring, domains, and provider accounts must be configured by the operator.
- The application does not guarantee that human judgments are universally correct or unbiased.
- Agreement metrics depend on reviewer selection, task design, label distribution, and sufficient sample size.
- Reviewer authentication is application-level authentication; enterprise SSO, SCIM, and organization/workspace management are future extensions.
- Provider-specific model integrations and automated evaluation pipelines are extension points rather than guaranteed built-in integrations.
- PostgreSQL production security depends on correct TLS, credentials, network restrictions, backups, and operational configuration.
- Commercial dataset rights are separate from the MIT software license and require their own provenance/licensing review.

## Interpretation

These limitations are intentionally disclosed so buyers can distinguish the reusable software asset from services, infrastructure, datasets, and future product development.
