/* login.js — 로그인 자동 데모 + 온보딩 → 로딩 → index */

var DEMO_EMAIL = 'cs.kim@samsung.com';
var DEMO_PASSWORD = 'Samsung2024!';

var DEMO_TIMING = {
  startDelay: 180,
  stepPause: 100,
  afterIdType: 280,
  afterPwType: 280,
  afterClick: 50,
  moveToId: 340,
  moveToPw: 320,
  moveToLogin: 340,
  clickPress: 90,
  beforeOnboarding: 100,
  typeEmail: 28,
  typePassword: 24
};

/* 입력칸: padding-left 기준 (login.css field-input padding 24px) + textOffsetX 미세조정 */
var DEMO_CURSOR_POS = {
  id: { offsetY: 0.5, textOffsetX: 2 },
  pw: { offsetY: 0.5, textOffsetX: 2 },
  loginBtn: { offsetX: 0.55, offsetY: 0.45 }
};

var ONBOARDING_URL = 'partials/onboarding.html';
var onboardingLoadCache = null;
var demoRunning = false;
var audioCtx = null;

(function preloadLoginAssets() {
  ['images/login-bg2.png', 'images/pointer.png'].forEach(function (src) {
    var img = new Image();
    img.src = src;
  });
})();

/* 페이지 아무 곳이나 한 번 누르면 효과음 잠금 해제 (브라우저 정책) */
document.addEventListener(
  'pointerdown',
  function unlockAudio() {
    var ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  },
  { once: true, capture: true }
);

document.addEventListener('DOMContentLoaded', function () {
  var loading = document.getElementById('loading');
  var loadBar = document.getElementById('loadBar');

  if (loading) {
    loading.classList.add('hide');
  }

  if (loadBar) {
    loadBar.style.transition = 'none';
    loadBar.style.width = '0%';
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('#btnLogin, #btnSso')) {
      playLoadingAndGoToIndex();
    }
  });

  setTimeout(playLoginDemo, DEMO_TIMING.startDelay);
});

function delay(ms) {
  if (window.NSRM_DEMO_CTRL) {
    return window.NSRM_DEMO_CTRL.interruptibleDelay(ms);
  }
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function getLayerRoot() {
  var root = document.getElementById('layerRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'layerRoot';
    document.body.appendChild(root);
  }
  return root;
}

function loadOnboardingLayer() {
  var existing = document.getElementById('obOverlay');
  if (existing) return Promise.resolve(existing);

  if (!onboardingLoadCache) {
    onboardingLoadCache = fetch(ONBOARDING_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('온보딩을 불러오지 못했습니다.');
        return response.text();
      })
      .then(function (html) {
        var holder = document.createElement('div');
        holder.innerHTML = html.trim();
        var root = getLayerRoot();

        while (holder.firstElementChild) {
          root.appendChild(holder.firstElementChild);
        }

        return document.getElementById('obOverlay');
      })
      .catch(function (error) {
        console.error(error);
        return null;
      });
  }

  return onboardingLoadCache;
}

function getCursorPoint(target, pos) {
  var rect = target.getBoundingClientRect();
  var extraX = pos.textOffsetX || 0;
  var y = rect.top + rect.height * (pos.offsetY == null ? 0.5 : pos.offsetY);

  /* 입력 필드는 글자 시작 위치(padding-left)에 맞춤 */
  if (target.classList && target.classList.contains('field-input')) {
    var padLeft = parseFloat(window.getComputedStyle(target).paddingLeft) || 24;
    return {
      x: rect.left + padLeft + extraX,
      y: y
    };
  }

  return {
    x: rect.left + rect.width * (pos.offsetX == null ? 0.5 : pos.offsetX),
    y: y
  };
}

function setCursorMode(cursor, mode) {
  cursor.classList.remove('is-text', 'is-pointer');
  cursor.classList.add(mode === 'pointer' ? 'is-pointer' : 'is-text');
}

/** 타이핑 중에는 데모 I-beam 숨김 (깜빡임 방지) */
function hideTextCursor(cursor) {
  cursor.classList.add('is-typing-hidden');
}

