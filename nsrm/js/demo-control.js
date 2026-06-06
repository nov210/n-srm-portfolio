/* demo-control.js — iframe 고정 프레임 + 일시정지/재생 */

(function (global) {
  var paused = false;
  var replayTimer = null;
  var resumeWaiters = [];

  function isPaused() {
    return paused;
  }

  function setPaused(value) {
    paused = !!value;
    document.documentElement.classList.toggle('nsrm-demo-paused', paused);
    if (paused && replayTimer) {
      clearTimeout(replayTimer);
      replayTimer = null;
    }
    if (!paused) {
      resumeWaiters.splice(0).forEach(function (fn) {
        fn();
      });
    }
  }

  function whenResumed() {
    if (!paused) return Promise.resolve();
    return new Promise(function (resolve) {
      resumeWaiters.push(resolve);
    });
  }

  function interruptibleDelay(ms) {
    return new Promise(function (resolve) {
      var left = ms;

      function step() {
        if (paused) {
          whenResumed().then(step);
          return;
        }
        if (left <= 0) {
          resolve();
          return;
        }
        var chunk = Math.min(40, left);
        setTimeout(function () {
          left -= chunk;
          step();
        }, chunk);
      }

      step();
    });
  }

  function setReplayTimer(fn, ms) {
    if (replayTimer) clearTimeout(replayTimer);
    replayTimer = setTimeout(function () {
      replayTimer = null;
      if (!paused) fn();
    }, ms);
  }

  function clearDemoSession() {
    try {
      sessionStorage.removeItem('nsrm-demo-finished');
      sessionStorage.removeItem('nsrm-demo-continue');
      sessionStorage.removeItem('nsrm-onboarding-seen');
      sessionStorage.removeItem('nsrm-show-onboarding');
    } catch (error) {
      /* sessionStorage unavailable */
    }
  }

  function withEmbed(url) {
    if (!/\bembed=1\b/.test(location.search)) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'embed=1';
  }

  function restartDemo() {
    setPaused(false);
    clearDemoSession();
    window.location.replace(withEmbed('index.html'));
  }

  function lockEmbedScroll() {
    function pinScroll() {
      if (global.scrollX !== 0 || global.scrollY !== 0) {
        global.scrollTo(0, 0);
      }
    }

    global.addEventListener(
      'scroll',
      function () {
        pinScroll();
      },
      { passive: true, capture: true }
    );

    global.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault();
      },
      { passive: false, capture: true }
    );

    global.addEventListener(
      'touchmove',
      function (e) {
        e.preventDefault();
      },
      { passive: false, capture: true }
    );

    pinScroll();
  }

  function blockScrollIntoViewInEmbed() {
    var proto = Element.prototype;
    var native = proto.scrollIntoView;
    if (!native || proto.__nsrmScrollIntoViewBlocked) return;

    proto.scrollIntoView = function () {
      if (/\bembed=1\b/.test(location.search)) return;
      return native.apply(this, arguments);
    };
    proto.__nsrmScrollIntoViewBlocked = true;
  }

  function initEmbed() {
    if (!/\bembed=1\b/.test(location.search)) return;
    document.documentElement.classList.add('nsrm-embed');
    document.documentElement.style.overflow = 'hidden';
    if (document.body) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    }
    blockScrollIntoViewInEmbed();
    lockEmbedScroll();
    if (document.getElementById('nsrm-embed-css')) return;
    var link = document.createElement('link');
    link.id = 'nsrm-embed-css';
    link.rel = 'stylesheet';
    link.href = 'css/embed.css';
    document.head.appendChild(link);
  }

  global.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== 'nsrm-demo') return;
    if (data.cmd === 'pause') setPaused(true);
    if (data.cmd === 'play') setPaused(false);
    if (data.cmd === 'restart') restartDemo();
  });

  global.NSRM_DEMO_CTRL = {
    isPaused: isPaused,
    setPaused: setPaused,
    whenResumed: whenResumed,
    interruptibleDelay: interruptibleDelay,
    setReplayTimer: setReplayTimer,
    clearDemoSession: clearDemoSession,
    withEmbed: withEmbed,
    restartDemo: restartDemo
  };

  initEmbed();
})(typeof window !== 'undefined' ? window : this);
