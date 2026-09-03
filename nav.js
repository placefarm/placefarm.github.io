(function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('mainnav');
  if (!btn || !nav) return;
  function setOpen(open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
