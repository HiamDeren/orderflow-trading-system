import re,json,os,sys
import pathlib
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
FILES=['index.html','quiz.html','tools.html','levels.html','plan.html','overlap.html']+['assets/js/'+f for f in ['core.js','quiz.js','home.js','fp.js','tools-page.js','levels-page.js','plan-chart.js','ema-page.js','overlap-page.js','levels-data.js','bank-tools.js','bank-levels.js','bank-ema.js']]
VN=re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]')
DELIM=re.compile(r'[<>\'"`{}$\n]')
def strip_comments(src,js):
    if js: src=re.sub(r'/\*.*?\*/',lambda m:'' if VN.search(m.group(0)) else m.group(0),src,flags=re.S)
    else: src=re.sub(r'<!--.*?-->',lambda m:'' if VN.search(m.group(0)) else m.group(0),src,flags=re.S)
    return src
def runs(src):
    out=[]
    for part in DELIM.split(src):
        k=part.strip()
        if k and VN.search(k): out.append(k)
    return out
if __name__=='__main__':
    allk={};per={}
    for f in FILES:
        s=strip_comments(open(os.path.join(ROOT,f)).read(),f.endswith('.js'))
        r=runs(s);per[f]=len(set(r))
        for k in r: allk.setdefault(k,f)
    print(per,len(allk),sum(len(k) for k in allk))
    
