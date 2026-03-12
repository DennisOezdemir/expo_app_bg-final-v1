# material-need-model-completion Implementation Plan

**Spec:** `.ralph/specs/material-need-model-completion.md`
**Branch:** `feat/material-need-model-completion`
**Status:** Planning

## Tasks

### Phase 1: Model Audit
- [ ] Inventory all current `project_material_needs` usage across n8n workflows, frontend, and supporting docs. - [complexity: S]
- [ ] Inventory all current `project_materials` dependencies that still matter for product selection, prices, and learning. - [complexity: S]
- [ ] Produce a concise gap list between current `project_material_needs` and the target Bauleiter-oriented model. - [complexity: S]

### Phase 2: Target Schema
- [ ] Define the target field set for `project_material_needs`, including product-selection, pricing, source, and status needs. - [complexity: M]
- [ ] Implement required Supabase migration(s) for missing `project_material_needs` fields. - [complexity: M]
- [ ] Document the target material-demand model and explicitly mark `project_materials` as legacy for new development. - [complexity: S]

### Phase 3: Read Path
- [ ] Implement a stable needs-based read path for future frontend work using a view, RPC, or dedicated data helper. - [complexity: M]
- [ ] Ensure the read path exposes Bauleiter-relevant grouping inputs such as room, trade, quantity, product state, and ordering state. - [complexity: M]
- [ ] Add lightweight verification for the read path shape using existing project data assumptions or smoke checks. - [complexity: S]

### Phase 4: Flow Alignment
- [ ] Verify `M4_05_Material_List_Generator` remains compatible with the target schema and update it if needed. - [complexity: M]
- [ ] Verify `M4_06_Order_Agent` and `M4_07_Order_Send` still work with the target demand model and adjust queries if needed. - [complexity: M]
- [ ] Verify `M4_08_Schedule_Order_Trigger` still expresses the intended timing logic against the target model. - [complexity: S]

### Phase 5: Legacy Boundary
- [ ] Define which `project_materials` capabilities will later move into a separate suggestion/learning layer. - [complexity: S]
- [ ] Add clear docs on what must not be built on top of `project_materials` anymore. - [complexity: S]
- [ ] Prepare a small follow-up handoff note for Package 02 `Material Suggestion Layer Extraction`. - [complexity: S]

### Phase 6: Verification
- [ ] Run essential checks for any changed SQL/helpers and confirm no obvious regressions in material/order flow assumptions. - [complexity: S]
- [ ] Update relevant architecture docs or `.ralph` spec context so future loops can continue from the new material source-of-truth decision. - [complexity: S]

## Done
- [x] Initial Claude/Ralph spec created for `material-need-model-completion`.
- [x] Initial implementation plan created for `material-need-model-completion`.
