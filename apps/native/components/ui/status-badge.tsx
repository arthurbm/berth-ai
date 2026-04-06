import { Chip } from "heroui-native";

import type {
	EndpointStatus,
	MessageStatus,
	ModelDownloadState,
	RequestLogStatus,
} from "@/types/app-state";

type StatusBadgeValue =
	| EndpointStatus
	| ModelDownloadState
	| MessageStatus
	| RequestLogStatus;

const getVariant = (value: StatusBadgeValue) => {
	if (
		value === "online" ||
		value === "ready" ||
		value === "in_use" ||
		value === "success"
	) {
		return {
			color: "success" as const,
			label: value === "in_use" ? "Em uso" : mapLabel(value),
		};
	}

	if (value === "error") {
		return { color: "danger" as const, label: "Erro" };
	}

	if (value === "cancelled" || value === "paused" || value === "aborted") {
		return { color: "warning" as const, label: mapLabel(value) };
	}

	if (
		value === "downloading" ||
		value === "starting" ||
		value === "streaming"
	) {
		return { color: "accent" as const, label: mapLabel(value) };
	}

	return { color: "default" as const, label: mapLabel(value) };
};

const mapLabel = (value: StatusBadgeValue) => {
	switch (value) {
		case "not_downloaded":
			return "Não baixado";
		case "queued":
			return "Na fila";
		case "downloading":
			return "Baixando";
		case "paused":
			return "Pausado";
		case "ready":
			return "Pronto";
		case "in_use":
			return "Em uso";
		case "offline":
			return "Offline";
		case "starting":
			return "Iniciando";
		case "online":
			return "Online";
		case "streaming":
			return "Streaming";
		case "complete":
			return "Completa";
		case "aborted":
			return "Interrompida";
		case "success":
			return "Sucesso";
		case "cancelled":
			return "Cancelada";
		default:
			return "Erro";
	}
};

export function StatusBadge({ value }: { value: StatusBadgeValue }) {
	const config = getVariant(value);

	return (
		<Chip color={config.color} size="sm" variant="soft">
			<Chip.Label>{config.label}</Chip.Label>
		</Chip>
	);
}
