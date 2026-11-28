#!/usr/bin/env python3
import argparse,json,re,hashlib,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent/'sandbox'
def safe(n):
 p=Path(n)
 if p.is_absolute() or '..' in p.parts or len(p.parts)!=1: raise ValueError('unsafe path: '+n)
 return ROOT/n
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def plan(manifest):
 rows=[];errors=[]
 for x in manifest:
  try:
   src=safe(x['from']); date=x.get('date'); slug=x.get('slug','')
   if not date or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',date): raise ValueError('explicit YYYY-MM-DD date required')
   if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug): raise ValueError('invalid slug')
   dst=safe(date+'_'+slug+'.jpg')
   if not src.is_file(): raise ValueError('source missing')
   rows.append({'from':src.name,'to':dst.name,'sha256':sha(src)})
  except Exception as e: errors.append(str(e))
 targets={}
 for x in rows: targets.setdefault(x['to'],[]).append(x['from'])
 for dst,sources in targets.items():
  if len(sources)>1: errors.append('target collision: '+dst+' from '+', '.join(sources))
  p=safe(dst)
  if p.exists() and p.name not in [x['from'] for x in rows]: errors.append('target exists: '+dst)
 return {'rows':rows,'errors':errors,'ok':not errors}
def apply(p):
 if not p['ok']: raise ValueError('apply blocked: '+json.dumps(p['errors']))
 # stage sources to temporary names, then move to destinations for atomic-ish all-or-none behavior
 temps=[]
 try:
  for i,row in enumerate(p['rows']):
   src=safe(row['from']);tmp=safe('.stage_'+str(i));src.rename(tmp);temps.append((tmp,safe(row['to']),row))
  for tmp,dst,row in temps: tmp.rename(dst)
 except Exception:
  for tmp,dst,row in temps:
   if tmp.exists(): tmp.rename(safe(row['from']))
   elif dst.exists(): dst.rename(safe(row['from']))
  raise
 return {'rows':p['rows']}
def undo(u):
 for row in u['rows']:
  src=safe(row['to']);dst=safe(row['from'])
  if not src.exists() or sha(src)!=row['sha256'] or dst.exists(): raise ValueError('undo precondition failed: '+row['to'])
 # validate all before moving, then perform
 for row in u['rows']: safe(row['to']).rename(safe(row['from']))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('cmd',choices=['plan','apply','undo']);ap.add_argument('file',nargs='?',default='manifest.json');a=ap.parse_args()
 if a.cmd=='plan':
  p=plan(json.loads(Path(a.file).read_text()));Path('plan.json').write_text(json.dumps(p,indent=2));print(json.dumps(p,indent=2));return 0 if p['ok'] else 2
 if a.cmd=='apply':
  p=json.loads(Path(a.file).read_text());u=apply(p);Path('undo.json').write_text(json.dumps(u,indent=2));print('applied');return 0
 undo(json.loads(Path(a.file).read_text()));print('restored');return 0
if __name__=='__main__':
 try: raise SystemExit(main())
 except Exception as e: print('ERROR:',e);raise SystemExit(2)
