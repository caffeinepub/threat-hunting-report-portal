import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ReportMetadata {
    title: string;
    date: Time;
    author: string;
}
export interface ThreatActor {
    name: string;
    description: string;
}
export type Time = bigint;
export interface Report {
    mitreTechniques: Array<string>;
    metadata: ReportMetadata;
    iocs: Array<string>;
    executiveSummary: string;
    findings: Array<string>;
    threatActors: Array<ThreatActor>;
}
export interface backendInterface {
    deleteReport(id: bigint): Promise<void>;
    getAllReports(): Promise<Array<Report>>;
    getReport(id: bigint): Promise<Report>;
    saveReport(title: string, author: string, executiveSummary: string, threatActorNames: Array<string>, threatActorDescriptions: Array<string>, mitreTechniques: Array<string>, iocs: Array<string>, findings: Array<string>): Promise<bigint>;
}
