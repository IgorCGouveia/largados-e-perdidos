/* Telas do gestor (computador): 6 Solicitações pendentes · 7 Registrar devolução · 8 Registrar destinação
   + Itens (painel geral) e Configurações (prazo, horário, critérios). */
(function (LP) {
  const I = LP.icon, E = LP.esc;
  LP.gui = LP.gui || { filtroStatus: '', busca: '', criterioNovo: '' };

  function layout(active, title, sub, content, actions) {
    const st = LP.store.state, s = st.sessao;
    const pend = st.itens.filter(function (i) { return i.solicitacao && i.solicitacao.estado === 'pendente'; }).length;
    const aband = st.itens.filter(function (i) { return i.status === 'abandonado'; }).length;
    const nav = [
      ['solicitacoes', 'Solicitações', 'inbox', pend],
      ['itens', 'Itens', 'list', 0],
      ['destinacao', 'Destinação', 'box', aband],
      ['config', 'Configurações', 'gear', 0]
    ];
    return '<div class="g-shell">' +
      '<aside class="g-side">' +
      '<div class="g-brand"><img src="assets/mascote.webp" alt="" width="40" height="40"><div><strong>Largados</strong><span>&amp; Perdidos</span></div></div>' +
      '<nav aria-label="Menu do gestor">' + nav.map(function (n) {
        const on = n[0] === active;
        return '<a href="#/g/' + n[0] + '" class="g-nav' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + I(n[2], 20) + '<span>' + n[1] + '</span>' +
          (n[3] ? '<b class="badge">' + n[3] + '</b>' : '') + '</a>';
      }).join('') + '</nav>' +
      '<div class="g-user"><div class="avatar">' + E(s.nome.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('')) + '</div>' +
      '<div><strong>' + E(s.nome) + '</strong><span>' + E(s.setor || 'Gestor') + '</span></div>' +
      '<button type="button" class="icon-btn" data-action="sair-gestor" aria-label="Sair">' + I('logout', 18) + '</button></div>' +
      '</aside>' +
      '<section class="g-main">' +
      '<header class="g-top"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="g-top-actions">' + (actions || '') + '</div></header>' +
      '<div class="g-content">' + content + '</div>' +
      '</section></div>';
  }

  function guard() {
    const s = LP.store.state.sessao;
    if (s && s.perfil === 'gestor') return null;
    return '<div class="g-denied"><img src="assets/mascote.webp" alt="" width="120" height="120">' +
      '<h1>Área restrita à secretaria</h1><p>As funções de gestor ficam disponíveis só para o perfil gestor (RF02).</p>' +
      '<button type="button" class="btn btn-primary" data-action="login-as" data-perfil="gestor">' + I('shield', 18) + 'Entrar como gestor (demonstração)</button></div>';
  }

  function itemCell(it) {
    return '<div class="cell-item">' + LP.thumb(it, 'sm') + '<div><strong>' + E(it.nome) + '</strong><span>' + it.id + ' · ' + LP.categoria(it.categoria).nome + '</span></div></div>';
  }

  /* ---------- 6 · Solicitações pendentes (RF12, RF13) ---------- */
  LP.views.g_solicitacoes = function () {
    const g = guard(); if (g) return g;
    const st = LP.store.state;
    const comPedido = st.itens.filter(function (i) { return i.status === 'solicitado' && i.solicitacao; })
      .sort(function (a, b) {
        if (a.solicitacao.estado !== b.solicitacao.estado) return a.solicitacao.estado === 'pendente' ? -1 : 1;
        return new Date(a.solicitacao.em) - new Date(b.solicitacao.em);
      });
    const pend = comPedido.filter(function (i) { return i.solicitacao.estado === 'pendente'; }).length;
    const disp = st.itens.filter(function (i) { return i.status === 'disponivel'; }).length;
    const vencendo = st.itens.filter(function (i) { return i.status === 'disponivel' && LP.diasRestantes(i) <= 7; }).length;
    const aband = st.itens.filter(function (i) { return i.status === 'abandonado'; }).length;

    const kpis = '<div class="kpis">' +
      kpi('inbox', pend, 'Solicitações pendentes', 'accent') +
      kpi('search', disp, 'Itens disponíveis', '') +
      kpi('clock', vencendo, 'Vencem em até 7 dias', vencendo ? 'warn' : '') +
      kpi('box', aband, 'Abandonados sem destino', aband ? 'warn' : '') +
      '</div>';

    const tabela = comPedido.length ? '<div class="card"><table class="table">' +
      '<thead><tr><th>Item</th><th>Solicitante</th><th>Pedido em</th><th>Situação</th><th class="ta-r">Ações</th></tr></thead><tbody>' +
      comPedido.map(function (it) {
        const sol = it.solicitacao, pendente = sol.estado === 'pendente';
        return '<tr' + (pendente ? ' class="row-hl"' : '') + '><td>' + itemCell(it) + '</td>' +
          '<td><strong>' + E(sol.nome) + '</strong><span class="sub">Matrícula ' + E(sol.matricula) + '</span></td>' +
          '<td>' + LP.fmt.data(sol.em) + '<span class="sub">' + LP.fmt.hora(sol.em) + '</span></td>' +
          '<td>' + (pendente ? '<span class="chip st-wait">Pendente</span><span class="sub">aguardando análise</span>' : '<span class="chip st-ok">Aprovada</span><span class="sub">aguardando retirada</span>') + '</td>' +
          '<td class="ta-r"><div class="row-actions">' +
          (pendente
            ? '<button type="button" class="btn btn-ghost btn-sm" data-action="recusar" data-id="' + it.id + '">' + I('x', 16) + 'Recusar</button>' +
              '<button type="button" class="btn btn-primary btn-sm" data-action="aprovar" data-id="' + it.id + '">' + I('check', 16) + 'Aprovar</button>'
            : '<a class="btn btn-primary btn-sm" href="#/g/devolucao/' + it.id + '">' + I('hand', 16) + 'Registrar devolução</a>') +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="card empty"><img src="assets/mascote.webp" alt="" width="96" height="96"><h3>Nenhuma solicitação</h3><p>Quando alguém pedir um item pelo app, o pedido aparece aqui.</p></div>';

    const tip = '<div class="tip">' + I('info', 18) + '<p>Aprovar só confirma que o item está guardado e pode ser buscado. A conferência do dono acontece na entrega, em <b>Registrar devolução</b>.</p></div>';

    return layout('solicitacoes', 'Solicitações de retirada', 'Pedidos feitos pela comunidade no catálogo de achados', kpis + tabela + tip,
      '<a class="btn btn-ghost" href="#/g/itens">' + I('list', 18) + 'Ver todos os itens</a>');
  };

  function kpi(icon, n, label, tone) {
    return '<div class="kpi ' + tone + '"><span class="kpi-ic">' + I(icon, 20) + '</span><strong>' + n + '</strong><span>' + label + '</span></div>';
  }

  LP.actions.aprovar = function (el) {
    LP.store.aprovar(el.dataset.id);
    LP.toast('Solicitação aprovada. O solicitante já pode buscar o item.');
    LP.render();
  };
  LP.actions.recusar = function (el) {
    const it = LP.store.item(el.dataset.id);
    LP.confirm({
      title: 'Recusar solicitação',
      body: '<p>O item <b>' + E(it.nome) + '</b> volta a ficar disponível no catálogo. Informe o motivo para ' + E(it.solicitacao.nome.split(' ')[0]) + '.</p>' +
        '<label class="field"><span>Motivo da recusa <em>*</em></span><select name="motivo">' +
        '<option>A descrição do solicitante não confere com o item</option>' +
        '<option>Outra pessoa comprovou ser a dona do item</option>' +
        '<option>Solicitação duplicada</option>' +
        '<option>Outro motivo</option></select></label>',
      ok: 'Recusar', danger: true,
      onOk: function (box) {
        LP.store.recusar(it.id, box.querySelector('[name=motivo]').value);
        LP.toast('Solicitação recusada. O item voltou ao catálogo.', 'info');
        LP.render();
      }
    });
  };
  LP.actions['sair-gestor'] = function () { LP.store.sair(); LP.go('#/u/login'); };

  /* ---------- 7 · Registrar devolução (RF14, RF15) ---------- */
  LP.views.g_devolucao = function (p) {
    const g = guard(); if (g) return g;
    const st = LP.store.state;
    const it = p.id && LP.store.item(p.id);
    if (!it) {
      const lista = st.itens.filter(function (i) { return i.status === 'solicitado' || i.status === 'disponivel'; });
      return layout('solicitacoes', 'Registrar devolução', 'Escolha o item que está sendo entregue',
        '<div class="card"><table class="table"><thead><tr><th>Item</th><th>Status</th><th></th></tr></thead><tbody>' +
        lista.map(function (i) { return '<tr><td>' + itemCell(i) + '</td><td>' + LP.statusChip(i.status) + '</td><td class="ta-r"><a class="btn btn-ghost btn-sm" href="#/g/devolucao/' + i.id + '">Selecionar</a></td></tr>'; }).join('') +
        '</tbody></table></div>');
    }
    if (it.status === 'devolvido') {
      const d = it.devolucao;
      return layout('solicitacoes', 'Devolução registrada', it.id,
        '<div class="g-two"><div>' + resumo(it) + '</div><div class="card card-pad done-card">' +
        '<div class="success-badge">' + I('check', 36) + '</div><h2>' + E(it.nome) + ' foi devolvido</h2>' +
        '<dl class="facts"><div><dt>Retirado por</dt><dd>' + E(d.nome) + ' · ' + E(d.matricula) + '</dd></div>' +
        '<div><dt>Conferência</dt><dd>' + E(d.criterio) + '</dd></div>' +
        '<div><dt>Data e hora</dt><dd>' + LP.fmt.dataHora(d.em) + '</dd></div>' +
        '<div><dt>Gestor responsável</dt><dd>' + E(d.gestor) + '</dd></div></dl>' +
        '<a class="btn btn-primary" href="#/g/solicitacoes">Voltar às solicitações</a></div></div>');
    }
    const sol = it.solicitacao;
    const form = '<form class="card card-pad form" data-form="devolucao" data-id="' + it.id + '" novalidate>' +
      '<h2 class="card-title">Quem está retirando</h2>' +
      (sol ? '<p class="hint">Dados preenchidos a partir da solicitação de ' + E(sol.nome.split(' ')[0]) + '. Ajuste se outra pessoa veio buscar.</p>' : '<p class="hint">Item sem solicitação no app: preencha com os dados de quem está na secretaria.</p>') +
      '<div class="grid-2">' +
      '<label class="field"><span>Nome completo <em>*</em></span><input name="nome" value="' + E(sol ? sol.nome : '') + '" required></label>' +
      '<label class="field"><span>Matrícula ou documento <em>*</em></span><input name="matricula" value="' + E(sol ? sol.matricula : '') + '" required></label>' +
      '</div>' +
      '<fieldset class="field"><legend>Como confirmou que é o dono? <em>*</em></legend>' +
      '<div class="crit-list">' + st.config.criterios.map(function (c, idx) {
        return '<label class="crit"><input type="radio" name="criterio" value="' + E(c) + '"' + (idx === 0 ? ' checked' : '') + '><span>' + I('check', 16) + E(c) + '</span></label>';
      }).join('') + '</div>' +
      '<a class="link-btn" href="#/g/config">' + I('gear', 14) + 'Editar lista de critérios</a></fieldset>' +
      '<label class="field"><span>Observação</span><textarea name="obs" rows="2" placeholder="Opcional. Ex.: descreveu o adesivo na tampa."></textarea></label>' +
      '<div class="audit">' + I('history', 18) + '<p>Será registrado com <b>data e hora atuais</b> e <b>' + E(st.sessao.nome) + '</b> como gestor responsável.</p></div>' +
      '<p class="form-error" data-error hidden></p>' +
      '<div class="form-actions"><a class="btn btn-ghost" href="#/g/solicitacoes">Cancelar</a><button class="btn btn-primary" type="submit">' + I('check', 18) + 'Confirmar devolução</button></div>' +
      '</form>';
    return layout('solicitacoes', 'Registrar devolução', 'Entrega do item ' + it.id + ' na secretaria',
      '<div class="g-two"><div>' + resumo(it) + '</div>' + form + '</div>');
  };

  function resumo(it) {
    const c = LP.categoria(it.categoria);
    return '<div class="card summary">' + LP.thumb(it, 'lg') +
      '<div class="card-pad"><div class="detail-head"><h2>' + E(it.nome) + '</h2>' + LP.statusChip(it.status) + '</div>' +
      '<p class="detail-desc">' + E(it.descricao) + '</p>' +
      '<dl class="facts facts-compact">' +
      '<div><dt>Código</dt><dd>' + it.id + '</dd></div>' +
      '<div><dt>Categoria</dt><dd>' + c.nome + '</dd></div>' +
      '<div><dt>Achado em</dt><dd>' + E(it.local) + ', ' + LP.fmt.data(it.achadoEm) + '</dd></div>' +
      '<div><dt>Cadastrado por</dt><dd>' + E(it.cadastradoPor.nome) + ' · ' + E(it.cadastradoPor.matricula) + '</dd></div>' +
      '<div><dt>Data limite</dt><dd>' + LP.fmt.data(LP.dataLimite(it)) + '</dd></div>' +
      '</dl>' +
      '<h3 class="section-title">Histórico</h3><ol class="timeline">' +
      it.log.slice().reverse().map(function (l) {
        return '<li><strong>' + E(l.acao) + '</strong><span>' + LP.fmt.dataHora(l.em) + ' · ' + E(l.quem) + '</span></li>';
      }).join('') + '</ol></div></div>';
  }

  LP.forms.devolucao = function (form) {
    const f = form.elements, err = form.querySelector('[data-error]');
    const crit = form.querySelector('[name=criterio]:checked');
    if (!f.nome.value.trim() || !f.matricula.value.trim() || !crit) {
      err.textContent = 'Preencha nome, matrícula e o critério de conferência.';
      err.hidden = false;
      return;
    }
    LP.store.devolver(form.dataset.id, { nome: f.nome.value.trim(), matricula: f.matricula.value.trim(), criterio: crit.value, obs: f.obs.value.trim() });
    LP.toast('Devolução registrada. O item saiu do catálogo.');
    LP.render();
  };

  /* ---------- 8 · Registrar destinação (RF20) ---------- */
  LP.views.g_destinacao = function (p) {
    const g = guard(); if (g) return g;
    const st = LP.store.state;
    const aband = st.itens.filter(function (i) { return i.status === 'abandonado'; })
      .sort(function (a, b) { return new Date(a.entrada) - new Date(b.entrada); });
    const destinados = st.itens.filter(function (i) { return i.status === 'destinado'; })
      .sort(function (a, b) { return new Date(b.destinacao.em) - new Date(a.destinacao.em); });
    const sel = (p.id && LP.store.item(p.id)) || aband[0];

    const lista = '<div class="card pick-list"><div class="card-head"><h2 class="card-title">Abandonados</h2><span class="chip st-old">' + aband.length + '</span></div>' +
      (aband.length ? aband.map(function (i) {
        const n = (st.interesses[i.id] || []).length;
        return '<a class="pick' + (sel && sel.id === i.id ? ' on' : '') + '" href="#/g/destinacao/' + i.id + '">' + LP.thumb(i, 'sm') +
          '<div><strong>' + E(i.nome) + '</strong><span>' + i.id + ' · venceu ' + LP.fmt.data(LP.dataLimite(i)) + '</span>' +
          (n ? '<span class="pick-int">' + I('heart', 12) + n + (n === 1 ? ' interessado' : ' interessados') + '</span>' : '') + '</div></a>';
      }).join('') : '<p class="muted card-pad">Nenhum item aguardando destino.</p>') +
      '</div>';

    let form = '';
    if (sel && sel.status === 'abandonado') {
      const ints = st.interesses[sel.id] || [];
      const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const tipo = LP.gui.destTipo || (ints.length ? 'reaproveitamento' : 'doacao');
      const destPadrao = tipo === 'doacao' ? 'Centro Espírita (doação)' : tipo === 'reaproveitamento' && ints.length ? ints[0].nome + ' · ' + ints[0].matricula : '';
      form = '<form class="card card-pad form" data-form="destinacao" data-id="' + sel.id + '" novalidate>' +
        '<div class="sel-head">' + LP.thumb(sel, 'md') + '<div><span class="eyebrow">' + sel.id + '</span><h2>' + E(sel.nome) + '</h2>' +
        '<p class="muted">' + E(sel.descricao) + '</p></div></div>' +
        '<fieldset class="field"><legend>Destino <em>*</em></legend><div class="dest-grid">' +
        Object.keys(LP.DESTINOS).map(function (k) {
          const d = LP.DESTINOS[k];
          return '<label class="dest dest-' + k + '"><input type="radio" name="tipo" value="' + k + '" data-input="dest-tipo"' + (tipo === k ? ' checked' : '') + '>' +
            '<span>' + I(d.icon, 26) + '<strong>' + d.nome + '</strong><small>' + d.desc + '</small></span></label>';
        }).join('') + '</div></fieldset>' +
        (ints.length && tipo === 'reaproveitamento' ? '<div class="tip">' + I('heart', 18) + '<p><b>' + ints.length + (ints.length === 1 ? ' pessoa demonstrou' : ' pessoas demonstraram') + ' interesse</b> pelo app: ' +
          ints.map(function (x) { return E(x.nome); }).join(', ') + '.</p></div>' : '') +
        '<div class="grid-2">' +
        (tipo !== 'descarte' ? '<label class="field"><span>' + (tipo === 'doacao' ? 'Instituição' : 'Quem recebe') + ' <em>*</em></span><input name="destinatario" list="destinatarios" value="' + E(destPadrao) + '" required>' +
          '<datalist id="destinatarios">' + st.config.destinatarios.map(function (d) { return '<option value="' + E(d) + '">'; }).join('') +
          ints.map(function (x) { return '<option value="' + E(x.nome + ' · ' + x.matricula) + '">'; }).join('') + '</datalist></label>' : '') +
        '<label class="field"><span>Data <em>*</em></span><input type="date" name="data" value="' + hoje + '" max="' + hoje + '" required></label>' +
        '</div>' +
        '<label class="field"><span>Justificativa <em>*</em></span><textarea name="justificativa" rows="3" placeholder="' +
        (tipo === 'descarte' ? 'Ex.: item quebrado, sem condição de uso.' : 'Ex.: em bom estado, prazo vencido sem procura.') + '" required></textarea></label>' +
        '<div class="audit">' + I('history', 18) + '<p>Registrado por <b>' + E(st.sessao.nome) + '</b>. O item sai do catálogo de abandonados.</p></div>' +
        '<p class="form-error" data-error hidden></p>' +
        '<div class="form-actions"><button class="btn btn-primary" type="submit">' + I('check', 18) + 'Registrar destinação</button></div>' +
        '</form>';
    } else {
      form = '<div class="card empty"><img src="assets/mascote.webp" alt="" width="96" height="96"><h3>Tudo em dia</h3><p>Não há itens abandonados esperando destino.</p></div>';
    }

    const hist = destinados.length ? '<div class="card"><div class="card-head"><h2 class="card-title">Destinações registradas</h2></div><table class="table">' +
      '<thead><tr><th>Item</th><th>Destino</th><th>Para</th><th>Data</th><th>Justificativa</th></tr></thead><tbody>' +
      destinados.map(function (i) {
        const d = i.destinacao;
        return '<tr><td>' + itemCell(i) + '</td><td><span class="chip st-gone">' + LP.DESTINOS[d.tipo].nome + '</span></td><td>' + E(d.destinatario || '—') + '</td><td>' + LP.fmt.data(d.em) + '</td><td class="muted">' + E(d.justificativa) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '';

    return layout('destinacao', 'Registrar destinação', 'Itens com prazo de ' + st.config.prazoDias + ' dias vencido',
      '<div class="g-split">' + lista + form + '</div>' + hist);
  };

  LP.inputs['dest-tipo'] = function (el) { LP.gui.destTipo = el.value; LP.render(); };

  LP.forms.destinacao = function (form) {
    const f = form.elements, err = form.querySelector('[data-error]');
    const tipo = (form.querySelector('[name=tipo]:checked') || {}).value;
    const dest = f.destinatario ? f.destinatario.value.trim() : '';
    if (!tipo || !f.justificativa.value.trim() || !f.data.value || (tipo !== 'descarte' && !dest)) {
      err.textContent = 'Preencha o destino, ' + (tipo !== 'descarte' ? 'quem recebe, ' : '') + 'a data e a justificativa.';
      err.hidden = false;
      return;
    }
    LP.store.destinar(form.dataset.id, { tipo: tipo, destinatario: dest, justificativa: f.justificativa.value.trim(), data: new Date(f.data.value + 'T12:00:00').toISOString() });
    LP.gui.destTipo = null;
    LP.toast('Destinação registrada: ' + LP.DESTINOS[tipo].nome.toLowerCase() + '.');
    LP.go('#/g/destinacao');
  };

  /* ---------- Itens (painel geral, RF05/RF21) ---------- */
  LP.views.g_itens = function () {
    const g = guard(); if (g) return g;
    const st = LP.store.state, gui = LP.gui, q = gui.busca.toLowerCase();
    const contagem = {};
    st.itens.forEach(function (i) { contagem[i.status] = (contagem[i.status] || 0) + 1; });
    const itens = st.itens.filter(function (i) { return !gui.filtroStatus || i.status === gui.filtroStatus; })
      .filter(function (i) { return !q || (i.nome + ' ' + i.id + ' ' + i.local).toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return new Date(b.entrada) - new Date(a.entrada); });
    const filtros = '<div class="seg">' + [['', 'Todos', st.itens.length]].concat(Object.keys(LP.STATUS).map(function (k) { return [k, LP.STATUS[k].nome, contagem[k] || 0]; })).map(function (f) {
      return '<button type="button" class="seg-btn' + (gui.filtroStatus === f[0] ? ' on' : '') + '" data-action="g-filtro" data-status="' + f[0] + '">' + f[1] + ' <b>' + f[2] + '</b></button>';
    }).join('') + '</div>';
    const table = '<div class="card"><div class="card-head">' + filtros +
      '<label class="search search-sm">' + I('search', 18) + '<input type="search" placeholder="Buscar por nome, código ou local" value="' + E(gui.busca) + '" data-input="g-busca"></label></div>' +
      '<table class="table"><thead><tr><th>Item</th><th>Local</th><th>Entrada</th><th>Data limite</th><th>Status</th><th></th></tr></thead><tbody>' +
      itens.map(function (i) {
        const dias = LP.diasRestantes(i);
        const limite = i.status === 'disponivel' || i.status === 'solicitado'
          ? LP.fmt.data(LP.dataLimite(i)) + '<span class="sub' + (dias <= 7 ? ' warn-text' : '') + '">' + (dias < 0 ? 'vencido' : dias === 0 ? 'vence hoje' : 'faltam ' + dias + ' dias') + '</span>'
          : '<span class="muted">—</span>';
        let acao = '';
        if (i.status === 'solicitado' || i.status === 'disponivel') acao = '<a class="btn btn-ghost btn-sm" href="#/g/devolucao/' + i.id + '">Devolver</a>';
        if (i.status === 'abandonado') acao = '<a class="btn btn-ghost btn-sm" href="#/g/destinacao/' + i.id + '">Destinar</a>';
        return '<tr><td>' + itemCell(i) + '</td><td>' + E(i.local) + '</td><td>' + LP.fmt.data(i.entrada) + '</td><td>' + limite + '</td><td>' + LP.statusChip(i.status) + '</td><td class="ta-r">' + acao + '</td></tr>';
      }).join('') +
      (itens.length ? '' : '<tr><td colspan="6" class="muted ta-c">Nenhum item com esses filtros.</td></tr>') +
      '</tbody></table></div>';
    return layout('itens', 'Itens', 'Tudo que passou pela secretaria, do cadastro à saída', table,
      '<a class="btn btn-primary" href="#/u/cadastrar" data-action="g-cadastrar">' + I('plus', 18) + 'Cadastrar item</a>');
  };
  LP.actions['g-filtro'] = function (el) { LP.gui.filtroStatus = el.dataset.status; LP.render(); };
  LP.inputs['g-busca'] = function (el) { LP.gui.busca = el.value; LP.render({ keepFocus: '[data-input="g-busca"]' }); };
  LP.actions['g-cadastrar'] = function (el, ev) { ev.preventDefault(); LP.toast('Abrindo o cadastro na visão celular.', 'info'); LP.go('#/u/cadastrar'); };

  /* ---------- Configurações (RF16, RF06) ---------- */
  LP.views.g_config = function () {
    const g = guard(); if (g) return g;
    const c = LP.store.state.config;
    const content = '<div class="g-cols">' +
      '<form class="card card-pad form" data-form="config" novalidate>' +
      '<h2 class="card-title">Prazo de permanência</h2>' +
      '<p class="hint">Quantos dias um item fica na secretaria antes de virar “Abandonado”. Segue as regras da direção do CI.</p>' +
      '<label class="field field-inline"><input type="number" name="prazoDias" min="7" max="365" value="' + c.prazoDias + '" required><span>dias</span></label>' +
      '<p class="muted small">Hoje a secretaria guarda por cerca de dois períodos letivos. O valor padrão ainda será definido com a direção.</p>' +
      '<h2 class="card-title">Atendimento para retirada</h2>' +
      '<label class="field"><span>Horário</span><input name="horario" value="' + E(c.horario) + '"></label>' +
      '<label class="field"><span>Local</span><input name="localRetirada" value="' + E(c.localRetirada) + '"></label>' +
      '<div class="audit">' + I('history', 18) + '<p>Verificação automática de prazos: última execução em <b>' + LP.fmt.dataHora(c.ultimaVerificacao) + '</b>. Roda pelo menos uma vez por dia.</p></div>' +
      '<div class="form-actions"><button type="button" class="btn btn-ghost" data-action="rodar-verificacao">Rodar verificação agora</button><button class="btn btn-primary" type="submit">Salvar</button></div>' +
      '</form>' +
      '<div class="card card-pad">' +
      '<h2 class="card-title">Critérios de conferência</h2>' +
      '<p class="hint">Opções que aparecem ao registrar uma devolução. A secretaria pode ajustar a lista.</p>' +
      '<ul class="editable">' + c.criterios.map(function (cr, idx) {
        return '<li><span>' + I('check', 16) + E(cr) + '</span><button type="button" class="icon-btn" data-action="rm-criterio" data-idx="' + idx + '" aria-label="Remover ' + E(cr) + '">' + I('x', 16) + '</button></li>';
      }).join('') + '</ul>' +
      '<form class="add-row" data-form="add-criterio"><input name="novo" placeholder="Novo critério" maxlength="60"><button class="btn btn-ghost btn-sm" type="submit">' + I('plus', 16) + 'Adicionar</button></form>' +
      '<h2 class="card-title mt">Categorias</h2>' +
      '<div class="cat-tags">' + LP.CATEGORIAS.map(function (k) { return '<span style="--tile:' + k.cor + ';--ink-tile:' + k.tinta + '">' + I('cat_' + k.id, 16) + k.nome + '</span>'; }).join('') + '</div>' +
      '</div></div>';
    return layout('config', 'Configurações', 'Regras do achados e perdidos do CI', content);
  };

  LP.forms.config = function (form) {
    const f = form.elements, dias = parseInt(f.prazoDias.value, 10);
    if (!(dias >= 7 && dias <= 365)) { LP.toast('O prazo deve ficar entre 7 e 365 dias.', 'error'); return; }
    LP.store.salvarConfig({ prazoDias: dias, horario: f.horario.value.trim() || LP.CONFIG_PADRAO.horario, localRetirada: f.localRetirada.value.trim() || LP.CONFIG_PADRAO.localRetirada });
    const n = LP.store.verificarPrazos();
    LP.toast('Configurações salvas.' + (n ? ' ' + n + (n === 1 ? ' item passou' : ' itens passaram') + ' para Abandonado.' : ''));
    LP.render();
  };
  LP.actions['rodar-verificacao'] = function () {
    const n = LP.store.verificarPrazos();
    LP.toast(n ? n + (n === 1 ? ' item marcado' : ' itens marcados') + ' como Abandonado.' : 'Nenhum item venceu desde a última verificação.', 'info');
    LP.render();
  };
  LP.forms['add-criterio'] = function (form) {
    const v = form.novo.value.trim();
    if (!v) return;
    const c = LP.store.state.config;
    if (c.criterios.indexOf(v) < 0) LP.store.salvarConfig({ criterios: c.criterios.concat([v]) });
    LP.render();
  };
  LP.actions['rm-criterio'] = function (el) {
    const c = LP.store.state.config;
    if (c.criterios.length <= 1) { LP.toast('Mantenha pelo menos um critério.', 'error'); return; }
    LP.store.salvarConfig({ criterios: c.criterios.filter(function (_, i) { return i !== Number(el.dataset.idx); }) });
    LP.render();
  };
})(window.LP);
