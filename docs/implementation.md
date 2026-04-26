# Monday Obsidian Sync implementation plan

Source spec: [obsidian-monday-sync-plugin-spec.md](./obsidian-monday-sync-plugin-spec.md)

This plan is the implementation checklist for the read-only Monday.com to Obsidian sync plugin. Future implementation sessions should check off a task only when every acceptance criterion under that task is satisfied.

## Completion rules

- [ ] Do not check off implementation tasks unless the code is present, typed, and wired into the plugin runtime.
- [ ] Do not check off preservation tasks unless tests or focused manual verification prove that non-`monday_*` properties, `tags`, and unfenced Markdown are preserved.
- [ ] Do not check off API tasks unless Monday GraphQL errors, transport errors, pagination, and missing fields are handled explicitly.
- [ ] Do not check off sync tasks unless upsert identity is based on `monday_item_id`, not filename or item name.
- [ ] Do not check off release readiness until `npm run build` passes.
- [ ] Each phase must finish with its own validation gate. Codex should run that phase's automated checks and then report any manual QA steps that require user validation before moving to the next phase.

## Phase 1: Project foundation

- [x] Replace sample plugin naming and remove sample behaviors.
  - [x] Acceptance: `src/main.ts` no longer registers sample ribbon icons, sample modal commands, document click notices, sample intervals, or sample status text.
  - [x] Acceptance: plugin class and exported settings names use Monday sync domain naming.
  - [x] Acceptance: all required MVP commands are registered with stable IDs:
    - `sync-configured-boards`
    - `validate-configuration`
    - `rebuild-monday-index`
    - `open-settings`
  - [x] Acceptance: `npm run build` passes after the sample code is removed.

- [x] Establish source module structure.
  - [x] Acceptance: feature logic is split out of `src/main.ts`.
  - [x] Acceptance: `src/main.ts` is limited to plugin lifecycle, settings load/save, command registration, and settings tab registration.
  - [x] Acceptance: modules exist for the planned architecture:
    - `src/settings.ts`
    - `src/commands/index.ts`
    - `src/monday/client.ts`
    - `src/monday/types.ts`
    - `src/sync/sync-service.ts`
    - `src/sync/hierarchy-builder.ts`
    - `src/sync/assignment-filter.ts`
    - `src/notes/note-repository.ts`
    - `src/notes/frontmatter-mapper.ts`
    - `src/notes/markdown-renderer.ts`
    - `src/notes/link-renderer.ts`
    - `src/index/sync-index.ts`
    - `src/logger.ts`
  - [x] Acceptance: imports have no circular dependencies between high-level services.

- [x] Add the automated test harness.
  - [x] Acceptance: package scripts include a test command.
  - [x] Acceptance: tests can run in Node without requiring a live Obsidian app for pure functions.
  - [x] Acceptance: Obsidian APIs used by service or repository tests can be mocked or wrapped.
  - [x] Acceptance: the initial test command passes with at least one smoke test.

- [x] Define core TypeScript types.
  - [x] Acceptance: `MondaySyncSettings` matches MVP settings from the spec.
  - [x] Acceptance: `MondayBoardConfig` includes `boardId`, optional name fields, `enabled`, and `assigneeColumnIds`.
  - [x] Acceptance: `MondaySyncItem` includes hierarchy, assignment, column, update, URL, and sync status fields.
  - [x] Acceptance: sync status is a strict union of `active`, `context`, `missing`, `archived`, `error`.
  - [x] Acceptance: column, update, board metadata, sync summary, and sync index record types are defined without using `any` for normalized plugin data.

- [x] Phase 1 automated validation.
  - [x] Acceptance: `npm run build` passes.
  - [x] Acceptance: the test command passes.
  - [x] Acceptance: TypeScript catches no unused imports left from the sample plugin.
  - [x] Acceptance: repository search confirms no sample command IDs or sample UI strings remain in `src/`.

- [x] Phase 1 manual QA gate.
  - [x] Acceptance: user confirms the command palette shows only Monday Sync commands from this plugin.
  - [x] Acceptance: user confirms no sample ribbon icon, sample status text, click notice, or sample modal behavior appears after reloading the plugin.

