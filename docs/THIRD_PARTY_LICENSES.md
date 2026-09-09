# Third-Party Licenses

ModelJudge AI uses open-source dependencies declared in `package.json` and `backend/package.json`.

## Direct application dependencies

- Express 5.x — see the package metadata and installed package license before redistribution.
- node-postgres (`pg`) 8.x — see the package metadata and installed package license before redistribution.
- ESLint 10.x — development dependency; see its package metadata and license.

## Buyer due diligence

Before a commercial transfer, run the dependency audit from a clean checkout and retain the resulting dependency/license inventory with the acquisition package.

Recommended commands:

```bash
cd backend
npm ci
npm audit
npm ls --depth=0
```

For a complete legal inventory, inspect the license metadata of all installed transitive dependencies as well as any frontend assets or externally sourced content.

This document is an operational inventory guide, not legal advice. The buyer should confirm license compatibility for the intended distribution model.
