/**
 * @file Describes unilens session state, and how to serialize/deserialize it
 */

import { useMemo, useState, useEffect } from "react";
import type { Capture } from "./capture";
import { UnilensClient } from "./UnilensClient";

export type UnilensState = {
	captures: Capture[];
};

export const getDefaultState = (): UnilensState => ({
	captures: [],
});


type Actions = {
	addCapture: (capture: Capture) => void;
	removeCapture: (captureId: string) => void;
};

export function useUnilensState(unilens: UnilensClient): [UnilensState, Actions] {

	const STORAGE_KEY = "unilens-session";

	// Initialize from localStorage if continuity is enabled; otherwise use defaults.
	const [state, setState] = useState<UnilensState>(() => {
		try {
			const settings = unilens.getSettings();
			if (settings?.continuity) {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					try {
						const parsed = JSON.parse(raw) as UnilensState;
						if (parsed && Array.isArray(parsed.captures)) return parsed;
					} catch (e) {
						// fall through to default
					}
				}
			}
		} catch (e) {
			// If anything goes wrong, fall back to defaults.
		}
		return getDefaultState();
	});

	// Persist to localStorage on every state change, but only if continuity was enabled
	// at initialization (per user's request we check on init only).
	useEffect(() => {
		try {
			const settings = unilens.getSettings();
			if (settings?.continuity) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                console.log("Updating storage...", state);
			}
		} catch (e) {
			// ignore storage errors
		}
	}, [state, unilens]);

	const addCapture = useMemo(
		() => (capture: Capture) =>
			setState((s) => ({
				...s,
				captures: [...s.captures, capture],
			})),
		[],
	);
	const removeCapture = useMemo(
		() => (captureId: string) =>
			setState((s) => ({
				...s,
				captures: [...s.captures.filter((c) => c.captureId !== captureId)],
			})),
		[],
	);

	return [state, { addCapture, removeCapture }];
}
