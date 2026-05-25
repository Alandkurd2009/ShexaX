const { Client, GatewayIntentBits, Events, EmbedBuilder, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const levels = new Collection();

function addXP(userId, xpAmount = 10) {
    if (!levels.has(userId)) levels.set(userId, { xp: 0, level: 0 });
    const user = levels.get(userId);
    user.xp += xpAmount;
    const xpNeeded = (user.level + 1) * 100;
    if (user.xp >= xpNeeded) {
        user.level++;
        user.xp = 0;
        return { leveledUp: true, newLevel: user.level };
    }
    return { leveledUp: false, newLevel: user.level };
}

function hasAdminOrOwnerRole(member) {
    return member.roles.cache.some(role => role.name === 'Admin' || role.name === 'Owner');
}

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ ${c.user.tag} is online!`);
    const voiceChannelId = '1507857397136228404';
    const channel = client.channels.cache.get(voiceChannelId);
    if (channel && channel.isVoiceBased()) await channel.join();
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'chating');
    if (channel && hasAdminOrOwnerRole(member)) {
        channel.send(`🔥 Welcome to ShexaX, ${member.user}!`);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('-av')) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention a user: `-av @user`');
        const embed = new EmbedBuilder()
            .setTitle(`🖼 ${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setColor('Blue');
        message.channel.send({ embeds: [embed] });
        return;
    }
    
    const isAdminOrOwner = hasAdminOrOwnerRole(message.member);
    if (!isAdminOrOwner) return;
    
    if (message.content.startsWith('!kick')) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Please mention a user: `!kick @user`');
        if (!user.kickable) return message.reply('I cannot kick this user');
        await user.kick();
        message.reply(`✅ ${user.user.username} has been kicked.`);
    }
    
    if (message.content.startsWith('!timeout')) {
        const args = message.content.split(' ');
        const user = message.mentions.members.first();
        const time = args[2];
        if (!user || !time) return message.reply('Usage: `!timeout @user 10m`');
        let ms = 0;
        if (time.endsWith('m')) ms = parseInt(time) * 60 * 1000;
        else if (time.endsWith('h')) ms = parseInt(time) * 60 * 60 * 1000;
        else if (time.endsWith('d')) ms = parseInt(time) * 24 * 60 * 60 * 1000;
        else return message.reply('Invalid time');
        await user.timeout(ms);
        message.reply(`✅ ${user.user.username} timed out for ${time}.`);
    }
    
    if (message.content.startsWith('!addrole')) {
        const args = message.content.split(' ');
        const user = message.mentions.members.first();
        const roleName = args.slice(2).join(' ');
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (!user || !role) return message.reply('Usage: `!addrole @user RoleName`');
        await user.roles.add(role);
        message.reply(`✅ Added role ${role.name} to ${user.user.username}`);
    }
    
    if (message.content.startsWith('!removerole')) {
        const args = message.content.split(' ');
        const user = message.mentions.members.first();
        const roleName = args.slice(2).join(' ');
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (!user || !role) return message.reply('Usage: `!removerole @user RoleName`');
        await user.roles.remove(role);
        message.reply(`✅ Removed role ${role.name} from ${user.user.username}`);
    }
    
    if (message.content === '!leaderboard') {
        const sorted = [...levels.entries()].sort((a, b) => b[1].level - a[1].level).slice(0, 10);
        let desc = '';
        for (let i = 0; i < sorted.length; i++) {
            const user = await client.users.fetch(sorted[i][0]);
            desc += `${i+1}. ${user.username} - Level ${sorted[i][1].level}\n`;
        }
        const embed = new EmbedBuilder()
            .setTitle('🏆 Leaderboard')
            .setDescription(desc || 'No levels yet')
            .setColor('Gold');
        message.channel.send({ embeds: [embed] });
    }
    
    const result = addXP(message.author.id, Math.floor(Math.random() * 15) + 5);
    if (result.leveledUp) {
        const embed = new EmbedBuilder()
            .setTitle('🎉 Level Up! 🎉')
            .setDescription(`${message.author} reached Level ${result.newLevel}!`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor('Gold');
        message.channel.send({ embeds: [embed] });
    }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const targetChannelId = '1507857397136228404';
    const bot = newState.guild.members.me;
    if (!bot.voice.channelId || bot.voice.channelId !== targetChannelId) {
        const channel = newState.guild.channels.cache.get(targetChannelId);
        if (channel && channel.isVoiceBased()) channel.join();
    }
});

client.login(process.env.DISCORD_TOKEN);
