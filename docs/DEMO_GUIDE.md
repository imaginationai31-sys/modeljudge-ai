# ModelJudge AI — Demo Guide

## Purpose

Use this flow to demonstrate the platform to a prospective AI-training or evaluation-data buyer without exposing production secrets or private gold answers.

## Demo sequence

### One — Product overview

Show the landing page and explain that ModelJudge AI combines pairwise model evaluation, multi-reviewer quality control, calibration, reliability evidence, versioned releases, and buyer API access.

### Two — Dataset Explorer

Open the Dataset Explorer and show evaluation records, preference labels, quality dimensions, categories, languages, and verification metadata.

### Three — Quality Center

Show review coverage, average quality, calibration evidence, reliability metrics, reviewer-control status, and certification gates.

### Four — Release Center

Open the release center and demonstrate versioned release metadata, checksums, available formats, and quality artifacts.

### Five — Buyer Portal

Use a dedicated demo API key to show release discovery, release inspection, usage information, and authenticated dataset access.

### Six — API workflow

Demonstrate that the buyer API uses an API key header and that release downloads are tied to a specific version.

## Safe demo rules

- Use synthetic/demo records unless commercial data is explicitly authorized.
- Use a dedicated demo buyer account and API key.
- Never display production API keys.
- Never display database credentials.
- Never display private gold-task expected answers.
- Do not claim certification gates have passed unless the current release report shows they have passed.
- Do not claim model superiority from preference statistics alone.

## Recommended buyer story

```text
Raw evaluations
      ↓
Validation + duplicate checks
      ↓
Multi-reviewer scoring
      ↓
Calibration + reviewer QC
      ↓
Reliability evidence
      ↓
Quality filtering
      ↓
Certification gates
      ↓
Immutable versioned release
      ↓
Authenticated buyer access
```

## Demo outcome

The prospect should leave with a clear understanding of:

- what the dataset contains
- how quality is measured
- how reviewer consistency is monitored
- how releases are versioned
- how access is authenticated
- how checksums and evidence support downstream inspection
