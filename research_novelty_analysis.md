# Research Novelty Analysis — GovSchemes AI

## Section 1: Current System Architecture & Limitations

### Architecture Summary

| Layer | Implementation | File(s) |
|-------|---------------|---------|
| **Data** | 243 schemes hardcoded in `SEED_SCHEMES` array | `lib/seed-schemes.ts` (176KB) |
| **User Input** | 4-step onboarding form → localStorage | `app/onboarding/page.tsx`, `components/forms/*` |
| **Matching** | Rule-based binary eligibility checker | `lib/matcher.ts` — `evaluateEligibility()` |
| **Scoring** | `matchedCriteria / totalCriteria × 100` | `lib/matcher.ts:36-39` |
| **AI Layer** | Groq Llama-3.3-70B for ranking + explanation | `lib/groq.ts` — `rankAndExplainSchemes()` |
| **Fallback** | Template string concatenation | `lib/groq.ts:186-216` |
| **API** | 4 Next.js routes (recommend, explain, schemes, profile) | `app/api/*` |
| **Auth** | localStorage-only, no real persistence | `lib/auth-context.tsx` |

### Data Flow
```
Onboarding Form → localStorage → POST /api/recommend
  → matchSchemes(profile, SEED_SCHEMES)     [Stage 1: rule-based]
  → rankAndExplainSchemes(profile, top15)    [Stage 2: LLM black-box]
  → JSON response → Results Page → Scheme Detail Page
```

### Critical Limitations Reducing Research Novelty

1. **Scoring is trivially binary.** Each criterion is pass/fail. Score = matched/total. No weighting, no partial matching, no uncertainty modeling. A 25-year-old missing the age cap by 1 year scores identically to missing it by 30 years.

2. **No learned model.** The matcher is pure `if/else`. There is zero ML, zero embedding, zero learned representation anywhere in the pipeline.

3. **LLM is a black box oracle.** Groq receives schemes + profile and returns a rank + text. There is no structured reasoning chain, no auditable scoring rubric, no faithfulness verification.

4. **No user feedback loop.** No click tracking, no implicit/explicit feedback, no way to learn which recommendations were useful.

5. **Static dataset, no temporal modeling.** Schemes never update. No awareness of deadlines, budget exhaustion, seasonal windows, or policy changes.

6. **No fairness analysis.** No measurement of whether the system systematically under-recommends schemes for marginalized groups.

7. **No multi-scheme interaction.** Schemes are scored independently. No awareness of complementary or conflicting schemes.

8. **No semantic understanding of eligibility text.** Eligibility is manually structured. Real government scheme pages have unstructured eligibility text.

---

## Section 2: Novel Feature Proposals

### 1. Hybrid Neural-Symbolic Eligibility Matcher with Soft Constraints

**A. What:** Replace the binary pass/fail matcher with a hybrid system: hard constraints (disqualifying) + soft constraints (scored on a continuous scale using learned distance functions). Example: if max income is ₹2.5L and user earns ₹2.7L, the system assigns a decay score (e.g., 0.85) rather than 0.

**B. Novelty:** Existing government recommenders (myScheme.gov.in, Umang) use strict binary filters. No published system models eligibility as a continuous-valued function with learned decay curves. This bridges symbolic AI (rule engines) with neural scoring.

**C. Technical Approach:**
- Define constraint types: `hard` (age range, gender) vs. `soft` (income threshold, education level)
- For soft constraints, learn a decay function `f(distance) → [0,1]` using a small annotated dataset of "near-eligible" cases
- Final score = product of hard constraint passes × weighted sum of soft constraint scores
- Implement in `lib/matcher.ts` as a `SoftMatcher` class

**D. Contribution:** Novel constraint satisfaction formulation for welfare eligibility — combines symbolic rule engines with differentiable scoring.

**E. Evaluation:** Precision@K, NDCG against expert-labeled rankings; ablation: binary vs. soft vs. hybrid. User study (N=30): perceived relevance of near-miss schemes.

**F. Difficulty:** Medium | **G. Publishability:** High

**H. Codebase fit:** Direct replacement of `evaluateEligibility()` in `matcher.ts`. Same API surface.

---

### 2. Counterfactual Explainability Engine ("What Would Make You Eligible")

**A. What:** For each non-matching scheme, generate minimal counterfactual explanations: "If your income were ₹50,000 lower, you would qualify for Scheme X." Rank counterfactuals by actionability (e.g., "get a ration card" is actionable; "change your age" is not).

