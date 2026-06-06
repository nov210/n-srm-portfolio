/* main.js — N-SRM 메인 페이지 인터랙션 */

var layerMap = {
  obOverlay: 'partials/onboarding.html',
  guideCoach: 'partials/guide-coach.html',
  popDeadline: 'partials/popup-deadline.html',
  popContent: 'partials/popup-content.html',
  popSurvey: 'partials/popup-survey.html',
  pfLegend: 'partials/portfolio-legend.html'
};

var guideCoachBlockingHints = false;

var layerLoadCache = {};

function getLayerRoot() {
  var root = document.getElementById('layerRoot');

  if (!root) {
    root = document.createElement('div');
    root.id = 'layerRoot';
    document.body.appendChild(root);
  }

  return root;
}

function loadLayer(id) {
  var existing = document.getElementById(id);
  if (existing) return Promise.resolve(existing);

  var url = layerMap[id];
  if (!url) return Promise.resolve(null);

  if (!layerLoadCache[id]) {
    layerLoadCache[id] = fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('레이어 파일을 불러오지 못했습니다: ' + url);
        return response.text();
      })
      .then(function (html) {
        var holder = document.createElement('div');
        holder.innerHTML = html.trim();

        var root = getLayerRoot();

        while (holder.firstElementChild) {
          root.appendChild(holder.firstElementChild);
        }

        return document.getElementById(id);
      })
      .catch(function (error) {
        console.error(error);
        return null;
      });
  }

  return layerLoadCache[id];
}

function dismissOb() {
  var el = document.getElementById('obOverlay');
  if (!el) return;

  el.classList.add('hide');
  setTimeout(function () {
    el.classList.remove('open');
    el.style.display = 'none';
  }, 380);
}

