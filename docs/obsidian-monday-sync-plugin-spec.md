# Obsidian Monday Sync Plugin — Implementation Specification

## 1. Purpose

Build an Obsidian plugin that mirrors selected Monday.com board items into local Markdown notes.

Each Monday item, including top-level items, subitems, and deeper multi-level child items, becomes exactly one Obsidian note. Parent notes link to child notes, and child notes link back to parent/root notes.

Monday.com remains the source of truth for project/task metadata, assignments, statuses, dates, hierarchy, and comments. Obsidian remains the place for private working notes, custom metadata, and local organization through properties, links, and Bases.

This plugin is read-only with respect to Monday.com. It pulls data from Monday into Obsidian. It does not push edits back to Monday.

---

## 2. Core Product Goals

The plugin must:

1. Add an Obsidian command that syncs configured Monday boards.
2. Require the user to manually specify the Monday boards to sync.
3. Use the Monday GraphQL API.
4. Create or update one note per Monday item at every hierarchy level.
5. Support classic Monday boards with subitems.
6. Support Monday multi-level boards with nested child items.
7. Use stable Monday item IDs for upsert identity.
8. Preserve parent-child relationships using Obsidian links and `monday_*` properties.
9. Store Monday item metadata and Monday board column values as Obsidian properties.
10. Copy Monday updates/comments into generated `monday-sync` fenced sections.
11. Preserve all user-owned note content and user-owned properties.
12. Store all created notes in one flat folder.

---

## 3. Non-goals

The plugin must not:

1. Push Obsidian note changes back to Monday.
2. Create, edit, archive, or delete Monday items.
3. Create Monday updates from Obsidian notes.
4. Treat Obsidian as the source of truth for Monday-managed metadata.
5. Auto-discover and sync arbitrary accessible boards.
6. Delete Obsidian notes automatically when Monday items disappear.
7. Create nested folders under the configured sync folder.
8. Implement a general-purpose Monday.com client.
9. Implement a workflow automation system.
10. Rewrite user-authored Markdown or user-authored properties.

---

## 4. Definitive Ownership and Safety Model

This is the most important implementation rule.

The plugin may modify only:

1. Obsidian properties whose keys begin with `monday_`.
2. Markdown content inside explicit `monday-sync` fenced regions.

Everything else in the note is user-owned and must be preserved exactly.

### 4.1 Plugin-owned content

Plugin-owned content:

```text
- Any Obsidian property whose key starts with monday_
- Any Markdown region fenced by monday-sync start/end markers
```

Examples:

```yaml
monday_item_id: "1234567890"
monday_status: "Working on it"
monday_due_date: 2026-05-15
monday_parent_note: "[[Website Redesign - 100]]"
```

```markdown
<!-- monday-sync:summary:start -->
Generated content
<!-- monday-sync:summary:end -->
```

### 4.2 User-owned content

User-owned content:

```text
- Any property that does not start with monday_
- The standard Obsidian tags property
- Any user-created tag
- Any Markdown content outside monday-sync fenced regions
- Any user-created heading
- Any user-created link
- Any user-created section
```

Example:

```yaml
---
monday_item_id: "1234567890"
monday_status: "Working on it"
area: "Product"
personal_priority: "High"
tags:
  - focus
  - writing
---
```

On sync, the plugin may update `monday_item_id` and `monday_status`.

It must preserve:

```yaml
area: "Product"
personal_priority: "High"
tags:
  - focus
  - writing
```

### 4.3 No required user writing location

The plugin must not require or reserve a `Working Notes` section.

The user may write anywhere outside `monday-sync` fences.

The entire unfenced note body is user-owned.

### 4.4 Tags

The plugin should not modify the user’s standard Obsidian `tags` property.

If the plugin needs plugin-managed tags, store them in a Monday-owned property:

```yaml
monday_tags:
  - monday
  - monday/synced
  - monday/child
```

The user can then choose whether to mirror these into normal Obsidian tags manually.

---

## 5. Flat Storage Model

All notes created by the plugin must be stored directly inside a single configured folder.

Default:

```yaml
sync_folder: "Monday"
```

The plugin must not create subfolders for boards, projects, root items, groups, or hierarchy levels.

Required flat layout:

```text
Monday/
  Website Redesign - 100.md
  Design homepage - 101.md
  Create wireframes - 102.md
  Review brand assets - 103.md
  Engineering Backlog Item - 204.md
  Marketing Launch Task - 305.md
```

Not allowed:

```text
Monday/
  Product Roadmap/
    Website Redesign - 100.md
```

Not allowed:

```text
Monday/
  Website Redesign/
    Design homepage - 101.md
```

Organization is handled by properties, links, and Obsidian Bases, not folders.

The plugin should not expose a `folder_strategy` setting in the MVP.

---

## 6. Board Sync Model

The user must manually configure the Monday boards to sync.

The plugin must not auto-discover and sync all accessible boards.

Example settings:

```yaml
boards:
  - board_id: "987654321"
    board_name_hint: "Product Roadmap"
    enabled: true
    assignee_column_ids:
      - "person"
      - "owner"
  - board_id: "123456789"
    board_name_hint: "Engineering Backlog"
    enabled: true
    assignee_column_ids: []
```

