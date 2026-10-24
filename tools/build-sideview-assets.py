"""Normalize original image-gen drafts to registered, binary-alpha pixel PNG assets.
No runtime art generation. This is slicing, registration and palette normalization,
not an illustration generator. Original full-resolution inputs are retained.
Requires Pillow, numpy, scipy only when rebuilding art; npm builds use shipped PNGs.
"""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'assets/sideview/source';OUT=ROOT/'public/assets/sideview';OUT.mkdir(parents=True,exist_ok=True)
NN=Image.Resampling.NEAREST
records=[]
def clean(im):
 im=im.convert('RGBA');a=im.getchannel('A').point(lambda n:255 if n>=130 else 0);im.putalpha(a);return im

def palette(im,colors=128):
 im=clean(im);alpha=im.getchannel('A');q=im.convert('RGB').quantize(colors=colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA');q.putalpha(alpha);return q

def save(name,im,origin,frames=None):
 im=palette(im);im.save(OUT/(name+'.png'),optimize=True);rec={'id':name,'file':name+'.png','width':im.width,'height':im.height,'source':origin,'sha256':hashlib.sha256((OUT/(name+'.png')).read_bytes()).hexdigest(),'colors':len(im.getcolors(im.width*im.height)or[])}
 if frames:rec.update(frames)
 records.append(rec);return im

def fitted(name,height):
 im=clean(Image.open(SRC/(name+'.png')));box=im.getbbox();im=im.crop(box);im=im.resize((round(im.width*height/im.height),height),NN);return save(name,im,name+'.png')

facades=fitted('facades',240);river=fitted('river',185)
sky=Image.open(SRC/'sky.png').convert('RGBA');save('sky',sky.resize((1080,360),NN),'sky.png')
# A small real sky strip extends the native viewport on taller screens.
save('sky-top',sky.crop((900,0,1000,100)).resize((32,32),NN),'sky.png')
room=Image.open(SRC/'interior.png').convert('RGBA').resize((640,360),NN);save('interior',room,'interior.png')
# Ground tiles are sampled from the image-assisted floor, not drawn at runtime.
floor=Image.open(SRC/'interior.png').convert('RGBA');save('pavement',floor.crop((300,740,650,850)).resize((128,40),NN),'interior.png');save('curb',floor.crop((0,850,floor.width,941)).resize((640,35),NN),'interior.png')

def actor_sheet(source,name,cols,rows,frames,framew,frameh,visualh,register_head=True):
 im=clean(Image.open(SRC/(source+'.png')));cw=im.width/cols;ch=im.height/rows;cells=[]
 for i in frames:
  cell=im.crop((round(i%cols*cw),round(i//cols*ch),round((i%cols+1)*cw),round((i//cols+1)*ch)));box=cell.getbbox()
  if not box:raise ValueError('Empty sprite cell '+str(i))
  cells.append((cell,box))
 scale=visualh/max(b[3]-b[1]for _,b in cells);sheet=Image.new('RGBA',(framew*len(frames),frameh))
 for i,(cell,b)in enumerate(cells):
  cut=cell.crop(b);scaled=cut.resize((round(cut.width*scale),round(cut.height*scale)),NN)
  if register_head:
   mask=np.array(cell.getchannel('A'))>0;head=mask[b[1]:b[1]+max(1,int((b[3]-b[1])*.29)),:];xs=np.where(head)[1];anchor=float(np.median(xs))
  else:
   mask=np.array(cell.getchannel('A'))>0;wheel=mask[b[1]+int((b[3]-b[1])*.8):b[3],b[0]:b[0]+int((b[2]-b[0])*.4)];xs=np.where(wheel)[1];anchor=float(np.median(xs))+b[0]
  dx=round((framew/2 if register_head else 32)-(anchor-b[0])*scale);dy=frameh-6-scaled.height
  if dx<0 or dx+scaled.width>framew:raise ValueError(f'Frame clipped: {name} {i} {dx} {scaled.width}')
  sheet.alpha_composite(scaled,(i*framew+dx,dy))
 save(name,sheet,source+'.png',{'frameWidth':framew,'frameHeight':frameh,'frames':len(frames),'baseline':frameh-6})

actor_sheet('hero','hero-walk',6,2,list(range(6)),88,96,80)
actor_sheet('hero','hero-idle',6,2,list(range(6,12)),88,96,80)
hero=Image.open(OUT/'hero-idle.png');save('hero-portrait',hero.crop((20,8,68,51)),'hero.png')
actor_sheet('npcs','rahim',3,2,[0,1,2],88,96,76)
rahim=Image.open(OUT/'rahim.png');save('rahim-portrait',rahim.crop((16,8,72,58)),'npcs.png')
actor_sheet('npcs','pedestrian',3,2,[3,4,5],112,96,76)
actor_sheet('vehicles','rickshaw',3,2,[0,1,2],146,112,100,False)
actor_sheet('vehicles','cng',3,2,[3,4,5],146,112,91,False)

# Isolate props that do not obey their draft atlas grid. Connected components
# prevent a neighbouring plant from leaking into a sprite's bounding box.
props=clean(Image.open(SRC/'props.png'));pixels=np.array(props);mask=pixels[:,:,3]>0;lab,_=ndimage.label(ndimage.binary_dilation(mask,iterations=2));slices=ndimage.find_objects(lab)
for name,component,height in [('banyan',2,235),('bananas',3,130),('produce',4,55),('bench',5,52)]:
 isolated=pixels.copy();isolated[:,:,3]=np.where(lab==component,pixels[:,:,3],0);part=Image.fromarray(isolated);box=part.getbbox();part=part.crop(box);part=part.resize((round(part.width*height/part.height),height),NN);save(name,part,'props.png')
# The palm and lamp overlap the draft grid; use their disjoint silhouettes.
for name,box,height in [('palm',(0,0,448,625),245),('lamp',(80,540,284,1015),165)]:
 part=props.crop(box);a=np.array(part)
 if name=='palm': a[540:,:,3]=np.where(np.indices(a[540:,:,3].shape)[1]>155,0,a[540:,:,3])
 else:
  yy,xx=np.indices(a[:,:,3].shape);a[:,:,3]=np.where((yy<85)&(xx<90),0,a[:,:,3])
 part=Image.fromarray(a);part=part.crop(part.getbbox());part=part.resize((round(part.width*height/part.height),height),NN);save(name,part,'props.png')

produce=Image.open(OUT/'produce.png');save('crate',produce.crop((42,31,82,55)),'props.png')

pedestrian=Image.open(OUT/'pedestrian.png');save('pedestrian-portrait',pedestrian.crop((32,8,80,51)),'npcs.png')

# Transparent foreground silhouette shadows and a tiny cup are source PNGs too.
# Authored pixel accents, never the primary character/environment artwork.
from PIL import ImageDraw
shadow=Image.new('RGBA',(48,8));d=ImageDraw.Draw(shadow);d.rectangle((5,2,42,5),fill=(22,26,48,70));d.rectangle((0,3,47,4),fill=(22,26,48,70));shadow.save(OUT/'shadow.png')
manifest={'version':1,'production':'Original image-gen assets, normalized offline with binary alpha, nearest resizing and shared per-sheet palettes. No user-reference pixels used as production art.','native_reference_viewport':[640,360],'protagonist_height':80,'asset_records':records,'source_hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in SRC.glob('*.png')}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(records,indent=2))
