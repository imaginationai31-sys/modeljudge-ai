const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md',
  'docs/ACQUISITION_OVERVIEW.md', 'docs/TECHNICAL_ARCHITECTURE.md',
  'docs/BUYER_ONBOARDING.md', 'docs/API_QUICKSTART.md', 'docs/BUYER_API.md',
  'docs/DEMO_GUIDE.md', 'docs/BUYER_RELEASES.md', 'docs/CERTIFICATION.md',
  'docs/RELIABILITY.md', 'docs/PRODUCTION_DEPLOYMENT.md',
  'docs/PRODUCTION_READINESS.md', 'docs/OBSERVABILITY.md',
  'docs/SECURITY_HARDENING.md', 'docs/ASSET_TRANSFER.md',
  'docs/DATA_PROVENANCE.md', 'docs/KNOWN_LIMITATIONS.md',
  'docs/THIRD_PARTY_LICENSES.md', 'docs/CHANGELOG.md',
  'backend/package.json', 'backend/.env.example', 'docker-compose.yml'
];

let failed = false;
console.log('MODELJUDGE AI — BUYER READINESS CHECK');
console.log('======================================');

for (const relative of required) {
  const exists = fs.existsSync(path.join(root, relative));
  console.log(`${exists ? '✓' : '✗'} ${relative}`);
  if (!exists) failed = true;
}

const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const backendPackage = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
const versionsAligned = rootPackage.version === '1.0.0' && backendPackage.version === '1.0.0';
console.log(`${versionsAligned ? '✓' : '✗'} package versions aligned at 1.0.0`);
if (!versionsAligned) failed = true;

const accidentalRootArtifacts = [
  '690f242f-ac74-4b31-9209-b71d9817bcca',
  'open'
];
for (const relative of accidentalRootArtifacts) {
  const exists = fs.existsSync(path.join(root, relative));
  console.log(`${exists ? '✗' : '✓'} accidental root artifact absent: ${relative}`);
  if (exists) failed = true;
}

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) failed = true;
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
run(npm, ['--prefix', 'backend', 'run', 'test:unit']);
run(npm, ['--prefix', 'backend', 'run', 'lint']);
run(npm, ['--prefix', 'backend', 'run', 'validate']);

console.log('\n======================================');
console.log(failed ? 'STATUS: NOT READY — fix the failed checks above.' : 'STATUS: BUYER READY — repository checks passed.');
process.exitCode = failed ? 1 : 0;