`board_name_hint` is optional and only used for display before the first successful validation. The authoritative board name comes from Monday.

### 6.1 Board validation

The settings tab should allow the user to validate each board.

Validation should confirm:

1. The board exists.
2. The API token can access the board.
3. The board metadata can be read.
4. The board columns can be read.
5. Items can be queried.
6. The board hierarchy type can be detected when available.

Settings display example:

```text
Configured boards:
✓ Product Roadmap — 987654321
✓ Engineering Backlog — 123456789
⚠ Marketing Tasks — inaccessible or invalid token
```

---

## 7. User Workflow

### 7.1 Initial setup

The user configures:

```yaml
api_token: stored_securely
sync_folder: "Monday"
boards:
  - board_id: "987654321"
    enabled: true
assignee_filter_mode: "current_user"
rename_files_on_monday_name_change: true
sync_updates: true
sync_child_items: true
max_updates_per_item: 25
include_done_items: true
include_archived_items: false
property_prefix: "monday_"
filename_template: "{{sanitized_name}} - {{monday_item_id}}"
```

### 7.2 Normal sync

The user runs:

```text
Monday Sync: Sync Configured Boards
```

The plugin then:

1. Loads settings.
2. Validates that at least one board is configured and enabled.
3. Authenticates with Monday.
4. Queries the current Monday user.
5. Syncs each enabled board.
6. Finds all relevant assigned items.
7. Includes any required ancestor items as context notes.
8. Builds the item hierarchy.
9. Creates or updates one flat-folder note per included Monday item.
10. Updates only `monday_*` properties.
11. Replaces only `monday-sync` fenced regions.
12. Saves the local sync index.
13. Reports a concise sync summary.

---

## 8. Commands

### 8.1 Required MVP commands

```text
Monday Sync: Sync Configured Boards
Monday Sync: Validate Configuration
Monday Sync: Rebuild Monday Index
Monday Sync: Open Settings
```

### 8.2 Optional later commands

```text
Monday Sync: Sync Current Note
Monday Sync: Sync Current Board
Monday Sync: Refresh Parent/Child Links
Monday Sync: Mark Missing Items
```

---

## 9. Monday Hierarchy Model

The plugin must support the following conceptual hierarchy:

```text
Board
└── Item
    └── Child Item / Subitem
        └── Child Item
            └── Child Item
                └── Child Item
```

Hierarchy level rules:

```text
Level 0 = top-level board item
Level 1 = child of top-level item
Level 2 = child of level 1 item
Level 3 = child of level 2 item
Level 4 = child of level 3 item
```

The plugin should not hard-code a single subitem level.

Each synced item must store hierarchy metadata:

```yaml
monday_item_id: "333333333"
monday_parent_item_id: "222222222"
monday_root_item_id: "111111111"
monday_hierarchy_level: 2
monday_is_child_item: true
monday_has_child_items: false
```

---

## 10. One Note Per Monday Item

Every included Monday item gets exactly one Obsidian note.

This includes:

1. Top-level board items.
2. Classic Monday subitems.
3. Multi-level board child items.
4. Nested child items under other child items.

Example Monday structure:

```text
Website Redesign
├── Design homepage
│   ├── Create wireframes
│   └── Review brand assets
└── Implement frontend
    ├── Build hero section
    └── Add analytics events
```

Expected notes in the flat sync folder:

```text
Monday/
  Website Redesign - 100.md
  Design homepage - 101.md
  Create wireframes - 102.md
  Review brand assets - 103.md
  Implement frontend - 104.md
  Build hero section - 105.md
  Add analytics events - 106.md
```

---

## 11. Upsert Identity

All upsert behavior must use stable Monday item IDs.

The note must not be identified by filename or item name.

Required identity property:

```yaml
monday_item_id: "1234567890"
```

Required hierarchy identity properties:

```yaml
monday_item_id: "1234567890"
monday_parent_item_id: "9876543210"
monday_root_item_id: "5555555555"
monday_board_id: "111111111"
monday_hierarchy_level: 1
monday_is_child_item: true
monday_has_child_items: false
```

### 11.1 Upsert behavior

When sync runs:

1. Find an existing note by `monday_item_id`.
2. If found, update that note.
3. If not found, create a new note in the configured flat sync folder.
4. If the Monday item name changed:
   1. Update `monday_item_name`.
   2. Update the generated title region if present.
   3. Rename the file if `rename_files_on_monday_name_change` is enabled.
   4. Update generated parent/child links in affected notes.
5. Never create a duplicate note for the same `monday_item_id`.

### 11.2 Index recovery

The local index is for performance only.

If the index is missing or corrupt, rebuild it by scanning Markdown files in `sync_folder` for `monday_item_id`.

---

## 12. File Naming

Default filename template:

```text
{{sanitized_name}} - {{monday_item_id}}.md
```

Example:

```text
Design homepage - 101.md
```

Filename sanitization must:

1. Remove or replace characters invalid for the filesystem.
2. Collapse excessive whitespace.
3. Limit filename length to a safe maximum.
4. Include the Monday item ID to avoid collisions.
5. Append a disambiguator if a collision still occurs.

Recommended behavior for duplicate names:

