/*const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Tudo certo! WhatsApp conectado.");
});

client.on("disconnected", (reason) => {
  console.log("⚠️ Desconectado:", reason);
});

client.initialize();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

client.on("message", async (msg) => {
  try {

    if (!msg.from || msg.from.endsWith("@g.us")) return;

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body ? msg.body.trim().toLowerCase() : "";

    const typing = async () => {
      await delay(2000);
      await chat.sendStateTyping();
      await delay(2000);
    };

    if (/^(menu|oi|olá|ola|bom dia|boa tarde|boa noite)$/i.test(texto)) {

      await typing();

      const hora = new Date().getHours();
      let saudacao = "Olá";

      if (hora >= 5 && hora < 12) saudacao = "Bom dia";
      else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
      else saudacao = "Boa noite";

      await client.sendMessage(
        msg.from,
        `${saudacao}! 👋\n\n` +
        `Essa mensagem foi enviada automaticamente pelo robô 🤖\n\n` +
        `Na versão PRO você vai além: desbloqueie tudo!.\n\n` +
        '✍️ Envio de textos\n' +
            '🎙️ Áudios\n' +
            '🖼️ Imagens\n' +
            '🎥 Vídeos\n' +
            '📂 Arquivos\n\n' +
            '💡 Simulação de "digitando..." e "gravando áudio"\n' +
            '🚀 Envio de mensagens em massa\n' +
            '📇 Captura automática de contatos\n' +
            '💻 Aprenda como deixar o robô funcionando 24 hrs, com o PC desligado\n' +
            '✅ E 3 Bônus exclusivos\n\n' +
            '🔥 Adquira a versão PRO agora: https://pay.kiwify.com.br/FkTOhRZ?src=pro');
      
    }


  } catch (error) {
    console.error("❌ Erro no processamento da mensagem:", error);
  }
});*/

// =====================================
// IMPORTAÇÕES
// =====================================
const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");

// =====================================
// CONFIGURAÇÃO DO CLIENTE
// =====================================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  },
});

// =====================================
// SISTEMA DE SESSÕES DE USUÁRIO
// =====================================
const userSessions = new Map();

class UserSession {
  constructor(userId) {
    this.userId = userId;
    this.currentStep = 'inicio';
    this.context = {};
    this.messageCount = 0;
    this.lastInteraction = new Date();
    this.awaitingInput = false;
    this.inputType = null;
    this.selectedSecretary = null;
  }

  updateLastInteraction() {
    this.lastInteraction = new Date();
    this.messageCount++;
  }

  setStep(step, context = {}) {
    this.currentStep = step;
    this.context = { ...this.context, ...context };
  }

  waitForInput(inputType) {
    this.awaitingInput = true;
    this.inputType = inputType;
  }

  clearInput() {
    this.awaitingInput = false;
    this.inputType = null;
  }
}

// =====================================
// ÁRVORE DE DECISÕES BIALI
// =====================================
class BialiDecisionTree {
  constructor() {
    this.keywords = {
      saudacao: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'menu', 'inicio'],
      consulta: ['consulta', 'consultar', 'agendamento', 'agendar', 'marcar', 'secretaria', 'secretária'],
      conhecer_biali: ['sobre', 'empresa', 'biali', 'conhecer', 'quem', 'informações', 'informacoes'],
      precos: ['preço', 'preco', 'preços', 'precos', 'valor', 'valores', 'custo', 'custos', 'tabela'],
      contato: ['contato', 'falar', 'telefone', 'email', 'whatsapp', 'localização', 'localizacao'],
      voltar: ['voltar', 'menu', 'inicio', 'principal'],
      despedida: ['tchau', 'obrigado', 'obrigada', 'valeu', 'até logo', 'ate logo', 'bye']
    };