**B. Novelty:** Counterfactual explanations are studied in ML fairness (Wachter et al., 2017) but not applied to government scheme recommendation. The actionability ranking is a novel contribution — it requires domain knowledge about which profile attributes are mutable.

**C. Technical Approach:**
- Classify each `UserProfile` field as `immutable` (age, gender, caste), `costly` (education, employment), or `easy` (ration card, documentation)
- For each missed criterion, compute the minimum change needed to pass
- Rank counterfactuals by `actionability_score = 1 / cost_of_change`
- Generate natural language using templates or LLM

**D. Contribution:** First application of actionable counterfactual explanations to welfare scheme matching. Introduces a mutable-attribute taxonomy for Indian citizen profiles.

**E. Evaluation:** Counterfactual validity rate, actionability user study (Likert scale), coverage (% of missed schemes with ≥1 actionable CF).

**F. Difficulty:** Medium | **G. Publishability:** High

**H. Codebase fit:** Extends `missedCriteria` in `MatchResult`. New `lib/counterfactual.ts` module. New section on scheme detail page.

---

### 3. Scheme Embedding Space with Semantic Similarity Retrieval

**A. What:** Embed all 243 schemes into a dense vector space using sentence transformers on `(name + description + benefitDescription + eligibility text)`. At query time, also embed the user profile as a natural-language paragraph, and retrieve schemes by cosine similarity — complementing the rule-based matcher.

**B. Novelty:** Current system has zero semantic understanding. Keyword search (`includes()`) cannot handle paraphrasing. No published govt-scheme recommender uses dense retrieval for eligibility matching.

**C. Technical Approach:**
- Pre-compute scheme embeddings using `all-MiniLM-L6-v2` or `multilingual-e5-large` (via ONNX.js or a Python sidecar)
- Convert user profile to a natural-language paragraph: "I am a 28-year-old female farmer from Odisha with BPL income..."
- Compute cosine similarity, retrieve top-K
- Fuse with rule-based scores: `final = α × rule_score + (1-α) × semantic_score`
- Learn α via a small validation set

**D. Contribution:** Novel bi-encoder retrieval approach for government scheme matching. Demonstrates that semantic similarity captures eligibility signals missed by rigid rules.

**E. Evaluation:** Recall@10, MRR, hit-rate vs. rule-only baseline. Ablation on fusion weight α.

**F. Difficulty:** High | **G. Publishability:** High

**H. Codebase fit:** New `lib/embeddings.ts`. Embeddings pre-computed at build time. Fusion logic in `recommend/route.ts`.

---

### 4. Fairness-Aware Re-Ranking with Demographic Parity Audit

**A. What:** Build an automated fairness audit pipeline that measures whether the system systematically under-recommends schemes to certain demographic groups (e.g., SC/ST users, women, minorities). Then implement a fairness-aware re-ranker that optimizes for both relevance and demographic parity.

**B. Novelty:** Fairness in RecSys is well-studied for e-commerce but essentially unexplored for government welfare. The stakes are higher — unfair recommendations mean citizens miss legally entitled benefits.

**C. Technical Approach:**
- Generate synthetic user profiles spanning the demographic grid (gender × caste × income × state)
- Measure: (a) average #schemes per group, (b) average benefit amount per group, (c) coverage disparity
- Implement constrained re-ranking: maximize relevance subject to `|coverage(group_a) - coverage(group_b)| < ε`
- Use the MMR (Maximal Marginal Relevance) framework adapted for fairness

**D. Contribution:** First fairness audit framework for government scheme recommenders. Introduces welfare-specific fairness metrics (benefit parity, coverage equity).

**E. Evaluation:** Demographic parity ratio, equalized opportunity metrics, Gini coefficient of benefit distribution. Before/after re-ranking comparison.

**F. Difficulty:** Medium | **G. Publishability:** High

**H. Codebase fit:** New `lib/fairness.ts`, new `scripts/fairness-audit.ts`. Re-ranker plugs into `recommend/route.ts` after Stage 2.

---

### 5. Scheme Complementarity Graph and Bundle Recommendation

**A. What:** Model inter-scheme relationships (complementary, prerequisite, mutually exclusive) as a directed graph. Recommend scheme *bundles* that maximize total benefit while respecting constraints (e.g., "apply for PMAY Housing first, then Ujjwala LPG, then Jan Dhan account").

**B. Novelty:** All existing systems treat schemes independently. No published system models scheme interactions. Bundle recommendation with constraint satisfaction is novel in this domain.

