import { beforeEach,it,expect,vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import { parseGPX } from '../src/core';
import { openDB,putMany } from '../src/db';
const q=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const until=async(fn:()=>void)=>vi.waitFor(fn,{timeout:7000});
const pickFile=(csv:string,name='名單.csv')=>{const el=q<HTMLInputElement>('#rosterFile');const bytes=new TextEncoder().encode(csv);Object.defineProperty(el,'files',{value:[{name,arrayBuffer:async()=>bytes.buffer.slice(0)}],configurable:true});el.dispatchEvent(new Event('change',{bubbles:true}));};
async function boot(){vi.resetModules();document.body.innerHTML='<div id="app"></div>';await import('../src/main');}
beforeEach(async()=>{Object.defineProperty(globalThis,'indexedDB',{value:new IDBFactory(),configurable:true});vi.spyOn(window,'confirm').mockReturnValue(true);vi.spyOn(window,'scrollTo').mockImplementation(()=>{});const db=await openDB(),r=await parseGPX(readFileSync('public/route.gpx','utf8'),'15期素養體能評測.GPX');await putMany(db,'routes',[r]);db.close();});
it('首次開啟必須先輸入教官姓名並匯入名單，完成後重新開啟不需再設定',async()=>{await boot();await until(()=>expect(q('#setupName')).toBeTruthy());expect(q('[data-nav]')).toBeNull();expect(q('#rosterFile')).toBeNull();expect(q('.setuphelp').textContent).toContain('加到主畫面');q<HTMLInputElement>('#setupName').value='虛構教官甲';q('#setupNameForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await until(()=>expect(q('#rosterFile')).toBeTruthy());expect(document.body.textContent).toContain('虛構教官甲');expect(q('[data-nav]')).toBeNull();
 pickFile('participant_id,name\nA01,虛構甲\nA01,重複');await until(()=>expect(q('#confirmRoster')).toBeTruthy());expect(q<HTMLButtonElement>('#confirmRoster').disabled).toBe(true);
 pickFile('﻿編號,姓名\r\nA01,虛構甲\r\nA02,虛構乙\r\n');await until(()=>expect(q<HTMLButtonElement>('#confirmRoster').disabled).toBe(false));q('#confirmRoster').click();await until(()=>expect(q('#add')).toBeTruthy());expect(q('.context').textContent).toContain('虛構教官甲');
 await boot();await until(()=>expect(q('#add')).toBeTruthy());expect(q('#setupName')).toBeNull();q('#add').click();await until(()=>expect(q('#participant')).toBeTruthy());expect(Array.from(q<HTMLSelectElement>('#participant').options).map(o=>o.text)).toContain('A02 · 虛構乙');});