    this.responses = {
      boas_vindas: `🏢 *Olá! Seja bem-vindo(a) à Biali.*

Escolha uma das opções abaixo para prosseguir:

1️⃣ *Consulta*
2️⃣ *Conhecer a Biali*  
3️⃣ *Consulta de Preços*
4️⃣ *Fale conosco*

Digite o *número* da opção desejada!`,

      // =====================================
      // OPÇÃO 1: CONSULTA
      // =====================================
      consulta_menu: `👩‍⚕️ *Consulta*

Você escolheu 'Consulta'. Para qual secretária você gostaria de ser direcionado?

1️⃣ *Secretária 1* - Dra. Ana Silva
2️⃣ *Secretária 2* - Dra. Maria Santos  
3️⃣ *Secretária 3* - Dra. Julia Costa
4️⃣ *Secretária 4* - Dra. Carla Oliveira
5️⃣ *Secretária 5* - Dra. Beatriz Lima

Digite o *número* da secretária ou *0* para voltar ao menu principal.`,

      // =====================================
      // OPÇÃO 2: CONHECER A BIALI
      // =====================================
      conhecer_biali_menu: `🏢 *Conhecer a Biali*

Você escolheu 'Conhecer a Biali'. O que você gostaria de saber sobre nós?

1️⃣ *Sobre*
2️⃣ *Profissionais Associados*
3️⃣ *Localização*

Digite o *número* da opção ou *0* para voltar ao menu principal.`,

      sobre_biali: `ℹ️ *Sobre a Biali*

A Biali é uma empresa líder em soluções e consultoria, dedicada a proporcionar inovação e resultados excepcionais aos nossos clientes em diversas áreas de atuação.

🎯 *Nossa Missão:*
Oferecer serviços de excelência com foco na satisfação do cliente.

🌟 *Nossa Visão:*
Ser referência no mercado através da qualidade e inovação.

💎 *Nossos Valores:*
• Excelência
• Inovação  
• Transparência
• Compromisso

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      profissionais: `👨‍⚕️ *Profissionais Associados*

Nossa equipe é composta por especialistas altamente qualificados e experientes em suas respectivas áreas, garantindo excelência e conhecimento aprofundado em cada projeto.

🏆 *Nossos Especialistas:*

👩‍⚕️ *Dra. Ana Silva*
• Especialidade: Clínica Geral
• Experiência: 15 anos
• CRM: 12345-SP

👩‍⚕️ *Dra. Maria Santos*  
• Especialidade: Pediatria
• Experiência: 12 anos
• CRM: 23456-SP

👩‍⚕️ *Dra. Julia Costa*
• Especialidade: Ginecologia
• Experiência: 18 anos
• CRM: 34567-SP

👩‍⚕️ *Dra. Carla Oliveira*
• Especialidade: Dermatologia
• Experiência: 10 anos
• CRM: 45678-SP

👩‍⚕️ *Dra. Beatriz Lima*
• Especialidade: Cardiologia
• Experiência: 20 anos
• CRM: 56789-SP

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      localizacao: `📍 *Nossas Localizações*

Estamos localizados estrategicamente em grandes centros urbanos para melhor atender você.

🏢 *Sede Principal:*
📍 Av. Paulista, 1000 - Bela Vista
São Paulo/SP - CEP: 01310-100
📞 (11) 3000-0000

🏢 *Filial Zona Sul:*
📍 Rua Augusta, 500 - Jardins  
São Paulo/SP - CEP: 01305-000
📞 (11) 3000-0001

🏢 *Filial ABC:*
📍 Av. Industrial, 200 - Santo André
Santo André/SP - CEP: 09080-500
📞 (11) 3000-0002

🕒 *Horário de Funcionamento:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      // =====================================
      // OPÇÃO 3: CONSULTA DE PREÇOS
      // =====================================
      precos_menu: `💰 *Consulta de Preços*

Você escolheu 'Consulta de Preços'. Qual informação específica você busca?

1️⃣ *Salas Disponíveis*
2️⃣ *Localizações*  
3️⃣ *Fale com um representante*

Digite o *número* da opção ou *0* para voltar ao menu principal.`,

      salas_disponiveis: `🏠 *Salas Disponíveis*

Oferecemos uma variedade de salas de reunião e escritórios privativos para locação, com opções flexíveis de período.

💼 *Tipos de Salas:*

🏢 *Sala Executiva*
• Capacidade: 2-4 pessoas
• Equipamentos: Mesa, cadeiras, TV
• Valor: R$ 50/hora

🏢 *Sala de Reunião*
• Capacidade: 6-10 pessoas  
• Equipamentos: Mesa, cadeiras, projetor
• Valor: R$ 80/hora

🏢 *Auditório*
• Capacidade: 20-50 pessoas
• Equipamentos: Palco, som, projeção
• Valor: R$ 200/hora

📋 *Pacotes Mensais Disponíveis*

Para informações detalhadas sobre modelos e preços, entre em contato diretamente conosco.

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      localizacoes_precos: `📍 *Localizações para Consulta de Preços*

Os preços podem variar de acordo com a localização e os serviços específicos contratados.

💰 *Tabela de Preços por Localização:*

🏢 *Sede Paulista:*
• Sala Executiva: R$ 60/hora
• Sala Reunião: R$ 90/hora  
• Auditório: R$ 250/hora

🏢 *Filial Jardins:*
• Sala Executiva: R$ 55/hora
• Sala Reunião: R$ 85/hora
• Auditório: R$ 220/hora

🏢 *Filial ABC:*
• Sala Executiva: R$ 45/hora
• Sala Reunião: R$ 70/hora
• Auditório: R$ 180/hora

📊 *Descontos Disponíveis:*
• Pacote mensal: 15% desconto
• Pacote trimestral: 25% desconto
• Clientes corporativos: até 30% desconto

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      representante: `👨‍💼 *Falar com Representante*

Para uma consulta personalizada e orçamentos detalhados, um de nossos representantes especializados entrará em contato com você.

📝 *Para prosseguir, nos informe:*
• Seu nome completo
• Telefone de contato  
• E-mail
• Tipo de serviço desejado

📞 *Ou entre em contato diretamente:*
• WhatsApp: (11) 99999-9999
• E-mail: vendas@biali.com.br
• Telefone: (11) 3000-0000

⏰ *Tempo de retorno:*
Nosso representante entrará em contato em até 2 horas úteis.

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      // =====================================
      // OPÇÃO 4: FALE CONOSCO
      // =====================================
      fale_conosco_menu: `📞 *Fale Conosco*

Você escolheu 'Fale conosco'. Como você gostaria de nos contatar?

1️⃣ *Email*
2️⃣ *Site*
3️⃣ *Número*

Digite o *número* da opção ou *0* para voltar ao menu principal.`,

      email_contato: `📧 *Contato por Email*

Você pode nos enviar um email para:

📮 *E-mails Principais:*
• Geral: contato@biali.com.br
• Vendas: vendas@biali.com.br  
• Suporte: suporte@biali.com.br
• RH: rh@biali.com.br

⏰ *Tempo de Resposta:*
Responderemos o mais rápido possível, geralmente em até 24 horas úteis.

📝 *Dica:* Inclua sempre seu nome, telefone e descreva detalhadamente sua necessidade para um atendimento mais eficiente.

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      site_contato: `�� *Site Oficial*

Visite nosso site oficial para mais informações, formulários de contato e novidades:

🔗 *Site Principal:*
www.biali.com.br

📋 *No site você encontra:*
• Formulário de contato online
• Catálogo completo de serviços
• Portfólio de projetos
• Blog com novidades
• Área do cliente
• Downloads de materiais

💡 *Formulário Online:*
Preencha nosso formulário no site para um atendimento direcionado e personalizado.

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      numero_contato: `�� *Contato Telefônico*

Para contato telefônico, utilize nossos números:

📞 *Telefones Principais:*

🏢 *Sede Paulista:*
• Principal: (11) 3000-0000
• WhatsApp: (11) 99999-9999
• Vendas: (11) 3000-0001

🏢 *Filial Jardins:*
• Principal: (11) 3000-0010
• WhatsApp: (11) 99999-9998

🏢 *Filial ABC:*
• Principal: (11) 3000-0020  
• WhatsApp: (11) 99999-9997

🕒 *Horário de Atendimento:*
• Segunda a Sexta: 8h às 18h
• Sábado: 8h às 12h
• Domingo: Fechado

📞 *Emergências:* (11) 99999-0000 (24h)

Digite *0* para voltar ao menu anterior ou *menu* para o menu principal.`,

      // =====================================
      // MENSAGENS DE ENCAMINHAMENTO
      // =====================================
      encaminhar_secretaria_1: `👩‍⚕️ *Encaminhando para Secretária 1*

Você será direcionado para a *Dra. Ana Silva* (Clínica Geral).

⏳ Aguarde um momento, por favor...

📞 *Contato Direto:*
• WhatsApp: (11) 99999-1001
• Ramal: 1001

A secretária entrará em contato em breve para agendar sua consulta.

*Horário de atendimento da Dra. Ana:*
Segunda, Quarta e Sexta: 8h às 17h

Digite *menu* para voltar ao menu principal.`,

      encaminhar_secretaria_2: `👩‍⚕️ *Encaminhando para Secretária 2*

Você será direcionado para a *Dra. Maria Santos* (Pediatria).

⏳ Aguarde um momento, por favor...

📞 *Contato Direto:*
• WhatsApp: (11) 99999-1002
• Ramal: 1002

A secretária entrará em contato em breve para agendar sua consulta.

*Horário de atendimento da Dra. Maria:*
Terça e Quinta: 8h às 17h
Sábado: 8h às 12h

Digite *menu* para voltar ao menu principal.`,

      encaminhar_secretaria_3: `👩‍⚕️ *Encaminhando para Secretária 3*

Você será direcionado para a *Dra. Julia Costa* (Ginecologia).

⏳ Aguarde um momento, por favor...

📞 *Contato Direto:*
• WhatsApp: (11) 99999-1003
• Ramal: 1003

A secretária entrará em contato em breve para agendar sua consulta.

*Horário de atendimento da Dra. Julia:*
Segunda a Sexta: 9h às 16h

Digite *menu* para voltar ao menu principal.`,

      encaminhar_secretaria_4: `👩‍⚕️ *Encaminhando para Secretária 4*

Você será direcionado para a *Dra. Carla Oliveira* (Dermatologia).

⏳ Aguarde um momento, por favor...

�� *Contato Direto:*
• WhatsApp: (11) 99999-1004
• Ramal: 1004

A secretária entrará em contato em breve para agendar sua consulta.

*Horário de atendimento da Dra. Carla:*
Segunda, Quarta e Sexta: 13h às 18h

Digite *menu* para voltar ao menu principal.`,

      encaminhar_secretaria_5: `👩‍⚕️ *Encaminhando para Secretária 5*

Você será direcionado para a *Dra. Beatriz Lima* (Cardiologia).

⏳ Aguarde um momento, por favor...

�� *Contato Direto:*
• WhatsApp: (11) 99999-1005
• Ramal: 1005

A secretária entrará em contato em breve para agendar sua consulta.

*Horário de atendimento da Dra. Beatriz:*
Terça e Quinta: 8h às 17h
Sexta: 8h às 12h

Digite *menu* para voltar ao menu principal.`,

      // =====================================
      // MENSAGENS AUXILIARES
      // =====================================
      nao_entendi: `🤔 Desculpe, não entendi sua mensagem.

Digite:
• *menu* - Para ver o menu principal
• *0* - Para voltar ao menu anterior
• Ou escolha uma das opções numéricas disponíveis

Como posso ajudá-lo?`,

      despedida: `👋 *Obrigado pelo contato!*

Foi um prazer atendê-lo pela Biali.

Se precisar de mais alguma coisa, estarei aqui!

🏢 *Biali - Excelência em Atendimento*

Tenha um ótimo dia! 😊`
    };
  }

  // =====================================
  // CLASSIFICAÇÃO DE INTENÇÃO
  // =====================================
  classifyIntent(message) {
    const text = message.toLowerCase().trim();
    
    // Verificar comandos diretos (números)
    if (/^[0-5]$/.test(text)) {
      return { intent: 'menu_option', value: text };
    }

    // Verificar palavras-chave
    for (const [intent, keywords] of Object.entries(this.keywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return { intent, confidence: 0.8 };
      }
    }

    return { intent: 'unknown', confidence: 0.1 };
  }

  // =====================================
  // PROCESSAMENTO DA ÁRVORE DE DECISÕES
  // =====================================
  processMessage(message, session) {
    const classification = this.classifyIntent(message);
    
    // Processar baseado na intenção e contexto atual
    switch (classification.intent) {
      case 'saudacao':
        return this.handleGreeting(session);
      
      case 'menu_option':
        return this.handleMenuOption(classification.value, session);
      
      case 'voltar':
        return this.handleBack(session);
      
      case 'despedida':
        session.setStep('finalizado');
        return this.responses.despedida;
      
      default:
        return this.handleContextualInput(message, session, classification);
    }
  }

  // =====================================
  // HANDLERS ESPECÍFICOS
  // =====================================
  handleGreeting(session) {
    session.setStep('menu_principal');
    
    const hora = new Date().getHours();
    let saudacao = "Olá";
    
    if (hora >= 5 && hora < 12) saudacao = "Bom dia";
    else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
    else saudacao = "Boa noite";

    return `${saudacao}! 👋\n\n${this.responses.boas_vindas}`;
  }

  handleMenuOption(option, session) {
    switch (session.currentStep) {
      case 'menu_principal':
        return this.handleMainMenuOption(option, session);
      
      case 'consulta':
        return this.handleConsultaOption(option, session);
      
      case 'conhecer_biali':
        return this.handleConhecerBialiOption(option, session);
      
      case 'precos':
        return this.handlePrecosOption(option, session);
      
      case 'fale_conosco':
        return this.handleFaleConoscoOption(option, session);
      
      default:
        return this.handleMainMenuOption(option, session);
    }
  }

  handleMainMenuOption(option, session) {
    switch (option) {
      case '0':
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
      
      case '1':
        session.setStep('consulta');
        return this.responses.consulta_menu;
      
      case '2':
        session.setStep('conhecer_biali');
        return this.responses.conhecer_biali_menu;
      
      case '3':
        session.setStep('precos');
        return this.responses.precos_menu;
      
      case '4':
        session.setStep('fale_conosco');
        return this.responses.fale_conosco_menu;
      
      default:
        return this.responses.nao_entendi;
    }
  }

  handleConsultaOption(option, session) {
    switch (option) {
      case '0':
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
      
      case '1':
        session.selectedSecretary = 1;
        return this.responses.encaminhar_secretaria_1;
      
      case '2':
        session.selectedSecretary = 2;
        return this.responses.encaminhar_secretaria_2;
      
      case '3':
        session.selectedSecretary = 3;
        return this.responses.encaminhar_secretaria_3;
      
      case '4':
        session.selectedSecretary = 4;
        return this.responses.encaminhar_secretaria_4;
      
      case '5':
        session.selectedSecretary = 5;
        return this.responses.encaminhar_secretaria_5;
      
      default:
        return this.responses.nao_entendi;
    }
  }

  handleConhecerBialiOption(option, session) {
    switch (option) {
      case '0':
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
      
      case '1':
        return this.responses.sobre_biali;
      
      case '2':
        return this.responses.profissionais;
      
      case '3':
        return this.responses.localizacao;
      
      default:
        return this.responses.nao_entendi;
    }
  }

  handlePrecosOption(option, session) {
    switch (option) {
      case '0':
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
      
      case '1':
        return this.responses.salas_disponiveis;
      
      case '2':
        return this.responses.localizacoes_precos;
      
      case '3':
        return this.responses.representante;
      
      default:
        return this.responses.nao_entendi;
    }
  }

  handleFaleConoscoOption(option, session) {
    switch (option) {
      case '0':
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
      
      case '1':
        return this.responses.email_contato;
      
      case '2':
        return this.responses.site_contato;
      
      case '3':
        return this.responses.numero_contato;
      
      default:
        return this.responses.nao_entendi;
    }
  }

  handleBack(session) {
    // Lógica para voltar ao menu anterior
    switch (session.currentStep) {
      case 'consulta':
      case 'conhecer_biali':
      case 'precos':
      case 'fale_conosco':
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
      
      default:
        session.setStep('menu_principal');
        return this.responses.boas_vindas;
    }
  }

  handleContextualInput(message, session, classification) {
    const text = message.toLowerCase().trim();
    
    // Verificar se é comando "menu"
    if (text === 'menu') {
      session.setStep('menu_principal');
      return this.responses.boas_vindas;
    }

    // Verificar intenções específicas
    if (classification.intent === 'consulta') {
      session.setStep('consulta');
      return this.responses.consulta_menu;
    }

    if (classification.intent === 'conhecer_biali') {
      session.setStep('conhecer_biali');
      return this.responses.conhecer_biali_menu;
    }

    if (classification.intent === 'precos') {
      session.setStep('precos');
      return this.responses.precos_menu;
    }

    if (classification.intent === 'contato') {
      session.setStep('fale_conosco');
      return this.responses.fale_conosco_menu;
    }

    return this.responses.nao_entendi;
  }
}

