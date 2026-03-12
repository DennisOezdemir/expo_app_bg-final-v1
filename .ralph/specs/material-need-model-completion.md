<!--
Copyright (c) 2026 expo_app_bg-final-v1. All rights reserved.
SPDX-License-Identifier: Proprietary
-->

# Material Need Model Completion Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2026-03-11

## Purpose

The current material architecture is split between `project_materials` and `project_material_needs`. This causes inconsistent frontend behavior, duplicate logic, and a process that behaves like a flat material list instead of a Bauleiter workflow. This feature establishes `project_material_needs` as the authoritative material-demand model and prepares the data shape, status model, and read paths required for future UI and automation work.

## User Stories

- As a Bauleiter, I want material demand to reflect rooms, trades, quantities, and timing so that I can make procurement decisions without manually managing raw material rows.
- As a developer, I want one authoritative material model so that frontend, automation, and ordering flows stop diverging.
- As the system, I want product-selection and learning behavior separated from raw demand so that suggestion logic can evolve without corrupting the source-of-truth model.

## Requirements

### Functional Requirements
- [ ] `project_material_needs` is treated as the authoritative material-demand model for all new work.
- [ ] The target schema for `project_material_needs` is explicitly documented and implemented where necessary.
- [ ] The model supports project, room, trade, material label/type, quantity, unit, source, and order-relevant status.
- [ ] Product-selection semantics are defined for needs-based workflows.
- [ ] Existing dependencies on `project_materials` are identified and documented.
- [ ] A stable read path exists for future needs-based frontend work.
- [ ] Existing M4 material/order/schedule flows are checked against the target model and gaps are documented or fixed.

### Non-Functional Requirements
- [ ] Changes must avoid breaking existing M4 automation flows.
- [ ] Schema and read-path changes must be documented clearly enough for follow-up Ralph packages.
- [ ] Legacy `project_materials` behavior must not be expanded during this package.

## Technical Notes

- **Uses:** Existing Supabase schema, M4 n8n workflows, current material frontend, planning flows
- **Location:** `supabase/migrations/`, `lib/`, `.ralph/specs/`, possibly `docs/`
- **Dependencies:** Supabase schema, n8n workflow compatibility, current product/supplier relations
- **Database:** Likely schema changes to `project_material_needs`, plus views/RPCs/read helpers

## Acceptance Criteria

- [ ] `project_material_needs` is formally defined as source of truth for material demand.
- [ ] Any missing schema fields required for future frontend and ordering work are added or explicitly specified.
- [ ] Product-selection behavior for demand records is defined.
- [ ] Legacy dependencies on `project_materials` are inventoried.
- [ ] A stable needs-based read path exists for future material-center work.
- [ ] M4_05, M4_06, M4_07, and M4_08 are aligned with the target model or have an explicit gap list.

## Out of Scope

- Rebuilding the material UI
- Full migration of historical data
- Removing `project_materials`
- Implementing the full learning/suggestion engine
- Building the final Bauleiter Material Center

## Open Questions

- [ ] Should product-selection fields live directly on `project_material_needs` or be split into a later suggestion layer?
- [ ] Does the current status model need more than `planned` and `ordered`?
- [ ] Should tools and consumables remain outside the primary demand model?
