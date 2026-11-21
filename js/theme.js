// Light / dark / auto. Loaded as a plain script in <head> so the right colours apply before
// the page first paints (no flash). "auto" follows the device's appearance setting.
(function () {
  var KEY = 'setgaps:theme';
  var media = matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try {
      return localStorage.getItem(KEY) || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function apply() {
    var choice = saved();
    var dark = choice === 'dark' || (choice === 'auto' && media.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#181B21' : '#FFFFFF';
  }

  media.addEventListener('change', apply);
  apply();

  window.SetGapsTheme = {
    get: saved,
    set: function (choice) {
      try {
        localStorage.setItem(KEY, choice);
      } catch (e) {
        // storage blocked: still switch for this visit
      }
      apply();
    },
  };
})();
