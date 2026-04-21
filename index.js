require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// agora vem do .env
const TOKEN = process.env.TOKEN;

const TICKET_PANEL_CHANNEL_ID = '1495959627588702428';

const STAFF_ROLE_IDS = [
  '1495979034797019277',
  '1495979254389801021',
  '1495979617952075846',
  '1495953606728355902',
  '1495953858265088114'
];

const CLAIM_ROLE_IDS = STAFF_ROLE_IDS;

const IMAGE_URL = 'https://media.discordapp.net/attachments/1495992823974199417/1496163260691517623/file_00000000ce7071f582b00c5a69c5cd85.png?format=webp&quality=lossless&width=1353&height=902';

const TICKET_MENU_ID = 'ticket_select';
const TICKET_CLOSE_ID = 'ticket_close';
const TICKET_CLAIM_ID = 'ticket_claim';

const ticketTypes = {
  suporte: {
    label: 'Suporte',
    emoji: '🛠️',
    color: 0x5865F2,
    description: 'Dúvidas, ajuda geral e suporte técnico.'
  },
  denuncia: {
    label: 'Denúncia',
    emoji: '🚨',
    color: 0xE74C3C,
    description: 'Denunciar jogador, membro ou situação.'
  },
  shop: {
    label: 'Shop',
    emoji: '🛒',
    color: 0x2B2D31,
    description: 'Compra de itens, VIP e pacotes.'
  },
  outro: {
    label: 'Outro',
    emoji: '💬',
    color: 0xF1C40F,
    description: 'Assuntos variados.'
  }
};

function makeSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function sendTicketPanel() {
  const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: '⚡ Byte Support' })
    .setTitle('🎫 Central de Tickets')
    .setDescription(
      'Selecione uma opção abaixo para abrir seu ticket.\n\n' +
      '🧩 Escolha o tipo certo para agilizar o atendimento.\n' +
      '🔒 O canal será privado para você e a staff.'
    )
    .setImage(IMAGE_URL)
    .setFooter({ text: '✨ Byte System • by: zkak', iconURL: IMAGE_URL })
    .setTimestamp();

  const menu = new StringSelectMenuBuilder()
    .setCustomId(TICKET_MENU_ID)
    .setPlaceholder('Selecione o tipo de ticket')
    .addOptions(
      { label: 'Suporte', description: 'Ajuda geral e dúvidas', value: 'suporte', emoji: '🛠️' },
      { label: 'Denúncia', description: 'Reportar algo ou alguém', value: 'denuncia', emoji: '🚨' },
      { label: 'Shop', description: 'Compra de itens e pacotes', value: 'shop', emoji: '🛒' },
      { label: 'Outro', description: 'Assuntos variados', value: 'outro', emoji: '💬' }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await channel.send({
    embeds: [embed],
    components: [row]
  });
}

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);
  await sendTicketPanel();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

  // resto do código continua igual...
});

client.login(TOKEN);