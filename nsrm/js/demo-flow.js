/* demo-flow.js — 데모 플로우: 목록 → 상세 → 수정 */

var DEMO_FLOW_TIMING = {
  startDelay: 520,
  moveDuration: 340,
  clickPress: 90,
  afterClick: 160,
  scrollWait: 420
};

function demoFlowDelay(ms) {
  if (window.NSRM_DEMO_CTRL) {
    return window.NSRM_DEMO_CTRL.interruptibleDelay(ms);
  }
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function setDemoContinueStep(step) {
  try {
    if (step) {
      sessionStorage.setItem('nsrm-demo-continue', step);
    } else {
      sessionStorage.removeItem('nsrm-demo-continue');
    }
  } catch (error) {
    /* sessionStorage unavailable */
  }
}

function takeDemoContinueStep() {
  try {
    var step = sessionStorage.getItem('nsrm-demo-continue');
    sessionStorage.removeItem('nsrm-demo-continue');
    return step;
  } catch (error) {
    return null;
  }
}

function ensureDemoCursor() {
  var cursor = document.getElementById('loginDemoCursor');
  if (cursor) return cursor;

  cursor = document.createElement('div');
  cursor.id = 'loginDemoCursor';
  cursor.className = 'login-demo-cursor is-hidden';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<span class="login-cursor-ibeam"></span>' +
    '<img src="images/pointer.png" alt="" class="login-cursor-pointer" />';
  document.body.appendChild(cursor);
  return cursor;
}

function getDemoTargetCenter(target) {
  var rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.62,
    y: rect.top + rect.height * 0.5
  };
}

function setDemoCursorPointer(cursor) {
  cursor.classList.remove('is-text');
  cursor.classList.add('is-pointer');
}

function moveDemoFlowCursor(cursor, x, y, duration) {
  cursor.style.transition =
    'left ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1), ' +
    'top ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
  cursor.style.left = x + 'px';
  cursor.style.top = y + 'px';
  return demoFlowDelay(duration + 16);
}

function pressDemoFlowCursor(cursor) {
  cursor.classList.add('is-pressing');
  return demoFlowDelay(DEMO_FLOW_TIMING.clickPress).then(function () {
    cursor.classList.remove('is-pressing');
  });
}

function pulseDemoFlowTarget(target) {
  if (!target) return demoFlowDelay(0);
  target.classList.add('is-demo-click');
  return demoFlowDelay(160).then(function () {
    target.classList.remove('is-demo-click');
  });
}

function playDemoClickNavigate(target, options) {
  var cursor = ensureDemoCursor();
  if (!cursor || !target) return Promise.resolve();

  var nextStep = options && options.nextStep;
  var fallbackHref = (options && options.fallbackHref) || '';

  document.body.classList.add('dashboard-demo-active');
  setDemoCursorPointer(cursor);
  cursor.classList.remove('is-hidden');
  cursor.classList.add('is-visible');

  if (!/\bembed=1\b/.test(location.search)) {
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }

  var point = getDemoTargetCenter(target);
  cursor.style.transition = 'none';
  cursor.style.left = point.x + 'px';
  cursor.style.top = point.y + 'px';

  return demoFlowDelay(DEMO_FLOW_TIMING.startDelay)
    .then(function () {
      return demoFlowDelay(DEMO_FLOW_TIMING.scrollWait);
    })
    .then(function () {
      point = getDemoTargetCenter(target);
      return moveDemoFlowCursor(
        cursor,
        point.x,
        point.y,
        DEMO_FLOW_TIMING.moveDuration
      );
    })
    .then(function () {
      return pressDemoFlowCursor(cursor);
    })
    .then(function () {
      return pulseDemoFlowTarget(target);
    })
    .then(function () {
      return demoFlowDelay(DEMO_FLOW_TIMING.afterClick);
    })
    .then(function () {
      setDemoContinueStep(nextStep);
      if (options && options.triggerClick) {
        target.click();
        return;
      }
      var nextUrl = target.getAttribute('href') || fallbackHref;
      window.location.href =
        window.NSRM_DEMO_CTRL && nextUrl
          ? window.NSRM_DEMO_CTRL.withEmbed(nextUrl)
          : nextUrl;
    })
    .catch(function (error) {
      console.error(error);
      document.body.classList.remove('dashboard-demo-active');
      cursor.classList.add('is-hidden');
      cursor.classList.remove('is-visible');
    });
}

function ensureSupplierExpOpen() {
  var row = document.getElementById('expRow');
  var btn = document.getElementById('expBtn');
  if (!row) return;

  if (row.style.display === 'none') {
    row.style.display = '';
    if (btn) btn.innerHTML = '&#9660;';
  }
}

function getSupplierDetailLink() {
  return (
    document.querySelector('[data-demo-target="supplier-detail-link"]') ||
    document.querySelector('.exp-highlight-link[href="nsrm_supplier_detail.html"]') ||
    document.querySelector('.exp-highlight-link')
  );
}

function getSupplierEditBtn() {
  return (
    document.querySelector('[data-demo-target="supplier-edit-btn"]') ||
    document.querySelector('.detail-edit-wrap .det-btn.primary[href="nsrm_supplier_edit.html"]') ||
    document.querySelector('a.det-btn.primary[href="nsrm_supplier_edit.html"]')
  );
}

function getSupplierSaveBtn() {
  return (
    document.querySelector('[data-demo-target="supplier-save-btn"]') ||
    document.getElementById('saveBtn')
  );
}

function getSupplierSuccessConfirmBtn() {
  return (
    document.querySelector('[data-demo-target="supplier-success-confirm"]') ||
    document.querySelector('.success-btn[href="home.html"]') ||
    document.querySelector('.success-btn')
  );
}

function waitForTarget(getTarget, onReady) {
  function tryFind() {
    if (getTarget()) {
      onReady();
      return;
    }
    setTimeout(tryFind, 120);
  }

  tryFind();
}

function runDemoStep(step) {
  if (step === 'supplier-detail-link') {
    ensureSupplierExpOpen();
    waitForTarget(getSupplierDetailLink, function () {
      playDemoClickNavigate(getSupplierDetailLink(), {
        nextStep: 'supplier-edit-btn',
        fallbackHref: 'nsrm_supplier_detail.html'
      });
    });
    return;
  }

  if (step === 'supplier-edit-btn') {
    waitForTarget(getSupplierEditBtn, function () {
      playDemoClickNavigate(getSupplierEditBtn(), {
        nextStep: 'supplier-save-btn',
        fallbackHref: 'nsrm_supplier_edit.html'
      });
    });
    return;
  }

  if (step === 'supplier-save-btn') {
    waitForTarget(getSupplierSaveBtn, function () {
      playDemoClickNavigate(getSupplierSaveBtn(), {
        triggerClick: true,
        nextStep: 'supplier-success-confirm'
      });
    });
    return;
  }

  if (step === 'supplier-success-confirm') {
    waitForTarget(getSupplierSuccessConfirmBtn, function () {
      try {
        sessionStorage.setItem('nsrm-demo-finished', '1');
      } catch (error) {
        /* sessionStorage unavailable */
      }
      playDemoClickNavigate(getSupplierSuccessConfirmBtn(), {
        fallbackHref: 'home.html'
      });
    });
  }
}

function startDemoFlowContinue() {
  if (window.NSRM_DEMO_CTRL && window.NSRM_DEMO_CTRL.isPaused()) return;
  var step = takeDemoContinueStep();
  if (!step) return;

  function boot() {
    runDemoStep(step);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

startDemoFlowContinue();
