import type { Backup, EventRecord, Route } from './types';
import { parseGPX, stable, validPoint } from './core';
export async function readBackup(text:string):Promise<Backup>{const b=JSON.parse(text);if(b.schemaVersion!==1||b.kind!=='guide15-backup')throw Error('不是支援的 V1 完整備份');for(const k of ['events','participants','instructors','routes','history'])if(!Array.isArray(b[k]))throw Error(`備份缺少 ${k}`);
if(typeof b.assessmentId!=='string'||typeof b.deviceId!=='string'||typeof b.exportedAt!=='string'||!b.settings)throw Error('備份來源資訊不完整');
for(const p of b.participants)if(!p||typeof p.participantId!=='string'||!p.participantId.trim()||typeof p.displayName!=='string'||!p.displayName.trim()||typeof p.active!=='boolean')throw Error('參加者資料錯誤');
for(const p of b.instructors)if(!p||typeof p.instructorId!=='string'||!p.instructorId.trim()||typeof p.displayName!=='string'||!p.displayName.trim()||typeof p.isCustom!=='boolean')throw Error('教官資料錯誤');
for(const r of b.routes as Route[]){if(!r||!Array.isArray(r.trackPoints)||!r.trackPoints.every(validPoint)||!Array.isArray(r.waypoints)||!r.waypoints.every(w=>validPoint(w)&&typeof w.id==='string'&&typeof w.name==='string'&&Number.isFinite(w.nearest_track_km)&&Number.isFinite(w.nearest_track_distance_m)&&typeof w.on_track==='boolean')||typeof r.sha256!=='string')throw Error('路線資料錯誤');if(!r.rawGpx)throw Error('路線缺少原始 GPX，無法驗證');const parsed=await parseGPX(r.rawGpx,r.sourceFileName);if(parsed.sha256!==r.sha256||stable(parsed.trackPoints)!==stable(r.trackPoints)||Math.abs(parsed.distanceKm-r.distanceKm)>0.001)throw Error('路線雜湊／幾何不一致');if(stable(parsed.waypoints.map(w=>[w.name,w.lat,w.lon]))!==stable(r.waypoints.map(w=>[w.name,w.lat,w.lon])))throw Error('原始地標不一致');}
for(const h of b.history)if(!h||typeof h.id!=='string'||typeof h.importedAt!=='string'||typeof h.source!=='string'||!['added','skipped','conflicts','errors'].every(k=>Number.isInteger(h[k])&&h[k]>=0))throw Error('匯入歷史錯誤');
for(const [store,key] of [['participants','participantId'],['instructors','instructorId'],['routes','sha256'],['history','id']]){const seen=new Map<string,string>();for(const row of b[store]){const id=row[key],content=stable(row);if(seen.has(id)&&seen.get(id)!==content)throw Error(`${store} 相同 ID 含不同內容，請先人工整理備份`);seen.set(id,content);}}
return b as Backup;}
// Discussion exports intentionally omit prose, coordinates, routes, device IDs and instructor names.
export function anonymousExport(events:EventRecord[]){const instructors=new Map<string,string>();return {schemaVersion:1,kind:'guide15-anonymous-discussion',notice:'非還原備份；文字與 GPS 已省略，以免姓名藏在自由文字中。參加者仍使用編號。',events:events.map(e=>{if(!instructors.has(e.instructorId))instructors.set(e.instructorId,`I${instructors.size+1}`);return {assessmentId:e.assessmentId,eventId:e.eventId,participantId:e.participantId,participantPending:e.participantPending,instructorCode:instructors.get(e.instructorId),category:e.category,behaviorCode:e.behaviorCode,occurredAt:e.occurredAt,deleted:!!e.deletedAt};})};}
// 多份完整備份合併為一份再預覽：每台裝置只取最新一份（每次上傳都是完整快照），
// 同一事件出現在多份時取 updatedAt 較新者；名單、教官、路線、歷史依 ID 去重（先出現者優先）。
export function combineBackups(list:{name:string;backup:Backup}[]):{backup:Backup;label:string;note:string}{
 if(!list.length)throw Error('沒有可匯入的備份');
 const latest=new Map<string,{name:string;backup:Backup}>();
 for(const x of list){const cur=latest.get(x.backup.deviceId);if(!cur||Date.parse(x.backup.exportedAt)>Date.parse(cur.backup.exportedAt))latest.set(x.backup.deviceId,x);}
 const chosen=[...latest.values()].sort((a,b)=>a.name.localeCompare(b.name));
 if(chosen.length===1&&list.length===1){const {name,backup}=chosen[0];return {backup,label:`${name}（來源裝置 ${backup.deviceId}）`,note:''};}
 const byId=<T,>(rows:T[],key:(r:T)=>string)=>{const m=new Map<string,T>();for(const r of rows)if(!m.has(key(r)))m.set(key(r),r);return [...m.values()];};
 const events=new Map<string,EventRecord>();
 for(const {backup} of chosen)for(const e of backup.events){const k=`${e.assessmentId}\u0000${e.eventId}`,old=events.get(k);if(!old||e.updatedAt>old.updatedAt)events.set(k,e);}
 const first=chosen[0].backup,skipped=list.length-chosen.length;
 const backup:Backup={...first,deviceId:chosen.map(c=>c.backup.deviceId).join('、'),exportedAt:chosen.map(c=>c.backup.exportedAt).sort().at(-1)!,events:[...events.values()],
  participants:byId(chosen.flatMap(c=>c.backup.participants),p=>p.participantId),instructors:byId(chosen.flatMap(c=>c.backup.instructors),i=>i.instructorId),routes:byId(chosen.flatMap(c=>c.backup.routes),r=>r.sha256),history:byId(chosen.flatMap(c=>c.backup.history),h=>h.id)};
 return {backup,label:`合併 ${chosen.length} 份備份：${chosen.map(c=>c.name).join('、')}`,note:`共 ${list.length} 份備份，${chosen.length} 台裝置各取最新一份${skipped?`，略過同裝置較舊的 ${skipped} 份`:''}：${chosen.map(c=>c.name).join('、')}`};
}
