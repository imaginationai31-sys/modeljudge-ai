const REQUIRED_FIELDS = ["id", "prompt", "response_a", "response_b", "preferred_response", "reason", "category", "language", "verified"];
const SCORE_FIELDS = ["accuracy_a", "accuracy_b", "relevance_a", "relevance_b", "clarity_a", "clarity_b", "safety_a", "safety_b"];
const PREFERENCES = new Set(["A", "B", "Tie"]);

function validateRecord(record, lineNumber, seenIds, seenFingerprints) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (typeof record[field] !== "string" && field !== "verified") {
      errors.push(`line ${lineNumber}: missing ${field}`);
    } else if (field !== "verified" && !record[field].trim()) {
      errors.push(`line ${lineNumber}: missing ${field}`);
    }
  }

  if (typeof record.verified !== "boolean") errors.push(`line ${lineNumber}: invalid verified`);
  if (!PREFERENCES.has(record.preferred_response)) errors.push(`line ${lineNumber}: invalid preferred_response`);
  if ((record.reason || "").trim().length < 10) errors.push(`line ${lineNumber}: reason is too short`);
  if ((record.reason || "").length > 500) errors.push(`line ${lineNumber}: reason is too long`);

  for (const field of SCORE_FIELDS) {
    if (!Number.isInteger(record[field]) || record[field] < 1 || record[field] > 5) {
      errors.push(`line ${lineNumber}: invalid ${field}`);
    }
  }

  if (seenIds.has(record.id)) errors.push(`line ${lineNumber}: duplicate id ${record.id}`);
  seenIds.add(record.id);

  if (record.fingerprint) {
    if (seenFingerprints.has(record.fingerprint)) errors.push(`line ${lineNumber}: duplicate fingerprint`);
    seenFingerprints.add(record.fingerprint);
  }

  return errors;
}

function validateText(text) {
  const lines = text.split("\n").filter(Boolean);
  const errors = [];
  const ids = new Set();
  const fingerprints = new Set();

  lines.forEach((line, index) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      errors.push(`line ${index + 1}: invalid JSON`);
      return;
    }
    errors.push(...validateRecord(record, index + 1, ids, fingerprints));
  });

  return { valid: errors.length === 0, records: lines.length, errors };
}

module.exports = { REQUIRED_FIELDS, SCORE_FIELDS, validateRecord, validateText };
