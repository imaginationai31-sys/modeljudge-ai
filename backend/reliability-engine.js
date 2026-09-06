function safeMean(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function cohenKappa(a, b) {
  if (a.length !== b.length || !a.length) return null;
  const n = a.length;
  const observed = a.filter((value, i) => value === b[i]).length / n;
  const categories = [...new Set([...a, ...b])];
  let expected = 0;
  for (const category of categories) {
    const pa = a.filter(value => value === category).length / n;
    const pb = b.filter(value => value === category).length / n;
    expected += pa * pb;
  }
  return expected === 1 ? 1 : Number(((observed - expected) / (1 - expected)).toFixed(5));
}

function fleissKappa(items) {
  if (!items.length) return null;
  const categories = [...new Set(items.flat())];
  const n = items.length;
  const ratingsPerItem = items[0].length;
  if (!ratingsPerItem || items.some(item => item.length !== ratingsPerItem)) return null;
  const proportions = Object.fromEntries(categories.map(category => [category, 0]));
  let pBar = 0;
  for (const item of items) {
    const counts = Object.fromEntries(categories.map(category => [category, 0]));
    for (const value of item) counts[value]++;
    const sum = Object.values(counts).reduce((total, count) => total + count * count, 0);
    pBar += (sum - ratingsPerItem) / (ratingsPerItem * (ratingsPerItem - 1));
    for (const category of categories) proportions[category] += counts[category];
  }
  pBar /= n;
  const pExpected = Object.values(proportions).reduce((sum, count) => {
    const p = count / (n * ratingsPerItem);
    return sum + p * p;
  }, 0);
  return pExpected === 1 ? 1 : Number(((pBar - pExpected) / (1 - pExpected)).toFixed(5));
}

function krippendorffAlphaNominal(items) {
  const units = items.filter(item => item.length >= 2);
  if (!units.length) return null;
  let totalPairs = 0;
  let disagreement = 0;
  const categoryTotals = new Map();
  for (const unit of units) {
    const counts = new Map();
    for (const value of unit) {
      counts.set(value, (counts.get(value) || 0) + 1);
      categoryTotals.set(value, (categoryTotals.get(value) || 0) + 1);
    }
    const m = unit.length;
    const pairCount = m * (m - 1);
    totalPairs += pairCount;
    disagreement += pairCount - [...counts.values()].reduce((sum, count) => sum + count * (count - 1), 0);
  }
  const doObserved = disagreement / totalPairs;
  const totalRatings = [...categoryTotals.values()].reduce((sum, count) => sum + count, 0);
  const deNumerator = totalRatings * (totalRatings - 1);
  if (deNumerator === 0) return null;
  const de = 1 - [...categoryTotals.values()].reduce((sum, count) => sum + count * (count - 1), 0) / deNumerator;
  return de === 0 ? 1 : Number((1 - doObserved / de).toFixed(5));
}

function bootstrapMeanCI(values, iterations = 1000, seed = 1337) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return null;
  let state = seed >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const means = [];
  for (let i = 0; i < iterations; i++) {
    let total = 0;
    for (let j = 0; j < clean.length; j++) total += clean[Math.floor(random() * clean.length)];
    means.push(total / clean.length);
  }
  means.sort((a, b) => a - b);
  const percentile = p => means[Math.min(means.length - 1, Math.floor(p * means.length))];
  return { mean: Number(safeMean(clean).toFixed(5)), lower_95: Number(percentile(0.025).toFixed(5)), upper_95: Number(percentile(0.975).toFixed(5)), iterations };
}

function buildReliabilityReport(records, reviews) {
  const byEvaluation = new Map();
  for (const review of reviews) {
    if (!byEvaluation.has(review.evaluation_id)) byEvaluation.set(review.evaluation_id, []);
    byEvaluation.get(review.evaluation_id).push(review);
  }
  const preferencePairs = [];
  const preferenceItems = [];
  const reviewerDimensionScores = [];
  for (const group of byEvaluation.values()) {
    if (group.length >= 2) {
      preferenceItems.push(group.map(r => r.preferred_response));
      preferencePairs.push([group[0].preferred_response, group[1].preferred_response]);
    }
    for (const dimension of ["accuracy_a","accuracy_b","relevance_a","relevance_b","clarity_a","clarity_b","safety_a","safety_b"]) {
      const values = group.map(r => Number(r[dimension])).filter(Number.isFinite);
      if (values.length >= 2) reviewerDimensionScores.push(safeMean(values));
    }
  }
  const kappas = preferencePairs.map(pair => cohenKappa([pair[0]], [pair[1]])).filter(Number.isFinite);
  const allDimensionValues = reviewerDimensionScores.filter(Number.isFinite);
  const agreementCoverage = records.length ? Number((preferenceItems.length / records.length).toFixed(5)) : 0;
  return {
    generated_at: new Date().toISOString(),
    methodology: "Nominal agreement metrics over independent reviewer labels; bootstrap confidence interval for mean reviewed dimension score.",
    sample: {
      evaluation_count: records.length,
      reviewed_evaluation_count: byEvaluation.size,
      multi_reviewed_evaluation_count: preferenceItems.length,
      review_count: reviews.length,
      multi_review_coverage: agreementCoverage
    },
    preference_reliability: {
      fleiss_kappa: fleissKappa(preferenceItems),
      krippendorff_alpha_nominal: krippendorffAlphaNominal(preferenceItems),
      pairwise_cohen_kappa_first_two: safeMean(kappas),
      pairwise_comparison_count: kappas.length
    },
    score_reliability: bootstrapMeanCI(allDimensionValues),
    interpretation: {
      note: "Kappa and alpha are descriptive reliability statistics, not evidence that one model is objectively better. Interpret alongside sample size, task mix, reviewer calibration, and disagreement patterns.",
      thresholds: { strong: 0.8, acceptable: 0.67, caution: 0.4 }
    }
  };
}

module.exports = { safeMean, cohenKappa, fleissKappa, krippendorffAlphaNominal, bootstrapMeanCI, buildReliabilityReport };
