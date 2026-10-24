"""Independent PNG/frame QA; no generation and no modification of shipped art."""
from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]/'public/assets/sideview';m=json.loads((root/'manifest.json').read_text());report=[]
for a in m['asset_records']:
 p=root/a['file'];im=Image.open(p).convert('RGBA');assert list(im.size)==[a['width'],a['height']];assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
 alpha=im.getchannel('A');assert set(alpha.tobytes())<={0,255},a['id']+' has soft sprite edges'
 visible={rgb[:3] for count,rgb in im.getcolors(im.width*im.height) if rgb[3]};assert len(visible)<=128
 if 'frames' in a:
  boxes=[]
  for f in range(a['frames']):
   crop=im.crop((f*a['frameWidth'],0,(f+1)*a['frameWidth'],a['frameHeight']));b=crop.getbbox();assert b is not None;assert b[0]>0 and b[2]<a['frameWidth'],a['id']+' clips a frame';assert b[3]==a['baseline'],(a['id'],f,b,a['baseline']);boxes.append(b)
  report.append({'id':a['id'],'frames':a['frames'],'registered_baseline':a['baseline'],'visible_colors':len(visible),'frame_boxes':boxes})
print(json.dumps({'status':'passed','files':len(m['asset_records']),'sheet_checks':report},indent=2))