```text
Design homepage - 101.md
Design homepage - 202.md
```

The Monday item ID should normally be enough to avoid collisions.

---

## 13. Required Monday-Owned Properties

Every synced note should include these properties when available:

```yaml
monday_item_id: "1234567890"
monday_item_name: "Design homepage"
monday_board_id: "987654321"
monday_board_name: "Product Roadmap"
monday_group_id: "topics"
monday_group_name: "In Progress"
monday_url: "https://..."
monday_sync_status: "active"
monday_last_synced_at: 2026-04-26T10:30:00-07:00
monday_updated_at: 2026-04-25T14:12:00Z
```

Every child item should also include:

```yaml
monday_is_child_item: true
monday_parent_item_id: "100"
monday_parent_item_name: "Website Redesign"
monday_parent_note: "[[Website Redesign - 100]]"
monday_root_item_id: "100"
monday_root_item_name: "Website Redesign"
monday_root_note: "[[Website Redesign - 100]]"
monday_hierarchy_level: 1
```

Every item with children should include:

```yaml
monday_has_child_items: true
monday_child_item_ids:
  - "101"
  - "104"
monday_child_notes:
  - "[[Design homepage - 101]]"
  - "[[Implement frontend - 104]]"
```

Top-level items should include:

```yaml
monday_is_child_item: false
monday_parent_item_id: null
monday_parent_note: null
monday_root_item_id: "100"
monday_root_note: "[[Website Redesign - 100]]"
monday_hierarchy_level: 0
```

Assignment/context properties:

```yaml
monday_assigned_to_me: true
monday_synced_as_context: false
```

For context-only ancestor notes:

```yaml
monday_assigned_to_me: false
monday_synced_as_context: true
monday_sync_status: "context"
```

Plugin-managed tags, if needed:

```yaml
monday_tags:
  - monday
  - monday/synced
  - monday/child
```

---

## 14. Monday Column Mapping

Each Monday board column should become an Obsidian property where practical.

### 14.1 Property naming rules

Column title:

```text
Due Date
```

Becomes:

```yaml
monday_due_date: 2026-05-15
```

Rules:

1. Lowercase.
2. Trim whitespace.
3. Replace spaces and unsupported characters with underscores.
4. Prefix with `monday_`.
5. Avoid collisions by appending the Monday column ID.

Example collision:

```yaml
monday_status: "Working on it"
monday_status_status_1: "Blocked"
```

### 14.2 Type mapping

| Monday column type | Obsidian property representation |
|---|---|
| Text | String |
| Long text | String |
| Status | String |
| People | List of names plus list of IDs |
| Date | Date |
| Timeline | Start and end date properties |
| Numbers | Number |
| Checkbox | Boolean |
| Dropdown | List |
| Tags | List in `monday_*` property |
| Link | URL string |
| Files | List of file names/URLs |
| Dependency | List of related Monday item IDs |
| Connect boards | List of related Monday item IDs or display values |
| Mirror/Rollup | Read-only display value if available |

People mapping:

```yaml
monday_assignees:
  - "Alex Smith"
  - "Jamie Rivera"
monday_assignee_ids:
  - "111222"
  - "333444"
```

Timeline mapping:

```yaml
monday_timeline_start: 2026-05-01
monday_timeline_end: 2026-05-15
```

### 14.3 Rollup columns on multi-level boards

For multi-level boards, rollup-capable columns may contain calculated values from child items.

The plugin should:

1. Treat rollup values as read-only Monday-derived metadata.
2. Store them in `monday_*` properties when returned.
3. Avoid attempting to infer editable semantics.
4. Prefer display-friendly values for Bases.
5. Include a separate metadata field if a value is known to be calculated versus leaf/static.

Example:

```yaml
monday_budget: 125000
monday_budget_is_leaf_value: false
```

---

## 15. Parent and Child Linking

### 15.1 Parent notes

A parent note should link to its immediate child notes in a generated fenced section.

```markdown
## Monday Child Items

<!-- monday-sync:children:start -->
- [[Design homepage - 101]]
- [[Implement frontend - 104]]
<!-- monday-sync:children:end -->
```

MVP behavior:

```text
Show immediate children only.
```

Later optional behavior:

```text
Allow a setting to show the full descendant tree.
```

### 15.2 Child notes

A child note should link back to its parent and root in a generated fenced section.

```markdown
## Monday Hierarchy

<!-- monday-sync:hierarchy:start -->
- Parent: [[Website Redesign - 100]]
- Root: [[Website Redesign - 100]]
- Level: 1
<!-- monday-sync:hierarchy:end -->
```

For a deeper child:

```markdown
## Monday Hierarchy

<!-- monday-sync:hierarchy:start -->
- Parent: [[Design homepage - 101]]
- Root: [[Website Redesign - 100]]
- Level: 2
<!-- monday-sync:hierarchy:end -->
```

### 15.3 Link updates after rename

When a Monday item is renamed and the note file is renamed, the plugin must update generated links in `monday-sync` fenced sections.

The plugin must not rewrite user-authored links outside generated sections.

---

## 16. Generated Markdown Sections

The plugin may create and update these generated sections:

