/* Estado do app, persistido no localStorage. Simula o back-end. */
(function (LP) {
  const KEY = 'largados-perdidos:v2';
  const STATUS = {
    disponivel: { nome: 'Disponível', cls: 'st-ok' },
    solicitado: { nome: 'Solicitado', cls: 'st-wait' },
    devolvido: { nome: 'Devolvido', cls: 'st-done' },
    abandonado: { nome: 'Abandonado', cls: 'st-old' },
    destinado: { nome: 'Destinado', cls: 'st-gone' }
  };
  const DESTINOS = {
    reaproveitamento: { nome: 'Reaproveitamento', icon: 'recycle', desc: 'Fica com alguém da comunidade do CI.' },
    doacao: { nome: 'Doação', icon: 'gift', desc: 'Segue para uma instituição parceira.' },
    descarte: { nome: 'Descarte', icon: 'trash', desc: 'Item sem condição de uso.' }
  };
  LP.STATUS = STATUS;
  LP.DESTINOS = DESTINOS;

  let state;

  /* Hash simples (cyrb53) só para não guardar a senha em texto puro no navegador.
     Num sistema com servidor, a senha seria verificada no back-end. */
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function contasIniciais() {
    const c = {};
    LP.CONTAS_GESTOR.forEach(function (g) {
      c[g.email] = { nome: g.nome, email: g.email, matricula: g.matricula, setor: g.setor, perfil: 'gestor', hash: hash(g.email + ':' + g.senha) };
    });
    return c;
  }

  function fresh() {
    return {
      itens: LP.seedItens(),
      config: JSON.parse(JSON.stringify(LP.CONFIG_PADRAO)),
      sessao: null,
      contas: contasIniciais(),
      seq: 43,
      interesses: {}
    };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* cota cheia: segue em memória */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : fresh();
    } catch (e) {
      state = fresh();
    }
    verificarPrazos();
  }

  /* ---------- utilidades ---------- */
  const fmtData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

  LP.fmt = {
    data: function (iso) { return fmtData.format(new Date(iso)); },
    curta: function (iso) { return fmtCurta.format(new Date(iso)).replace('.', ''); },
    hora: function (iso) { return fmtHora.format(new Date(iso)); },
    dataHora: function (iso) { return fmtData.format(new Date(iso)) + ' às ' + fmtHora.format(new Date(iso)); },
    relativo: function (iso) {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const d = new Date(iso); d.setHours(0, 0, 0, 0);
      const n = Math.round((hoje - d) / LP.DAY);
      if (n === 0) return 'hoje';
      if (n === 1) return 'ontem';
      if (n < 7) return 'há ' + n + ' dias';
      return fmtCurta.format(new Date(iso)).replace('.', '');
    }
  };

  LP.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  LP.categoria = function (id) {
    return LP.CATEGORIAS.find(function (c) { return c.id === id; }) || LP.CATEGORIAS[LP.CATEGORIAS.length - 1];
  };

  LP.dataLimite = function (item) {
    return new Date(new Date(item.entrada).getTime() + state.config.prazoDias * LP.DAY).toISOString();
  };

  LP.diasRestantes = function (item) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const lim = new Date(LP.dataLimite(item)); lim.setHours(0, 0, 0, 0);
    return Math.round((lim - hoje) / LP.DAY);
  };

  /* RF17 + RNF06: rotina que marca itens vencidos como "Abandonado".
     No sistema real roda sozinha uma vez por dia; aqui roda ao abrir o app e de hora em hora. */
  function verificarPrazos() {
    let mudou = 0;
    state.itens.forEach(function (it) {
      if (it.status === 'disponivel' && LP.diasRestantes(it) < 0) {
        it.status = 'abandonado';
        it.abandonadoEm = LP.dataLimite(it);
        it.log.push({ acao: 'Prazo vencido', de: 'Disponível', para: 'Abandonado', quem: 'Sistema', em: LP.dataLimite(it) });
        mudou++;
      }
    });
    state.config.ultimaVerificacao = new Date().toISOString();
    save();
    return mudou;
  }

  function find(id) {
    return state.itens.find(function (i) { return i.id === id; });
  }

  function pushLog(item, acao, de, para, quem) {
    item.log.push({ acao: acao, de: de, para: para, quem: quem, em: new Date().toISOString() });
  }

  LP.store = {
    load: load,
    get state() { return state; },
    reset: function () {
      const sessao = state && state.sessao;
      state = fresh();
      state.sessao = sessao;
      verificarPrazos();
    },
    verificarPrazos: verificarPrazos,
    item: find,

    conta: function (email) { return state.contas[email.toLowerCase()] || null; },

    /* RF01: e-mail institucional + senha. Devolve a conta ou null. */
    autenticar: function (email, senha) {
      const c = state.contas[email.toLowerCase()];
      if (!c || c.hash !== hash(c.email + ':' + senha)) return null;
      state.sessao = { nome: c.nome, email: c.email, matricula: c.matricula, perfil: c.perfil, setor: c.setor };
      save();
      return state.sessao;
    },

    criarConta: function (dados) {
      const email = dados.email.toLowerCase();
      state.contas[email] = { nome: dados.nome, email: email, matricula: dados.matricula, perfil: 'usuario', hash: hash(email + ':' + dados.senha) };
      return this.autenticar(email, dados.senha);
    },

    sair: function () { state.sessao = null; save(); },

    /* RF03 + RF04 */
    cadastrar: function (dados) {
      const id = 'LP-' + String(state.seq++).padStart(4, '0');
      const quem = state.sessao || LP.USUARIOS.aluno;
      const item = {
        id: id,
        nome: dados.nome, categoria: dados.categoria, descricao: dados.descricao,
        local: dados.local, achadoEm: dados.achadoEm, entrada: new Date().toISOString(),
        foto: dados.foto || null, sensivel: !!dados.sensivel,
        status: 'disponivel',
        cadastradoPor: { nome: quem.nome, matricula: quem.matricula },
        log: []
      };
      pushLog(item, 'Item cadastrado', null, 'Disponível', quem.nome);
      state.itens.unshift(item);
      save();
      return item;
    },

    /* RF10 + RF11 */
    solicitar: function (id) {
      const it = find(id);
      const u = state.sessao || LP.USUARIOS.aluno;
      if (!it || it.status !== 'disponivel') return false;
      it.status = 'solicitado';
      it.solicitacao = { nome: u.nome, matricula: u.matricula, email: u.email, em: new Date().toISOString(), estado: 'pendente' };
      pushLog(it, 'Retirada solicitada', 'Disponível', 'Solicitado', u.nome);
      save();
      return true;
    },

    cancelarSolicitacao: function (id) {
      const it = find(id);
      if (!it || it.status !== 'solicitado') return;
      pushLog(it, 'Solicitação cancelada', 'Solicitado', 'Disponível', it.solicitacao.nome);
      it.status = 'disponivel';
      delete it.solicitacao;
      save();
    },

    /* RF12 + RF13 */
    aprovar: function (id) {
      const it = find(id);
      it.solicitacao.estado = 'aprovada';
      pushLog(it, 'Solicitação aprovada', 'Solicitado', 'Solicitado', state.sessao.nome);
      save();
    },
    recusar: function (id, motivo) {
      const it = find(id);
      pushLog(it, 'Solicitação recusada: ' + motivo, 'Solicitado', 'Disponível', state.sessao.nome);
      it.historicoRecusas = (it.historicoRecusas || []).concat([Object.assign({}, it.solicitacao, { motivo: motivo })]);
      delete it.solicitacao;
      it.status = 'disponivel';
      save();
    },

    /* RF14 + RF15 */
    devolver: function (id, dados) {
      const it = find(id);
      const de = STATUS[it.status].nome;
      it.devolucao = {
        nome: dados.nome, matricula: dados.matricula, criterio: dados.criterio, obs: dados.obs || '',
        em: new Date().toISOString(), gestor: state.sessao.nome
      };
      it.status = 'devolvido';
      pushLog(it, 'Devolução registrada (' + dados.criterio + ')', de, 'Devolvido', state.sessao.nome);
      save();
    },

    /* RF20 */
    destinar: function (id, dados) {
      const it = find(id);
      it.destinacao = {
        tipo: dados.tipo, destinatario: dados.destinatario, justificativa: dados.justificativa,
        em: dados.data, gestor: state.sessao.nome
      };
      it.status = 'destinado';
      pushLog(it, 'Destinação: ' + DESTINOS[dados.tipo].nome.toLowerCase(), 'Abandonado', 'Destinado', state.sessao.nome);
      save();
    },

    interesse: function (id) {
      const u = state.sessao || LP.USUARIOS.aluno;
      const lista = state.interesses[id] || [];
      if (!lista.some(function (x) { return x.matricula === u.matricula; })) {
        lista.push({ nome: u.nome, matricula: u.matricula, em: new Date().toISOString() });
      }
      state.interesses[id] = lista;
      save();
    },
    temInteresse: function (id) {
      const u = state.sessao || LP.USUARIOS.aluno;
      return (state.interesses[id] || []).some(function (x) { return x.matricula === u.matricula; });
    },

    salvarConfig: function (patch) {
      Object.assign(state.config, patch);
      save();
    },

    save: save
  };
})(window.LP);
