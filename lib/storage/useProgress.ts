"use client";
import { useSyncExternalStore } from "react";
import { progressRepository } from "./progressRepository";

export function useProgress() {
  const data = useSyncExternalStore(progressRepository.subscribe, progressRepository.getSnapshot, progressRepository.getServerSnapshot);
  return { data, ...progressRepository.actions };
}
