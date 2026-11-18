/* Chương Tape: chuyển layout tape mẫu Đầy đủ / 2 cột (Price + Volume như Smart Tape) */
(function(){
var box=document.getElementById("tpPats");if(!box)return;
var K="ofs.tape.layout",bs=[].slice.call(document.querySelectorAll(".tp-seg button"));
function set(l){box.classList.toggle("l2",l==="l2");bs.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.l===l))});try{localStorage.setItem(K,l)}catch(e){}}
bs.forEach(function(b){b.addEventListener("click",function(){set(b.dataset.l)})});
var s="full";try{s=localStorage.getItem(K)||"full"}catch(e){}
set(s);
})();