/** 다음 입력칸으로 이동할 때만 다시 표시 */
function showTextCursor(cursor) {
  cursor.classList.remove('is-typing-hidden');
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/** 로그인 버튼 클릭 시 짧은 찰칵 소리 */
function playClickSound() {
  try {
    var ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (error) {
    /* 오디오 미지원 환경 */
  }
}

function moveCursor(cursor, x, y, duration) {
  cursor.style.transition =
    'left ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1), ' +
    'top ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
  cursor.style.left = x + 'px';
  cursor.style.top = y + 'px';
  return delay(duration + 16);
}

function pressCursor(cursor) {
  cursor.classList.add('is-pressing');
  return delay(DEMO_TIMING.clickPress).then(function () {
    cursor.classList.remove('is-pressing');
  });
}

function typeInto(cursor, input, text, charDelay) {
  input.focus();
  input.value = '';
  hideTextCursor(cursor);

  return new Promise(function (resolve) {
    var index = 0;

    function tick() {
      if (index >= text.length) {
        resolve();
        return;
      }

      input.value += text.charAt(index);
      index += 1;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(tick, charDelay);
    }

    tick();
  });
}

function showOnboardingAfterLogin() {
  var cursor = document.getElementById('loginDemoCursor');
  if (cursor) {
    cursor.classList.add('is-hidden');
    cursor.classList.remove('is-visible');
  }

  return loadOnboardingLayer().then(function (overlay) {
    if (!overlay) {
      playLoadingAndGoToIndex();
      return;
    }

    overlay.style.display = '';
    overlay.classList.remove('hide');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function dismissOnboardingAndContinue() {
  var overlay = document.getElementById('obOverlay');

  if (!overlay) {
    playLoadingAndGoToIndex();
    return;
  }

  /* 닫힘 애니메이션 대기 중 로그인 배경이 비치지 않도록 즉시 로딩으로 전환 */
  overlay.classList.remove('open', 'hide');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  playLoadingAndGoToIndex();
}

function markOnboardingSeen() {
  try {
    sessionStorage.setItem('nsrm-onboarding-seen', '1');
    sessionStorage.removeItem('nsrm-show-onboarding');
  } catch (error) {
    /* ignore */
  }
}

function playLoadingAndGoToIndex() {
  var loading = document.getElementById('loading');
  var loadBar = document.getElementById('loadBar');

  markOnboardingSeen();

  if (!loading || !loadBar) {
    window.location.href =
      window.NSRM_DEMO_CTRL ? window.NSRM_DEMO_CTRL.withEmbed('home.html') : 'home.html';
    return;
  }

  loading.classList.remove('hide');

  loadBar.style.transition = 'none';
  loadBar.style.width = '0%';

  setTimeout(function () {
    loadBar.style.transition = 'width .65s ease';
    loadBar.style.width = '100%';
  }, 30);

  setTimeout(function () {
    window.location.href =
      window.NSRM_DEMO_CTRL ? window.NSRM_DEMO_CTRL.withEmbed('home.html') : 'home.html';
  }, 850);
}

function playLoginDemo() {
  if (demoRunning) return;
  if (window.NSRM_DEMO_CTRL && window.NSRM_DEMO_CTRL.isPaused()) return;

  var cursor = document.getElementById('loginDemoCursor');
  var userId = document.getElementById('userId');
  var userPw = document.getElementById('userPw');
  var btnLogin = document.getElementById('btnLogin');
  var loginCard = document.querySelector('.login-card');

  if (!cursor || !userId || !userPw || !btnLogin) return;

  demoRunning = true;
  try {
    sessionStorage.removeItem('nsrm-demo-finished');
    sessionStorage.removeItem('nsrm-demo-continue');
  } catch (error) {
    /* sessionStorage unavailable */
  }
  if (loginCard) loginCard.classList.add('is-demo-active');

  getAudioContext().resume().catch(function () {});

  userId.value = '';
  userPw.value = '';

  setCursorMode(cursor, 'text');
  cursor.classList.remove('is-hidden');
  cursor.classList.add('is-visible');

  var start = getCursorPoint(userId, DEMO_CURSOR_POS.id);
  cursor.style.transition = 'none';
  cursor.style.left = start.x + 'px';
  cursor.style.top = start.y + 'px';

  return delay(DEMO_TIMING.stepPause)
    .then(function () {
      setCursorMode(cursor, 'text');
      showTextCursor(cursor);
      var idPoint = getCursorPoint(userId, DEMO_CURSOR_POS.id);
      return moveCursor(cursor, idPoint.x, idPoint.y, DEMO_TIMING.moveToId);
    })
    .then(function () {
      return pressCursor(cursor);
    })
    .then(function () {
      return delay(DEMO_TIMING.afterClick);
    })
    .then(function () {
      return typeInto(cursor, userId, DEMO_EMAIL, DEMO_TIMING.typeEmail);
    })
    .then(function () {
      return delay(DEMO_TIMING.afterIdType);
    })
    .then(function () {
      setCursorMode(cursor, 'text');
      showTextCursor(cursor);
      var pwPoint = getCursorPoint(userPw, DEMO_CURSOR_POS.pw);
      return moveCursor(cursor, pwPoint.x, pwPoint.y, DEMO_TIMING.moveToPw);
    })
    .then(function () {
      return pressCursor(cursor);
    })
    .then(function () {
      return delay(DEMO_TIMING.afterClick);
    })
    .then(function () {
      return typeInto(cursor, userPw, DEMO_PASSWORD, DEMO_TIMING.typePassword);
    })
    .then(function () {
      return delay(DEMO_TIMING.afterPwType);
    })
    .then(function () {
      setCursorMode(cursor, 'pointer');
      var btnPoint = getCursorPoint(btnLogin, DEMO_CURSOR_POS.loginBtn);
      return moveCursor(cursor, btnPoint.x, btnPoint.y, DEMO_TIMING.moveToLogin);
    })
    .then(function () {
      hideTextCursor(cursor);
      playClickSound();
      return pressCursor(cursor);
    })
    .then(function () {
      btnLogin.classList.add('is-demo-click');
      return delay(DEMO_TIMING.beforeOnboarding);
    })
    .then(function () {
      btnLogin.classList.remove('is-demo-click');
      if (loginCard) loginCard.classList.remove('is-demo-active');
      demoRunning = false;
      playLoadingAndGoToIndex();
    })
    .catch(function (error) {
      console.error(error);
      demoRunning = false;
    });
}
