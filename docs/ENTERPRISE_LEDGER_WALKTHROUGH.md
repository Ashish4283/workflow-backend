# 🏆 The Enterprise Process Ledger: Master Class

Your platform is now a world-class **Enterprise Data Orchestration Hub**. This guide explains how to use the new "Standard of the World" features to build, manage, and bill complex data processes.

## 1. Initiating a Multi-Row Process
To handle thousands of records for a client:
1.  **Start Trigger**: Use the `Manual` trigger and select **"Dependent Tasks (Batch Mode)"**.
2.  **Mapping Logic**: Insert a `Data Mapper` node. In the Inspector, define how diverse client headers (e.g., "Cust_Email") should map to your internal schema ("email").
3.  **Human QA Pool**: Add a `Human QA Pool` node. This is the **Human-in-the-loop** anchor. It will break your bulk upload into individual tasks for your agents.

## 2. Real-time Scoping (The Financial Meter)
As you drag nodes onto the canvas, watch the **Process Scope Meter** (top right):
- **Unit COGS**: The absolute cost of running this unit (computed automatically from node dependencies).
- **Client Rate**: The revenue generated per unit.
- **Profitability Audit**: If the meter shows a low margin, adjust your `ratePerUnit` in the `Billing Control` node.

## 3. The High-Fidelity Review Grid (Tabulator Mode)
When your agents or QA team opens the **User App**, they will no longer see simple forms. They will see the **Task Ledger**:
- **Grid Editing**: Click any cell to edit data instantly (Google Spreadsheet style).
- **Bulk Actions**: Select 500 rows and hit "Approve" to process them in a single batch.
- **Search & Filter**: Find specific records in massive task pools using the ultra-fast search bar.

## 4. Finalizing the Ledger
Once the QA team is satisfied:
1.  Click **"Submit Ledger"** in the Grid.
2.  The system reconciles the child tasks.
3.  The `Billing Control` node generates the final financial report for the process.

> [!TIP]
> Use the **AI Model Node** *before* the **Human QA Pool** to pre-process data. This reduces agent labor time, increasing your profit margin!

---

**Architect's Note**: This system is designed so that a 10-year-old can upload a file, map the headers, and push it to a professional QA team—all while the platform manages the accounting in the background.
