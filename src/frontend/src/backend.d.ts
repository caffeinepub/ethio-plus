import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface StudentProfile {
    status: RegistrationStatus;
    subscriptionEnd?: Time;
    profilePhotoId: ExternalBlob;
    email: string;
    creationTime: Time;
    deviceFingerprint: string;
    subscriptionStart?: Time;
    phone: string;
    paymentBillId: ExternalBlob;
    schoolDocumentId: ExternalBlob;
}
export type Time = bigint;
export type RegistrationStatus = {
    __kind__: "expired";
    expired: string | null;
} | {
    __kind__: "pending";
    pending: string | null;
} | {
    __kind__: "approved";
    approved: string | null;
} | {
    __kind__: "rejected";
    rejected: string | null;
};
export interface UserProfile {
    name: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveRegistration(student: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getActiveStudents(): Promise<Array<StudentProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpiredStudents(): Promise<Array<StudentProfile>>;
    getRemainingDays(): Promise<bigint | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isEmailTaken(email: string): Promise<boolean>;
    isRegistered(): Promise<boolean>;
    isSubscriptionActive(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listPendingRegistrations(): Promise<Array<[Principal, StudentProfile]>>;
    rejectRegistration(student: Principal, reason: string | null): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    submitRegistration(phone: string, email: string, profilePhotoId: ExternalBlob, schoolDocumentId: ExternalBlob, paymentBillId: ExternalBlob, deviceFingerprint: string): Promise<void>;
}
