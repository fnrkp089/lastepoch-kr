(async function() {
  var tips;
  try {
    var res = await fetch('https://raw.githubusercontent.com/fnrkp089/lastepoch-kr/main/tooltips.json');
    tips = await res.json();
  } catch(e) {
    console.log('tooltips.json not loaded');
    return;
  }
  
  function formatDesc(desc) {
    if (!desc) return '';
    return desc
      .replace(/'?\{'([^}]+)'\}?/g, '<span class="skill-ref">$1</span>')
      .replace(/\[(\d+[\.,]?\d*[%]?)\]/g, '<span class="num-ref">$1</span>');
  }
  
  function buildUniquePopup(tip, en) {
    var h = '<div class="tt-u-header">';
    if (tip.sp) {
      var scale = 56 / Math.max(tip.sp[2], tip.sp[3]);
      var bgSizeW = Math.round(3529 * scale);
      var bgSizeH = Math.round(3470 * scale);
      var bgX = Math.round(tip.sp[0] * scale);
      var bgY = Math.round(tip.sp[1] * scale);
      h += '<div class="tt-u-icon" style="background-size:' + bgSizeW + 'px ' + bgSizeH + 'px;background-position:-' + bgX + 'px -' + bgY + 'px"></div>';
    }
    h += '<div class="tt-u-info">';
    h += '<div class="tt-u-name">' + tip.ko + '</div>';
    h += '<div class="tt-u-base">' + (tip.base || '') + '</div>';
    if (tip.set) h += '<div class="tt-u-set-tag">\uc138\ud2b8 \uc544\uc774\ud15c</div>';
    h += '</div></div>';
    if (tip.implicits && tip.implicits.length > 0) {
      h += '<div style="color:#aaa;font-size:10px;margin-top:4px;padding-bottom:2px;border-bottom:1px solid #444">기본 속성</div>';
      tip.implicits.forEach(function(im) { h += '<div style="color:#7c7cef;font-size:11px;padding:2px 4px;margin:1px 0;background:rgba(124,124,239,0.06);border-radius:3px">' + im + '</div>'; });
    }
    if (tip.mods && tip.mods.length > 0) {
      h += '<div style="color:#aaa;font-size:10px;margin-top:4px;padding-bottom:2px;border-bottom:1px solid #444">고유 옵션</div>';
      tip.mods.forEach(function(md) { h += '<div style="color:#c8c8c8;font-size:11px;padding:3px 4px;margin:2px 0;background:rgba(200,200,200,0.06);border-left:2px solid #555;border-radius:2px">' + (md || '') + '</div>'; });
    }
    if (tip.lore) h += '<div class="tt-u-lore">"' + tip.lore + '"</div>';
    if (tip.tips && tip.tips.length > 0) {
      h += '<div class="tt-u-mods">';
      tip.tips.forEach(function(t) {
        h += '<div class="tt-u-mod">' + t.replace(/\[(\d+),\s*(\d+),\s*\d+\]/g, '<span class="mod-val">$1-$2</span>') + '</div>';
      });
      h += '</div>';
    }
    return h;
  }
  
  function buildNodePopup(tip, en) {
    var typeLabels = {skill: '\uc2a4\ud0ac', node: '\ub178\ub4dc'};
    var typeLabel = typeLabels[tip.type] || '';
    var typeClass = tip.type || '';
    
    var h = '<div class="tt-header">';
    h += '<div class="tt-name">' + tip.ko + ' <span class="tt-en">(' + en + ')</span></div>';
    h += '<span class="tt-type ' + typeClass + '">' + typeLabel + '</span>';
    h += '</div>';
    if (tip.tree) h += '<div class="tt-tree">' + tip.tree + ' \ud2b8\ub9ac</div>';
    if (tip.mp) h += '<div class="tt-meta">\ub9e5\uc2a4 ' + tip.mp + '\ud3ec\uc778\ud2b8</div>';
    if (tip.stats && tip.stats.length > 0) {
      h += '<div class="tt-stats">';
      tip.stats.forEach(function(st) {
        var cls = (st.d||st.downside) ? 'stat-down' : 'stat-up';
        var val = (st.v||st.value) ? '<span class="stat-val ' + cls + '">' + (st.v||st.value) + '</span> ' : '';
        h += '<div class="tt-stat">' + val + (st.n||st.name) + '</div>';
      });
      h += '</div>';
    }
    if (tip.desc) h += '<div class="tt-desc">' + formatDesc(tip.desc) + '</div>';
    return h;
  }
  
  // 스킬 변경점 섹션 + 유니크/세트 변경 섹션에 적용
  var sectionIds = [
    'rogue-new','rogue-changes','mage-changes','acolyte-changes','primalist-changes','sentinel-changes',
    'unique-changes','set-changes'
  ];
  var count = 0;
  
  sectionIds.forEach(function(secId) {
    var section = document.getElementById(secId);
    if (!section) return;
    
    var walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    
    textNodes.forEach(function(node) {
      var text = node.textContent;
      if (!text || !node.parentNode) return;
      
      var regex = /\(([A-Z][a-zA-Z\s\'\-]{2,50})\)/g;
      var match;
      var matches = [];
      while ((match = regex.exec(text)) !== null) {
        var en = match[1].trim();
        if (tips[en]) {
          matches.push({s: match.index, e: match.index + match[0].length, en: en, tip: tips[en]});
        }
      }
      if (matches.length === 0) return;
      
      var frag = document.createDocumentFragment();
      var lastIdx = 0;
      
      matches.forEach(function(m) {
        if (m.s > lastIdx) frag.appendChild(document.createTextNode(text.substring(lastIdx, m.s)));
        
        var span = document.createElement('span');
        span.className = 'tt';
        span.textContent = text.substring(m.s, m.e);
        
        var popup = document.createElement('div');
        popup.className = m.tip.type === 'unique' ? 'tt-unique-popup' : 'tt-popup';
        
        if (m.tip.type === 'unique') {
          popup.innerHTML = buildUniquePopup(m.tip, m.en);
        } else {
          popup.innerHTML = buildNodePopup(m.tip, m.en);
        }
        
        span.appendChild(popup);
        
        span.addEventListener('mouseenter', function(e) {
          var rect = span.getBoundingClientRect();
          var popupEl = span.querySelector('.tt-popup, .tt-unique-popup');
          if (rect.top > 300) {
            popupEl.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
            popupEl.style.top = '';
          } else {
            popupEl.style.top = (rect.bottom + 8) + 'px';
            popupEl.style.bottom = '';
          }
          popupEl.style.left = Math.max(10, Math.min(rect.left - 60, window.innerWidth - 360)) + 'px';
        });
        
        frag.appendChild(span);
        lastIdx = m.e;
        count++;
      });
      
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.substring(lastIdx)));
      node.parentNode.replaceChild(frag, node);
    });
  });
  
  console.log('Tooltips applied: ' + count);
  
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<span class="toast-icon">\ud83d\udca1</span> \uc601\ubb38\uba85\uc5d0 \ub9c8\uc6b0\uc2a4\ub97c \uc62c\ub9ac\uba74 \uc2a4\ud0ac/\ub178\ub4dc/\uc720\ub2c8\ud06c \uc124\uba85\uc744 \ud655\uc778\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4';
  document.body.appendChild(toast);
  
  var toastShown = false;
  function showToast() {
    if (toastShown) return;
    toastShown = true;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 4000);
  }
  
  var skillSection = document.getElementById('skill-changes') || document.getElementById('rogue-new');
  if (skillSection) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { showToast(); observer.disconnect(); }
      });
    }, {threshold: 0.1});
    observer.observe(skillSection);
  }
  
  document.querySelectorAll('.toc a').forEach(function(a) {
    a.addEventListener('click', function() {
      var href = a.getAttribute('href');
      if (href && (href.includes('skill') || href.includes('rogue') || href.includes('mage') || href.includes('acolyte') || href.includes('primalist') || href.includes('sentinel') || href.includes('unique') || href.includes('set'))) {
        setTimeout(showToast, 500);
      }
    });
  });
})();