export type MondayId = string;

export type MondaySyncStatus = "active" | "context" | "missing" | "archived" | "error";

export interface NormalizedColumnValue {
	id: MondayId;
	title: string;
	type: string;
	text: string | null;
	value: string | number | boolean | string[] | null;
	rawValue: string | null;
}

export interface MondayUpdate {
	id: MondayId;
	body: string;
	createdAt: string;
	creatorId: MondayId | null;
	creatorName: string | null;
}

export interface MondayBoardMetadata {
	id: MondayId;
	name: string;
	columns: MondayBoardColumnMetadata[];
	hierarchyType: string | null;
}

export interface MondayBoardColumnMetadata {
	id: MondayId;
	title: string;
	type: string;
}

export interface MondaySyncItem {
	id: MondayId;
	name: string;
	boardId: MondayId;
	boardName: string;
	groupId: MondayId | null;
	groupName: string | null;
	parentItemId: MondayId | null;
	rootItemId: MondayId;
	hierarchyLevel: number;
	childItemIds: MondayId[];
	columnValues: NormalizedColumnValue[];
	updates: MondayUpdate[];
	url: string | null;
	updatedAt: string | null;
	assignedToCurrentUser: boolean;
	syncedAsContext: boolean;
	syncStatus: MondaySyncStatus;
}

export interface SyncSummary {
	created: number;
	updated: number;
	context: number;
	missing: number;
	archived: number;
	error: number;
	failed: number;
}

export interface SyncIndexRecord {
	mondayItemId: MondayId;
	notePath: string;
	boardId: MondayId;
	parentItemId: MondayId | null;
	rootItemId: MondayId;
	lastSyncedAt: string;
	lastMondayUpdatedAt: string | null;
}
