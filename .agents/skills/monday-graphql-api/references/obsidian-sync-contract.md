# Obsidian Monday sync contract

Sources:

- `docs/implementation.md`
- `docs/obsidian-monday-sync-plugin-spec.md`

## Product boundary

Build a read-only Obsidian plugin that mirrors selected monday.com board items into local Markdown notes. Monday remains the source of truth for project/task metadata, assignments, statuses, dates, hierarchy, and comments. Obsidian remains the place for private working notes, custom metadata, and local organization.

Do not implement:

- Monday mutations
- bidirectional sync
- auto-discovery of arbitrary boards
- note deletion when Monday items disappear
- nested folder strategies
- a general-purpose Monday client beyond sync needs

## Required commands

Register stable command IDs:

- `sync-configured-boards`
- `validate-configuration`
- `rebuild-monday-index`
- `open-settings`

User-facing names:

- `Monday Sync: Sync Configured Boards`
- `Monday Sync: Validate Configuration`
- `Monday Sync: Rebuild Monday Index`
- `Monday Sync: Open Settings`

## Settings defaults

```ts
{
  syncFolder: "Monday",
  assigneeFilterMode: "current_user",
  renameFilesOnMondayNameChange: true,
  syncUpdates: true,
  syncChildItems: true,
  maxUpdatesPerItem: 25,
  includeDoneItems: true,
  includeArchivedItems: false,
  propertyPrefix: "monday_",
  filenameTemplate: "{{sanitized_name}} - {{monday_item_id}}",
  apiVersion: "2026-04",
}
```

Boards are manually configured with board ID, optional name hints, enabled flag, and assignee column IDs. Disabled boards are not queried.

## Ownership and preservation

The plugin may modify only:

- Obsidian properties whose keys begin with `monday_`
- Markdown inside exact `monday-sync` marker pairs

The plugin must preserve:

- all non-`monday_*` properties
- the standard Obsidian `tags` property
- unfenced Markdown body content
- user-created headings, links, and sections

Use `monday_tags` for plugin-managed tags, never the standard `tags` property.

## Note identity and storage

Every included Monday item gets exactly one note. This includes top-level items, classic subitems, and multi-level child items.

Identity is `monday_item_id`, never filename or item name. The local index is an optimization only and must be rebuildable by scanning notes for `monday_item_id`.

All notes live directly inside one flat `syncFolder`. Do not create board, group, project, root item, or hierarchy subfolders.

Default filename:

```text
{{sanitized_name}} - {{monday_item_id}}.md
```

When Monday item names change, update the existing note and generated links. Rename the file only when `renameFilesOnMondayNameChange` is enabled.

## Required note properties

Base properties when available:

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

Hierarchy properties:

- `monday_is_child_item`
- `monday_parent_item_id`
- `monday_parent_item_name`
- `monday_parent_note`
- `monday_root_item_id`
- `monday_root_item_name`
- `monday_root_note`
- `monday_hierarchy_level`
- `monday_has_child_items`
- `monday_child_item_ids`
- `monday_child_notes`

Assignment/context properties:

- `monday_assigned_to_me`
- `monday_synced_as_context`

Statuses are a strict union:

- `active`
- `context`
- `missing`
- `archived`
- `error`

## Column mapping

Column property names:

1. Lowercase the title.
2. Trim whitespace.
3. Replace spaces and unsupported characters with underscores.
4. Prefix with `monday_`.
5. Resolve collisions by appending the Monday column ID.

Never overwrite non-`monday_*` properties.

Type mapping:

- Text/long text/status/link: string/display text
- People: display name list plus ID list
- Date: date
- Timeline: start and end date properties
- Numbers: number when parseable
- Checkbox: boolean
- Dropdown/tags/files/dependency/connect boards: list where practical
- Mirror/rollup/unknown: read-only display value fallback

## Sync workflow

Normal sync:

1. Load settings.
2. Validate that at least one board is enabled.
3. Build Monday client.
4. Query current Monday user.
5. Validate/fetch each enabled board.
6. Fetch all item pages.
7. Normalize items.
8. Reconstruct hierarchy.
9. Filter to items assigned to the current user.
10. Include required ancestors as context notes.
11. Upsert notes and generated links.
12. Mark missing/archived/error statuses without deleting notes.
13. Save the index and report created, updated, context, missing, archived, error, and failed counts.

Validation-only commands must never create, update, rename, or delete notes.

## Test expectations

Monday client tests should cover:

- successful GraphQL responses
- transport failures
- non-2xx responses
- GraphQL `errors`
- partial data with errors
- rate-limit/complexity errors
- missing expected fields
- current user and board metadata validation
- cursor pagination across multiple pages
- update limit behavior

Sync tests should cover:

- one note per top-level item, classic subitem, and multi-level child item
- current-user assignment filtering
- ancestor context inclusion
- item rename without duplicate notes
- generated link updates
- missing item status without deletion
- user-owned frontmatter and Markdown preservation
