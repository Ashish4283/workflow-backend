# 🌐 Enterprise Process Ledger: Architectural Blueprint

To achieve "Standard of the World" status, the Process Builder is evolving into a **Distributed Operating System for Data**. This blueprint outlines the shift from linear automation to multi-dimensional data orchestration.

## 1. Data Topology: Parent-Child Relationship
Standard automations fail because they process rows one-by-one with no context. Our system introduces the **Ledger Context**:
- **Parent Record**: The global execution state (e.g., "Batch Upload #882").
- **Child Tasks**: Atomic units of work created by the system (e.g., "Review Row 42").
- **State Persistence**: Child tasks inherit the mapping logic and billing scope of the Parent, ensuring absolute auditability.

## 2. The Logic Mapper Engine
Handling inconsistent headers is solved via a **Schema Normalization Layer**:
- **Fuzzy Alignment**: The `mappingNode` uses Levenshtein distance and AI semantic matching to align "Cust_Email" with "email_address".
- **Transformation Pipes**: Logic can be applied during mapping (e.g., `UPPERCASE(name)`).

## 3. High-Fidelity Human QA (The Tabulator Grid)
For the 10-year-old kid to operate this, we replace complex forms with a **"Flight Control" Grid**:
- **Tabulator Integration**: A 60fps, high-performance table with Excel-like keybindings.
- **Bulk Actions**: Agents can select 1,000 rows and apply a "Match" status in one click.
- **Visual Feedback**: Real-time validation colors (Red for error, Green for synced).

## 4. Financial Scoping & Billing Engine
A true SaaS needs to know its margins. We implement **Dual-Sided Scoping**:
- **Billing (Client Side)**: The rate charged to the client per unit (e.g., $0.10 per row).
- **Payments (Resource Side)**: The cost of the API (Gemini/OpenAI) + the cost of the Human Agent time (e.g., $0.02 per row).
- **Margin Analysis**: The `billingNode` acts as a real-time auditor, preventing non-profitable processes from running.

---

## 🛠️ Step-by-Step Evolution Path

### Phase 1: The Scaffolding (Current)
- [x] Add enterprise nodes (`mappingNode`, `qaNode`, `billingNode`).
- [x] Define visual identities and inspector interfaces.

### Phase 2: The Grid Runtime
- [ ] Implement `DataReviewGrid` in the User App.
- [ ] Integrate Tabulator-style interaction patterns (Auto-fills, Bulk selection).

### Phase 3: The Financial Ledger
- [ ] Implement a `Ledger` table in the database to track `parent_id`, `node_id`, `cost`, and `revenue`.
- [ ] Add a "Profit/Loss" dashboard for Super Admins.
