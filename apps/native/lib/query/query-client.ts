import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Number.POSITIVE_INFINITY,
			gcTime: Number.POSITIVE_INFINITY,
			retry: 1,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
		},
	},
});

export const APP_SNAPSHOT_QUERY_KEY = ["app-snapshot"] as const;
