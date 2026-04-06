import { useContext } from "react";

import { AppDataContext } from "@/providers/app-data-provider";

export const useAppData = () => {
	const context = useContext(AppDataContext);

	if (!context) {
		throw new Error("useAppData must be used within AppDataProvider");
	}

	return context;
};
