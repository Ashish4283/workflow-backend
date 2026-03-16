# 💰 Enterprise Scoping & Billing Model

This document defines the financial logic for the **Process Builder's** integrated billing engine.

## 1. The Billing Philosophy
Every node execution has a cost. Our system calculates this in real-time, allowing admins to scope projects with precision.
- **Node Cost (COGS)**: Sum of API fees + Agent labor time.
- **Gross Revenue**: Unit Rate × Volume.
- **Net Profit**: Revenue - COGS.

## 2. Dynamic Scoping (Real-time Metering)
We are implementing a **"Process Meter"** in the Builder UI:
| Node Type | Resource Cost (Min) | Suggested Client Rate |
| :--- | :--- | :--- |
| **AI Processing** | $0.005 / execution | $0.02 |
| **Human QA (Grid)** | $0.05 / row | $0.15 |
| **Web Scraping** | $0.001 / page | $0.01 |
| **CRM Sync** | $0.00 / call | $0.05 |

## 3. Parent-Child Billing Logic
When a **Parent Process** (Bulk Upload) is initiated:
1.  **Authorization**: System checks Org balance.
2.  **Allocation**: If a `billingNode` exists, it sets the `rate_per_unit` for all 10,000 child tasks.
3.  **Settlement**: Once an Agent hits "Submit Ledger" in the Review Grid, the billing record is finalized and a report is generated for the client.

## 4. Why this is "Standard of the World"?
Most RPA/Automation tools bill on a flat subscription. **Creative4AI** bills on **Unit Value Created**. This aligns our success with the client's success.

> [!IMPORTANT]
> Always include a `billingNode` at the end of professional service workflows to ensure margin protection.
