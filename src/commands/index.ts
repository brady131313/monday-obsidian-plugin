import { App, Notice } from "obsidian";
import type MondaySyncPlugin from "../main";

const NOT_IMPLEMENTED_MESSAGE =
	"This command will be implemented in a later phase.";

interface AppWithSettings extends App {
	setting: {
		open(): void;
		openTabById(id: string): void;
	};
}

export function registerCommands(plugin: MondaySyncPlugin): void {
	plugin.addCommand({
		id: "sync-configured-boards",
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		name: "Monday Sync: Sync Configured Boards",
		callback: () => {
			new Notice(NOT_IMPLEMENTED_MESSAGE);
		},
	});

	plugin.addCommand({
		id: "validate-configuration",
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		name: "Monday Sync: Validate Configuration",
		callback: () => {
			new Notice(NOT_IMPLEMENTED_MESSAGE);
		},
	});

	plugin.addCommand({
		id: "rebuild-monday-index",
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		name: "Monday Sync: Rebuild Monday Index",
		callback: () => {
			new Notice(NOT_IMPLEMENTED_MESSAGE);
		},
	});

	plugin.addCommand({
		id: "open-settings",
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		name: "Monday Sync: Open Settings",
		callback: () => {
			openPluginSettings(plugin);
		},
	});
}

function openPluginSettings(plugin: MondaySyncPlugin): void {
	const setting = (plugin.app as AppWithSettings).setting;
	setting.open();
	setting.openTabById(plugin.manifest.id);
}