## Phase 2: Settings and commands

- [ ] Implement MVP settings defaults and persistence.
  - [ ] Acceptance: defaults are:
    - `syncFolder: "Monday"`
    - `assigneeFilterMode: "current_user"`
    - `renameFilesOnMondayNameChange: true`
    - `syncUpdates: true`
    - `syncChildItems: true`
    - `maxUpdatesPerItem: 25`
    - `includeDoneItems: true`
    - `includeArchivedItems: false`
    - `propertyPrefix: "monday_"`
    - `filenameTemplate: "{{sanitized_name}} - {{monday_item_id}}"`
    - `apiVersion: "2026-04"`
  - [ ] Acceptance: settings load with `Object.assign` or equivalent migration-safe merging.
  - [ ] Acceptance: saving settings uses `this.saveData`.
  - [ ] Acceptance: no excluded MVP settings are exposed: folder strategies, scheduled sync, webhooks, bidirectional sync, per-board templates, custom mappings.

- [ ] Build the settings tab.
  - [ ] Acceptance: user can set the Monday API token.
  - [ ] Acceptance: user can set the flat sync folder.
  - [ ] Acceptance: user can add, edit, enable/disable, and remove manually configured board IDs.
  - [ ] Acceptance: user can set optional board name hints.
  - [ ] Acceptance: user can configure assignee column IDs per board.
  - [ ] Acceptance: user can configure rename behavior, updates sync, child item sync, update limit, done item inclusion, archived item inclusion, filename template, and API version.
  - [ ] Acceptance: settings UI uses sentence case labels and short, direct copy.
  - [ ] Acceptance: settings tab can show validation status for each configured board.

- [ ] Implement command registration.
  - [ ] Acceptance: `Monday Sync: Sync Configured Boards` validates settings and runs the full sync service.
  - [ ] Acceptance: `Monday Sync: Validate Configuration` validates API token and enabled boards without writing notes.
  - [ ] Acceptance: `Monday Sync: Rebuild Monday Index` scans the sync folder and rewrites the local index.
  - [ ] Acceptance: `Monday Sync: Open Settings` opens this plugin's settings tab.
  - [ ] Acceptance: command failures show concise Obsidian notices and log details for debugging.

- [ ] Phase 2 automated validation.
  - [ ] Acceptance: settings defaults are covered by automated tests.
  - [ ] Acceptance: settings merge or migration behavior is covered by automated tests.
  - [ ] Acceptance: command registration is covered by a unit test or lightweight Obsidian API mock.
  - [ ] Acceptance: `npm run build` and the test command pass.

- [ ] Phase 2 manual QA gate.
  - [ ] Acceptance: user confirms settings persist after editing and reloading Obsidian.
  - [ ] Acceptance: user confirms boards can be added, edited, disabled, and removed in the settings tab.
  - [ ] Acceptance: user confirms `Monday Sync: Open Settings` opens this plugin's settings tab.
  - [ ] Acceptance: user confirms sync and validation commands show clear notices when token or enabled boards are missing.

## Phase 3: Monday GraphQL client

- [ ] Implement centralized Monday client.
  - [ ] Acceptance: all Monday network calls go through `MondayClient`.
  - [ ] Acceptance: endpoint is `https://api.monday.com/v2`.
  - [ ] Acceptance: requests include `Authorization`, `Content-Type: application/json`, and `API-Version` headers.
  - [ ] Acceptance: API version is read from settings or a centralized default.
  - [ ] Acceptance: GraphQL requests send `{ query, variables }`.
  - [ ] Acceptance: the client never logs the API token.

- [ ] Implement API error handling.
  - [ ] Acceptance: transport failures are converted to typed plugin errors.
  - [ ] Acceptance: non-2xx responses include status and safe response details.
  - [ ] Acceptance: GraphQL `errors` responses are not treated as successful even when `data` is present.
  - [ ] Acceptance: rate-limit or complexity errors are detected and surfaced distinctly where possible.
  - [ ] Acceptance: missing expected fields produce actionable validation or sync errors.
  - [ ] Acceptance: Monday request IDs are captured in logs when available.