```markdown
## Monday Hierarchy

<!-- monday-sync:hierarchy:start -->
...
<!-- monday-sync:hierarchy:end -->

## Monday Summary

<!-- monday-sync:summary:start -->
...
<!-- monday-sync:summary:end -->

## Monday Child Items

<!-- monday-sync:children:start -->
...
<!-- monday-sync:children:end -->

## Monday Updates

<!-- monday-sync:updates:start -->
...
<!-- monday-sync:updates:end -->
```

The plugin may overwrite only content between matching `monday-sync` markers.

If a required marker pair is missing from a note, the plugin may append a new generated section to the note.

It must not infer that similarly named user sections are safe to overwrite unless they contain the explicit marker pair.

---

## 17. Note Templates

### 17.1 New top-level item note

```markdown
---
monday_item_id: "100"
monday_item_name: "Website Redesign"
monday_board_id: "987654321"
monday_board_name: "Product Roadmap"
monday_group_id: "topics"
monday_group_name: "In Progress"
monday_is_child_item: false
monday_has_child_items: true
monday_parent_item_id: null
monday_parent_note: null
monday_root_item_id: "100"
monday_root_item_name: "Website Redesign"
monday_root_note: "[[Website Redesign - 100]]"
monday_hierarchy_level: 0
monday_child_item_ids:
  - "101"
  - "104"
monday_child_notes:
  - "[[Design homepage - 101]]"
  - "[[Implement frontend - 104]]"
monday_status: "Working on it"
monday_priority: "High"
monday_due_date: 2026-05-15
monday_assignees:
  - "Alex Smith"
monday_assignee_ids:
  - "111222"
monday_assigned_to_me: true
monday_synced_as_context: false
monday_sync_status: "active"
monday_last_synced_at: 2026-04-26T10:30:00-07:00
monday_updated_at: 2026-04-25T14:12:00Z
monday_url: "https://example.monday.com/boards/987654321/pulses/100"
monday_tags:
  - monday
  - monday/synced
---

# Website Redesign

## Monday Summary

<!-- monday-sync:summary:start -->
- Board: Product Roadmap
- Group: In Progress
- Status: Working on it
- Priority: High
- Due: 2026-05-15
- Assignees: Alex Smith
<!-- monday-sync:summary:end -->

## Monday Child Items

<!-- monday-sync:children:start -->
- [[Design homepage - 101]]
- [[Implement frontend - 104]]
<!-- monday-sync:children:end -->

## Monday Updates

<!-- monday-sync:updates:start -->
### 2026-04-25 14:12 — Jamie Rivera

Please confirm the revised launch date.
<!-- monday-sync:updates:end -->
```

### 17.2 New child item note

```markdown
---
monday_item_id: "101"
monday_item_name: "Design homepage"
monday_board_id: "987654321"
monday_board_name: "Product Roadmap"
monday_group_id: "topics"
monday_group_name: "In Progress"
monday_is_child_item: true
monday_has_child_items: true
monday_parent_item_id: "100"
monday_parent_item_name: "Website Redesign"
monday_parent_note: "[[Website Redesign - 100]]"
monday_root_item_id: "100"
monday_root_item_name: "Website Redesign"
monday_root_note: "[[Website Redesign - 100]]"
monday_hierarchy_level: 1
monday_child_item_ids:
  - "102"
  - "103"
monday_child_notes:
  - "[[Create wireframes - 102]]"
  - "[[Review brand assets - 103]]"
monday_status: "Working on it"
monday_priority: "Medium"
monday_due_date: 2026-05-08
monday_assignees:
  - "Alex Smith"
monday_assignee_ids:
  - "111222"
monday_assigned_to_me: true
monday_synced_as_context: false
monday_sync_status: "active"
monday_last_synced_at: 2026-04-26T10:30:00-07:00
monday_updated_at: 2026-04-25T14:12:00Z
monday_url: "https://example.monday.com/boards/987654321/pulses/101"
monday_tags:
  - monday
  - monday/synced
  - monday/child
---

# Design homepage

## Monday Hierarchy

<!-- monday-sync:hierarchy:start -->
- Parent: [[Website Redesign - 100]]
- Root: [[Website Redesign - 100]]
- Level: 1
<!-- monday-sync:hierarchy:end -->

## Monday Summary

<!-- monday-sync:summary:start -->
- Board: Product Roadmap
- Group: In Progress
- Status: Working on it
- Priority: Medium
- Due: 2026-05-08
- Assignees: Alex Smith
<!-- monday-sync:summary:end -->

## Monday Child Items

<!-- monday-sync:children:start -->
- [[Create wireframes - 102]]
- [[Review brand assets - 103]]
<!-- monday-sync:children:end -->

## Monday Updates

<!-- monday-sync:updates:start -->
### 2026-04-24 09:15 — Morgan Chen

Please attach the first homepage draft when ready.
<!-- monday-sync:updates:end -->
```

---

## 18. Monday Updates / Comments

Monday updates should not become Obsidian properties.

They should be copied into the generated `Monday Updates` section.

Rules:

1. Render updates in reverse chronological order.
2. Include timestamp, author, and body.
3. Strip or sanitize unsupported HTML.
4. Preserve links where practical.
5. Treat updates as read-only generated content.
6. Overwrite only the fenced updates region on sync.
7. Limit the number of updates per note using `max_updates_per_item`.

