import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseGPX, distance, matchRoute, validateEvent, parseCSV, parseRoster, exportCSV, localISO, planMerge, stable, decodeText, menuWaypoints } from '../src/core';
import { readBackup, anonymousExport } from '../src/backup';
import { ASSESSMENT, type EventRecord } from '../src/types';
import { event } from './fixture';
const raw=readFileSync('public/route.gpx','utf8'),meta=JSON.parse(readFileSync('public/route_data.json','utf8'));
describe('原始正式 GPX 與球面幾何',()=>{
 it('解析正式 821 點、22 地標、12.51 km、SHA 並保留原始座標',async()=>{const r=await parseGPX(raw,'15期素養體能評測.GPX');expect(r.trackPoints).toHaveLength(821);expect(r.waypoints).toHaveLength(22);expect(r.sha256).toBe(meta.sha256);expect(r.distanceKm).toBeCloseTo(12.512,2);expect(r.closedLoop).toBe(true);expect(r.hasElevation).toBe(false);expect(r.distanceKm).toBeGreaterThan(12);for(const w of r.waypoints){const original=meta.waypoints.find((x:any)=>x.name===w.name);expect(w.lat).toBe(original.lat);expect(w.lon).toBe(original.lon);expect(w.nearest_track_km).toBeCloseTo(original.nearest_track_km,2);expect(w.on_track).toBe(original.on_track);}expect(r.waypoints.filter(w=>!w.on_track)).toHaveLength(5);expect(r.waypoints.every(w=>!w.confirmed)).toBe(true);});
 it('閉合起終點顯示多個里程候選，不誤算為零',()=>{const track=[{lat:25,lon:121},{lat:25.01,lon:121},{lat:25.01,lon:121.01},{lat:25,lon:121}];const m=matchRoute(track[0],track);expect(m.candidates!.length).toBeGreaterThan(1);expect(m.candidates!.some(c=>c.kmFromStart>3)).toBe(true);expect(distance(track[0],track[1])).toBeCloseTo(1111.95,0);});
 it('拒絕錯誤 XML、缺少座標、多斷段與非法座標',async()=>{for(const xml of ['oops','<gpx><trk><trkseg><trkpt/><trkpt lat="25" lon="121"/></trkseg></trk></gpx>','<gpx><trk><trkseg/><trkseg/></trk></gpx>','<gpx><trk><trkseg><trkpt lat="500" lon="121"/><trkpt lat="25" lon="121"/></trkseg></trk></gpx>'])await expect(parseGPX(xml,'bad.gpx')).rejects.toThrow();});
});
describe('事件資料規則及合併',()=>{
 it('三類可儲存，事實與文字地點必填，GPS 可空；S99 名稱必填',()=>{expect(validateEvent(event())).toEqual([]);expect(validateEvent(event({category:'improve',reminded:'unknown',response:'unknown',notifiedLead:'unknown'}))).toEqual([]);expect(validateEvent(event({category:'safety',behaviorCode:'S01'}))).toEqual([]);expect(validateEvent(event({observationText:'   '})).length).toBeGreaterThan(0);expect(validateEvent(event({locationText:''})).length).toBeGreaterThan(0);expect(validateEvent(event({category:'safety',behaviorCode:'S99'}))).toContain('請填自訂安全事件名稱');expect(validateEvent(event({category:'positive',behaviorCode:'S01'})).length).toBeGreaterThan(0);});
 it('拒絕非法 GPS／時間／版本；短事實允許現場先簡記',()=>{expect(validateEvent(event({observationText:'先記'}))).toEqual([]);expect(validateEvent(event({occurredAt:'2026-12-13T10:00:00'})).length).toBeGreaterThan(0);expect(validateEvent(event({gps:{lat:100,lon:121,accuracyM:-1,capturedAt:localISO()}})).length).toBeGreaterThan(0);expect(localISO()).toMatch(/[+-]\d\d:\d\d$/);});
 it('相同 ID 同內容跳過、不同內容衝突、不同 ID 相似仍保留、不同活動獨立',()=>{const a=event(),b=event(),c={...a,observationText:'同一事件的新文字'},d={...a,assessmentId:'another'};const p=planMerge([a],[{...a},b,c,d,{bad:1}]);expect(p.added).toHaveLength(2);expect(p.skipped).toHaveLength(1);expect(p.conflicts).toHaveLength(1);expect(p.errors).toHaveLength(1);expect(p.similar).toHaveLength(1);expect(stable({a:1,b:2})).toBe(stable({b:2,a:1}));});
 it('同一匯入檔內重複及衝突也檢查',()=>{const a=event();const p=planMerge([],[a,{...a},{...a,deletedAt:a.updatedAt}]);expect(p.added).toHaveLength(1);expect(p.skipped).toHaveLength(1);expect(p.conflicts).toHaveLength(1);});
});
describe('CSV、名單與匿名資料',()=>{
 it('BOM／繁中／逗號、引號及換行往返不破損',()=>{const text='繁體中文,"引號"\n下一行';const csv=exportCSV([event({observationText:text})]);expect(csv.charCodeAt(0)).toBe(0xFEFF);const rows=parseCSV(csv);expect(rows[1][rows[0].indexOf('具體事實')]).toBe(text);});
 it('公式、前導空白、Tab 等不執行公式',()=>{for(const v of ['=1+1','+SUM(1,2)','-1+2','@SUM(A1)','  =1','\t=1','\r=1']){const rows=parseCSV(exportCSV([event({observationText:v})]));expect(rows[1][rows[0].indexOf('具體事實')]).toBe("'"+v);}});
 it('名單預覽攔截缺失／重複欄位，支援 JSON、BOM',()=>{expect(parseRoster('\uFEFFparticipant_id,name\r\nP1,王一\r\nP1,王二\r\nP2,','participant').errors).toHaveLength(2);expect(parseRoster('[{"instructor_id":"I1","name":"測試"}]','instructor').valid).toHaveLength(1);expect(()=>parseRoster('name\n姓名','participant')).toThrow();expect(()=>parseCSV('"broken')).toThrow();});
 it('匿名討論版不含姓名、自由文字、GPS、裝置，不能作還原備份',async()=>{const a=anonymousExport([event()]),s=JSON.stringify(a);expect(s).not.toContain('虛構測試');expect(s).not.toContain('主動協助');expect(s).not.toContain('gps');await expect(readBackup(s)).rejects.toThrow();});
 it('完整備份驗證原始 GPX SHA 與幾何',async()=>{const route=await parseGPX(raw,'正式.GPX');const b={schemaVersion:1,kind:'guide15-backup',assessmentId:ASSESSMENT,deviceId:'test-device',exportedAt:localISO(),events:[event()],participants:[],instructors:[],routes:[route],settings:{},history:[]};expect((await readBackup(JSON.stringify(b))).routes).toHaveLength(1);await expect(readBackup(JSON.stringify({...b,routes:[{...route,sha256:'tampered'}]}))).rejects.toThrow('雜湊');});
 it('名單接受中文欄位名稱與 Big5／UTF-8 編碼',()=>{expect(parseRoster('編號,姓名\nA01,王小明','participant').valid).toEqual([{id:'A01',name:'王小明'}]);const utf8=new TextEncoder().encode('\uFEFFparticipant_id,name\nA01,王小明').buffer;expect(parseRoster(decodeText(utf8),'participant').valid[0].name).toBe('王小明');const big5=new Uint8Array([0x41,0x30,0x31,0x2c,0xa4,0xfd,0xa4,0x70,0xa9,0xfa]).buffer;expect(decodeText(big5)).toBe('A01,王小明');});
 it('地標選單排除人形立牌與平等里',async()=>{const route=await parseGPX(raw,'正式.GPX');const menu=menuWaypoints(route.waypoints);expect(route.waypoints).toHaveLength(22);expect(menu).toHaveLength(11);expect(menu.every(w=>!w.name.startsWith('人形立牌')&&!w.name.startsWith('平等里'))).toBe(true);});
});
describe('事件 CSV（Excel 閱讀用）',()=>{
 it('中文欄位與選項、依編號再依時間排序、不含已刪除事件',()=>{const rows=parseCSV(exportCSV([
  event({participantId:'A10',occurredAt:'2026-12-13T09:00:00+08:00',category:'safety',behaviorCode:'S02',reminded:'yes',response:'corrected',notifiedLead:'yes',gps:{lat:25.0123456,lon:121.5,accuracyM:12.4,capturedAt:'2026-12-13T09:00:00+08:00'},routeEstimate:{kmFromStart:3.24,crossTrackDistanceM:18.6,confidence:'approximate'}}),
  event({participantId:'A2',occurredAt:'2026-12-13T11:00:00+08:00'}),event({participantId:'A2',occurredAt:'2026-12-13T08:30:00+08:00',observationText:'較早'}),
  event({participantId:'A1',deletedAt:'2026-12-13T12:00:00+08:00'}),event({participantId:'A3',category:'safety',behaviorCode:'S99',behaviorCustomLabel:'自訂狀況'})]));
  const h=rows[0],col=(r:string[],name:string)=>r[h.indexOf(name)];
  expect(h.slice(0,4)).toEqual(['參加者編號','姓名','待核對編號','類別']);expect(h).toContain('是否已通知總教官');expect(h).not.toContain('observationText');
  expect(rows.slice(1).map(r=>r[0])).toEqual(['A2','A2','A3','A10']);expect(col(rows[1],'具體事實')).toBe('較早');expect(col(rows[1],'事件時間')).toBe('2026-12-13 08:30');
  const s=rows[4];expect(col(s,'類別')).toBe('安全／規則事件');expect(col(s,'安全項目')).toBe('S02 未告知嚮導自行離開隊伍');expect(col(s,'是否已提醒')).toBe('已提醒');expect(col(s,'提醒後反應')).toBe('已改正');expect(col(s,'是否已通知總教官')).toBe('已通知');expect(col(s,'GPS')).toBe('25.012346, 121.500000（±12 m）');expect(col(s,'路線推測')).toBe('約 3.2 km，偏離 19 m');
  expect(col(rows[3],'安全項目')).toBe('自訂狀況');expect(col(rows[1],'類別')).toBe('正向表現');expect(col(rows[1],'是否已提醒')).toBe('');});
});