- [ ] Implement current user and board metadata queries.
  - [ ] Acceptance: current user query returns Monday user ID and display name.
  - [ ] Acceptance: board metadata validation confirms board existence, token access, board name, hierarchy type when available, and columns.
  - [ ] Acceptance: board validation detects inaccessible or invalid boards without crashing the settings tab.
  - [ ] Acceptance: board display name is updated from authoritative Monday metadata after successful validation.

- [ ] Implement item pagination.
  - [ ] Acceptance: first page uses `items_page`.
  - [ ] Acceptance: subsequent pages use `next_items_page`.
  - [ ] Acceptance: sync continues until no cursor remains.
  - [ ] Acceptance: implementation does not assume boards have fewer than 500 items.
  - [ ] Acceptance: all page results are merged before hierarchy reconstruction.

- [ ] Implement item, child item, column value, and update fetching.
  - [ ] Acceptance: top-level items include ID, name, updated time, URL, group, parent reference when present, subitems/children when returned, column values, and updates if enabled.
  - [ ] Acceptance: classic subitems and multi-level child items are included when `syncChildItems` is enabled.
  - [ ] Acceptance: update fetching respects `maxUpdatesPerItem`.
  - [ ] Acceptance: rollup/calculated column values are captured as read-only display values when returned.
  - [ ] Acceptance: implementation comments or tests document any Monday schema field adaptations made for the selected API version.

- [ ] Phase 3 automated validation.
  - [ ] Acceptance: Monday client tests cover successful GraphQL responses.
  - [ ] Acceptance: Monday client tests cover transport failures, non-2xx responses, GraphQL `errors`, partial data with errors, rate-limit or complexity errors, and missing expected fields.
  - [ ] Acceptance: current user query and board metadata validation are covered with mocked responses.
  - [ ] Acceptance: cursor pagination across multiple pages is covered with mocked responses.
  - [ ] Acceptance: update limit behavior is covered with mocked responses.
  - [ ] Acceptance: `npm run build` and the test command pass.

- [ ] Phase 3 manual QA gate.
  - [ ] Acceptance: user confirms board validation succeeds for a known accessible board.
  - [ ] Acceptance: user confirms board validation reports a clear error for an invalid board ID or inaccessible board.
  - [ ] Acceptance: user confirms no notes are created, updated, renamed, or deleted by validation-only commands.

## Phase 4: Normalization, hierarchy, and filtering

- [ ] Normalize Monday API responses.
  - [ ] Acceptance: every included API item is converted into `MondaySyncItem`.
  - [ ] Acceptance: item IDs, board IDs, parent IDs, root IDs, and column IDs are stored as strings.
  - [ ] Acceptance: missing optional data is represented as `null` or empty arrays, not undefined runtime surprises.
  - [ ] Acceptance: normalized items include `assignedToCurrentUser`, `syncedAsContext`, and `syncStatus`.

- [ ] Implement hierarchy reconstruction.
  - [ ] Acceptance: parent-child relationships can be built from top-level items, subitems, child items, and `parent_item` references.
  - [ ] Acceptance: top-level items receive `hierarchyLevel: 0` and `rootItemId` equal to their own ID.
  - [ ] Acceptance: child items receive correct `parentItemId`, `rootItemId`, `hierarchyLevel`, and immediate `childItemIds`.
  - [ ] Acceptance: hierarchy supports at least four nested child levels.
  - [ ] Acceptance: cycle detection prevents infinite traversal and marks affected items as `error`.
  - [ ] Acceptance: unresolved parents do not prevent child note creation; affected properties are set safely and status is `error`.

- [ ] Implement assignment filtering.
  - [ ] Acceptance: default behavior syncs items assigned to the authenticated Monday user.
  - [ ] Acceptance: configured `assigneeColumnIds` are used when provided.
  - [ ] Acceptance: when no assignee columns are configured for a board, all People columns can count as assignment columns.
  - [ ] Acceptance: items assigned to the user are marked `monday_assigned_to_me: true` and `monday_synced_as_context: false`.
  - [ ] Acceptance: unassigned ancestors required by assigned descendants are included as context notes.
  - [ ] Acceptance: context notes are marked `monday_assigned_to_me: false`, `monday_synced_as_context: true`, and `monday_sync_status: "context"`.

