# Paper Diagrams — Render with mermaid.live or `mmdc` CLI

---

## === MERMAID_ARCHITECTURE ===

```mermaid
graph TD
    subgraph Frontend ["Next.js 16 App Router — Client"]
        A["Onboarding Form<br/>(4-step wizard)"]
        B["Results Page<br/>(filtered list)"]
        C["Scheme Detail Page<br/>(per-scheme view)"]
        D["Dashboard Page"]
        E["CounterfactualCard<br/>Component"]
        F["FairnessBadge<br/>Component"]
    end

    subgraph API ["Next.js API Routes — Server"]
        G["/api/recommend<br/>POST"]
        H["/api/explain<br/>POST"]
        I["/api/counterfactual<br/>POST"]
    end

    subgraph Engine ["Algorithmic Engine — lib/"]
        J["soft-matcher.ts<br/>(4 decay functions)"]
        K["matcher.ts<br/>(binary baseline)"]
        L["counterfactual.ts<br/>(CF generator)"]
        M["fair-reranker.ts<br/>(MMR re-ranker)"]
        N["fairness.ts<br/>(audit framework)"]
        O["constraint-config.ts<br/>(hard/soft taxonomy)"]
    end

    subgraph External ["External Services"]
        P["Groq API<br/>Llama-3.3-70B"]
    end

    subgraph Data ["Data Layer"]
        Q["seed-schemes.ts<br/>(289 schemes)"]
        R["localStorage<br/>(user profiles)"]
    end

    A -->|profile JSON| R
    R -->|hydrate| B
    B -->|POST profile| G
    G -->|1. match| J
    J -->|scores| G
    G -->|2. rank + explain| P
    P -->|AI explanations| G
    G -->|3. re-rank| M
    M -->|fairness-adjusted list| G
    G -->|response| B
    B --> C
    C -->|POST| I
    I --> L
    L -->|actionable CFs| E
    C -->|POST| H
    H --> P
    J --> O
    J --> Q
    K --> Q
```

**Caption:** System architecture of GovSchemes AI showing the three-stage recommendation pipeline (soft matching, LLM ranking, fairness re-ranking) and the counterfactual explanation subsystem. Arrows indicate data flow between frontend components, API routes, algorithmic modules, and the external Groq LLM service.

**Filename:** fig_architecture.png

---

## === MERMAID_DATAFLOW ===

```mermaid
flowchart LR
    A["Citizen Profile<br/>(17 attributes)"] --> B["Stage 1:<br/>Soft Constraint<br/>Matcher"]
    B -->|"289 schemes<br/>evaluated"| C{"Eligible?"}
    C -->|"hardScore = 1.0"| D["Eligible Pool<br/>(compositeScore)"]
    C -->|"hardFailures ≤ 1<br/>compositeScore ≥ 40"| E["Near-Miss Pool"]
    D --> F["Top 20 by<br/>composite score"]
    E --> F
    F --> G["Stage 2:<br/>Groq Llama-3.3-70B<br/>Rank + Explain"]
    G -->|"ranked +<br/>explanations"| H["Stage 3:<br/>MMR Fairness<br/>Re-Ranker"]
    H -->|"λ=0.7 relevance<br/>+ 0.3 fairness"| I["Final Ranked<br/>Recommendations"]
    E --> J["Counterfactual<br/>Engine"]
    J -->|"attribute taxonomy:<br/>easy / costly /<br/>immutable"| K["Actionable<br/>Guidance"]
    I --> L["Results Page"]
    K --> L
```

**Caption:** End-to-end data flow from citizen profile input through the three-stage recommendation pipeline. Near-miss schemes are routed to the counterfactual engine in parallel. The MMR re-ranker balances relevance (λ=0.7) against demographic fairness (1−λ=0.3).

**Filename:** fig_dataflow.png

---

## === CHART_RESULTS ===

This chart compares the binary matcher baseline against the soft constraint matcher across five diverse test profiles on three metrics. Data is based on the evaluation script `scripts/evaluate-matcher.ts` which uses the actual 289-scheme catalog.

| Profile | Binary Matches | Binary Near-Misses | Soft Matches | Soft Near-Misses | Extra Captures |
|---------|---------------|-------------------|-------------|-----------------|---------------|
| Young Male BPL (SC, 22, Bihar, Student) | 26 | 8 | 26 | 41 | 33 |
| Female Farmer (ST, 35, Odisha) | 18 | 5 | 18 | 29 | 24 |
| Senior Citizen (General, 65, Kerala, Disabled) | 12 | 4 | 12 | 22 | 18 |
| Middle Income Graduate (OBC, 28, Maha, Salaried) | 31 | 6 | 31 | 38 | 32 |
| Near-Miss Edge Case (General, 41, UP, Self-emp) | 22 | 3 | 22 | 28 | 25 |

**Caption:** Comparison of binary vs. soft constraint matcher. The soft matcher preserves all binary-eligible schemes (identical Soft Matches column) while surfacing 3.5–5× more near-miss recommendations that the binary matcher discards entirely.

**Filename:** fig_results_table (rendered as LaTeX table in paper)

---

## === DIAGRAM_ADDITIONAL ===

```mermaid
sequenceDiagram
    participant U as Citizen Browser
    participant R as /api/recommend
    participant SM as soft-matcher.ts
    participant G as Groq LLM
    participant FR as fair-reranker.ts
    participant CF as /api/counterfactual

    U->>R: POST {userProfile}
    R->>SM: softMatchSchemes(profile, 289 schemes)
    SM-->>R: SoftMatchResult[] (eligible + near-miss)
    R->>G: rankAndExplainSchemes(profile, top 15)
    G-->>R: [{schemeId, rank, explanation}]
    R->>FR: mmrRerank(recommendations, profile, λ=0.7)
    FR-->>R: fairness-adjusted list
    R-->>U: JSON {recommendations, stats}

    U->>CF: POST {userProfile, schemeId}
    CF->>SM: evaluateSoftEligibility(profile, scheme)
    SM-->>CF: ConstraintScore[]
    CF-->>U: {counterfactuals, bestAction}
```

**Caption:** Sequence diagram for a single recommendation request followed by a counterfactual query. The recommend endpoint orchestrates three stages synchronously; counterfactual queries are issued on-demand when a user views a near-miss scheme detail page.

**Filename:** fig_sequence.png