**C. Technical Approach:**
- Build a scheme interaction graph: edges = {complements, requires, conflicts_with}
- Edge extraction: (a) LLM-based extraction from scheme descriptions, (b) co-eligibility analysis from the rule engine
- Bundle optimization: given eligible schemes, find subsets maximizing `Σ benefit_amount` subject to no conflicting pairs, using a greedy set-cover or ILP
- Sequence recommendation: topological sort of prerequisite edges

**D. Contribution:** Novel graph-based welfare scheme bundle optimization. Introduces scheme interaction taxonomy.

**E. Evaluation:** Bundle benefit vs. top-K independent, constraint violation rate, user preference study (bundle vs. list).

**F. Difficulty:** High | **G. Publishability:** Medium-High

**H. Codebase fit:** New `lib/scheme-graph.ts`, new `lib/bundle-optimizer.ts`. New UI component for bundle visualization.

---

### 6. LLM-as-Judge Faithfulness Verification for AI Explanations

**A. What:** The current system sends schemes to Groq and blindly trusts the output. Build a verification pipeline: a second LLM call (or rule-based checker) validates that the explanation is *faithful* to the actual eligibility match — no hallucinated benefits, no fabricated criteria.

**B. Novelty:** LLM-as-Judge (Zheng et al., 2023) is a hot topic but has not been applied to government scheme explanations where factual accuracy is critical (wrong information → missed benefits or fraud).

**C. Technical Approach:**
- After Groq generates explanation, extract factual claims using a structured prompt
- Cross-reference each claim against: (a) scheme data in `SEED_SCHEMES`, (b) match results from `evaluateEligibility()`
- Flag hallucinations (e.g., "you get ₹10,000" when scheme says ₹5,000)
- Compute faithfulness score = verified_claims / total_claims
- Re-generate or annotate unfaithful explanations

**D. Contribution:** First faithfulness verification pipeline for welfare scheme explanations. Quantifies hallucination rate in this critical domain.