- [ ] Implement included item planning.
  - [ ] Acceptance: sync plan contains every active assigned item and required ancestor context item exactly once.
  - [ ] Acceptance: sync plan preserves child relationships among included items.
  - [ ] Acceptance: disabled boards are not queried or included.
  - [ ] Acceptance: excluded archived items are not updated as active notes and can be marked archived when previously synced.

- [ ] Phase 4 automated validation.
  - [ ] Acceptance: normalization tests cover missing optional API fields.
  - [ ] Acceptance: hierarchy tests cover top-level only boards.
  - [ ] Acceptance: hierarchy tests cover classic subitems.
  - [ ] Acceptance: hierarchy tests cover multi-level child items with at least three levels.
  - [ ] Acceptance: hierarchy tests cover root item and hierarchy level calculation.
  - [ ] Acceptance: hierarchy tests cover cycle detection and unresolved parent handling.
  - [ ] Acceptance: assignment tests cover configured People columns, fallback to all People columns, current-user matching, and ancestor context inclusion.
  - [ ] Acceptance: planning tests prove disabled boards are ignored.
  - [ ] Acceptance: `npm run build` and the test command pass.

- [ ] Phase 4 manual QA gate.
  - [ ] Acceptance: user confirms the configured assignment columns match how their Monday boards represent ownership.
  - [ ] Acceptance: user confirms whether context ancestor notes should appear in their Bases views or be hidden by filters.

## Phase 5: Frontmatter and column mapping

- [ ] Implement Monday-owned property mapping.
  - [ ] Acceptance: every note receives required base properties when available:
    - `monday_item_id`
    - `monday_item_name`
    - `monday_board_id`
    - `monday_board_name`
    - `monday_group_id`
    - `monday_group_name`
    - `monday_url`
    - `monday_sync_status`
    - `monday_last_synced_at`
    - `monday_updated_at`
  - [ ] Acceptance: child notes receive parent, root, and hierarchy properties.
  - [ ] Acceptance: parent notes receive `monday_has_child_items`, `monday_child_item_ids`, and `monday_child_notes`.
  - [ ] Acceptance: top-level notes receive null parent properties and level `0`.
  - [ ] Acceptance: plugin-managed tags, if present, are written only to `monday_tags`.

- [ ] Implement column-to-property name normalization.
  - [ ] Acceptance: column titles are lowercased, trimmed, unsupported characters replaced with underscores, and prefixed with `monday_`.
  - [ ] Acceptance: property name collisions are resolved by appending the Monday column ID.
  - [ ] Acceptance: generated property names never overwrite non-`monday_*` properties.
  - [ ] Acceptance: `propertyPrefix` remains fixed to `monday_` for MVP behavior.

- [ ] Implement column type normalization.
  - [ ] Acceptance: text, long text, status, people, date, timeline, numbers, checkbox, dropdown, tags, link, files, dependency, connect boards, mirror, and rollup values are handled according to the spec.
  - [ ] Acceptance: People columns produce display names and ID lists where available.
  - [ ] Acceptance: Timeline columns produce start and end date properties.
  - [ ] Acceptance: calculated or rollup values include metadata when leaf/calculated status is known.
  - [ ] Acceptance: unsupported or unknown column types degrade to display text without throwing.

- [ ] Implement safe frontmatter updates.
  - [ ] Acceptance: update logic removes or replaces only keys beginning with `monday_`.
  - [ ] Acceptance: non-`monday_*` properties remain present after sync.
  - [ ] Acceptance: the standard Obsidian `tags` property remains unchanged after sync.
  - [ ] Acceptance: newly created notes contain frontmatter with Monday-owned properties only unless required by Obsidian formatting.
  - [ ] Acceptance: existing malformed frontmatter is handled with a clear error and does not destroy note content.

