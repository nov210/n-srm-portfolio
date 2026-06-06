fetch('header.html')
  .then(function(response) {
    return response.text();
  })
  .then(function(data) {
    document.getElementById('header').innerHTML = data;

    setGnbActive();
    setSubMenuActive();

    document.dispatchEvent(new CustomEvent('nsrm-header-ready'));
  });

function setGnbActive() {
  const currentGnb = document.body.dataset.gnb;

  document.querySelectorAll('[data-gnb-key]').forEach(function(item) {
    item.classList.toggle('on', item.dataset.gnbKey === currentGnb);
  });
}

function setSubMenuActive() {
  const activeKey = document.body.dataset.subActive || 'home';

  document.querySelectorAll('[data-sub-key]').forEach(function(item) {
    item.classList.toggle('on', item.dataset.subKey === activeKey);
  });
}
