# 🔒 Internal Infrastructure Security Protocol

> [!CAUTION]
> This document contains internal server architecture details and is restricted to the **DevOps and Super Admin** clusters.

## 1. Environment Access
Access to the `horizons-backend` production environment requires a hardware security key.

## 2. DB Connectivity
The database operates on a private VPC and does not accept external connections. All migrations must be performed through the `admin-secure-tunnel`.

---
*Last Updated: March 2026 by Antigravity AI*