- [ ] Phase 5 automated validation.
  - [ ] Acceptance: property name normalization and collision handling are covered by tests.
  - [ ] Acceptance: column value normalization is covered for all MVP column types.
  - [ ] Acceptance: People column name and ID output is covered by tests.
  - [ ] Acceptance: Timeline start and end output is covered by tests.
  - [ ] Acceptance: unsupported column type fallback is covered by tests.
  - [ ] Acceptance: `monday_*` replacement, non-`monday_*` preservation, `tags` preservation, and malformed frontmatter handling are covered by tests.
  - [ ] Acceptance: `npm run build` and the test command pass.

- [ ] Phase 5 manual QA gate.
  - [ ] Acceptance: user reviews a generated note's properties and confirms the Monday-owned fields are useful for their expected Bases views.
  - [ ] Acceptance: user confirms custom properties and standard `tags` remain unchanged after a test sync.

## Phase 6: Markdown rendering and note preservation

- [ ] Implement generated section replacement.
  - [ ] Acceptance: sections are identified only by exact `monday-sync` marker pairs.
  - [ ] Acceptance: replacement changes only content between matching marker lines.
  - [ ] Acceptance: marker lines are preserved.
  - [ ] Acceptance: missing marker pairs cause the generated section to be appended.
  - [ ] Acceptance: same-named user headings without marker pairs are never overwritten.

- [ ] Implement Monday summary rendering.
  - [ ] Acceptance: summary section renders board, group, status, priority, due date, and assignees when available.
  - [ ] Acceptance: missing values are omitted or rendered consistently without noisy placeholders.
  - [ ] Acceptance: Markdown special characters in Monday values are escaped or represented safely.

- [ ] Implement hierarchy and child link rendering.
  - [ ] Acceptance: child notes render parent, root, and level inside `monday-sync:hierarchy`.
  - [ ] Acceptance: parent notes render immediate child links inside `monday-sync:children`.
  - [ ] Acceptance: MVP rendering shows immediate children only.
  - [ ] Acceptance: generated links use current note filenames and update after plugin-managed renames.
  - [ ] Acceptance: user-authored links outside generated fences are never rewritten.

- [ ] Implement Monday updates rendering.
  - [ ] Acceptance: updates render in reverse chronological order.
  - [ ] Acceptance: each update includes timestamp, author, and sanitized body.
  - [ ] Acceptance: unsupported HTML is stripped or sanitized.
  - [ ] Acceptance: links are preserved where practical.
  - [ ] Acceptance: rendered updates are limited by `maxUpdatesPerItem`.
  - [ ] Acceptance: updates are never written to frontmatter.

- [ ] Implement new note templates.
  - [ ] Acceptance: top-level item notes include frontmatter, `# Item name`, summary, child items when present, and updates when enabled.
  - [ ] Acceptance: child item notes include frontmatter, `# Item name`, hierarchy, summary, child items when present, and updates when enabled.
  - [ ] Acceptance: new notes do not include a reserved or required user writing section.
  - [ ] Acceptance: all created notes are stored directly in the configured sync folder.

- [ ] Phase 6 automated validation.
  - [ ] Acceptance: fenced section replacement is covered by tests.
  - [ ] Acceptance: missing marker append behavior is covered by tests.
  - [ ] Acceptance: same-named unmarked user headings are covered by tests and remain untouched.
  - [ ] Acceptance: user headings, user links, and unfenced Markdown are preserved byte-for-byte where feasible.
  - [ ] Acceptance: summary rendering, hierarchy rendering, child link rendering, and updates rendering are covered by tests.
  - [ ] Acceptance: update body sanitization and Markdown escaping are covered by tests.
  - [ ] Acceptance: `npm run build` and the test command pass.

- [ ] Phase 6 manual QA gate.
  - [ ] Acceptance: user confirms generated sections look acceptable in Obsidian reading view.
  - [ ] Acceptance: user confirms their own Markdown outside `monday-sync` fences survives a repeated test sync.
  - [ ] Acceptance: user confirms no required or reserved writing section is added to new notes.

