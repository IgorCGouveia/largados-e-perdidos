/* Roteador por hash, renderização, eventos delegados, toasts, modal e mapa de telas. */
(function (LP) {
  const I = LP.icon, E = LP.esc;
  const $app = document.getElementById('app');
  const $device = document.getElementById('device');
  const $chrome = document.getElementById('device-chrome');
  const $map = document.getElementById('screen-map');
  const $toasts = document.getElementById('toasts');
  const $modal = document.getElementById('modal');

  const ROUTES = [
    ['u', /^login$/, 'login'],
    ['u', /^catalogo$/, 'catalogo'],
    ['u', /^item\/([\w-]+)$/, 'item'],
    ['u', /^cadastrar$/, 'cadastrar'],
    ['u', /^cadastrado\/([\w-]+)$/, 'cadastrado'],
    ['u', /^abandonados$/, 'abandonados'],
    ['u', /^perfil$/, 'perfil'],
    ['g', /^solicitacoes$/, 'g_solicitacoes'],
    ['g', /^devolucao(?:\/([\w-]+))?$/, 'g_devolucao'],
    ['g', /^destinacao(?:\/([\w-]+))?$/, 'g_destinacao'],
    ['g', /^itens$/, 'g_itens'],
    ['g', /^config$/, 'g_config']
  ];

  let current = { mode: 'u', view: 'login', params: {}, path: '' };

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const m = h.match(/^(u|g)\/(.+)$/);
    if (m) {
      for (const r of ROUTES) {
        if (r[0] !== m[1]) continue;
        const mm = m[2].match(r[1]);
        if (mm) return { mode: r[0], view: r[2], params: { id: mm[1] }, path: h };
      }
    }
    return null;
  }

  LP.go = function (hash) {
    if (location.hash === hash) LP.render();
    else location.hash = hash;
  };

  /* ---------- mapa de telas (slide 10 do Marco II) ---------- */
  function screenMap() {
    const st = LP.store.state;
    const disp = st.itens.find(function (i) { return i.status === 'disponivel'; });
    const aprov = st.itens.find(function (i) { return i.solicitacao && i.solicitacao.estado === 'aprovada'; }) ||
      st.itens.find(function (i) { return i.status === 'solicitado'; });
    const telas = [
      [1, 'Login', 'u', '#/u/login', 'RF01 · RF02', 'login'],
      [2, 'Catálogo de achados', 'u', '#/u/catalogo', 'RF07 · RF08 · RF09', 'catalogo'],
      [3, 'Detalhe e retirada', 'u', '#/u/item/' + (disp ? disp.id : 'LP-0042'), 'RF10 · RF11', 'item'],
      [4, 'Cadastrar item', 'u', '#/u/cadastrar', 'RF03 · RF04 · RF05', 'cadastrar'],
      [5, 'Catálogo de abandonados', 'u', '#/u/abandonados', 'RF18 · RF19', 'abandonados'],
      [6, 'Solicitações pendentes', 'g', '#/g/solicitacoes', 'RF12 · RF13', 'g_solicitacoes'],
      [7, 'Registrar devolução', 'g', '#/g/devolucao' + (aprov ? '/' + aprov.id : ''), 'RF14 · RF15', 'g_devolucao'],
      [8, 'Registrar destinação', 'g', '#/g/destinacao', 'RF20', 'g_destinacao']
    ];
    return '<div class="map-head"><h2>8 telas</h2><p>O caminho completo do item: do cadastro à devolução ou destinação.</p></div>' +
      '<ol class="map-list">' + telas.map(function (t) {
        const on = current.view === t[5] || (t[5] === 'cadastrar' && current.view === 'cadastrado');
        return '<li><a href="' + t[3] + '" class="map-item' + (on ? ' on' : '') + (t[2] === 'g' ? ' is-g' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' +
          '<span class="map-n">' + t[0] + '</span><span class="map-txt"><strong>' + t[1] + '</strong><small>' + (t[2] === 'u' ? 'Usuário · celular' : 'Gestor · computador') + ' · ' + t[4] + '</small></span></a></li>';
      }).join('') + '</ol>' +
      '<div class="map-flow"><h3>Roteiro sugerido</h3><ol>' +
      '<li>Entre como <b>usuário</b> e solicite a retirada de um item.</li>' +
      '<li>Mude para <b>gestor</b>, aprove o pedido e registre a devolução.</li>' +
      '<li>Em <b>Destinação</b>, doe ou reaproveite um item abandonado.</li></ol></div>';
  }

  function chrome(mode) {
    if (mode === 'u') {
      const t = new Date();
      return '<div class="status-bar"><span>' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + '</span><span class="notch"></span>' +
        '<span class="sb-icons"><i></i><i></i><i></i><b></b></span></div>';
    }
    return '<div class="browser-bar"><span class="dots"><i></i><i></i><i></i></span>' +
      '<span class="url">' + I('shield', 14) + 'largados.ci.ufpb.br/gestor/' + E(current.path.replace(/^g\//, '')) + '</span></div>';
  }

  /* ---------- render ---------- */
  LP.render = function (opts) {
    opts = opts || {};
    const r = parse();
    if (!r) {
      const s = LP.store.state.sessao;
      location.replace(s ? (s.perfil === 'gestor' ? '#/g/solicitacoes' : '#/u/catalogo') : '#/u/login');
      return;
    }
    const changed = r.path !== current.path;
    current = r;
    const fn = LP.views[r.view];
    const focusSel = opts.keepFocus;
    let caret = null;
    if (focusSel) {
      const el = document.querySelector(focusSel);
      if (el && typeof el.selectionStart === 'number') caret = el.selectionStart;
    }
    const scroller = $app.querySelector('.m-body, .g-content');
    const prevScroll = scroller ? scroller.scrollTop : 0;

    $app.innerHTML = fn(r.params);
    $device.className = 'device device-' + r.mode;
    document.body.dataset.mode = r.mode;
    $chrome.innerHTML = chrome(r.mode);
    $map.innerHTML = screenMap();
    document.querySelectorAll('[data-mode-link]').forEach(function (a) {
      a.classList.toggle('on', a.dataset.modeLink === r.mode);
      if (a.dataset.modeLink === r.mode) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });

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

  /* ---------- barra do protótipo ---------- */
  LP.actions.reset = function () {
    LP.store.reset();
    LP.draft = {};
    LP.toast('Dados de demonstração restaurados.', 'info');
    LP.render();
  };
  LP.actions['toggle-map'] = function () { document.body.classList.toggle('map-open'); };

  /* ---------- eventos delegados ---------- */
  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const fn = LP.actions[el.dataset.action];
    if (fn) { fn(el, ev); }
  });

  document.addEventListener('click', function (ev) {
    const a = ev.target.closest('[data-mode-link]');
    if (!a) return;
    const s = LP.store.state.sessao;
    if (a.dataset.modeLink === 'u' && !s) { ev.preventDefault(); LP.go('#/u/login'); }
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

  window.addEventListener('hashchange', function () { document.body.classList.remove('map-open'); LP.render(); });

  LP.store.load();
  LP.render();
})(window.LP);
