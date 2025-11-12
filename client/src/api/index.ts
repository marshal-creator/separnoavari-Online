// API types + lightweight client (قابل‌تعویض با بک‌اند واقعی)

export type IdeaStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";

export interface Idea {
  id: string;
  title: string;
  track?: string;
  submittedAt: string; // ISO
  updatedAt?: string;  // ISO
  status: IdeaStatus;
  scoreAvg?: number | null;
  fileUrl?: string | null;
  userId?: number | string;
  contactEmail?: string | null;
  submitterName?: string | null;
  submitterUsername?: string | null;
  phone?: string | null;
  teamMembers?: string | string[] | Record<string, unknown> | null;
  executiveSummary?: string | null;
  files?: { pdf?: string | null; word?: string | null } | null;
  userEmail?: string | null;
  userName?: string | null;
  assignments?: Assignment[];
}

export interface Judge {
  id: string;
  name: string;
  username?: string | null;
  email?: string | null;
  projectCount?: number;
}

export interface Assignment {
  id: string;
  ideaId?: string;
  judgeId?: string | null;
  judgeName?: string | null;
  judgeUsername?: string | null;
  status: "ASSIGNED" | "DONE" | "PENDING";
  description?: string | null;
  finalScore?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  decisionAt?: string | null;
  pdfUrl?: string | null;
  evaluation?: unknown;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "judge" | "user";
  createdAt: string;
  status?: "ACTIVE" | "SUSPENDED";
  lastLogin?: string | null;
  ideasSubmitted?: number;
}

/* ------------------------------------------------------------------ */
/*                    Fetch helper (typed, JSON default)               */
/* ------------------------------------------------------------------ */

const CONTENT_TYPE_JSON = "application/json";

// const API_BASE = "http://localhost:5000";

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", CONTENT_TYPE_JSON);
  }

  const fullUrl = url.startsWith("http") ? url : `${url}`;
  const res = await fetch(fullUrl, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!res.ok) {
    // Optional: try to read error payload
    let reason: string | undefined;
    try {
      const data = await res.clone().json();
      reason = (data && (data.message || data.error)) as string | undefined;
    } catch {
      // intentionally ignored
    }
    throw new Error(`${res.status} ${res.statusText}${reason ? ` - ${reason}` : ""}`);
  }

  // 204 No Content یا بدنه خالی
  const len = res.headers.get("content-length");
  if (res.status === 204 || len === "0") {
    return undefined as unknown as T;
  }

  // اگر سرور JSON برگرداند
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }

  // در غیر اینصورت متن ساده (در صورت نیاز می‌توان سفارشی کرد)
  return (await res.text()) as unknown as T;
}

/* ------------------------------------------------------------------ */
/*                                Ideas                                */
/* ------------------------------------------------------------------ */

export async function listIdeas(params?: Partial<{ q: string }>): Promise<Idea[]> {
  const q = params?.q ? `?q=${encodeURIComponent(params.q)}` : "";
  return api<Idea[]>(`/api/ideas${q}`);
}

export async function getIdea(id: string): Promise<Idea> {
  return api<Idea>(`/api/ideas/${id}`);
}

/* ------------------------------------------------------------------ */
/*                               Judges                                */
/* ------------------------------------------------------------------ */

export async function listJudges(): Promise<Judge[]> {
  const judges = await api<Array<{ id: number | string; name?: string; username?: string; projectCount?: number }>>(
    `/api/admin/judges`
  );
  return judges.map((j) => ({
    id: String(j.id),
    name: j?.name ?? "",
    username: j?.username ?? null,
    projectCount: typeof j?.projectCount === "number" ? j.projectCount : undefined,
  }));
}

export async function createJudge(payload: { name: string; email?: string }): Promise<Judge> {
  return api<Judge>(`/api/judges`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": CONTENT_TYPE_JSON },
  });
}

/* ------------------------------------------------------------------ */
/*                            Assignments                              */
/* ------------------------------------------------------------------ */

export async function listAssignments(): Promise<Assignment[]> {
  const assignments = await api<
    Array<{
      id: number | string;
      judgeId?: number | string | null;
      judgeName?: string | null;
      judgeUsername?: string | null;
      description?: string | null;
      status?: string | null;
      final_score?: number | null;
      created_at?: string | null;
      updated_at?: string | null;
      decision_at?: string | null;
      idea_id?: number | string | null;
      pdf_url?: string | null;
      evaluation?: unknown;
    }>
  >(`/api/admin/projects`);

  return assignments.map((row) => {
    const rawStatus = String(row?.status ?? "").toUpperCase();
    let status: Assignment["status"] = "ASSIGNED";
    if (rawStatus === "DONE" || rawStatus === "REVIEWED" || rawStatus === "COMPLETED") {
      status = "DONE";
    } else if (!rawStatus || rawStatus === "PENDING") {
      status = "PENDING";
    }
    return {
      id: String(row.id),
      ideaId:
        row.idea_id != null
          ? String(row.idea_id)
          : row.description
            ? String(row.description)
            : String(row.id),
      judgeId: row.judgeId != null ? String(row.judgeId) : null,
      judgeName: row.judgeName ?? (row.judgeId != null ? String(row.judgeId) : null),
      judgeUsername: row.judgeUsername ?? null,
      status,
      description: row.description ?? null,
      finalScore: row.final_score ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
      decisionAt: row.decision_at ?? null,
      pdfUrl: row.pdf_url ?? null,
      evaluation: row.evaluation ?? null,
    };
  });
}

export async function createAssignment(ideaId: string, judgeIds: string[]): Promise<void> {
  await api<void>(`/api/assignments`, {
    method: "POST",
    body: JSON.stringify({ ideaId, judgeIds }),
    headers: { "Content-Type": CONTENT_TYPE_JSON },
  });
}

/* ------------------------------------------------------------------ */
/*                                Users                                */
/* ------------------------------------------------------------------ */

export async function listUsers(): Promise<AdminUser[]> {
  return api<AdminUser[]>(`/api/users`);
}

export async function getUserProfile(id: string): Promise<{
  id: string; name: string; email: string; role: string; status: string; lastLogin: string | null;
  recentIdeas: { id: string; title: string; submittedAt: string }[];
}> {
  return api(`/api/users/${id}`);
}

export async function updateUserRole(id: string, role: "admin" | "judge" | "user"): Promise<void> {
  await api(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }), headers: { "Content-Type": CONTENT_TYPE_JSON } });
}

export async function updateUserStatus(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<void> {
  await api(`/api/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": CONTENT_TYPE_JSON } });
}
// ... سایر import/export ها و type ها

export async function deleteIdea(id: string): Promise<void> {
  await api<void>(`/api/ideas/${id}`, { method: "DELETE" });
}