## Phase 7: Note repository, filenames, and index

- [ ] Implement flat sync folder management.
  - [ ] Acceptance: sync folder is created if missing.
  - [ ] Acceptance: plugin-created notes are placed directly inside `syncFolder`.
  - [ ] Acceptance: no board, group, project, root item, or hierarchy subfolders are created.
  - [ ] Acceptance: sync rejects or normalizes settings that would imply nested folder strategies outside the MVP.

- [ ] Implement filename generation.
  - [ ] Acceptance: default filename template is `{{sanitized_name}} - {{monday_item_id}}.md`.
  - [ ] Acceptance: invalid filesystem characters are removed or replaced.
  - [ ] Acceptance: excessive whitespace is collapsed.
  - [ ] Acceptance: filename length is capped to a safe maximum.
  - [ ] Acceptance: Monday item ID is included to avoid collisions.
  - [ ] Acceptance: any remaining collision is resolved with a safe disambiguator.

- [ ] Implement upsert by `monday_item_id`.
  - [ ] Acceptance: existing notes are found by authoritative `monday_item_id` frontmatter.
  - [ ] Acceptance: local index can speed lookup but is never the sole source of identity.
  - [ ] Acceptance: item name changes update the existing note instead of creating a duplicate.
  - [ ] Acceptance: if `renameFilesOnMondayNameChange` is enabled, plugin renames the note file in place within the flat sync folder.
  - [ ] Acceptance: if rename target belongs to a different `monday_item_id`, collision handling prevents overwrite.

- [ ] Implement sync index persistence.
  - [ ] Acceptance: index stores version, item ID, path, board ID, parent ID, root ID, hierarchy level, last sync time, and last Monday update time.
  - [ ] Acceptance: index is saved in plugin data, not in synced Markdown notes.
  - [ ] Acceptance: index updates after note creation, plugin-managed rename, and successful lookup repair.
  - [ ] Acceptance: corrupt or missing index files are handled by rebuild rather than sync failure.

- [ ] Implement index rebuild.
  - [ ] Acceptance: rebuild scans Markdown files in `syncFolder`.
  - [ ] Acceptance: rebuild reads `monday_item_id` from frontmatter.
  - [ ] Acceptance: duplicate IDs are reported and handled deterministically.
  - [ ] Acceptance: rebuild command rewrites the index and shows a concise summary.

- [ ] Implement missing, archived, and error status updates.
  - [ ] Acceptance: previously synced items from enabled boards that are no longer returned are never deleted.
  - [ ] Acceptance: missing notes receive only `monday_sync_status: "missing"` and related `monday_*` sync metadata updates.
  - [ ] Acceptance: excluded archived notes can receive `monday_sync_status: "archived"` when archive state is known.
  - [ ] Acceptance: partial query failures can mark affected notes `monday_sync_status: "error"` without destroying user content.

- [ ] Phase 7 automated validation.
  - [ ] Acceptance: filename sanitization, length limits, and collision handling are covered by tests.
  - [ ] Acceptance: flat sync folder creation is covered with a mocked or wrapped vault adapter.
  - [ ] Acceptance: upsert-by-`monday_item_id` is covered by tests.
  - [ ] Acceptance: rename behavior updates the index and does not overwrite unrelated notes.
  - [ ] Acceptance: index save, load, corrupt recovery, and rebuild are covered by tests.
  - [ ] Acceptance: missing, archived, and error status updates are covered by tests and preserve user-owned content.
  - [ ] Acceptance: `npm run build` and the test command pass.

- [ ] Phase 7 manual QA gate.
  - [ ] Acceptance: user confirms plugin-created notes appear directly inside the configured sync folder with no nested folders.
  - [ ] Acceptance: user confirms renamed Monday items rename existing notes rather than creating duplicates.
  - [ ] Acceptance: user confirms missing items are marked missing and not deleted.

## Phase 8: Sync orchestration

