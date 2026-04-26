import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./settings-data";

describe("DEFAULT_SETTINGS", () => {
	it("matches the MVP defaults", () => {
		expect(DEFAULT_SETTINGS).toEqual({
			apiToken: "",
			syncFolder: "Monday",
			boards: [],
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
		});
	});

	it("keeps strict plugin-managed property and API defaults", () => {
		expect(DEFAULT_SETTINGS.propertyPrefix).toBe("monday_");
		expect(DEFAULT_SETTINGS.apiVersion).toBe("2026-04");
	});
});
