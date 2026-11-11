export const ASSESSMENT = 'guide15-2026-12-13';
export const SAFETY = { S01: '未經允許超越前導', S02: '未告知嚮導自行離開隊伍', S03: '岔路發現前後都沒人，仍自行選路', S04: '明確安全指示後仍反覆違反', S05: '在危險位置拍攝而妨礙安全', S99: '其他／自行填寫' } as const;
export type Category = 'positive'|'improve'|'safety';
export const CATEGORY_LABEL: Record<Category,string> = { positive: '正向表現', improve: '待改善行為', safety: '安全／規則事件' };
export interface GPS {lat:number; lon:number; accuracyM:number; capturedAt:string}
export interface RouteEstimate {kmFromStart:number; crossTrackDistanceM:number; confidence:'approximate'; candidates?:{kmFromStart:number;crossTrackDistanceM:number}[]}
export interface EventRecord {schemaVersion:1; eventId:string; assessmentId:string; routeVersion:string; participantId:string; participantNameSnapshot:string; participantPending:boolean; instructorId:string; instructorNameSnapshot:string; category:Category; behaviorCode:keyof typeof SAFETY|null; behaviorCustomLabel:string|null; observationText:string; occurredAt:string; locationText:string; locationWaypointId:string|null; gps:GPS|null; routeEstimate:RouteEstimate|null; reminded:'yes'|'no'|'unknown'|null; response:'corrected'|'partially_corrected'|'not_corrected'|'not_applicable'|'unknown'|null; notifiedLead:'yes'|'no'|'unknown'|null; actionNotes:string; createdAt:string; updatedAt:string; deletedAt:string|null}
export interface Participant {participantId:string;displayName:string;active:boolean}
export interface Instructor {instructorId:string;displayName:string;isCustom:boolean}
export interface Point {lat:number;lon:number}
export interface Waypoint extends Point {id:string;name:string;nearest_track_distance_m:number;nearest_track_km:number;on_track:boolean;notes:string;confirmed?:boolean}
export interface Route {routeId:string;sourceFileName:string;sha256:string;trackPoints:Point[];waypoints:Waypoint[];distanceKm:number;importedAt:string;hasElevation:boolean;closedLoop:boolean;rawGpx?:string;provenance:string}
export interface Settings {key:'main';deviceId:string;assessmentId:string;instructorId:string;routeVersion:string;accuracyLimitM:number;offRouteM:number;ambiguityM:number}
export interface ImportHistory {id:string;importedAt:string;source:string;added:number;skipped:number;conflicts:number;errors:number}
export interface Backup {schemaVersion:1;kind:'guide15-backup';assessmentId:string;deviceId:string;exportedAt:string;events:EventRecord[];participants:Participant[];instructors:Instructor[];routes:Route[];settings:Settings;history:ImportHistory[]}