- [ ] Implement full sync workflow.
  - [ ] Acceptance: sync loads settings and validates the API token.
  - [ ] Acceptance: sync fails early with a user-facing notice if no enabled board is configured.
  - [ ] Acceptance: sync queries current Monday user before assignment filtering.
  - [ ] Acceptance: sync processes only enabled configured boards.
  - [ ] Acceptance: each board sync validates metadata, fetches all pages, normalizes items, filters assignments, includes ancestors, builds hierarchy, upserts notes, updates links, updates missing statuses, and saves the index.
  - [ ] Acceptance: sync reports created, updated, context, missing, archived, error, and failed counts.

- [ ] Implement board validation workflow.
  - [ ] Acceptance: validation can run independently of sync.
  - [ ] Acceptance: validation confirms board existence, access, metadata, columns, item query ability, and hierarchy type when available.
  - [ ] Acceptance: validation updates board display status in settings.
  - [ ] Acceptance: validation does not create, update, rename, or delete any notes.

- [ ] Implement logging.
  - [ ] Acceptance: logs include high-level sync phases and board IDs.
  - [ ] Acceptance: logs include safe error context and Monday request IDs where available.
  - [ ] Acceptance: logs never include API tokens or full vault content.
  - [ ] Acceptance: user-facing notices remain concise.

- [ ] Phase 8 automated validation.
  - [ ] Acceptance: mocked full sync test creates one note per included top-level item.
  - [ ] Acceptance: mocked full sync test creates one note per included classic subitem.
  - [ ] Acceptance: mocked full sync test creates one note per included multi-level child item.
  - [ ] Acceptance: mocked full sync test covers child assigned to current user while parent is context-only.
  - [ ] Acceptance: mocked full sync test covers item rename and generated link updates.
  - [ ] Acceptance: mocked full sync test covers missing item status without deletion.
  - [ ] Acceptance: mocked full sync test covers GraphQL partial error handling without silent note corruption.
  - [ ] Acceptance: mocked full sync test covers pagination across multiple pages.
  - [ ] Acceptance: `npm run build` and the full test command pass.

- [ ] Phase 8 manual QA gate.
  - [ ] Acceptance: user confirms a real or representative sync creates one note per included Monday item.
  - [ ] Acceptance: user confirms parent notes link to immediate children in generated sections.
  - [ ] Acceptance: user confirms child notes link to parent and root in generated sections.
  - [ ] Acceptance: user confirms generated links update after a Monday item rename.
  - [ ] Acceptance: user confirms no duplicate notes are created for renamed Monday items.
  - [ ] Acceptance: user confirms user-authored Markdown, custom properties, and standard `tags` survive repeated syncs.
  - [ ] Acceptance: user confirms top-level, actionable child task, full project tree, and context-only Bases views can be built from synced properties.
  - [ ] Acceptance: user confirms no unexpected network activity beyond Monday API requests initiated by sync or validation.

## Release readiness

- [ ] Verify security and privacy requirements.
  - [ ] Acceptance: plugin never writes to Monday.
  - [ ] Acceptance: plugin never creates, edits, archives, or deletes Monday items.
  - [ ] Acceptance: plugin never fetches or executes remote code.
  - [ ] Acceptance: network calls are limited to Monday API requests initiated by user sync or validation actions.
  - [ ] Acceptance: API token is not logged.
  - [ ] Acceptance: README documents external service use before release.

- [ ] Verify build and release artifacts.
  - [ ] Acceptance: `npm run build` passes.
  - [ ] Acceptance: generated release artifacts are `main.js`, `manifest.json`, and `styles.css` if present.
  - [ ] Acceptance: `manifest.json` has stable plugin ID, SemVer version, accurate minimum app version, description, and desktop-only setting.
  - [ ] Acceptance: `versions.json` maps plugin version to minimum Obsidian version.
  - [ ] Acceptance: generated build artifacts are not committed unless intentionally preparing a release artifact package.

## MVP done definition

- [ ] All tasks through Phase 8 are complete.
- [ ] Every phase's automated validation gate has passed.
- [ ] Every phase's manual QA gate has either been confirmed by the user or explicitly deferred with documented risk.
- [ ] Release readiness checks are complete.
- [ ] `npm run build` passes.
