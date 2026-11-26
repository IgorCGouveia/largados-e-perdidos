/* Roteador por hash, renderização, eventos delegados, toasts e modal. */
(function (LP) {
  const I = LP.icon, E = LP.esc;
  const $app = document.getElementById('app');
  const $toasts = document.getElementById('toasts');
  const $modal = document.getElementById('modal');

  /* [perfil da área, padrão do caminho, view] */
  const ROUTES = [
    ['u', /^login$/, 'login'],
    ['u', /^catalogo$/, 'catalogo'],
    ['u', /^item\/([\w-]+)$/, 'item'],
    ['u', /^cadastrar$/, 'cadastrar'],
    ['u', /^cadastrado\/([\w-]+)$/, 'cadastrado'],
    ['u', /^abandonados$/, 'abandonados'],
    ['u', /^perfil$/, 'perfil'],
    ['g', /^secretaria\/solicitacoes$/, 'g_solicitacoes'],
    ['g', /^secretaria\/devolucao(?:\/([\w-]+))?$/, 'g_devolucao'],
    ['g', /^secretaria\/destinacao(?:\/([\w-]+))?$/, 'g_destinacao'],
    ['g', /^secretaria\/itens$/, 'g_itens'],
    ['g', /^secretaria\/config$/, 'g_config']
  ];

  let current = { mode: 'u', view: '', params: {}, path: '' };

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    for (const r of ROUTES) {
      const m = h.match(r[1]);
      if (m) return { mode: r[0], view: r[2], params: { id: m[1] }, path: h };
    }
    return null;
  }

  function inicio() {
    const s = LP.store.state.sessao;
    return s && s.perfil === 'gestor' ? '#/secretaria/solicitacoes' : '#/catalogo';
  }

  LP.go = function (hash) {
    if (location.hash === hash) LP.render();
    else location.hash = hash;
  };

  /* ---------- render ---------- */
  LP.render = function (opts) {
    opts = opts || {};
    const r = parse();
    if (!r) { location.replace(inicio()); return; }

    const s = LP.store.state.sessao;
    if (r.mode === 'g' && !s) {
      LP.afterLogin = location.hash;
      location.replace('#/login');
      return;
    }
    if (r.view === 'login' && s) { location.replace(inicio()); return; }

    const changed = r.path !== current.path;
    current = r;
    const focusSel = opts.keepFocus;
    let caret = null;
    if (focusSel) {
      const el = document.querySelector(focusSel);
      if (el && typeof el.selectionStart === 'number') caret = el.selectionStart;
    }
    const scroller = $app.querySelector('.m-body, .g-content');
    const prevScroll = scroller ? scroller.scrollTop : 0;

    $app.innerHTML = LP.views[r.view](r.params);
    document.body.dataset.mode = r.mode;

    const nextScroller = $app.querySelector('.m-body, .g-content');
    if (nextScroller) nextScroller.scrollTop = changed ? 0 : prevScroll;
    if (focusSel) {
      const el = document.querySelector(focusSel);
      if (el) { el.focus(); if (caret != null) el.setSelectionRange(caret, caret); }
    } else if (changed) {
      $app.focus({ preventScroll: true });
    }
  };

  LP.refreshRegion = function (name, fn) {
    const el = $app.querySelector('[data-region="' + name + '"]');
    if (el) el.innerHTML = fn();
  };

  /* ---------- feedback ---------- */
  LP.toast = function (msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast toast-' + (kind || 'ok');
    t.innerHTML = I(kind === 'error' ? 'alert' : kind === 'info' ? 'info' : 'check', 18) + '<span>' + E(msg) + '</span>';
    while ($toasts.children.length >= 2) $toasts.firstElementChild.remove();
    $toasts.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 3000);
  };

  LP.confirm = function (o) {
    $modal.innerHTML = '<div class="modal-backdrop" data-action="modal-close"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<h2 id="modal-title">' + o.title + '</h2><div class="modal-body">' + o.body + '</div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Voltar</button>' +
      '<button type="button" class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-action="modal-ok">' + o.ok + '</button></div></div>';
    $modal.classList.add('open');
    LP._modalOk = o.onOk;
    const first = $modal.querySelector('select, input, [data-action="modal-ok"]');
    if (first) first.focus();
  };
  function closeModal() { $modal.classList.remove('open'); $modal.innerHTML = ''; LP._modalOk = null; }
  LP.actions['modal-close'] = closeModal;
  LP.actions['modal-ok'] = function () {
    const box = $modal.querySelector('.modal');
    const fn = LP._modalOk;
    closeModal();
    if (fn) fn(box);
  };

  /* ---------- eventos delegados ---------- */
  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const fn = LP.actions[el.dataset.action];
    if (fn) fn(el, ev);
  });

  document.addEventListener('submit', function (ev) {
    const form = ev.target.closest('[data-form]');
    if (!form) return;
    ev.preventDefault();
    const fn = LP.forms[form.dataset.form];
    if (fn) fn(form);
  });

  function handleInput(ev) {
    const el = ev.target.closest('[data-input]');
    if (!el) return;
    const textual = el.tagName === 'INPUT' && /^(text|search|number|email)$/.test(el.type);
    if ((ev.type === 'input') !== textual) return;
    const fn = LP.inputs[el.dataset.input];
    if (fn) fn(el, ev);
  }
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleInput);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $modal.classList.contains('open')) closeModal();
  });

  window.addEventListener('hashchange', function () { LP.render(); });

  /* RNF06: além de rodar ao abrir, a verificação de prazos roda de hora em hora enquanto o app está aberto. */
  setInterval(function () { if (LP.store.verificarPrazos()) LP.render(); }, 3600000);

  LP.store.load();
  LP.render();
})(window.LP);
