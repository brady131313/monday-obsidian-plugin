import { App, PluginSettingTab, Setting } from "obsidian";
import type MondaySyncPlugin from "./main";
import { DEFAULT_SETTINGS } from "./settings-data";
import type { MondayBoardConfig, MondaySyncSettings } from "./settings-data";

export { DEFAULT_SETTINGS };
export type { MondayBoardConfig, MondaySyncSettings };

export class MondaySyncSettingTab extends PluginSettingTab {
	plugin: MondaySyncPlugin;

	constructor(app: App, plugin: MondaySyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Monday API token")
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc("Used only to read configured Monday boards.")
			.addText((text) =>
				text
					.setPlaceholder("Enter API token")
					.setValue(this.plugin.settings.apiToken)
					.onChange(async (value) => {
						this.plugin.settings.apiToken = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Sync folder")
			.setDesc("Markdown notes will be stored directly in this folder.")
			.addText((text) =>
				text
					.setPlaceholder("Monday")
					.setValue(this.plugin.settings.syncFolder)
					.onChange(async (value) => {
						this.plugin.settings.syncFolder =
							value || DEFAULT_SETTINGS.syncFolder;
						await this.plugin.saveSettings();
					}),
			);
	}
}