**E. Evaluation:** Faithfulness rate, hallucination taxonomy, agreement with human annotators (Cohen's κ).

**F. Difficulty:** Medium | **G. Publishability:** High

**H. Codebase fit:** New `lib/verification.ts`. Plugs into `groq.ts` after `rankAndExplainSchemes()`. Adds confidence badge to UI.

---

### 7. Active Profiling via Adaptive Questionnaire (Information Gain Maximization)

**A. What:** Replace the fixed 4-step form with an adaptive questionnaire that asks the minimum number of questions needed to maximally discriminate between eligible schemes. Use information gain (entropy reduction) to select the next question.

**B. Novelty:** Adaptive testing is well-studied in education (CAT) but not applied to welfare profiling. The question selection criterion is novel: maximize the expected reduction in scheme set uncertainty.

**C. Technical Approach:**
- Model the scheme catalog as a decision space. Each user attribute partitions this space.
- At each step, compute information gain: `IG(attribute) = H(schemes) - H(schemes | attribute_value)`
- Select the attribute with highest IG. Stop when the candidate set is stable or confidence > threshold.
- Implement as a server-side state machine in a new API route

**D. Contribution:** Novel adaptive profiling algorithm for welfare recommendation. Reduces user effort (fewer questions) while maintaining recommendation quality.

**E. Evaluation:** # questions to converge vs. fixed form, Recall@K parity, user completion rate, time-to-completion.

**F. Difficulty:** Medium | **G. Publishability:** Medium-High

**H. Codebase fit:** New `lib/adaptive-profiler.ts`, new `app/api/adaptive/route.ts`. Alternative onboarding flow.

---

### 8. Temporal Eligibility Modeling and Proactive Notifications

**A. What:** Add a temporal dimension to eligibility: track scheme deadlines, enrollment windows, budget cycles, and user life events (upcoming birthday pushing them into senior-citizen range, child reaching school age). Proactively alert users when their eligibility status changes.

**B. Novelty:** All existing systems are snapshot-based (check eligibility now). No system models how eligibility evolves over time or proactively predicts future eligibility transitions.

**C. Technical Approach:**
- Extend `Scheme` type with `{ applicationDeadline, enrollmentWindow, budgetCycle }`
- Build a temporal eligibility function: `eligible(user, scheme, time_t) → score`
- Predictive module: given user's age trajectory, income changes (if modeled), identify schemes they will become eligible for within N months
- Notification engine: diff current vs. future eligibility sets

**D. Contribution:** First temporal eligibility model for welfare recommendations. Introduces proactive recommendation in the government domain.

**E. Evaluation:** Prediction accuracy (future eligibility), notification precision, user engagement with proactive alerts.

**F. Difficulty:** Medium | **G. Publishability:** Medium

**H. Codebase fit:** Extends `Scheme` and `UserProfile` types. New `lib/temporal.ts`. Requires minor schema additions to seed data.

---

### 9. Cross-Lingual Eligibility Understanding via NLP-Powered Scheme Ingestion

**A. What:** Build an NLP pipeline that automatically extracts structured eligibility criteria from unstructured government scheme web pages (in English and Hindi). This replaces manual CSV curation and scales to thousands of schemes.

**B. Novelty:** The current system relies on a hand-curated CSV of 243 schemes. Real government portals have 2,000+ schemes with eligibility described in free text. No published system automatically extracts structured eligibility from multilingual government text.

**C. Technical Approach:**
- Crawl scheme pages from myScheme.gov.in (scraper already exists in `scripts/scrape-myscheme.ts`)
- Use a fine-tuned NER model or LLM prompt to extract: age range, income limit, gender, caste, employment type, boolean flags
- Map extracted entities to `Scheme.eligibility` schema
- Validate extraction against known ground truth (the existing 243 schemes)
- Support Hindi via multilingual models (mBERT, IndicNER)

**D. Contribution:** Novel information extraction pipeline for government welfare schemes. Introduces a benchmark dataset for structured eligibility extraction.

**E. Evaluation:** Extraction F1 vs. ground truth, schema coverage, cross-lingual transfer accuracy.

**F. Difficulty:** High | **G. Publishability:** High

**H. Codebase fit:** New `scripts/auto-extract.ts` or Python sidecar. Generates `seed-schemes.ts` automatically.

---

### 10. Explanation Preference Learning via Implicit Feedback

**A. What:** Learn which explanation styles users prefer by tracking implicit signals: time spent reading, click-through to application link, bookmark actions. Use this to personalize explanation generation (technical vs. simple, short vs. detailed, benefit-focused vs. process-focused).

**B. Novelty:** Explanation personalization exists in XAI literature but has not been applied to welfare schemes. The implicit feedback signals (bookmark, apply-click, read time) are domain-specific proxies for explanation quality.

**C. Technical Approach:**
- Instrument the frontend to track: `{schemeId, readDurationMs, clickedApply, bookmarked, scrollDepth}`
- Define explanation styles: `{concise, detailed, benefit_focus, process_focus, comparative}`
- A/B test explanation styles per user segment
- Train a contextual bandit (LinUCB) to select the best style given `(user_demographics, scheme_type)`
- Feed selected style as a system prompt modifier to Groq

**D. Contribution:** Novel application of contextual bandits for explanation style selection in welfare recommendation.

**E. Evaluation:** Click-through rate, apply rate, read time, user satisfaction survey, bandit regret analysis.

**F. Difficulty:** High | **G. Publishability:** Medium-High

**H. Codebase fit:** New `lib/feedback-tracker.ts` (client), new `app/api/feedback/route.ts`, new `lib/bandit.ts`.

---

## Section 3: Top 3 Publishable Directions

### Direction A: "Fair and Explainable Welfare Scheme Recommendation" (Features 1 + 2 + 4)

Combine the hybrid matcher (Feature 1), counterfactual explanations (Feature 2), and fairness audit (Feature 4) into a single system contribution. **Paper angle:** "We present FairScheme, a welfare recommendation system that models eligibility as soft constraints, generates actionable counterfactual explanations, and guarantees demographic parity in recommendations."

**Target venues:** ACM FAccT, AAAI (AI for Social Good track), ACM RecSys

---

### Direction B: "Semantic Retrieval Meets Symbolic Rules for Government Scheme Discovery" (Features 3 + 9)

Combine dense retrieval (Feature 3) with automated scheme ingestion (Feature 9). **Paper angle:** "We present SchemeIR, a hybrid retrieval system that fuses neural bi-encoder similarity with symbolic eligibility rules, powered by an automated NLP pipeline that extracts structured criteria from multilingual government portals."

**Target venues:** SIGIR, EMNLP (NLP for Social Good), ACL Findings

---

### Direction C: "Trustworthy AI Explanations for Welfare Benefits" (Features 6 + 10 + 2)

Combine faithfulness verification (Feature 6), explanation preference learning (Feature 10), and counterfactuals (Feature 2). **Paper angle:** "We present TrustScheme, an explanation framework for welfare recommendations that verifies factual faithfulness, personalizes explanation style via contextual bandits, and generates actionable counterfactuals."

**Target venues:** CHI, IUI, AAAI (Human-AI Interaction)

---

## Section 4: Recommended Paper Framing

**Title:** *"FairScheme: A Hybrid Soft-Constraint Recommendation System with Counterfactual Explanations and Fairness Guarantees for Government Welfare Schemes"*

**Abstract structure:**
1. Problem: 1,500+ govt schemes, low awareness, existing recommenders use rigid binary filters with no fairness guarantees
2. Method: Hybrid neural-symbolic matcher with soft constraints + counterfactual explainability + fairness-aware re-ranking
3. Dataset: 243 curated Indian schemes + synthetic user profiles spanning demographic grid
4. Results: X% improvement in NDCG, Y% reduction in coverage disparity, Z% of counterfactuals rated actionable by users
5. Contribution: First fairness-audited welfare scheme recommender with actionable explanations

**Evaluation plan:**
| Experiment | Metric | Baseline |
|-----------|--------|----------|
| Recommendation quality | NDCG@10, Recall@10, MRR | Binary rule matcher |
| Fairness | Demographic parity ratio, Gini coefficient | Unaudited system |
| Explanation quality | Faithfulness rate, actionability (user study) | Raw LLM output |
| User study (N=30-50) | SUS score, task completion time, trust rating | Current system |

---

## Section 5: Feasibility Roadmap

| Phase | Duration | Features | Deliverable |
|-------|----------|----------|-------------|
| **Phase 1** | 2 weeks | Feature 1 (Soft Constraints) | `lib/soft-matcher.ts`, ablation results |
| **Phase 2** | 2 weeks | Feature 2 (Counterfactuals) | `lib/counterfactual.ts`, UI integration |
| **Phase 3** | 2 weeks | Feature 4 (Fairness Audit) | `lib/fairness.ts`, audit report generation |
| **Phase 4** | 3 weeks | Feature 6 (Faithfulness Verification) | `lib/verification.ts`, hallucination metrics |
| **Phase 5** | 2 weeks | Feature 3 (Embeddings) — optional | `lib/embeddings.ts`, retrieval evaluation |
| **Phase 6** | 2 weeks | Paper writing + evaluation | LaTeX draft, figures, tables |

**Total estimated time: 10-13 weeks** for a publishable paper using Direction A.

---

## Section 6: Codebase Changes Required

### Feature 1 — Soft Constraints (Minimum viable research contribution)

```
MODIFY  lib/matcher.ts
  - Add SoftMatchResult interface with continuous scores
  - Add constraint type taxonomy (hard/soft)
  - Add decay functions per constraint type
  - Replace binary scoring with weighted soft scoring

ADD     lib/constraint-config.ts
  - Define which constraints are hard vs soft
  - Define decay function parameters per constraint
```

### Feature 2 — Counterfactual Explanations

```
ADD     lib/counterfactual.ts
  - computeCounterfactuals(profile, scheme, missedCriteria)
  - rankByActionability(counterfactuals)
  - Attribute mutability taxonomy

MODIFY  app/scheme/[id]/page.tsx
  - Add "What would make you eligible?" section

MODIFY  lib/types.ts
  - Add Counterfactual interface
```

### Feature 4 — Fairness Audit

```
ADD     lib/fairness.ts
  - generateDemographicGrid() → UserProfile[]
  - computeGroupMetrics(profiles, schemes)
  - fairnessReport()

ADD     lib/fair-reranker.ts
  - mmrRerank(recommendations, fairnessConstraints)

ADD     scripts/run-fairness-audit.ts
  - CLI script that generates the full audit report

MODIFY  app/api/recommend/route.ts
  - Insert fair re-ranking step after AI ranking
```

### Feature 6 — Faithfulness Verification

```
ADD     lib/verification.ts
  - extractClaims(explanation) → Claim[]
  - verifyClaim(claim, scheme, matchResult) → boolean
  - faithfulnessScore(claims) → number

MODIFY  lib/groq.ts
  - Add verification call after explanation generation
  - Re-generate if faithfulness < threshold

MODIFY  lib/types.ts
  - Add faithfulnessScore to Recommendation
  - Add verifiedClaims, hallucinations arrays
```

> [!IMPORTANT]
> **Minimum viable paper:** Implement Features 1 + 2 + 4 (Sections above). This gives you a hybrid matcher contribution, an explainability contribution, and a fairness contribution — three orthogonal research axes in one system, which is the structure reviewers want to see.
