"""Sinh bản tiếng Anh (*.en.html + assets/js/en/*) từ bản tiếng Việt.
Chạy: python3 i18n/build_en.py — báo các đoạn tiếng Việt mới chưa có bản dịch (thêm vào en_extra.tsv: "câu VI<TAB>câu EN")."""
import re,os,sys
import pathlib
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from extract import FILES,VN,strip_comments,runs
ROOT=str(HERE.parent)
D=str(HERE)
keys={int(i):k for i,k in (l.rstrip('\n').split('\t',1) for l in open(f'{D}/keys.tsv'))}
tr={int(i):t for i,t in (l.rstrip('\n').split('\t',1) for l in open(f'{D}/en.tsv') if l.strip())}
M={keys[i]:tr[i] for i in keys}
# extra keys added after the first extraction
EXTRA_FILE=f'{D}/en_extra.tsv'
if os.path.exists(EXTRA_FILE):
    for l in open(EXTRA_FILE):
        if l.strip(): k,t=l.rstrip('\n').split('\t',1); M[k]=t
pat=re.compile('|'.join(re.escape(k) for k in sorted(M,key=len,reverse=True)))
JSN=['core.js','quiz.js','home.js','fp.js','tools-page.js','levels-page.js','plan-chart.js','ema-page.js','overlap-page.js','levels-data.js','bank-tools.js','bank-levels.js','bank-ema.js']
CODE=[  # (regex, repl) applied after translation
 (r'<html lang="vi">','<html lang="en">'),
 (r'\b(index|tools|levels|plan|overlap|quiz)\.html',r'\1.en.html'),
 (r'assets/js/('+'|'.join(re.escape(j) for j in JSN)+r')',r'assets/js/en/\1'),
 (r"'vi-VN'","'en-GB'"),
 (r'"vi-VN"','"en-GB"'),
 (r"h<12\?'SA':'CH'","h<12?'AM':'PM'"),
 (r"'Mua'","'Buy'"),
 (r'• Tin: ','• News: '),
 (r'`Tin: ','`News: '),
]
missing=set()
os.makedirs(f'{ROOT}/assets/js/en',exist_ok=True)
for f in FILES:
    src=strip_comments(open(f'{ROOT}/{f}').read(),f.endswith('.js'))
    for r in runs(src):
        if r not in M: missing.add((f,r))
    out=pat.sub(lambda m:M[m.group(0)],src)
    for a,b in CODE: out=re.sub(a,b,out)
    dst=f.replace('.html','.en.html') if f.endswith('.html') else f.replace('assets/js/','assets/js/en/')
    open(f'{ROOT}/{dst}','w').write(out)
    left=[m.group(0) for m in re.finditer(r'[^<>\'"`{}$\n]*'+VN.pattern+r'[^<>\'"`{}$\n]*',out)]
    if left: print('LEFT',dst,left[:5])
print('missing keys',len(missing))
for m in sorted(missing): print(' ',m)