Example:

```markdown
## Monday Updates

<!-- monday-sync:updates:start -->
### 2026-04-25 14:12 — Jamie Rivera

Please confirm whether the revised launch date is final.

---

### 2026-04-22 09:03 — Morgan Chen

Design review is complete.
<!-- monday-sync:updates:end -->
```

---

## 19. Assignment Filtering

Default behavior:

```text
Sync Monday items where the authenticated user appears in a configured People column.
```

MVP behavior:

1. The user configures board IDs manually.
2. The plugin queries the board columns.
3. The user may select which People columns count as assignment columns.
4. If none are selected, all People columns may be treated as assignment columns.

Example:

```yaml
boards:
  - board_id: "987654321"
    enabled: true
    assignee_column_ids:
      - "person"
      - "owner"
```

### 19.1 Ancestor context rule

A child item may be assigned to the user while its parent is not.

The plugin must sync the full ancestor chain required to preserve hierarchy.

Example:

```text
Parent item: not assigned to me
Child item: assigned to me
```

Expected behavior:

1. Sync the child item.
2. Also create or update the parent note as a context note.
3. Mark the parent note:

```yaml
monday_assigned_to_me: false
monday_synced_as_context: true
monday_sync_status: "context"
```

This avoids orphan child notes and lets Bases hide context-only notes if desired.

---

## 20. Multi-level Board Support

Multi-level board support is part of the MVP.

The plugin must detect and handle both:

```text
classic
multi_level
```

when Monday exposes a board hierarchy type.

Implementation requirements:

1. Query all relevant items on the configured board.
2. Include subitems/child items.
3. Use parent references to reconstruct the hierarchy.
4. Calculate root item ID for every item.
5. Calculate hierarchy level for every item.
6. Create or update one note per included item.
7. Render parent/child links.
8. Store hierarchy metadata in `monday_*` properties.

### 20.1 Internal normalized item model

```ts
interface MondaySyncItem {
  id: string;
  name: string;
  boardId: string;
  boardName: string;
  groupId: string | null;
  groupName: string | null;
  parentItemId: string | null;
  rootItemId: string;
  hierarchyLevel: number;
  childItemIds: string[];
  columnValues: NormalizedColumnValue[];
  updates: MondayUpdate[];
  url: string | null;
  updatedAt: string | null;
  assignedToCurrentUser: boolean;
  syncedAsContext: boolean;
  syncStatus: "active" | "context" | "missing" | "archived" | "error";
}
```

### 20.2 Hierarchy reconstruction

The plugin should build hierarchy from:

1. Top-level items returned by board item queries.
2. `subitems` returned on items.
3. `parent_item` references on subitems/child items, when available.
4. Additional item lookups if required to resolve missing ancestors.

If a parent cannot be resolved, create the child note anyway and set:

```yaml
monday_parent_item_id: "unknown-or-id-if-known"
monday_parent_note: null
monday_sync_status: "error"
```

---

## 21. Pagination

The plugin must support cursor-based pagination.

For each configured board:

1. Query the first page with `items_page`.
2. Store the returned cursor.
3. Continue querying with `next_items_page`.
4. Stop when no cursor remains.
5. Merge all returned items into one normalized item list.
6. Build hierarchy after collecting all pages.

The plugin must not assume a board has fewer than 500 items.

Cursor handling must be completed within the cursor validity window.

---

## 22. Monday API Requirements

The implementation should centralize all Monday API usage in `MondayClient`.

### 22.1 Endpoint

Use the Monday GraphQL endpoint:

```text
https://api.monday.com/v2
```

### 22.2 Headers

Use headers equivalent to:

```http
Authorization: <api token>
Content-Type: application/json
API-Version: 2026-04
```

The API version should be centralized as a constant or setting so it can be updated later.

### 22.3 GraphQL request format

Requests should send:

```json
{
  "query": "...",
  "variables": {}
}
```

### 22.4 Error handling

The client must check:

1. HTTP transport errors.
2. Non-2xx HTTP statuses.
3. GraphQL `errors` array.
4. Partial data responses.
5. Monday complexity/rate-limit errors.
6. Missing expected fields.

Do not trust `data` blindly if `errors` are present.

### 22.5 Suggested board metadata query

```graphql
query GetBoardMetadata($boardIds: [ID!]) {
  boards(ids: $boardIds, hierarchy_types: [classic, multi_level]) {
    id
    name
    hierarchy_type
    columns {
      id
      title
      type
      capabilities
    }
  }
}
```

### 22.6 Suggested first page query

This query is illustrative. It should be adapted to the actual Monday API schema version used during implementation.

```graphql
query GetBoardItems($boardId: [ID!], $limit: Int!) {
  boards(ids: $boardId, hierarchy_types: [classic, multi_level]) {
    id
    name
    hierarchy_type
    items_page(
      limit: $limit
      hierarchy_scope_config: allItems
    ) {
      cursor
      items {
        id
        name
        updated_at
        url
        group {
          id
          title
        }
        parent_item {
          id
          name
        }
        subitems {
          id
          name
          updated_at
          url
          parent_item {
            id
            name
          }
        }
        column_values(capabilities: [CALCULATED]) {
          id
          type
          text
          value
          column {
            id
            title
            type
          }
        }
        updates(limit: 25) {
          id
          created_at
          body
          creator {
            id
            name
          }
        }
      }
    }
  }
}
```