// =====================================
// INSTÂNCIA DA ÁRVORE DE DECISÕES BIALI
// =====================================
const bialiTree = new BialiDecisionTree();

// =====================================
// QR CODE
// =====================================
client.on("qr", (qr) => {
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

// =====================================
// WHATSAPP CONECTADO
// =====================================
client.on("ready", () => {
  console.log("✅ Tudo certo! WhatsApp conectado.");
  console.log("🏢 Sistema Biali ativado!");
});

// =====================================
// DESCONEXÃO
// =====================================
client.on("disconnected", (reason) => {
  console.log("⚠️ Desconectado:", reason);
});

// =====================================
// INICIALIZA
// =====================================
client.initialize();

// =====================================
// FUNÇÃO DE DELAY
// =====================================
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// =====================================
// PROCESSADOR PRINCIPAL - BIALI
// =====================================
client.on("message", async (msg) => {
  try {
    // ❌ IGNORA QUALQUER COISA QUE NÃO SEJA CONVERSA PRIVADA
    if (!msg.from || msg.from.endsWith("@g.us")) return;

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body ? msg.body.trim() : "";
    if (!texto) return;

    // =====================================
    // GERENCIAMENTO DE SESSÃO
    // =====================================
    let session = userSessions.get(msg.from);
    if (!session) {
      session = new UserSession(msg.from);
      userSessions.set(msg.from, session);
    }
    session.updateLastInteraction();

    // =====================================
    // SIMULAÇÃO DE DIGITAÇÃO
    // =====================================
    const typing = async () => {
      await delay(1000);
      await chat.sendStateTyping();
      await delay(2000);
    };

    await typing();

    // =====================================
    // PROCESSAMENTO VIA ÁRVORE BIALI
    // =====================================
    const response = bialiTree.processMessage(texto, session);

    // =====================================
    // ENVIO DA RESPOSTA
    // =====================================
    await client.sendMessage(msg.from, response);

    // =====================================
    // LOG DA INTERAÇÃO
    // =====================================
    console.log(`📱 ${msg.from}: ${texto.substring(0, 30)}...`);
    console.log(`🏢 Biali: ${response.substring(0, 50)}...`);
    console.log(`📊 Sessão: ${session.currentStep} | Msgs: ${session.messageCount}`);
    console.log("─".repeat(60));

  } catch (error) {
    console.error("❌ Erro no processamento da mensagem:", error);
    
    try {
      await client.sendMessage(msg.from, 
        "🚨 Ocorreu um erro temporário. Digite *menu* para continuar ou tente novamente."
      );
    } catch (sendError) {
      console.error("❌ Erro ao enviar mensagem de erro:", sendError);
    }
  }
});

// =====================================
// LIMPEZA DE SESSÕES ANTIGAS
// =====================================
setInterval(() => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  for (const [userId, session] of userSessions.entries()) {
    if (session.lastInteraction < twoHoursAgo) {
      userSessions.delete(userId);
      console.log(`🧹 Sessão Biali limpa: ${userId}`);
    }
  }
}, 60 * 60 * 1000); // A cada 1 hora

console.log("🚀 Bot Biali iniciado!");
console.log("🏢 Funcionalidades ativas:");
console.log("   ✅ Menu principal Biali");
console.log("   ✅ Sistema de consultas");
console.log("   ✅ Informações da empresa");
console.log("   ✅ Consulta de preços");
console.log("   ✅ Canais de contato");
console.log("   ✅ Encaminhamento para secretárias");
console.log("   ✅ Gerenciamento de sessões");