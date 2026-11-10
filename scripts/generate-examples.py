"""Generate explicit synthetic backups. Never loads these into the running app."""
import json, uuid, pathlib
root=pathlib.Path(__file__).resolve().parent.parent
stamp='2026-12-13T10:00:00+08:00'
sha=json.loads((root/'public/route_data.json').read_text())['sha256']
def event(i=0):
 return dict(schemaVersion=1,eventId=str(uuid.uuid4()),assessmentId='guide15-2026-12-13',routeVersion=sha,participantId=f'TEST{i%2+1:03}',participantNameSnapshot='虛構參加者'+('甲' if i%2==0 else '乙'),participantPending=False,instructorId='TEST-I1',instructorNameSnapshot='虛構教官甲',category='positive',behaviorCode=None,behaviorCustomLabel=None,observationText=f'【虛構測試 {i+1}】在測試集合時協助傳達集合指示，供匯入功能驗證。',occurredAt=stamp,locationText='虛構測試地點（不是實際觀察）',locationWaypointId=None,gps=None,routeEstimate=None,reminded=None,response=None,notifiedLead=None,actionNotes='',createdAt=stamp,updatedAt=stamp,deletedAt=None)
b=dict(schemaVersion=1,kind='guide15-backup',assessmentId='guide15-2026-12-13',deviceId='SYNTHETIC-EXAMPLE-DEVICE',exportedAt=stamp,events=[event()],participants=[dict(participantId='TEST001',displayName='虛構參加者甲',active=True),dict(participantId='TEST002',displayName='虛構參加者乙',active=True)],instructors=[dict(instructorId='TEST-I1',displayName='虛構教官甲',isCustom=False)],routes=[],settings=dict(key='main',deviceId='SYNTHETIC-EXAMPLE-DEVICE',assessmentId='guide15-2026-12-13',instructorId='TEST-I1',routeVersion=sha,accuracyLimitM=60,offRouteM=100,ambiguityM=10),history=[])
for filename,records in [('example.backup.json',b['events']),('1000-events.backup.json',[event(i) for i in range(1000)])]:
 b['events']=records
 (root/'examples'/filename).write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
