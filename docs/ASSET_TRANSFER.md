# ModelJudge AI — Asset Transfer Runbook

This document is for a buyer taking ownership of the ModelJudge AI software asset.

## 1. What transfers

The transferable software asset includes the Git repository, application source, frontend, backend, database schema/migrations, tests, scripts, documentation, release tooling, and configuration templates.

The current repository is distributed under the MIT software license in `LICENSE`, unless a separate written agreement supersedes it.

## 2. What does not automatically transfer

A buyer must separately verify ownership, redistribution rights, and licenses for any dataset records, model outputs, external content, trademarks, hosted infrastructure, domains, accounts, and third-party services.

The sample/demo records in this repository should not be represented as a commercial proprietary human dataset unless their provenance and rights have been independently established.

## 3. Recommended handover sequence

1. Buyer receives repository access or a repository archive.
2. Buyer clones the repository from a clean environment.
3. Buyer installs Node.js 20+ dependencies with `npm ci` in `backend/`.
4. Buyer reviews `.env.example` and creates private deployment secrets.
5. Buyer provisions PostgreSQL and configures `DATABASE_URL`.
6. Buyer runs `npm run migrate` from `backend/`.
7. Buyer starts the application and checks `/api/health`.
8. Buyer creates or rotates reviewer/admin credentials using private bootstrap procedures.
9. Buyer configures CORS, rate limits, backups, TLS, monitoring, and logging.
10. Buyer verifies evaluation, reviewer verification, calibration, quality, release, and buyer API workflows.
11. Buyer rotates all credentials that were used during demonstration or handover.

## 4. Production checklist

- [ ] PostgreSQL provisioned with backups
- [ ] TLS enabled for database and application traffic
- [ ] Strong environment secrets configured
- [ ] `ADMIN_BOOTSTRAP_TOKEN` rotated and protected
- [ ] Reviewer accounts created with least privilege
- [ ] Buyer API keys created privately
- [ ] CORS restricted to the buyer's domains
- [ ] Rate limits reviewed for expected traffic
- [ ] Monitoring and alerting configured
- [ ] Restore procedure tested
- [ ] Dataset provenance and commercial rights reviewed
- [ ] Demo credentials disabled or rotated

## 5. Ownership boundary

The software is an evaluation platform. A buyer remains responsible for operating the service securely, selecting appropriate evaluation policies, obtaining rights for commercial data, and validating the quality and legality of released datasets.

## 6. Post-transfer recommendation

After handover, create a new deployment secret set and rotate all credentials. Do not reuse credentials from screenshots, demos, development machines, or public documentation.
