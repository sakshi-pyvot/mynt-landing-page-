// Help articles open inside the dashboard's Help dialog as ?embed=1. Mark the
// page so its CSS hides the standalone chrome. A file, not an inline script:
// production's Content-Security-Policy (script-src 'self') blocks inline code.
if (new URLSearchParams(location.search).has('embed')) {
  document.documentElement.classList.add('embed');
}

// Redesign v2 (H-V13 / H-B6): the articles' own palette is dark only. Inject a
// light and a dark palette over their variables, and pick one from
// ?theme=light|dark, then follow the dashboard's `.dark` class live while the
// dialog is open. Article HTML is unchanged. Opened on its own (no ?theme and
// no dashboard parent), the article keeps its original look.
(function () {
  var params = new URLSearchParams(location.search);
  var root = document.documentElement;

  var style = document.createElement('style');
  style.textContent =
    'html[data-theme="light"]{--mint:#047857;--bg:#eef0f5;--card:#f8f9fc;--text:#22252e;--muted:#59616f;--border:#cfd5df;--tip-bg:rgba(5,150,105,.06);--tip-border:rgba(5,150,105,.22);color-scheme:light}' +
    'html[data-theme="dark"]{--mint:#34d399;--bg:#101115;--card:#1a1c22;--text:#f2f3f7;--muted:#b1b5c3;--border:#383d48;--tip-bg:rgba(52,211,153,.06);--tip-border:rgba(52,211,153,.2);color-scheme:dark}' +
    'html[data-theme] body{font-size:14px;line-height:1.85}' +
    'html[data-theme] h1{font-size:26px;letter-spacing:-.6px}' +
    'html[data-theme] h2{font-size:20px;letter-spacing:-.3px}' +
    'html[data-theme] .wrap{padding-top:24px}' +
    'html[data-theme] .step,html[data-theme] .hello,html[data-theme] .video-box{border-radius:17px}' +
    'html[data-theme="light"] .step-num{color:#ffffff}' +
    // The dialog header already shows the title; the H1 stays for screen readers.
    'html.embed h1:first-of-type{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}';
  document.head.appendChild(style);

  // The dashboard is same-origin; anything else (or no parent) throws or is null.
  function parentRoot() {
    try {
      return parent !== window ? parent.document.documentElement : null;
    } catch (e) {
      return null;
    }
  }

  var host = parentRoot();
  var asked = params.get('theme');

  function apply() {
    var theme = host ? (host.classList.contains('dark') ? 'dark' : 'light') : asked;
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  }
  apply();

  if (host) {
    new MutationObserver(apply).observe(host, { attributes: true, attributeFilter: ['class'] });
    // Escape inside the article closes the dialog: hand the key to the page.
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      try {
        parent.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      } catch (e) {
        /* not the dashboard */
      }
    });
  }
})();
