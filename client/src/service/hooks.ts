// Service hooks for assignments and judges

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import api from "./api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) {
    let reason = "";
    try {
      const d = await res.clone().json();
      reason = d?.error || d?.message || "";
    } catch {}
    throw new Error(`${res.status} ${res.statusText}${reason ? ` - ${reason}` : ""}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

// Assignment hooks
export function useIdeaAssignments(ideaId?: string) {
  return useQuery({
    enabled: !!ideaId,
    queryKey: ["idea-assignments", ideaId],
    queryFn: () =>
      request<{
        assignments: any[];
        maxJudges: number;
      }>(`/api/ideas/${ideaId}/assignments`),
  });
}

export function useManualAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ideaId: string; judgeIds: string[] }) => {
      return request(`/api/ideas/${payload.ideaId}/assignments`, {
        method: "POST",
        body: JSON.stringify({ judgeIds: payload.judgeIds }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["idea-assignments"] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; ideaId: string }) => {
      return request(`/api/ideas/${payload.ideaId}/assignments/${payload.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["idea-assignments"] });
    },
  });
}

export function useLockAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; ideaId: string }) => {
      return request(`/api/ideas/${payload.ideaId}/assignments/${payload.id}/lock`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["idea-assignments"] });
    },
  });
}

// Judge hooks
export function useAdminJudges() {
  return useQuery({
    queryKey: ["admin-judges"],
    queryFn: () =>
      request<{
        items: Array<{
          id: string;
          user?: {
            name?: string;
            email?: string;
          };
          capacity?: number | null;
        }>;
      }>(`/api/admin/judges`),
  });
}

