require('dotenv').config();
const http = require('http'); // Necessário para o Render não dar erro de porta

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

// --- SERVIDOR PARA O RENDER ---
// Isso mantém o bot online no plano gratuito do Render
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("Bot Byte System Online!");
  res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

// IDs de Configuração
const TICKET_PANEL_CHANNEL_ID = '1495959627588702428';
const STAFF_ROLE_IDS = [
  '1495979034797019277',
  '1495979254389801021',
  '1495979617952075846',
  '1495953606728355902',
  '1495953858265088114'
];

const IMAGE_URL = 'https://media.discordapp.net/attachments/1495992823974199417/1496163260691517623/file_00000000ce7071f582b00c5a69c5cd85.png?format=webp&quality=lossless&width=1353&height=902';

const TICKET_MENU_ID = 'ticket_select';
const TICKET_CLOSE_ID = 'ticket_close';
const TICKET_CLAIM_ID = 'ticket_claim';

const ticketTypes = {
  suporte: { label: 'Suporte', emoji: '🛠️', color: 0x5865F2, description: 'Dúvidas e ajuda geral.' },
  denuncia: { label: 'Denúncia', emoji: '🚨', color: 0xE74C3C, description: 'Denunciar algo.' },
  shop: { label: 'Shop', emoji: '🛒', color: 0x2B2D31, description: 'Compras e VIP.' },
  outro: { label: 'Outro', emoji: '💬', color: 0xF1C40F, description: 'Assuntos variados.' }
};

// --- FUNÇÃO DO PAINEL ---
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
      Object.entries(ticketTypes).map(([value, data]) => ({
        label: data.label,
        description: data.description,
        value: value,
        emoji: data.emoji
      }))
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await channel.send({ embeds: [embed], components: [row] });
}

client.once('ready', async () => {
  console.log(`✅ Logado como ${client.user.tag}`);
  await sendTicketPanel();
});

// --- LÓGICA DE INTERAÇÃO ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === TICKET_MENU_ID) {
    const selected = interaction.values[0];
    const type = ticketTypes[selected];

    await interaction.deferReply({ ephemeral: true });

    // Criar o canal do ticket
    const channel = await interaction.guild.channels.create({
      name: `${type.emoji}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ...STAFF_ROLE_IDS.map(id => ({ id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
      ]
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor(type.color)
      .setTitle(`${type.emoji} Ticket de ${type.label}`)
      .setDescription(`Olá ${interaction.user}, aguarde um membro da equipe.\nDescreva seu problema abaixo para agilizar o processo.`)
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(TICKET_CLOSE_ID).setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
      new ButtonBuilder().setCustomId(TICKET_CLAIM_ID).setLabel('Assumir Ticket').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️')
    );

    await channel.send({ content: `${interaction.user} | <@&${STAFF_ROLE_IDS[0]}>`, embeds: [ticketEmbed], components: [buttons] });
    await interaction.editReply({ content: `✅ Seu ticket foi criado: ${channel}` });
  }

  if (interaction.isButton()) {
    if (interaction.customId === TICKET_CLOSE_ID) {
      await interaction.reply('🔒 Este canal será deletado em 5 segundos...');
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === TICKET_CLAIM_ID) {
      const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
      if (!isStaff) return interaction.reply({ content: '❌ Apenas a equipe pode assumir tickets.', ephemeral: true });

      const claimedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFooter({ text: `Ticket assumido por: ${interaction.user.tag}` });

      const disabledButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(TICKET_CLOSE_ID).setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
        new ButtonBuilder().setCustomId(TICKET_CLAIM_ID).setLabel('Assumido').setStyle(ButtonStyle.Secondary).setDisabled(true)
      );

      await interaction.update({ embeds: [claimedEmbed], components: [disabledButtons] });
      await interaction.followUp({ content: `🙋‍♂️ ${interaction.user} assumiu o atendimento!` });
    }
  }
});

client.login(TOKEN);