/* demo-replay.js — 데모 종료 후 parent(frame.html)에 리플레이 요청 */

(function (global) {
  var REPLAY_DELAY_MS = 2800;

  function scheduleDemoReplay(delay) {
    var wait = typeof delay === 'number' ? delay : REPLAY_DELAY_MS;
    var run = function () {
      if (global.NSRM_DEMO_CTRL) {
        global.NSRM_DEMO_CTRL.clearDemoSession();
      }
      /* ★ 핵심 변경: 직접 이동하지 않고 parent(frame.html)에게 iframe 리셋을 요청 */
      try { window.parent.postMessage({ type: 'nsrm-replay' }, '*'); } catch (e) {}
    };

    if (global.NSRM_DEMO_CTRL) {
      global.NSRM_DEMO_CTRL.setReplayTimer(run, wait);
      return;
    }
    setTimeout(run, wait);
  }

  function initReplayOnHome() {
    if (!document.querySelector('.body')) return;
    if (global.NSRM_DEMO_CTRL && global.NSRM_DEMO_CTRL.isPaused()) return;

    try {
      if (sessionStorage.getItem('nsrm-demo-finished') !== '1') return;
    } catch (error) {
      return;
    }

    scheduleDemoReplay();
  }

  global.NSRM_DEMO_REPLAY = {
    scheduleDemoReplay: scheduleDemoReplay,
    initReplayOnHome: initReplayOnHome
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReplayOnHome);
  } else {
    initReplayOnHome();
  }
})(typeof window !== 'undefined' ? window : this);
