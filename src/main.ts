import { Plugin } from "obsidian";
import { registerCommands } from "./commands";
import { DEFAULT_SETTINGS, MondaySyncSettings, MondaySyncSettingTab } from "./settings";

export default class MondaySyncPlugin extends Plugin {
	settings: MondaySyncSettings;

	async onload() {
		await this.loadSettings();
		registerCommands(this);
		this.addSettingTab(new MondaySyncSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MondaySyncSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