### 22.7 Suggested next page query

```graphql
query GetNextItemsPage($cursor: String!, $limit: Int!) {
  next_items_page(cursor: $cursor, limit: $limit) {
    cursor
    items {
      id
      name
      updated_at
      url
      group {
        id
        title
      }
      parent_item {
        id
        name
      }
      subitems {
        id
        name
        updated_at
        url
        parent_item {
          id
          name
        }
      }
      column_values(capabilities: [CALCULATED]) {
        id
        type
        text
        value
        column {
          id
          title
          type
        }
      }
      updates(limit: 25) {
        id
        created_at
        body
        creator {
          id
          name
        }
      }
    }
  }
}
```

### 22.8 API documentation notes

Implementation should verify exact query fields against the selected Monday API version.

Known relevant Monday API behaviors:

1. Board items are queried with `items_page` and subsequent pages use `next_items_page`.
2. Multi-level boards can contain multiple subitem layers.
3. Multi-level board hierarchy should be reconstructed using parent relationships.
4. Rollup-capable column values on multi-level boards may require `capabilities: [CALCULATED]`.
5. API versions change; centralize version-specific behavior.

---

## 23. Sync Algorithm

### 23.1 Full sync

1. Load settings.
2. Validate API token exists.
3. Validate at least one board is configured and enabled.
4. Query current Monday user.
5. For each enabled board:
   1. Query board metadata.
   2. Query board columns.
   3. Query all items using pagination.
   4. Query child relationships and column values.
   5. Query updates/comments if enabled.
   6. Normalize Monday items.
   7. Determine which items are assigned to the current user.
   8. Include ancestor items required for context.
   9. Build hierarchy tree.
   10. Create or update notes for every included item.
   11. Update parent-child generated links.
6. Mark previously synced items from configured boards that were not returned as missing, archived, or error as appropriate.
7. Save sync index.
8. Show sync summary.

### 23.2 Sync summary example

```text
Monday sync complete: 42 updated, 8 created, 3 context notes updated, 2 missing, 0 failed.
```

---

## 24. Local Sync Index

The plugin should maintain a JSON index in its plugin data directory.

Example:

```json
{
  "version": 1,
  "items": {
    "100": {
      "path": "Monday/Website Redesign - 100.md",
      "board_id": "987654321",
      "parent_item_id": null,
      "root_item_id": "100",
      "hierarchy_level": 0,
      "last_synced_at": "2026-04-26T10:30:00-07:00",
      "last_monday_updated_at": "2026-04-25T14:12:00Z"
    },
    "101": {
      "path": "Monday/Design homepage - 101.md",
      "board_id": "987654321",
      "parent_item_id": "100",
      "root_item_id": "100",
      "hierarchy_level": 1,
      "last_synced_at": "2026-04-26T10:30:00-07:00",
      "last_monday_updated_at": "2026-04-25T14:12:00Z"
    }
  }
}
```

The index should be updated whenever a note is created, renamed, moved by plugin behavior, or matched by scanning.

The index must never be the sole source of identity. The `monday_item_id` property is authoritative.

---

## 25. Deleted, Archived, or Missing Items

The plugin must never delete notes automatically.

If an item previously synced from a configured board is no longer returned:

```yaml
monday_sync_status: "missing"
```

If the item is archived and archived items are excluded:

```yaml
monday_sync_status: "archived"
```

If the item exists but cannot be fully queried:

```yaml
monday_sync_status: "error"
```

Allowed statuses:

```yaml
monday_sync_status: "active"
monday_sync_status: "context"
monday_sync_status: "missing"
monday_sync_status: "archived"
monday_sync_status: "error"
```

The plugin should update only `monday_*` properties when marking status. It must not alter user content.

---

## 26. Settings

### 26.1 MVP settings

```ts
interface MondaySyncSettings {
  apiToken: string;
  syncFolder: string; // default: "Monday"
  boards: MondayBoardConfig[];
  assigneeFilterMode: "current_user";
  renameFilesOnMondayNameChange: boolean;
  syncUpdates: boolean;
  syncChildItems: boolean;
  maxUpdatesPerItem: number;
  includeDoneItems: boolean;
  includeArchivedItems: boolean;
  propertyPrefix: "monday_";
  filenameTemplate: "{{sanitized_name}} - {{monday_item_id}}";
  apiVersion: string; // default: "2026-04"
}

interface MondayBoardConfig {
  boardId: string;
  boardNameHint?: string;
  displayName?: string;
  enabled: boolean;
  assigneeColumnIds: string[];
}
```

### 26.2 Required defaults

```yaml
sync_folder: "Monday"
assignee_filter_mode: "current_user"
rename_files_on_monday_name_change: true
sync_updates: true
sync_child_items: true
max_updates_per_item: 25
include_done_items: true
include_archived_items: false
property_prefix: "monday_"
filename_template: "{{sanitized_name}} - {{monday_item_id}}"
api_version: "2026-04"
```

