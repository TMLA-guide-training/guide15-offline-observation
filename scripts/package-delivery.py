from pathlib import Path
import sys
import zipfile,hashlib,shutil,json
project=Path(__file__).resolve().parent.parent
out=Path(sys.argv[1]) if len(sys.argv)>1 else project/'dist/downloads'
out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out/'guide15-pwa-v1.0-source-and-build.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(project.rglob('*')):
  rel=p.relative_to(project)
  if p.is_file() and not any(x in ('node_modules','.git','downloads') for x in rel.parts):z.write(p,Path('guide15-pwa')/rel)
with zipfile.ZipFile(out/'guide15-pwa-v1.0-dist.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted((project/'dist').rglob('*')):
  if p.is_file() and 'downloads' not in p.relative_to(project/'dist').parts:z.write(p,p.relative_to(project/'dist'))
for name,path in [('安裝與使用說明.md','README.md'),('手機飛航模式驗收步驟.md','docs/acceptance.md'),('總教官合併資料指南.md','docs/merge-guide.md'),('測試結果與限制.md','docs/testing.md')]:shutil.copyfile(project/path,out/name)
with open(out/'SHA256SUMS.txt','w') as f:
 for p in sorted(out.glob('*.zip')):f.write(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n')
print(json.dumps([{'file':p.name,'bytes':p.stat().st_size} for p in out.iterdir()],ensure_ascii=False))
