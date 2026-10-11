import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: Number.POSITIVE_INFINITY,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: Number.POSITIVE_INFINITY,
		},
	},
});

export const APP_SNAPSHOT_QUERY_KEY = ["app-snapshot"] as const;