function openOnboarding() {
  loadLayer('obOverlay').then(function (overlay) {
    if (!overlay) return;

    overlay.style.display = '';
    overlay.classList.remove('hide');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function openPop(id) {
  loadLayer(id).then(function (popup) {
    if (!popup) return;

    popup.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function closePop(id) {
  var popup = document.getElementById(id);
  if (!popup) return;

  var panel = popup.querySelector('.pop-panel');

  if (panel) {
    panel.classList.add('pop-panel-out');
  }

  setTimeout(function () {
    popup.classList.remove('open');

    if (panel) {
      panel.classList.remove('pop-panel-out');
    }

    document.body.style.overflow = '';
  }, 180);
}

function selectScale(button) {
  var group = button.parentElement;
  if (!group) return;

  group.querySelectorAll('.sv-scale-btn').forEach(function (item) {
    item.classList.remove('sel');
  });

  button.classList.add('sel');
}

function switchTab(button) {
  var group = button.parentElement;
  if (!group) return;

  group.querySelectorAll('.tab-btn').forEach(function (item) {
    item.classList.remove('on');
  });

  button.classList.add('on');
}

function switchBtab(button) {
  var group = button.parentElement;
  if (!group) return;

  group.querySelectorAll('.btab').forEach(function (item) {
    item.classList.remove('on');
  });

  button.classList.add('on');
}

function switchCtEpisode(button) {
  var episode = button.dataset.episode;
  var popup = button.closest('#popContent');
  if (!popup || !episode) return;

  popup.querySelectorAll('.ct-episode-tab').forEach(function (tab) {
    var isActive = tab.dataset.episode === episode;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  popup.querySelectorAll('.ct-webtoon').forEach(function (img) {
    var isActive = img.dataset.episode === episode;
    img.classList.toggle('is-active', isActive);
    if (isActive) {
      img.removeAttribute('hidden');
    } else {
      img.setAttribute('hidden', '');
    }
  });
}

document.addEventListener('click', function (event) {
  var onboardingButton = event.target.closest('[data-onboarding-open]');
  if (onboardingButton) {
    openOnboarding();
    return;
  }

  var dismissButton = event.target.closest('[data-action="dismiss-ob"]');
  if (dismissButton) {
    dismissOb();
    document.body.style.overflow = '';
    return;
  }

  var guideCoachDismiss = event.target.closest('[data-action="dismiss-guide-coach"]');
  if (guideCoachDismiss) {
    dismissGuideCoach();
    return;
  }

  if (event.target.id === 'guideCoach') {
    dismissGuideCoach();
    return;
  }

  var openButton = event.target.closest('[data-popup-open]');
  if (openButton) {
    openPop(openButton.dataset.popupOpen);
    return;
  }

  var closeButton = event.target.closest('[data-popup-close]');
  if (closeButton) {
    closePop(closeButton.dataset.popupClose);
    return;
  }

  var overlay = event.target.classList && event.target.classList.contains('pop-overlay') ? event.target : null;
  if (overlay) {
    closePop(overlay.id);
    return;
  }

  var scaleButton = event.target.closest('[data-action="select-scale"]');
  if (scaleButton) {
    selectScale(scaleButton);
    return;
  }

  var tabButton = event.target.closest('[data-action="switch-tab"]');
  if (tabButton) {
    switchTab(tabButton);
    return;
  }

  var boardTabButton = event.target.closest('[data-action="switch-btab"]');
  if (boardTabButton) {
    switchBtab(boardTabButton);
    return;
  }

  var ctEpisodeButton = event.target.closest('[data-action="switch-ct-episode"]');
  if (ctEpisodeButton) {
    switchCtEpisode(ctEpisodeButton);
    return;
  }

  var calendarDay = event.target.closest('.cal-day:not(.other)');
  if (calendarDay) {
    document.querySelectorAll('.cal-day').forEach(function (item) {
      if (!item.classList.contains('today')) {
        item.classList.remove('sel');
      }
    });

    if (!calendarDay.classList.contains('today')) {
      calendarDay.classList.add('sel');
    }
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;

  var guideCoach = document.getElementById('guideCoach');
  if (guideCoach && guideCoach.classList.contains('open')) {
    dismissGuideCoach();
    return;
  }

  var openPopup = document.querySelector('.pop-overlay.open');

  if (openPopup) {
    closePop(openPopup.id);
  } else {
    dismissOb();
    document.body.style.overflow = '';
  }
});

function maybeOpenOnboardingAfterLogin() {
  try {
    /* 로그인 페이지에서 이미 온보딩을 본 경우 index 에서 다시 띄우지 않음 */
    if (sessionStorage.getItem('nsrm-onboarding-seen') === '1') return;
    if (sessionStorage.getItem('nsrm-show-onboarding') !== '1') return;
    sessionStorage.removeItem('nsrm-show-onboarding');
    openOnboarding();
  } catch (error) {
    /* sessionStorage unavailable */
  }
}

function dismissGuideCoach() {
  var overlay = document.getElementById('guideCoach');

  try {
    sessionStorage.setItem('nsrm-click-coach-seen', '1');
  } catch (error) {
    /* sessionStorage unavailable */
  }

  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }

  document.body.style.overflow = '';
  guideCoachBlockingHints = false;

  if (allClickHintTargetsReady()) {
    showClickHints();
    return;
  }

  setTimeout(function retryHintsAfterCoach() {
    if (allClickHintTargetsReady()) showClickHints();
  }, 400);
}

function maybeShowGuideCoach() {
  if (!document.querySelector('.body')) return;

  try {
    if (sessionStorage.getItem('nsrm-click-coach-seen') === '1') return;
  } catch (error) {
    return;
  }

  guideCoachBlockingHints = true;

  loadLayer('guideCoach').then(function (overlay) {
    if (!overlay) {
      /* partial 누락 배포 대비: JS에서 즉시 폴백 생성 */
      overlay = createGuideCoachFallback();
      if (!overlay) {
        guideCoachBlockingHints = false;
        return;
      }
    }

    overlay.style.display = '';
    overlay.classList.remove('hide');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function createGuideCoachFallback() {
  if (document.getElementById('guideCoach')) return document.getElementById('guideCoach');

  var root = getLayerRoot();
  var wrapper = document.createElement('div');
  wrapper.innerHTML = [
    '<div class="ob-overlay" id="guideCoach" role="dialog" aria-label="이 파란 원이 표시된 업무 영역에 마우스를 올리면 관련 내용이 강조됩니다. 확인 후 클릭해주세요." aria-modal="true">',
    '  <div class="guide-coach-wrap">',
    '    <button type="button" class="guide-coach-close" data-action="dismiss-guide-coach" aria-label="닫기">',
    '      <span class="guide-coach-close-x" aria-hidden="true"></span>',
    '    </button>',
    '    <div class="guide-coach-visual">',
    '      <span class="guide-coach-pin-demo" aria-hidden="true"></span>',
    '      <span class="guide-coach-visual-label">이 파란 원이 표시된 업무 영역에 마우스를 올리면 관련 내용이 강조됩니다. 확인 후 클릭해주세요.</span>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  if (!wrapper.firstElementChild) return null;
  root.appendChild(wrapper.firstElementChild);
  return document.getElementById('guideCoach');
}

var clickHintTargets = [
  { key: 'supplier-management', action: 'page', pageUrl: 'nsrm_supplier_list.html', inline: true, pin: { left: '50%', top: '2px' } },
  /* 위치는 .guide-pin-today-deadline 에서만 지정(인라인 top 제거로 잘림 방지) */
  { key: 'today-deadline', action: 'popup', pin: { left: '92%' } },
  /* 위치는 .guide-pin-today-content 에서만 지정 */
  { key: 'today-content', action: 'popup' },
  { key: 'survey-progress', action: 'popup', pin: { left: '72%', top: '6px' } }
];

function ensureGuideSpotlightBg() {
  var el = document.getElementById('guideSpotlightBg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'guideSpotlightBg';
    el.className = 'guide-spotlight-bg';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function showGuideSpotlight(target) {
  if (!target || !document.body.classList.contains('guide-hints-active')) return;
  ensureGuideSpotlightBg();
  document.body.classList.add('guide-spotlight-on');
  target.classList.add('guide-spotlit');
  target.classList.add('guide-focus-hover');
}

function hideGuideSpotlight(target) {
  document.body.classList.remove('guide-spotlight-on');
  if (target) {
    target.classList.remove('guide-spotlit');
    target.classList.remove('guide-focus-hover');
  } else {
    document.querySelectorAll('.guide-spotlit').forEach(function (node) {
      node.classList.remove('guide-spotlit');
    });
    document.querySelectorAll('.guide-focus-hover').forEach(function (node) {
      node.classList.remove('guide-focus-hover');
    });
  }
}

function handleGuideTargetAction(target, config) {
  if (!target) return;

  hideGuideSpotlight(null);

  if (config.action === 'page' && config.pageUrl) {
    window.location.href = config.pageUrl;
    return;
  }

  var popupId = target.dataset && target.dataset.popupOpen;
  if (popupId) {
    openPop(popupId);
    return;
  }

  var link = target.querySelector('a[href]');
  if (link && link.getAttribute('href') && link.getAttribute('href') !== '#none') {
    window.location.href = link.getAttribute('href');
  }
}

function ensureClickPin(target, config) {
  if (!target) return;

  if (!target.classList.contains('hs-wrap')) {
    target.classList.add('hs-wrap');
  }

  if (config.inline) {
    target.classList.add('guide-pin-target-inline');
  }

  if (target.dataset.guidePinBound !== '1') {
    target.addEventListener('mouseenter', function () {
      showGuideSpotlight(target);
    });
    target.addEventListener('mouseleave', function () {
      hideGuideSpotlight(target);
    });
    target.addEventListener('click', function () {
      handleGuideTargetAction(target, config);
    });
    target.dataset.guidePinBound = '1';
  }

  if (target.querySelector('.guide-pin')) return;

  var pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'guide-pin guide-pin-' + config.key;
  if (config.pin) {
    if (config.pin.left) pin.style.left = config.pin.left;
    if (config.pin.top) pin.style.top = config.pin.top;
  }
  pin.setAttribute('aria-label', '가이드 포인트');
  pin.addEventListener('mouseenter', function () {
    showGuideSpotlight(target);
  });
  pin.addEventListener('mouseleave', function () {
    hideGuideSpotlight(target);
  });
  pin.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    handleGuideTargetAction(target, config);
  });
  target.appendChild(pin);

  var hitbox = document.createElement('button');
  hitbox.type = 'button';
  hitbox.className = 'guide-pin-hitbox guide-pin-hitbox-' + config.key;
  var pinStyle = window.getComputedStyle(pin);
  hitbox.style.left = pinStyle.left;
  hitbox.style.top = pinStyle.top;
  hitbox.setAttribute('aria-label', '가이드 포인트 영역');
  hitbox.addEventListener('mouseenter', function () {
    showGuideSpotlight(target);
  });
  hitbox.addEventListener('mouseleave', function () {
    hideGuideSpotlight(target);
  });
  hitbox.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    handleGuideTargetAction(target, config);
  });
  target.appendChild(hitbox);
}

function allClickHintTargetsReady() {
  return clickHintTargets.every(function (item) {
    return !!document.querySelector('[data-guide-target="' + item.key + '"]');
  });
}

var clickHintsShown = false;

function showClickHints() {
  if (clickHintsShown) return;
  clickHintsShown = true;

  clickHintTargets.forEach(function (item) {
    var target = document.querySelector('[data-guide-target="' + item.key + '"]');
    ensureClickPin(target, item);
  });

  document.body.classList.add('guide-hints-active');
}

var clickHintsBootAt = 0;
var CLICK_HINTS_DELAY_MS = 1500;

function scheduleClickHints() {
  if (!document.querySelector('.body') || !allClickHintTargetsReady()) return;

  var remaining = Math.max(0, CLICK_HINTS_DELAY_MS - (Date.now() - clickHintsBootAt));

  setTimeout(function () {
    if (guideCoachBlockingHints) return;
    if (allClickHintTargetsReady()) showClickHints();
  }, remaining);
}

function bootClickHints() {
  if (!document.querySelector('.body')) return;

  clickHintsBootAt = Date.now();

  document.addEventListener('nsrm-header-ready', scheduleClickHints, { once: true });

  setTimeout(function waitTargets() {
    if (allClickHintTargetsReady()) {
      scheduleClickHints();
      return;
    }
    setTimeout(waitTargets, 120);
  }, CLICK_HINTS_DELAY_MS);
}

var DASHBOARD_DEMO_TIMING = {
  startDelay: 520,
  moveDuration: 340,
  clickPress: 90,
  afterClick: 120,
  popupShow: 1100,
  betweenTargets: 280
};

var DASHBOARD_DEMO_TARGETS = [
  { key: 'today-deadline', popupId: 'popDeadline' },
  { key: 'survey-progress', popupId: 'popSurvey' },
  { key: 'today-content', popupId: 'popContent' },
  { key: 'supplier-management', pageUrl: 'nsrm_supplier_list.html' }
];

var dashboardDemoRunning = false;
var dashboardDemoStarted = false;

function demoDelay(ms) {
  if (window.NSRM_DEMO_CTRL) {
    return window.NSRM_DEMO_CTRL.interruptibleDelay(ms);
  }
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function getDemoCursorCenter(target) {
  var rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.55,
    y: rect.top + rect.height * 0.45
  };
}

function setDemoCursorMode(cursor, mode) {
  cursor.classList.remove('is-text', 'is-pointer');
  cursor.classList.add(mode === 'text' ? 'is-text' : 'is-pointer');
}

function moveDemoCursor(cursor, x, y, duration) {
  cursor.style.transition =
    'left ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1), ' +
    'top ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
  cursor.style.left = x + 'px';
  cursor.style.top = y + 'px';
  return demoDelay(duration + 16);
}

function pressDemoCursor(cursor) {
  cursor.classList.add('is-pressing');
  return demoDelay(DASHBOARD_DEMO_TIMING.clickPress).then(function () {
    cursor.classList.remove('is-pressing');
  });
}

function pulseDemoTarget(target) {
  if (!target) return demoDelay(0);
  target.classList.add('is-demo-click');
  return demoDelay(160).then(function () {
    target.classList.remove('is-demo-click');
  });
}

function demoClickPopupTarget(cursor, target, popupId) {
  return pressDemoCursor(cursor)
    .then(function () {
      return pulseDemoTarget(target);
    })
    .then(function () {
      return openPop(popupId);
    })
    .then(function () {
      return demoDelay(DASHBOARD_DEMO_TIMING.popupShow);
    })
    .then(function () {
      closePop(popupId);
      return demoDelay(220);
    });
}

function allDashboardDemoTargetsReady() {
  return DASHBOARD_DEMO_TARGETS.every(function (item) {
    return !!document.querySelector('[data-guide-target="' + item.key + '"]');
  });
}

function playDashboardClickDemo() {
  if (dashboardDemoRunning || !document.querySelector('.body')) return;
  if (window.NSRM_DEMO_CTRL && window.NSRM_DEMO_CTRL.isPaused()) return;

  var cursor = document.getElementById('loginDemoCursor');
  if (!cursor) return;

  dashboardDemoRunning = true;
  document.body.classList.add('dashboard-demo-active');

  setDemoCursorMode(cursor, 'pointer');
  cursor.classList.remove('is-hidden');
  cursor.classList.add('is-visible');

  var firstTarget = document.querySelector(
    '[data-guide-target="' + DASHBOARD_DEMO_TARGETS[0].key + '"]'
  );
  var start = getDemoCursorCenter(firstTarget);
  cursor.style.transition = 'none';
  cursor.style.left = start.x + 'px';
  cursor.style.top = start.y + 'px';

  var chain = demoDelay(DASHBOARD_DEMO_TIMING.startDelay);

  DASHBOARD_DEMO_TARGETS.forEach(function (item) {
    chain = chain.then(function () {
      var target = document.querySelector('[data-guide-target="' + item.key + '"]');
      if (!target) return;

      var point = getDemoCursorCenter(target);
      return moveDemoCursor(cursor, point.x, point.y, DASHBOARD_DEMO_TIMING.moveDuration).then(
        function () {
          if (item.popupId) {
            return demoClickPopupTarget(cursor, target, item.popupId);
          }

          return pressDemoCursor(cursor)
            .then(function () {
              return pulseDemoTarget(target);
            })
            .then(function () {
              if (item.pageUrl) {
                var link = target.querySelector('a[href]');
                try {
                  sessionStorage.setItem('nsrm-demo-continue', 'supplier-detail-link');
                } catch (error) {
                  /* sessionStorage unavailable */
                }
                var nextUrl = (link && link.getAttribute('href')) || item.pageUrl;
                window.location.href =
                  window.NSRM_DEMO_CTRL && nextUrl
                    ? window.NSRM_DEMO_CTRL.withEmbed(nextUrl)
                    : nextUrl;
                return;
              }
              return demoDelay(DASHBOARD_DEMO_TIMING.afterClick);
            });
        }
      );
    });

    chain = chain.then(function () {
      return demoDelay(DASHBOARD_DEMO_TIMING.betweenTargets);
    });
  });

  chain
    .then(function () {
      cursor.classList.add('is-hidden');
      cursor.classList.remove('is-visible');
      document.body.classList.remove('dashboard-demo-active');
      dashboardDemoRunning = false;
    })
    .catch(function (error) {
      console.error(error);
      dashboardDemoRunning = false;
      document.body.classList.remove('dashboard-demo-active');
    });
}

function startDashboardClickDemo() {
  if (!document.querySelector('.body')) return;
  if (window.NSRM_DEMO_CTRL && window.NSRM_DEMO_CTRL.isPaused()) return;

  try {
    if (sessionStorage.getItem('nsrm-demo-finished') === '1') return;
  } catch (error) {
    /* sessionStorage unavailable */
  }

  function tryStart() {
    if (dashboardDemoStarted || !allDashboardDemoTargetsReady()) return;
    dashboardDemoStarted = true;
    playDashboardClickDemo();
  }

  document.addEventListener('nsrm-header-ready', function () {
    setTimeout(tryStart, DASHBOARD_DEMO_TIMING.startDelay);
  });

  setTimeout(function waitTargets() {
    if (allDashboardDemoTargetsReady()) {
      tryStart();
      return;
    }
    setTimeout(waitTargets, 120);
  }, DASHBOARD_DEMO_TIMING.startDelay);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDashboardClickDemo);
} else {
  startDashboardClickDemo();
}

window.NSRM = window.NSRM || {};
window.NSRM.loadLayer = loadLayer;
window.NSRM.openPop = openPop;
window.NSRM.openOnboarding = openOnboarding;
