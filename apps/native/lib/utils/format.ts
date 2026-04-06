export const formatBytes = (value: number) => {
	if (value <= 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB"];
	const exponent = Math.min(
		Math.floor(Math.log(value) / Math.log(1024)),
		units.length - 1
	);
	const result = value / 1024 ** exponent;

	return `${result.toFixed(result >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const formatRelativeTime = (dateString: string | null) => {
	if (!dateString) {
		return "Nunca";
	}

	const delta = Date.now() - new Date(dateString).getTime();
	const minutes = Math.floor(delta / (1000 * 60));

	if (minutes < 1) {
		return "Agora";
	}

	if (minutes < 60) {
		return `${minutes} min atrás`;
	}

	const hours = Math.floor(minutes / 60);

	if (hours < 24) {
		return `${hours} h atrás`;
	}

	const days = Math.floor(hours / 24);

	return `${days} d atrás`;
};

export const truncateText = (value: string, maxLength: number) => {
	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength - 1)}…`;
};

export const getConversationTitle = (prompt: string) =>
	truncateText(prompt.trim(), 48) || "Nova conversa";
