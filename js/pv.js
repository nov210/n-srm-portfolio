/* ============================================================
   pv.js — 포트폴리오 뷰 인터랙션
   ============================================================ */
(function(){
  'use strict';

  /* ── 리빌 ── */
  var rvs=document.querySelectorAll('.rv');
  var obs=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('on')});
  },{threshold:.1,rootMargin:'0px 0px -30px 0px'});
  rvs.forEach(function(el){obs.observe(el)});

  /* ── BA 슬라이더 (dashboard22) ── */
  var cmp=document.getElementById('comparison');
  var bef=document.getElementById('beforeLayer');
  var hdl=document.getElementById('handle');
  var baBr=document.getElementById('baBr');
  var beforeImg=bef&&bef.querySelector('img[data-src]');
  if(baBr&&beforeImg){
    var beforeObs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          beforeImg.src=beforeImg.dataset.src;
          beforeImg.removeAttribute('data-src');
          beforeObs.unobserve(baBr);
        }
      });
    },{rootMargin:'300px'});
    beforeObs.observe(baBr);
  }
  if(cmp&&bef&&hdl){
    var d=false;
    function sp(x){
      var r=cmp.getBoundingClientRect();
      var ratio=(x-r.left)/r.width;
      ratio=Math.max(0,Math.min(1,ratio));
      var pct=ratio*100;
      bef.style.clipPath='inset(0 '+(100-pct)+'% 0 0)';
      hdl.style.left=pct+'%';
    }
    cmp.addEventListener('pointerdown',function(e){
      d=true;
      cmp.setPointerCapture(e.pointerId);
      sp(e.clientX);
    });
    cmp.addEventListener('pointermove',function(e){
      if(!d)return;
      e.preventDefault();
      sp(e.clientX);
    });
    cmp.addEventListener('pointerup',function(){d=false;});
    cmp.addEventListener('pointercancel',function(){d=false;});
    cmp.addEventListener('dragstart',function(e){e.preventDefault();});
  }

  /* ── PC 갤러리 블랙 오버레이 ── */
  document.querySelectorAll('.pc-card').forEach(function(card){
    if(card.querySelector('.pc-overlay'))return;
    var ov=document.createElement('span');
    ov.className='pc-overlay';
    ov.setAttribute('aria-hidden','true');
    card.appendChild(ov);
  });

  /* ── 데모 iframe 지연 로드 (뷰포트 진입 시 재생 시작) ── */
  var demoFrame=document.querySelector('.demo-frame');
  if(demoFrame&&demoFrame.dataset.src){
    var demoObs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          demoFrame.src=demoFrame.dataset.src;
          demoObs.unobserve(demoFrame);
        }
      });
    },{threshold:0.2});
    demoObs.observe(demoFrame);
  }

  /* ── 데모 iframe 스크롤 격리 ── */
  var demoWrap=document.querySelector('.demo-wrap');
  if(demoWrap){
    var fr=demoWrap.querySelector('iframe');
    if(fr) fr.style.pointerEvents='none';

    /*
     * iframe 이 pointer-events:none 이므로
     * mouseenter/mouseleave 가 demo-wrap 에서 정상 발생.
     * body overflow:hidden 으로 물리적으로 스크롤 잠금.
     */
    demoWrap.addEventListener('mouseenter',function(){
      document.documentElement.style.overflow='hidden';
      document.body.style.overflow='hidden';
    });
    demoWrap.addEventListener('mouseleave',function(){
      document.documentElement.style.overflow='';
      document.body.style.overflow='';
    });

    /* belt-and-suspenders: wheel 도 막아둠 */
    demoWrap.addEventListener('wheel',function(e){
      e.preventDefault();
    },{passive:false});
    demoWrap.addEventListener('touchmove',function(e){
      e.preventDefault();
    },{passive:false});
  }

})();