### 26.3 Explicitly excluded MVP settings

Do not implement these in the MVP:

```yaml
folder_strategy: "by_board"
scheduled_sync_enabled: false
webhook_sync_enabled: false
per_board_templates: []
custom_column_mappings: {}
bidirectional_sync_enabled: false
```

---

## 27. Implementation Architecture

```text
MondaySyncPlugin
├── SettingsTab
├── MondayClient
├── BoardConfigService
├── SyncService
├── HierarchyBuilder
├── AssignmentFilter
├── NoteRepository
├── FrontmatterMapper
├── MarkdownRenderer
├── LinkRenderer
├── SyncIndex
└── Logger
```

### 27.1 `MondayClient`

Responsible for:

```text
GraphQL requests
Authentication
API version header
Pagination
Rate-limit handling
Transport error handling
GraphQL error handling
Monday request ID logging when available
```

### 27.2 `BoardConfigService`

Responsible for:

```text
Manual board configuration
Board validation
Board metadata caching
Settings tab board status
Assignee column selection
```

### 27.3 `SyncService`

Responsible for:

```text
Overall sync orchestration
Calling MondayClient
Applying assignment filtering
Including context ancestors
Creating update plans
Reporting sync summaries
```

### 27.4 `HierarchyBuilder`

Responsible for:

```text
Parent-child relationship detection
Root item calculation
Hierarchy level calculation
Child item ordering
Cycle detection
Invalid hierarchy handling
```

### 27.5 `AssignmentFilter`

Responsible for:

```text
Current-user matching
People-column handling
Assigned/context classification
Ancestor inclusion
```

### 27.6 `NoteRepository`

Responsible for:

```text
Finding notes by monday_item_id
Creating notes in the flat sync folder
Renaming note files
Updating monday_* frontmatter only
Preserving non-monday properties
Replacing only monday-sync fenced sections
Rebuilding index from vault files
```

### 27.7 `FrontmatterMapper`

Responsible for:

```text
Monday column-to-property mapping
Type normalization
Property prefixing
Collision handling
Hierarchy properties
Sync status properties
Preserving user-owned properties
```

### 27.8 `MarkdownRenderer`

Responsible for:

```text
Summary section
Hierarchy section
Children section
Updates section
Markdown escaping
Date formatting
HTML sanitization for updates
```

### 27.9 `LinkRenderer`

Responsible for:

```text
Obsidian note links
Parent links
Child links
Root links
Safe link display names
Generated link updates after rename
```

### 27.10 `SyncIndex`

Responsible for:

```text
Monday item ID to file path mapping
Index persistence
Index rebuild
Rename tracking
Corruption recovery
```

---

## 28. Core Implementation Details

### 28.1 Updating frontmatter safely

When updating frontmatter:

1. Parse existing frontmatter.
2. Remove or replace only keys beginning with `monday_`.
3. Preserve all non-`monday_` keys exactly as much as the Obsidian API allows.
4. Write the new `monday_*` keys.
5. Do not modify `tags`.

### 28.2 Updating generated sections safely

When updating a generated section:

1. Find the exact marker pair.
2. Replace only the content between the markers.
3. Leave marker lines intact.
4. If marker pair does not exist, append a new generated section.
5. Do not overwrite same-named sections without markers.

### 28.3 Note creation

When creating a new note:

1. Create the note in `sync_folder`.
2. Use the filename template.
3. Add `monday_*` properties.
4. Add generated sections.
5. Do not add required user writing sections.
6. Do not add standard Obsidian tags unless the user explicitly configures that in a future version.

### 28.4 Rename behavior

When renaming a note:

1. Determine the new filename from the template.
2. Keep the note in the same flat `sync_folder`.
3. Rename only if the target path differs.
4. If the target path exists and is not the same `monday_item_id`, resolve collision safely.
5. Update the sync index.
6. Regenerate affected parent/child link sections.

---

## 29. MVP Scope

The MVP should include:

1. Manual board ID configuration.
2. Manual board validation.
3. Manual sync command.
4. API token setting.
5. Flat folder sync only.
6. Current-user assignment filtering.
7. Optional per-board People column assignment configuration.
8. One note per synced Monday item.
9. Notes for child items and nested child items.
10. Ancestor context notes.
11. Parent-to-child generated links.
12. Child-to-parent/root generated links.
13. Stable upsert by `monday_item_id`.
14. Filename/title update when Monday names change.
15. `monday_*` properties for Monday metadata and columns.
16. Generated Monday updates section.
17. Local sync index.
18. Index rebuild command.
19. Safe replacement of only `monday-sync` fenced regions.
20. Preservation of all non-`monday_*` properties and all unfenced Markdown.
21. Missing item status instead of deletion.

---

## 30. Deferred Features

Defer these to avoid overengineering:

1. Scheduled sync.
2. Webhook sync.
3. Bidirectional editing.
4. Creating Monday updates from Obsidian.
5. Downloading Monday file attachments.
6. Per-board note templates.
7. Complex custom column mapping UI.
8. Full custom hierarchy rendering.
9. Team-wide sync views.
10. Auto-discovery of all accessible boards.
11. Writing Obsidian task checkboxes back to Monday.
12. Conflict resolution for user-edited Monday-managed properties.
13. Nested folder strategies.
14. Standard Obsidian tag mutation.

