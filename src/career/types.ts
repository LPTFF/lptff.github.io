/**
 * 职业机会发现与简历画像类型契约
 */

export type EvidenceType = "projectProven" | "selfStated" | "unknown";

export interface CareerCapability {
  skillName: string;
  category: string;
  level?: string;
  evidenceType: EvidenceType;
  quote: string;
}

export interface CareerExperience {
  timeRange: string;
  companyOrProject: string;
  role: string;
  responsibilities: string[];
  techStack: string[];
  quote?: string;
}

export interface CareerProfile {
  version: number;
  fingerprint: string;
  updatedAt: string;
  fileName: string;
  fileSize: number;
  summary: string;
  workYears: string;
  education: string;
  targetIntention: string;
  capabilities: CareerCapability[];
  experiences: CareerExperience[];
  unknowns: string[];
  communicationProfileSnippet: string;
}

export interface SupportingJobCitation {
  jobUrl: string;
  jobTitle: string;
  brandName: string;
  salaryDesc?: string;
  exactQuote: string;
  verified?: boolean;
}

export interface CareerDirection {
  id: string;
  title: string;
  bossSearchKeyword: string;
  fitReason: string;
  marketBasis: string;
  conditionsToVerify: string[];
  isAdjacent: boolean;
  supportingJobs: SupportingJobCitation[];
}

export interface UserPreferences {
  city?: string;
  salaryExpectation?: string;
}

export interface MarketJobItem {
  jobNum: number;
  brandLogo: string;
  brandName: string;
  bossTitle: string;
  brandIndustry: string;
  salaryDesc: string;
  skills: string[];
  job_detail: string;
  jobDesc: string;
  time: string;
  timestamp: number;
  website: string;
  sourcePage: string;
  capturedAt?: string;
  pageUpdatedAt?: string;
  jobPostTime?: string | null;
  sourceStatus?: string;
}

export interface CareerBridgeStatus {
  connected: boolean;
  hasGeminiKey: boolean;
  model: string;
  currentProfileMeta: {
    version: number;
    fingerprint: string;
    updatedAt: string;
    fileName: string;
  } | null;
}

export interface CareerMatchResult {
  profileFingerprint: string;
  marketDigest: string;
  updatedAt: string;
  directions: CareerDirection[];
}
