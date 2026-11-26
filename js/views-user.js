/* Telas do usuário (celular): 1 Login · 2 Catálogo · 3 Detalhe e retirada · 4 Cadastrar · 5 Abandonados */
(function (LP) {
  const I = LP.icon, E = LP.esc;
  LP.ui = LP.ui || { q: '', cat: '', local: '', periodo: '', filtrosAbertos: false };
  LP.views = LP.views || {};
  LP.actions = LP.actions || {};

  /* ---------- peças compartilhadas ---------- */
  LP.statusChip = function (status) {
    const s = LP.STATUS[status];
    return '<span class="chip ' + s.cls + '">' + s.nome + '</span>';
  };

  LP.thumb = function (item, size) {
    const c = LP.categoria(item.categoria);
    const cls = 'thumb thumb-' + (size || 'md');
    if (item.sensivel) {
      return '<div class="' + cls + ' thumb-hidden" title="Foto não divulgada">' + I('eyeOff', size === 'lg' ? 34 : 22) +
        (size === 'lg' ? '<span>Foto não divulgada<br><small>item de alto valor ou com dados pessoais</small></span>' : '') + '</div>';
    }
    if (item.foto) {
      return '<div class="' + cls + '"><img src="' + item.foto + '" alt="Foto: ' + E(item.nome) + '"></div>';
    }
    return '<div class="' + cls + '" style="--tile:' + c.cor + ';--ink-tile:' + c.tinta + '">' + I('cat_' + c.id, size === 'lg' ? 64 : size === 'sm' ? 22 : 30) + '</div>';
  };

  function header(title, opts) {
    opts = opts || {};
    return '<header class="m-header' + (opts.dark ? ' m-header-dark' : '') + '">' +
      (opts.back ? '<a class="icon-btn" href="' + opts.back + '" aria-label="Voltar">' + I('back', 22) + '</a>' : '<a href="#/catalogo" class="m-logo-link" aria-label="Início"><img class="m-logo" src="assets/mascote.webp" alt="" width="34" height="34"></a>') +
      '<div class="m-title"><h1>' + title + '</h1>' + (opts.sub ? '<p>' + opts.sub + '</p>' : '') + '</div>' +
      (opts.right || '') +
      (LP.store.state.sessao && LP.store.state.sessao.perfil === 'gestor' ? '<a class="btn btn-lime btn-sm" href="#/secretaria/solicitacoes">' + I('shield', 16) + 'Secretaria</a>' : '') +
      '</header>';
  }

  function tabbar(active) {
    const tabs = [
      ['catalogo', 'Achados', 'search'],
      ['cadastrar', 'Cadastrar', 'plus'],
      ['abandonados', 'Abandonados', 'box'],
      ['perfil', 'Perfil', 'user']
    ];
    return '<nav class="tabbar" aria-label="Navegação principal">' + tabs.map(function (t) {
      const on = t[0] === active;
      return '<a href="#/' + t[0] + '" class="tab' + (on ? ' on' : '') + (t[0] === 'cadastrar' ? ' tab-cta' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="tab-ic">' + I(t[2], 22) + '</span><span>' + t[1] + '</span></a>';
    }).join('') + '</nav>';
  }

  function screen(body, opts) {
    opts = opts || {};
    return '<div class="m-screen' + (opts.tabs ? ' has-tabs' : '') + (opts.footer ? ' has-footer' : '') + '">' + body +
      (opts.footer ? '<div class="m-footer">' + opts.footer + '</div>' : '') +
      (opts.tabs ? tabbar(opts.tabs) : '') + '</div>';
  }

  function itemCard(it) {
    const c = LP.categoria(it.categoria);
    return '<a class="item-card" href="#/item/' + it.id + '">' + LP.thumb(it, 'md') +
      '<div class="item-card-body">' +
      '<div class="item-card-top"><span class="cat-label" style="--ink-tile:' + c.tinta + '">' + c.nome + '</span>' + LP.statusChip(it.status) + '</div>' +
      '<h3>' + E(it.nome) + '</h3>' +
      '<p class="meta">' + I('pin', 14) + E(it.local) + '</p>' +
      '<p class="meta">' + I('calendar', 14) + 'Achado ' + LP.fmt.relativo(it.achadoEm) + '</p>' +
      '</div></a>';
  }

  /* ---------- 1 · Login (RF01, RF02) ---------- */
  function nomeDoEmail(email) {
    return email.split('@')[0].split(/[._-]+/).filter(Boolean)
      .map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(' ');
  }

  LP.views.login = function () {
    const novo = LP.ui.novaConta;
    const card = novo
      ? '<form class="login-card" data-form="criar-conta" novalidate>' +
        '<h2>Primeiro acesso</h2>' +
        '<p class="hint">Não encontramos uma conta para <b>' + E(novo) + '</b>. Complete seus dados para criar.</p>' +
        '<label class="field"><span>Nome completo</span><input name="nome" autocomplete="name" value="' + E(nomeDoEmail(novo)) + '" required></label>' +
        '<label class="field"><span>Matrícula</span><input name="matricula" inputmode="numeric" autocomplete="off" placeholder="Ex.: 20240012345" required></label>' +
        '<label class="field"><span>Crie uma senha</span><input type="password" name="senha" autocomplete="new-password" minlength="6" placeholder="Mínimo de 6 caracteres" required></label>' +
        '<p class="hint">Usamos nome e matrícula só para registrar quem cadastrou, pediu ou retirou um item.</p>' +
        '<p class="form-error" data-error hidden></p>' +
        '<button class="btn btn-primary btn-block" type="submit">Criar conta e entrar</button>' +
        '<button type="button" class="link-btn center" data-action="voltar-login">Usar outro e-mail</button>' +
        '</form>'
      : '<form class="login-card" data-form="login" novalidate>' +
        '<h2>Entrar</h2>' +
        '<p class="hint">Use seu e-mail institucional da UFPB.</p>' +
        '<label class="field"><span>E-mail institucional</span>' +
        '<input type="email" name="email" autocomplete="username" placeholder="nome@academico.ufpb.br" value="' + E(LP.ui.ultimoEmail || '') + '" required></label>' +
        '<label class="field"><span>Senha</span>' +
        '<input type="password" name="senha" autocomplete="current-password" required></label>' +
        '<p class="form-error" data-error hidden></p>' +
        '<button class="btn btn-primary btn-block" type="submit">Entrar</button>' +
        '<p class="hint center-text">Primeiro acesso? Digite seu e-mail e uma senha nova para criar a conta.</p>' +
        '</form>';
    return '<div class="m-screen login">' +
      '<div class="login-hero">' +
      '<img src="assets/mascote.webp" alt="Mascote: crocodilo detetive com lupa" width="140" height="140">' +
      '<h1>Largados<br><span>&amp; Perdidos</span></h1>' +
      '<p class="tagline">Achados e perdidos do Centro de Informática</p>' +
      '</div>' + card +
      '<a class="login-public" href="#/catalogo">Ver o catálogo sem entrar ' + I('chevron', 16) + '</a>' +
      '</div>';
  };

  LP.forms = LP.forms || {};
  function depoisDeEntrar(s) {
    const destino = LP.afterLogin;
    LP.afterLogin = null;
    LP.ui.novaConta = null;
    LP.toast('Bem-vindo(a), ' + s.nome.split(' ')[0] + '!');
    if (s.perfil === 'gestor') LP.go(destino && destino.indexOf('#/secretaria') === 0 ? destino : '#/secretaria/solicitacoes');
    else LP.go(destino && destino.indexOf('#/secretaria') !== 0 ? destino : '#/catalogo');
  }
  LP.forms.login = function (form) {
    const email = form.email.value.trim().toLowerCase();
    const senha = form.senha.value;
    const err = form.querySelector('[data-error]');
    function erro(msg, campo) { err.textContent = msg; err.hidden = false; if (campo) campo.focus(); }
    if (!/^[^\s@]+@academico\.ufpb\.br$/.test(email)) return erro('Use um e-mail @academico.ufpb.br.', form.email);
    if (!senha) return erro('Informe sua senha.', form.senha);
    LP.ui.ultimoEmail = email;
    if (!LP.store.conta(email)) {
      LP.ui.novaConta = email;
      LP.render();
      return;
    }
    const s = LP.store.autenticar(email, senha);
    if (!s) return erro('Senha incorreta. Tente de novo.', form.senha);
    depoisDeEntrar(s);
  };
  LP.forms['criar-conta'] = function (form) {
    const f = form.elements, err = form.querySelector('[data-error]');
    const nome = f.nome.value.trim(), mat = f.matricula.value.trim(), senha = f.senha.value;
    function erro(msg, campo) { err.textContent = msg; err.hidden = false; if (campo) campo.focus(); }
    if (nome.split(/\s+/).length < 2) return erro('Informe nome e sobrenome.', f.nome);
    if (!/^\d{6,12}$/.test(mat)) return erro('A matrícula deve ter só números (6 a 12 dígitos).', f.matricula);
    if (senha.length < 6) return erro('A senha precisa ter pelo menos 6 caracteres.', f.senha);
    depoisDeEntrar(LP.store.criarConta({ email: LP.ui.novaConta, nome: nome, matricula: mat, senha: senha }));
  };
  LP.actions['voltar-login'] = function () { LP.ui.novaConta = null; LP.render(); };

  /* ---------- 2 · Catálogo de achados (RF07, RF08, RF09) ---------- */
  function filtrar() {
    const ui = LP.ui, q = ui.q.trim().toLowerCase();
    const limite = ui.periodo ? Date.now() - Number(ui.periodo) * LP.DAY : 0;
    return LP.store.state.itens
      .filter(function (it) { return it.status === 'disponivel' || it.status === 'solicitado'; })
      .filter(function (it) { return !ui.cat || it.categoria === ui.cat; })
      .filter(function (it) { return !ui.local || it.local === ui.local; })
      .filter(function (it) { return !limite || new Date(it.achadoEm).getTime() >= limite; })
      .filter(function (it) {
        if (!q) return true;
        return (it.nome + ' ' + it.descricao + ' ' + it.local + ' ' + it.id + ' ' + LP.categoria(it.categoria).nome).toLowerCase().indexOf(q) >= 0;
      })
      .sort(function (a, b) { return new Date(b.achadoEm) - new Date(a.achadoEm); });
  }

  function catalogoLista() {
    const itens = filtrar();
    const ativos = (LP.ui.local ? 1 : 0) + (LP.ui.periodo ? 1 : 0);
    let html = '<div class="result-line"><span><strong>' + itens.length + '</strong> ' + (itens.length === 1 ? 'item encontrado' : 'itens encontrados') + '</span>' +
      (LP.ui.q || LP.ui.cat || ativos ? '<button type="button" class="link-btn" data-action="limpar-filtros">Limpar filtros</button>' : '<span class="muted">mais recentes primeiro</span>') + '</div>';
    if (!itens.length) {
      html += '<div class="empty"><img src="assets/mascote.webp" alt="" width="96" height="96"><h3>Nada por aqui</h3>' +
        '<p>Nenhum item combina com a busca. Tente outra palavra ou limpe os filtros.</p></div>';
    } else {
      html += '<div class="item-list">' + itens.map(itemCard).join('') + '</div>';
    }
    return html;
  }

  LP.views.catalogo = function () {
    const ui = LP.ui, s = LP.store.state.sessao;
    const ativos = (ui.local ? 1 : 0) + (ui.periodo ? 1 : 0);
    const chips = [['', 'Todos']].concat(LP.CATEGORIAS.map(function (c) { return [c.id, c.nome]; }));
    const body = header('Achados no CI', {
      sub: s ? 'Olá, ' + E(s.nome.split(' ')[0]) + '!' : 'Catálogo público',
      right: s ? '' : '<a class="btn btn-lime btn-sm" href="#/login">Entrar</a>'
    }) +
      '<div class="m-body">' +
      '<div class="search-row">' +
      '<label class="search">' + I('search', 20) + '<input type="search" placeholder="Buscar: garrafa, carregador, LP-0042…" value="' + E(ui.q) + '" data-input="q" aria-label="Buscar itens"></label>' +
      '<button type="button" class="icon-btn filter-btn' + (ui.filtrosAbertos || ativos ? ' on' : '') + '" data-action="toggle-filtros" aria-label="Filtros" aria-expanded="' + ui.filtrosAbertos + '">' + I('filter', 20) +
      (ativos ? '<span class="dot">' + ativos + '</span>' : '') + '</button>' +
      '</div>' +
      '<div class="filters"' + (ui.filtrosAbertos ? '' : ' hidden') + '>' +
      '<label class="field field-sm"><span>Local</span><select data-input="local"><option value="">Qualquer local</option>' +
      LP.LOCAIS.map(function (l) { return '<option' + (ui.local === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></label>' +
      '<label class="field field-sm"><span>Período</span><select data-input="periodo">' +
      [['', 'Qualquer data'], ['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias']].map(function (p) {
        return '<option value="' + p[0] + '"' + (ui.periodo === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
      }).join('') + '</select></label>' +
      '</div>' +
      '<div class="chip-scroll" role="tablist" aria-label="Categorias">' + chips.map(function (c) {
        return '<button type="button" role="tab" class="cat-chip' + (ui.cat === c[0] ? ' on' : '') + '" aria-selected="' + (ui.cat === c[0]) + '" data-action="set-cat" data-cat="' + c[0] + '">' + c[1] + '</button>';
      }).join('') + '</div>' +
      '<div data-region="lista">' + catalogoLista() + '</div>' +
      '</div>';
    return screen(body, { tabs: 'catalogo' });
  };

  LP.inputs = LP.inputs || {};
  LP.inputs.q = function (el) { LP.ui.q = el.value; LP.refreshRegion('lista', catalogoLista); };
  LP.inputs.local = function (el) { LP.ui.local = el.value; LP.render(); };
  LP.inputs.periodo = function (el) { LP.ui.periodo = el.value; LP.render(); };
  LP.actions['set-cat'] = function (el) { LP.ui.cat = el.dataset.cat; LP.render(); };
  LP.actions['toggle-filtros'] = function () { LP.ui.filtrosAbertos = !LP.ui.filtrosAbertos; LP.render(); };
  LP.actions['limpar-filtros'] = function () { Object.assign(LP.ui, { q: '', cat: '', local: '', periodo: '' }); LP.render(); };

  /* ---------- 3 · Detalhe e retirada (RF10, RF11) ---------- */
  LP.views.item = function (p) {
    const it = LP.store.item(p.id);
    if (!it) return screen(header('Item não encontrado', { back: '#/catalogo' }) + '<div class="m-body"><div class="empty"><p>Esse código não existe.</p></div></div>');
    const c = LP.categoria(it.categoria);
    const st = LP.store.state, s = st.sessao;
    const minha = it.solicitacao && s && it.solicitacao.matricula === s.matricula;
    const dias = LP.diasRestantes(it);
    const voltar = it.status === 'abandonado' ? '#/abandonados' : '#/catalogo';

    let aviso = '';
    if (minha) {
      aviso = '<div class="notice notice-ok">' + I('check', 20) + '<div><strong>' + (it.solicitacao.estado === 'aprovada' ? 'Solicitação aprovada' : 'Retirada solicitada') + '</strong>' +
        '<p>Vá até a <b>' + E(st.config.localRetirada) + '</b> com um documento com foto.</p>' +
        '<p class="notice-time">' + I('clock', 16) + E(st.config.horario) + '</p></div></div>';
    } else if (it.status === 'solicitado') {
      aviso = '<div class="notice notice-wait">' + I('info', 20) + '<div><strong>Alguém já pediu este item</strong><p>Se ele for seu, procure a secretaria levando algo que comprove: a conferência acontece na hora da entrega.</p></div></div>';
    }

    let footer;
    if (it.status === 'disponivel') {
      footer = '<button class="btn btn-primary btn-block btn-lg" type="button" data-action="solicitar" data-id="' + it.id + '">' + I('hand', 20) + 'É meu! Solicitar retirada</button>';
    } else if (minha) {
      footer = '<button class="btn btn-ghost btn-block" type="button" data-action="cancelar-solicitacao" data-id="' + it.id + '">Cancelar solicitação</button>';
    } else if (it.status === 'abandonado') {
      const tem = LP.store.temInteresse(it.id);
      footer = '<button class="btn ' + (tem ? 'btn-ghost' : 'btn-primary') + ' btn-block btn-lg" type="button" data-action="interesse" data-id="' + it.id + '"' + (tem ? ' disabled' : '') + '>' +
        I(tem ? 'check' : 'recycle', 20) + (tem ? 'Interesse registrado' : 'Quero reaproveitar') + '</button>';
    }

    const body = header(E(it.id), { back: voltar, sub: c.nome }) +
      '<div class="m-body detail">' +
      LP.thumb(it, 'lg') +
      '<div class="detail-head"><h2>' + E(it.nome) + '</h2>' + LP.statusChip(it.status) + '</div>' +
      aviso +
      '<p class="detail-desc">' + E(it.descricao) + '</p>' +
      '<dl class="facts">' +
      '<div><dt>' + I('pin', 18) + 'Onde foi achado</dt><dd>' + E(it.local) + '</dd></div>' +
      '<div><dt>' + I('calendar', 18) + 'Quando</dt><dd>' + LP.fmt.dataHora(it.achadoEm) + '</dd></div>' +
      '<div><dt>' + I('tag', 18) + 'Categoria</dt><dd>' + c.nome + '</dd></div>' +
      (it.status === 'abandonado'
        ? '<div><dt>' + I('alert', 18) + 'Prazo</dt><dd>Venceu em ' + LP.fmt.data(LP.dataLimite(it)) + '</dd></div>'
        : '<div><dt>' + I('clock', 18) + 'Fica guardado até</dt><dd>' + LP.fmt.data(LP.dataLimite(it)) + (dias <= 7 && dias >= 0 ? ' <span class="chip st-old">' + (dias === 0 ? 'vence hoje' : dias + ' dias') + '</span>' : '') + '</dd></div>') +
      '</dl>' +
      (it.status === 'disponivel' ? '<div class="how"><h3>Como funciona a retirada</h3><ol>' +
        '<li><b>Solicite</b> aqui pelo app. O item fica reservado como “Solicitado”.</li>' +
        '<li><b>Vá à secretaria</b> no horário: ' + E(st.config.horario.toLowerCase()) + '.</li>' +
        '<li><b>Comprove</b> que é seu: documento, nome no item ou um detalhe que só o dono conhece.</li></ol></div>' : '') +
      '<p class="privacy">' + I('shield', 16) + 'Quem cadastrou o item só é visível para a secretaria.</p>' +
      '</div>';
    return screen(body, { footer: footer });
  };

  LP.actions.solicitar = function (el) {
    if (!LP.store.state.sessao) {
      LP.afterLogin = '#/item/' + el.dataset.id;
      LP.toast('Entre com seu e-mail institucional para solicitar.', 'info');
      LP.go('#/login');
      return;
    }
    const it = LP.store.item(el.dataset.id);
    LP.confirm({
      title: 'Solicitar retirada?',
      body: '<p><b>' + E(it.nome) + '</b> ficará reservado no seu nome. Depois, vá à secretaria para buscar.</p>' +
        '<p class="notice-time">' + I('clock', 16) + E(LP.store.state.config.horario) + '</p>',
      ok: 'Solicitar',
      onOk: function () {
        LP.store.solicitar(it.id);
        LP.toast('Pedido feito! O item agora está como “Solicitado”.');
        LP.render();
      }
    });
  };
  LP.actions['cancelar-solicitacao'] = function (el) {
    LP.store.cancelarSolicitacao(el.dataset.id);
    LP.toast('Solicitação cancelada.', 'info');
    LP.render();
  };
  LP.actions.interesse = function (el) {
    if (!LP.store.state.sessao) { LP.afterLogin = '#/item/' + el.dataset.id; LP.go('#/login'); return; }
    LP.store.interesse(el.dataset.id);
    LP.toast('Interesse registrado. A secretaria avisa se o item for liberado para você.');
    LP.render();
  };

  /* ---------- 4 · Cadastrar item (RF03, RF04, RF05) ---------- */
  LP.draft = LP.draft || {};
  LP.views.cadastrar = function () {
    if (!LP.store.state.sessao) {
      return screen(header('Cadastrar item') + '<div class="m-body"><div class="empty">' +
        '<img src="assets/mascote.webp" alt="" width="110" height="110"><h3>Achou algo no CI?</h3>' +
        '<p>Entre com seu e-mail institucional para cadastrar. Assim a secretaria sabe quem trouxe o item.</p>' +
        '<a class="btn btn-primary" href="#/login" data-action="login-then" data-next="#/cadastrar">Entrar para cadastrar</a></div></div>', { tabs: 'cadastrar' });
    }
    const d = LP.draft;
    const hoje = new Date(); const tz = hoje.getTimezoneOffset() * 60000;
    const agora = new Date(hoje - tz).toISOString().slice(0, 16);
    const body = header('Cadastrar item achado', { sub: 'Leva menos de 1 minuto' }) +
      '<form class="m-body form" data-form="cadastrar" novalidate>' +
      '<label class="photo-drop' + (d.foto ? ' has-photo' : '') + '">' +
      (d.foto ? '<img src="' + d.foto + '" alt="Prévia da foto">' : I('camera', 30) + '<strong>Adicionar foto</strong><span>Opcional · JPG ou PNG</span>') +
      '<input type="file" accept="image/jpeg,image/png" data-input="foto" class="sr-only"></label>' +
      (d.foto ? '<button type="button" class="link-btn center" data-action="remover-foto">Remover foto</button>' : '') +
      '<label class="field"><span>Nome do item <em>*</em></span><input name="nome" maxlength="60" placeholder="Ex.: Garrafa térmica azul" value="' + E(d.nome || '') + '" required></label>' +
      '<fieldset class="field"><legend>Categoria <em>*</em></legend><div class="cat-grid">' +
      LP.CATEGORIAS.map(function (c) {
        return '<label class="cat-opt" style="--tile:' + c.cor + ';--ink-tile:' + c.tinta + '"><input type="radio" name="categoria" value="' + c.id + '"' + (d.categoria === c.id ? ' checked' : '') + ' required>' +
          '<span>' + I('cat_' + c.id, 22) + c.nome + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<label class="field"><span>Descrição <em>*</em></span><textarea name="descricao" rows="3" maxlength="280" placeholder="Cor, marca, detalhes que ajudam o dono a reconhecer" required>' + E(d.descricao || '') + '</textarea></label>' +
      '<label class="field"><span>Onde achou <em>*</em></span><select name="local" required><option value="">Escolha o local</option>' +
      LP.LOCAIS.map(function (l) { return '<option' + (d.local === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Quando achou <em>*</em></span><input type="datetime-local" name="achadoEm" max="' + agora + '" value="' + E(d.achadoEm || agora) + '" required></label>' +
      '<label class="check"><input type="checkbox" name="sensivel"' + (d.sensivel ? ' checked' : '') + '><span><b>Item de valor ou com dados pessoais</b><small>A foto não aparece no catálogo público, só a descrição.</small></span></label>' +
      '<div class="notice notice-info">' + I('info', 18) + '<p>Itens com comida ou líquido têm o conteúdo descartado na secretaria antes de serem guardados.</p></div>' +
      '<p class="form-error" data-error hidden></p>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">' + I('check', 20) + 'Cadastrar item</button>' +
      '</form>';
    return screen(body, { tabs: 'cadastrar' });
  };

  function capturar(form) {
    const f = form.elements;
    Object.assign(LP.draft, {
      nome: f.nome.value, descricao: f.descricao.value, local: f.local.value, achadoEm: f.achadoEm.value,
      sensivel: f.sensivel.checked, categoria: (form.querySelector('[name=categoria]:checked') || {}).value
    });
  }
  LP.inputs.foto = function (el) {
    const file = el.files && el.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) { LP.toast('Use uma imagem JPG ou PNG.', 'error'); return; }
    capturar(el.form);
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        const max = 720, k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        LP.draft.foto = cv.toDataURL('image/jpeg', 0.8);
        LP.render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  LP.actions['remover-foto'] = function (el) { capturar(el.closest('form')); LP.draft.foto = null; LP.render(); };
  LP.actions['login-then'] = function (el, ev) { ev.preventDefault(); LP.afterLogin = el.dataset.next; LP.go('#/login'); };

  LP.forms.cadastrar = function (form) {
    capturar(form);
    const d = LP.draft, err = form.querySelector('[data-error]');
    const faltando = [];
    if (!d.nome || !d.nome.trim()) faltando.push('nome');
    if (!d.categoria) faltando.push('categoria');
    if (!d.descricao || !d.descricao.trim()) faltando.push('descrição');
    if (!d.local) faltando.push('local');
    if (!d.achadoEm) faltando.push('data');
    form.querySelectorAll('.invalid').forEach(function (n) { n.classList.remove('invalid'); });
    if (faltando.length) {
      err.textContent = 'Falta preencher: ' + faltando.join(', ') + '.';
      err.hidden = false;
      ['nome', 'descricao', 'local'].forEach(function (n) { if (!form.elements[n].value.trim()) form.elements[n].classList.add('invalid'); });
      return;
    }
    const item = LP.store.cadastrar({
      nome: d.nome.trim(), categoria: d.categoria, descricao: d.descricao.trim(), local: d.local,
      achadoEm: new Date(d.achadoEm).toISOString(), foto: d.foto, sensivel: d.sensivel
    });
    LP.draft = {};
    LP.go('#/cadastrado/' + item.id);
  };

  LP.views.cadastrado = function (p) {
    const it = LP.store.item(p.id);
    if (!it) return LP.views.cadastrar();
    const st = LP.store.state;
    const body = '<div class="m-body success">' +
      '<div class="success-badge">' + I('check', 40) + '</div>' +
      '<h2>Item cadastrado!</h2><p>Obrigado por ajudar. Agora leve o item até a secretaria.</p>' +
      '<div class="code-card"><span>Código do item</span><strong>' + it.id + '</strong><small>Informe este código ao entregar</small></div>' +
      '<div class="notice notice-info">' + I('pin', 18) + '<div><strong>' + E(st.config.localRetirada) + '</strong><p class="notice-time">' + I('clock', 16) + E(st.config.horario) + '</p></div></div>' +
      '<div class="success-actions"><a class="btn btn-primary btn-block" href="#/item/' + it.id + '">Ver no catálogo</a>' +
      '<a class="btn btn-ghost btn-block" href="#/cadastrar">Cadastrar outro</a></div>' +
      '</div>';
    return screen(header('Cadastro concluído', { back: '#/catalogo' }) + body, { tabs: 'cadastrar' });
  };

  /* ---------- 5 · Catálogo de abandonados (RF18, RF19) ---------- */
  LP.views.abandonados = function () {
    const st = LP.store.state;
    const itens = st.itens.filter(function (i) { return i.status === 'abandonado'; })
      .sort(function (a, b) { return new Date(b.abandonadoEm || b.entrada) - new Date(a.abandonadoEm || a.entrada); });
    const doados = st.itens.filter(function (i) { return i.status === 'destinado'; }).length;
    const body = header('Abandonados', { sub: 'Prazo de ' + st.config.prazoDias + ' dias vencido' }) +
      '<div class="m-body">' +
      '<div class="banner">' +
      '<div><strong>Ninguém veio buscar.</strong><p>Depois de ' + st.config.prazoDias + ' dias na secretaria, o item vem para cá. Itens em bom estado podem ser reaproveitados pela comunidade antes da doação.</p></div>' +
      '<div class="banner-stats"><span><b>' + itens.length + '</b> aguardando destino</span><span><b>' + doados + '</b> já destinados</span></div>' +
      '</div>' +
      (itens.length ? '<div class="item-list">' + itens.map(function (it) {
        const c = LP.categoria(it.categoria);
        const tem = LP.store.temInteresse(it.id);
        return '<a class="item-card" href="#/item/' + it.id + '">' + LP.thumb(it, 'md') +
          '<div class="item-card-body"><div class="item-card-top"><span class="cat-label" style="--ink-tile:' + c.tinta + '">' + c.nome + '</span>' + LP.statusChip(it.status) + '</div>' +
          '<h3>' + E(it.nome) + '</h3>' +
          '<p class="meta">' + I('alert', 14) + 'Venceu em ' + LP.fmt.data(LP.dataLimite(it)) + '</p>' +
          (tem ? '<p class="meta meta-ok">' + I('check', 14) + 'Você demonstrou interesse</p>' : '<p class="meta">' + I('pin', 14) + E(it.local) + '</p>') +
          '</div></a>';
      }).join('') + '</div>'
        : '<div class="empty"><img src="assets/mascote.webp" alt="" width="96" height="96"><h3>Nenhum item abandonado</h3><p>Todos os itens vencidos já tiveram destino.</p></div>') +
      '</div>';
    return screen(body, { tabs: 'abandonados' });
  };

  /* ---------- Perfil: minhas solicitações ---------- */
  LP.views.perfil = function () {
    const st = LP.store.state, s = st.sessao;
    if (!s) {
      return screen(header('Perfil') + '<div class="m-body"><div class="empty"><img src="assets/mascote.webp" alt="" width="110" height="110">' +
        '<h3>Você não entrou</h3><p>Entre para acompanhar suas solicitações e os itens que cadastrou.</p>' +
        '<a class="btn btn-primary" href="#/login">Entrar</a></div></div>', { tabs: 'perfil' });
    }
    const minhas = st.itens.filter(function (i) {
      return (i.solicitacao && i.solicitacao.matricula === s.matricula) || (i.devolucao && i.devolucao.matricula === s.matricula);
    });
    const cadastrados = st.itens.filter(function (i) { return i.cadastradoPor && i.cadastradoPor.matricula === s.matricula; });
    function linha(i, extra) {
      return '<a class="row-link" href="#/item/' + i.id + '">' + LP.thumb(i, 'sm') + '<div><strong>' + E(i.nome) + '</strong><span>' + extra + '</span></div>' + LP.statusChip(i.status) + '</a>';
    }
    const body = header('Perfil') +
      '<div class="m-body">' +
      '<div class="profile-card"><div class="avatar">' + E(s.nome.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('')) + '</div>' +
      '<div><strong>' + E(s.nome) + '</strong><span>' + E(s.email) + '</span><span>Matrícula ' + E(s.matricula) + '</span></div></div>' +
      '<h3 class="section-title">Minhas solicitações</h3>' +
      (minhas.length ? '<div class="rows">' + minhas.map(function (i) {
        const txt = i.status === 'devolvido' ? 'Retirado em ' + LP.fmt.data(i.devolucao.em)
          : i.solicitacao.estado === 'aprovada' ? 'Aprovada: pode buscar na secretaria' : 'Pedida ' + LP.fmt.relativo(i.solicitacao.em);
        return linha(i, txt);
      }).join('') + '</div>' : '<p class="muted pad">Você ainda não solicitou nenhum item.</p>') +
      '<h3 class="section-title">Itens que cadastrei</h3>' +
      (cadastrados.length ? '<div class="rows">' + cadastrados.map(function (i) { return linha(i, i.id + ' · ' + LP.fmt.relativo(i.entrada)); }).join('') + '</div>'
        : '<p class="muted pad">Nenhum item cadastrado por você.</p>') +
      '<div class="lgpd">' + I('shield', 18) + '<p><b>Seus dados (LGPD).</b> Guardamos só nome, matrícula e e-mail, para registrar quem cadastrou, pediu ou retirou um item. Apenas a secretaria vê esses dados, e eles são apagados ao fim do prazo de retenção.</p></div>' +
      (s.perfil === 'gestor' ? '<a class="btn btn-primary btn-block" href="#/secretaria/solicitacoes">' + I('shield', 18) + 'Abrir painel da secretaria</a>' : '') +
      '<button type="button" class="btn btn-ghost btn-block" data-action="sair">' + I('logout', 18) + 'Sair</button>' +
      '</div>';
    return screen(body, { tabs: 'perfil' });
  };
  LP.actions.sair = function () { LP.store.sair(); LP.toast('Você saiu.', 'info'); LP.go('#/catalogo'); };
})(window.LP);