---

## 31. Acceptance Criteria

### 31.1 Manual board configuration

Given no boards are configured, when sync runs, then the plugin shows a message requiring at least one configured board.

Given boards are configured manually, when sync runs, then only enabled configured boards are queried.

### 31.2 Flat storage

Given notes are created by the plugin, they are created directly inside `sync_folder`.

No board, project, root item, group, or hierarchy folders are created.

### 31.3 One note per item

Given a Monday parent item has three child items, when sync runs, then four notes are created: one parent note and one note per child item.

### 31.4 Nested child support

Given a Monday item has child items multiple levels deep, when sync runs, then each included item gets its own note with correct parent, root, and hierarchy level properties.

### 31.5 Parent links

Given a parent item has child items, when sync runs, then the parent note contains links to its immediate child notes inside the `monday-sync:children` fenced section.

### 31.6 Child backlinks

Given a child item has a parent item, when sync runs, then the child note contains a generated link back to the parent and root notes inside the `monday-sync:hierarchy` fenced section.

### 31.7 Stable upsert

Given a Monday item has already been synced, when its Monday name changes, then the plugin updates the existing note instead of creating a duplicate.

### 31.8 Filename consistency

Given `rename_files_on_monday_name_change` is enabled, when a Monday item name changes, then the note file is renamed and generated parent/child links are updated.

### 31.9 User content preservation

Given a user has written Markdown outside `monday-sync` fenced sections, when sync runs, that Markdown remains unchanged.

### 31.10 User property preservation

Given a user has custom properties that do not start with `monday_`, when sync runs, those properties remain unchanged.

### 31.11 Tag preservation

Given a user has standard Obsidian `tags`, when sync runs, those tags remain unchanged.

### 31.12 Missing item safety

Given a previously synced Monday item is no longer returned, when sync runs, the note is not deleted and receives:

```yaml
monday_sync_status: "missing"
```

### 31.13 Bases support

Given notes are synced, the user can build Obsidian Bases views using at least:

```yaml
monday_item_name
monday_board_name
monday_group_name
monday_status
monday_due_date
monday_assignees
monday_assigned_to_me
monday_synced_as_context
monday_is_child_item
monday_hierarchy_level
monday_parent_note
monday_root_note
monday_sync_status
```

---

## 32. Example Obsidian Bases Views

### 32.1 Top-level projects only

Filter:

```text
monday_is_child_item = false
```

Useful columns:

```text
monday_item_name
monday_status
monday_priority
monday_due_date
monday_assignees
monday_child_notes
```

### 32.2 My actionable child tasks

Filter:

```text
monday_is_child_item = true
monday_assigned_to_me = true
monday_sync_status = active
```

Useful columns:

```text
monday_item_name
monday_parent_note
monday_root_note
monday_status
monday_due_date
monday_priority
```

### 32.3 Full project tree context

Filter:

```text
monday_root_note = [[Website Redesign - 100]]
```

Useful columns:

```text
monday_hierarchy_level
monday_item_name
monday_parent_note
monday_status
monday_assignees
monday_due_date
```

### 32.4 Context notes only

Filter:

```text
monday_synced_as_context = true
```

Useful columns:

```text
monday_item_name
monday_root_note
monday_child_notes
monday_sync_status
```

---

## 33. Suggested Test Plan

### 33.1 Unit tests

Test:

1. Filename sanitization.
2. Property name normalization.
3. `monday_*` property replacement.
4. Non-`monday_*` property preservation.
5. `tags` preservation.
6. Fenced section replacement.
7. Missing marker section append.
8. Hierarchy tree construction.
9. Root item calculation.
10. Hierarchy level calculation.
11. Assignment filtering.
12. Ancestor context inclusion.
13. Sync index rebuild.

### 33.2 Integration tests with mocked Monday API

Test:

1. Classic board with top-level items only.
2. Classic board with subitems.
3. Multi-level board with three or more levels.
4. Child assigned to current user while parent is not assigned.
5. Item rename.
6. File collision.
7. Missing item.
8. Archived item.
9. GraphQL partial error.
10. Pagination across multiple pages.

### 33.3 Manual QA

Verify:

1. Notes are created in one flat folder.
2. User-authored Markdown is preserved.
3. User properties are preserved.
4. User tags are preserved.
5. Generated links are updated after rename.
6. Bases can filter by hierarchy and assignment properties.
7. No duplicate notes are created for renamed Monday items.

---

## 34. Implementation Handoff Summary

Build a read-only Obsidian plugin that syncs manually configured Monday.com boards into a single flat Obsidian folder. Every synced Monday item, including nested subitems on multi-level boards, gets one Markdown note keyed by `monday_item_id`. The plugin owns only `monday_*` properties and `monday-sync` fenced Markdown regions. It must preserve all other properties, tags, and Markdown exactly. Parent/child relationships are represented through `monday_*` properties and generated Obsidian links. Monday comments are copied into generated read-only sections. The plugin never deletes user notes and never writes back to Monday.
