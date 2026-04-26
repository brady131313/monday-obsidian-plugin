export interface MondayBoardConfig {
	boardId: string;
	boardNameHint?: string;
	displayName?: string;
	enabled: boolean;
	assigneeColumnIds: string[];
}

export interface MondaySyncSettings {
	apiToken: string;
	syncFolder: string;
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
	apiVersion: string;
}

export const DEFAULT_SETTINGS: MondaySyncSettings = {
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
};
