export class Logger {
	info(message: string): void {
		console.info(message);
	}

	error(message: string, error?: unknown): void {
		console.error(message, error);
	}
}
