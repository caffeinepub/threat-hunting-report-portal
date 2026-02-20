import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Line {
    color: string;
    endPosition: Position;
    isArrow: boolean;
    startPosition: Position;
    strokeWidth: number;
}
export interface Icon {
    id: string;
    name: string;
    iconType: string;
    position: Position;
}
export interface Position {
    x: number;
    y: number;
}
export interface DiagramState {
    lines: Array<Line>;
    lastModified: bigint;
    connections: Array<Connection>;
    textLabels: Array<TextLabel>;
    icons: Array<Icon>;
    freehandDrawings: Array<FreehandDrawing>;
}
export interface TextLabel {
    content: string;
    color: string;
    fontWeight: string;
    position: Position;
    fontSize: number;
}
export interface FreehandDrawing {
    color: string;
    strokeWidth: number;
    points: Array<Position>;
}
export interface Connection {
    color: string;
    sourceId: string;
    connectionType: string;
    targetId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllConnections(): Promise<Array<Connection> | null>;
    getAllIconPositions(): Promise<Array<Icon> | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDiagramState(): Promise<DiagramState | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDiagramState(state: DiagramState): Promise<void>;
}
