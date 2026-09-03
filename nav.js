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

/* 홈(첫 화면)에서만 우하단에 뜨는 인물 사진 + 닫기(×) 버튼. 표시 여부는 CSS가 제어 */
(function () {
  // 홈 페이지에서만 표시 (다른 페이지는 제외)
  var path = location.pathname.replace(/\/index\.html$/, '/');
  var isHome = path === '/' || /\/$/.test(path);
  if (!isHome) return;
  // 사용자가 닫았으면 이 탭에서는 다시 안 뜸
  try { if (sessionStorage.getItem('hideFloatPortrait') === '1') return; } catch (e) {}
  if (document.querySelector('.float-portrait-wrap')) return;

  var wrap = document.createElement('div');
  wrap.className = 'float-portrait-wrap';

  // 사진을 누르면 후원 페이지로 이동
  var link = document.createElement('a');
  link.className = 'float-portrait-link';
  link.href = 'support.html';
  link.setAttribute('aria-label', '이학정 후원하기');

  var img = document.createElement('img');
  img.className = 'float-portrait';
  img.src = 'img/leehakjeong.webp';
  img.alt = '이학정 남동구의원 후원하기';
  link.appendChild(img);

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'float-portrait-close';
  close.setAttribute('aria-label', '사진 닫기');
  close.textContent = '×';
  close.addEventListener('click', function () {
    wrap.remove();
    try { sessionStorage.setItem('hideFloatPortrait', '1'); } catch (e) {}
  });

  wrap.appendChild(link);
  wrap.appendChild(close);
  document.body.appendChild(wrap);
})();
