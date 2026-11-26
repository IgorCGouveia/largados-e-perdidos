/* Dados de demonstração. As datas são relativas ao dia em que o protótipo é aberto,
   para que os prazos (RF16/RF17) sempre façam sentido na demonstração. */
(function (LP) {
  const DAY = 86400000;

  function daysAgo(n, hour) {
    const d = new Date();
    d.setHours(hour == null ? 10 : hour, 15, 0, 0);
    return new Date(d.getTime() - n * DAY).toISOString();
  }

  LP.DAY = DAY;
  LP.daysAgo = daysAgo;

  LP.CATEGORIAS = [
    { id: 'eletronicos', nome: 'Eletrônicos', cor: '#DDEBFF', tinta: '#2D5FA8' },
    { id: 'documentos', nome: 'Documentos', cor: '#FFF1D6', tinta: '#9A6512' },
    { id: 'roupas', nome: 'Roupas', cor: '#F6E3F3', tinta: '#8A3A80' },
    { id: 'garrafas', nome: 'Garrafas', cor: '#DDF4F1', tinta: '#1E7A70' },
    { id: 'material', nome: 'Material escolar', cor: '#E8F7D6', tinta: '#3C7A1E' },
    { id: 'outros', nome: 'Outros', cor: '#ECEFEA', tinta: '#4F5E53' }
  ];

  LP.LOCAIS = [
    'Hall de entrada (térreo)',
    'Área de convivência (térreo)',
    'Cantina (térreo)',
    'Auditório (térreo)',
    'Sala 101 (1º andar)',
    'Sala 105 (1º andar)',
    'Sala 203 (2º andar)',
    'Laboratório 3 (2º andar)',
    'Biblioteca setorial (2º andar)',
    'Outro local'
  ];

  LP.CONFIG_PADRAO = {
    prazoDias: 90,
    horario: 'Segunda a sexta, 8h às 12h e 13h às 17h',
    localRetirada: 'Secretaria do CI, térreo',
    criterios: [
      'Documento com foto',
      'Nome marcado no item',
      'Descreveu um detalhe único',
      'Desbloqueou o aparelho'
    ],
    destinatarios: ['Centro Espírita (doação)', 'Comunidade do CI (reaproveitamento)'],
    ultimaVerificacao: null
  };

  /* Contas da secretaria já cadastradas (perfil gestor, RF02). */
  LP.CONTAS_GESTOR = [
    { nome: 'Maria Souza', email: 'secretaria@academico.ufpb.br', matricula: 'SIAPE 1234567', setor: 'Secretaria do CI', senha: 'secretaria' }
  ];

  LP.USUARIOS = {
    aluno: { nome: 'Gives Andrade', email: 'gives.andrade@academico.ufpb.br', matricula: '20240012345', perfil: 'usuario' },
    gestor: { nome: 'Maria Souza', email: 'maria.souza@academico.ufpb.br', matricula: 'SIAPE 1234567', perfil: 'gestor', setor: 'Secretaria do CI' }
  };

  function log(acao, de, para, quem, dias, hora) {
    return { acao: acao, de: de, para: para, quem: quem, em: daysAgo(dias, hora) };
  }

  /* status: disponivel | solicitado | devolvido | abandonado | destinado */
  LP.seedItens = function () {
    return [
      {
        id: 'LP-0042', nome: 'Garrafa térmica azul', categoria: 'garrafas',
        descricao: 'Garrafa térmica de inox azul-marinho, 1 litro, com um adesivo de planeta na tampa. Estava vazia.',
        local: 'Sala 105 (1º andar)', achadoEm: daysAgo(1, 9), entrada: daysAgo(1, 11),
        status: 'disponivel', cadastradoPor: { nome: 'Pedro Lima', matricula: '20230045678' },
        log: [log('Item cadastrado', null, 'Disponível', 'Pedro Lima', 1, 11)]
      },
      {
        id: 'LP-0041', nome: 'Carregador de notebook USB-C', categoria: 'eletronicos',
        descricao: 'Fonte preta de 65 W com cabo USB-C trançado. Há uma fita crepe enrolada perto do conector.',
        local: 'Laboratório 3 (2º andar)', achadoEm: daysAgo(3, 16), entrada: daysAgo(3, 17),
        status: 'solicitado', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        solicitacao: { nome: 'Gives Andrade', matricula: '20240012345', email: 'gives.andrade@academico.ufpb.br', em: daysAgo(0, 8), estado: 'pendente' },
        log: [
          log('Item cadastrado', null, 'Disponível', 'Maria Souza', 3, 17),
          log('Retirada solicitada', 'Disponível', 'Solicitado', 'Gives Andrade', 0, 8)
        ]
      },
      {
        id: 'LP-0040', nome: 'Carteira de estudante', categoria: 'documentos', sensivel: true,
        descricao: 'Carteira estudantil da UFPB dentro de uma capinha transparente. Para retirar, informe o nome completo impresso.',
        local: 'Cantina (térreo)', achadoEm: daysAgo(4, 12), entrada: daysAgo(4, 13),
        status: 'disponivel', cadastradoPor: { nome: 'Lara Mendes', matricula: '20230011223' },
        log: [log('Item cadastrado', null, 'Disponível', 'Lara Mendes', 4, 13)]
      },
      {
        id: 'LP-0039', nome: 'Moletom cinza com capuz', categoria: 'roupas',
        descricao: 'Moletom cinza mescla, tamanho M, com o bolso frontal descosturado do lado esquerdo.',
        local: 'Auditório (térreo)', achadoEm: daysAgo(7, 18), entrada: daysAgo(6, 9),
        status: 'disponivel', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        log: [log('Item cadastrado', null, 'Disponível', 'Maria Souza', 6, 9)]
      },
      {
        id: 'LP-0038', nome: 'Raquete de pingue-pongue', categoria: 'outros',
        descricao: 'Raquete com borracha vermelha e preta, cabo de madeira clara com as iniciais "G.A." riscadas.',
        local: 'Área de convivência (térreo)', achadoEm: daysAgo(11, 15), entrada: daysAgo(11, 16),
        status: 'solicitado', cadastradoPor: { nome: 'Caio Ferreira', matricula: '20230099887' },
        solicitacao: { nome: 'Ana Beatriz Costa', matricula: '20220054321', email: 'ana.costa@academico.ufpb.br', em: daysAgo(1, 14), estado: 'aprovada' },
        log: [
          log('Item cadastrado', null, 'Disponível', 'Caio Ferreira', 11, 16),
          log('Retirada solicitada', 'Disponível', 'Solicitado', 'Ana Beatriz Costa', 1, 14),
          log('Solicitação aprovada', 'Solicitado', 'Solicitado', 'Maria Souza', 1, 15)
        ]
      },
      {
        id: 'LP-0037', nome: 'Fone de ouvido sem fio', categoria: 'eletronicos', sensivel: true,
        descricao: 'Fone intra-auricular com estojo de carregamento branco e um arranhão na tampa. Foto não divulgada por ser item de alto valor.',
        local: 'Biblioteca setorial (2º andar)', achadoEm: daysAgo(15, 10), entrada: daysAgo(15, 11),
        status: 'solicitado', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        solicitacao: { nome: 'Rafael Nunes', matricula: '20210076543', email: 'rafael.nunes@academico.ufpb.br', em: daysAgo(0, 10), estado: 'pendente' },
        log: [
          log('Item cadastrado', null, 'Disponível', 'Maria Souza', 15, 11),
          log('Retirada solicitada', 'Disponível', 'Solicitado', 'Rafael Nunes', 0, 10)
        ]
      },
      {
        id: 'LP-0036', nome: 'Caderno universitário verde', categoria: 'material',
        descricao: 'Caderno de 10 matérias, capa verde-escura, com anotações de Cálculo II e Estruturas de Dados.',
        local: 'Sala 203 (2º andar)', achadoEm: daysAgo(22, 11), entrada: daysAgo(22, 12),
        status: 'disponivel', cadastradoPor: { nome: 'Júlia Prado', matricula: '20230033445' },
        log: [log('Item cadastrado', null, 'Disponível', 'Júlia Prado', 22, 12)]
      },
      {
        id: 'LP-0035', nome: 'Guarda-chuva preto', categoria: 'outros',
        descricao: 'Guarda-chuva automático preto, cabo emborrachado, uma das varetas entortada.',
        local: 'Hall de entrada (térreo)', achadoEm: daysAgo(36, 8), entrada: daysAgo(36, 9),
        status: 'disponivel', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        log: [log('Item cadastrado', null, 'Disponível', 'Maria Souza', 36, 9)]
      },
      {
        id: 'LP-0034', nome: 'Óculos de grau com estojo', categoria: 'outros',
        descricao: 'Armação redonda dourada dentro de estojo marrom de couro sintético.',
        local: 'Sala 101 (1º andar)', achadoEm: daysAgo(85, 15), entrada: daysAgo(85, 16),
        status: 'disponivel', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        log: [log('Item cadastrado', null, 'Disponível', 'Maria Souza', 85, 16)]
      },
      {
        id: 'LP-0033', nome: 'Pen drive 32 GB', categoria: 'eletronicos',
        descricao: 'Pen drive prateado com chaveiro de cordão vermelho.',
        local: 'Laboratório 3 (2º andar)', achadoEm: daysAgo(20, 14), entrada: daysAgo(20, 15),
        status: 'devolvido', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        devolucao: { nome: 'Bruno Alves', matricula: '20230022110', criterio: 'Descreveu um detalhe único', em: daysAgo(13, 10), gestor: 'Maria Souza' },
        log: [
          log('Item cadastrado', null, 'Disponível', 'Maria Souza', 20, 15),
          log('Retirada solicitada', 'Disponível', 'Solicitado', 'Bruno Alves', 14, 9),
          log('Devolução registrada', 'Solicitado', 'Devolvido', 'Maria Souza', 13, 10)
        ]
      },
      {
        id: 'LP-0031', nome: 'Calculadora científica', categoria: 'material',
        descricao: 'Calculadora científica cinza com tampa deslizante. Funcionando, pilha fraca.',
        local: 'Sala 101 (1º andar)', achadoEm: daysAgo(97, 10), entrada: daysAgo(97, 11),
        status: 'disponivel', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        log: [log('Item cadastrado', null, 'Disponível', 'Maria Souza', 97, 11)]
      },
      {
        id: 'LP-0030', nome: 'Mochila preta', categoria: 'outros',
        descricao: 'Mochila preta de nylon com dois bolsos laterais. Estava vazia, com um chaveiro de crocodilo.',
        local: 'Auditório (térreo)', achadoEm: daysAgo(104, 17), entrada: daysAgo(104, 18),
        status: 'disponivel', cadastradoPor: { nome: 'Tiago Moura', matricula: '20230066778' },
        log: [log('Item cadastrado', null, 'Disponível', 'Tiago Moura', 104, 18)]
      },
      {
        id: 'LP-0028', nome: 'Jaqueta jeans', categoria: 'roupas',
        descricao: 'Jaqueta jeans azul-clara, tamanho G, em bom estado.',
        local: 'Sala 203 (2º andar)', achadoEm: daysAgo(112, 9), entrada: daysAgo(112, 10),
        status: 'disponivel', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        log: [log('Item cadastrado', null, 'Disponível', 'Maria Souza', 112, 10)]
      },
      {
        id: 'LP-0025', nome: 'Garrafa plástica rosa', categoria: 'garrafas',
        descricao: 'Squeeze rosa de 700 ml. Conteúdo descartado na entrada.',
        local: 'Cantina (térreo)', achadoEm: daysAgo(118, 12), entrada: daysAgo(118, 13),
        status: 'disponivel', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        log: [log('Item cadastrado', null, 'Disponível', 'Maria Souza', 118, 13)]
      },
      {
        id: 'LP-0022', nome: 'Estojo com canetas', categoria: 'material',
        descricao: 'Estojo de tecido azul com canetas, lápis e borracha.',
        local: 'Sala 105 (1º andar)', achadoEm: daysAgo(140, 9), entrada: daysAgo(140, 10),
        status: 'destinado', cadastradoPor: { nome: 'Maria Souza', matricula: 'SIAPE 1234567' },
        destinacao: { tipo: 'doacao', destinatario: 'Centro Espírita (doação)', justificativa: 'Material em bom estado, prazo vencido sem procura.', em: daysAgo(40, 15), gestor: 'Maria Souza' },
        log: [
          log('Item cadastrado', null, 'Disponível', 'Maria Souza', 140, 10),
          log('Prazo vencido', 'Disponível', 'Abandonado', 'Sistema', 50, 0),
          log('Destinação: doação', 'Abandonado', 'Destinado', 'Maria Souza', 40, 15)
        ]
      }
    ];
  };
})(window.LP);
