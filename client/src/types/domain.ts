// Domain types for the application

export interface IdeaFile {
  path: string;
  originalName: string;
  size?: number | null;
  mime?: string | null;
}

export interface Assignment {
  id: string;
  ideaId: string;
  judgeId: string;
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "LOCKED";
  judge?: {
    id: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
  submission?: {
    version: number;
    uploadedAt: string;
    downloadUrl: string;
  };
}

