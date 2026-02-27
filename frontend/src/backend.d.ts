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
export interface Icon {
    id: string;
    name: string;
    iconType: string;
    position: Position;
}
export interface DiagramState {
    boxShapes: Array<BoxShape>;
    lines: Array<Line>;
    lastModified: bigint;
    connections: Array<Connection>;
    textLabels: Array<TextLabel>;
    icons: Array<Icon>;
    freehandDrawings: Array<FreehandDrawing>;
    images: Array<Image>;
}
export interface TextLabel {
    content: string;
    color: string;
    fontWeight: string;
    position: Position;
    fontSize: number;
}
export interface BoxShape {
    id: string;
    title: string;
    color: string;
    borderWidth: number;
    position: Position;
    borderColor: string;
    dimensions: {
        height: number;
        width: number;
    };
}
export interface FreehandDrawing {
    color: string;
    strokeWidth: number;
    points: Array<Position>;
}
export interface Line {
    color: string;
    endPosition: Position;
    isArrow: boolean;
    startPosition: Position;
    strokeWidth: number;
}
export interface NamedDiagram {
    name: string;
    state: DiagramState;
}
export interface Position {
    x: number;
    y: number;
}
export interface Image {
    id: string;
    file: ExternalBlob;
    name: string;
    size: {
        height: number;
        width: number;
    };
    description: string;
    position: Position;
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
    deleteDiagramState(diagramId: bigint): Promise<void>;
    getAllConnections(diagramId: bigint): Promise<Array<Connection> | null>;
    getAllDiagrams(): Promise<Array<NamedDiagram>>;
    getAllIconPositions(diagramId: bigint): Promise<Array<Icon> | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDiagramStateById(id: bigint): Promise<NamedDiagram | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDiagramState(name: string, state: DiagramState): Promise<bigint>;
    updateDiagramName(id: bigint, newName: string): Promise<void>;
}
