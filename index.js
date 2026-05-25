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
    if (!member || !member.roles) return false;
    return member.roles.cache.some(role => role.name === 'Admin' || role.name === 'Owner');
}

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ ${c.user.tag} is online!`);
    const voiceChannelId = '1507857397136228404';
    const channel = client.channels.cache.get(voiceChannelId);
    if (channel && channel.isVoiceBased()) {
        await channel.join();
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    let channel = member.guild.channels.cache.find(ch => ch.name === 'chating');
    if (!channel) channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
    if (channel && hasAdminOrOwnerRole(member)) {
        channel.send(`🔥 Welcome to ShexaX, ${member.user}!`);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('av ') || message.content.startsWith('-av')) {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setTitle(`🖼 ${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setColor('Blue');
        await message.channel.send({ embeds: [embed] });
        return;
    }
    
    if (message.content === 'ping') {
        await message.reply(`🏓 Pong! Latency: ${Date.now() - message.createdTimestamp}ms`);
        return;
    }
    
    const isAdminOrOwner = hasAdminOrOwnerRole(message.member);
    if (!isAdminOrOwner) return;
    
    if (message.content.startsWith('kick ')) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Usage: `kick @user`');
        if (!user.kickable) return message.reply('I cannot kick this user');
        await user.kick();
        await message.reply(`✅ ${user.user.username} has been kicked.`);
    }
    
    if (message.content.startsWith('ban ')) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Usage: `ban @user`');
        if (!user.bannable) return message.reply('I cannot ban this user');
        await user.ban();
        await message.reply(`✅ ${user.user.username} has been banned.`);
    }
    
    if (message.content.startsWith('m ')) {
        const args = message.content.split(' ');
        const user = message.mentions.members.first();
        const time = args[2];
        if (!user || !time) return message.reply('Usage: `m @user 10m` (m/h/d)');
        let ms = 0;
        if (time.endsWith('m')) ms = parseInt(time) * 60 * 1000;
        else if (time.endsWith('h')) ms = parseInt(time) * 60 * 60 * 1000;
        else if (time.endsWith('d')) ms = parseInt(time) * 24 * 60 * 60 * 1000;
        else return message.reply('Invalid time format. Use: 10m, 1h, 2d');
        await user.timeout(ms);
        await message.reply(`✅ ${user.user.username} timed out for ${time}.`);
    }
    
    if (message.content.startsWith('um ')) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Usage: `um @user`');
        await user.timeout(null);
        await message.reply(`✅ ${user.user.username} timeout removed.`);
    }
    
    if (message.content.startsWith('c ')) {
        const amount = parseInt(message.content.split(' ')[1]);
        if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('Usage: `c 1-100`');
        await message.channel.bulkDelete(amount, true);
        const msg = await message.reply(`✅ Deleted ${amount} messages.`);
        setTimeout(() => msg.delete(), 3000);
    }
    
    if (message.content === 'lock') {
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
        await message.reply('🔒 Channel locked.');
    }
    
    if (message.content === 'ul') {
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
        await message.reply('🔓 Channel unlocked.');
    }
    
    if (message.content.startsWith('slowmode ')) {
        const seconds = parseInt(message.content.split(' ')[1]);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) return message.reply('Usage: `slowmode 5` (0-21600 seconds)');
        await message.channel.setRateLimitPerUser(seconds);
        await message.reply(`✅ Slowmode set to ${seconds} seconds.`);
    }
    
    if (message.content.startsWith('+role ')) {
        const args = message.content.split(' ');
        const user = message.mentions.members.first();
        const roleName = args.slice(2).join(' ');
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (!user || !role) return message.reply('Usage: `+role @user RoleName`');
        await user.roles.add(role);
        await message.reply(`✅ Added role ${role.name} to ${user.user.username}`);
    }
    
    if (message.content.startsWith('-role ')) {
        const args = message.content.split(' ');
        const user = message.mentions.members.first();
        const roleName = args.slice(2).join(' ');
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (!user || !role) return message.reply('Usage: `-role @user RoleName`');
        await user.roles.remove(role);
        await message.reply(`✅ Removed role ${role.name} from ${user.user.username}`);
    }
    
    if (message.content === 'join') {
        if (!message.member.voice.channel) return message.reply('You must be in a voice channel!');
        await message.member.voice.channel.join();
        await message.reply('✅ Joined your voice channel.');
    }
    
    if (message.content === 'dec') {
        const voiceChannel = message.guild.members.me.voice.channel;
        if (!voiceChannel) return message.reply('I am not in a voice channel!');
        await voiceChannel.leave();
        await message.reply('✅ Left voice channel.');
    }
    
    if (message.content === 't') {
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
        await message.channel.send({ embeds: [embed] });
    }
    
    if (message.content.startsWith('ui ')) {
        const user = message.mentions.users.first() || message.author;
        const member = await message.guild.members.fetch(user.id);
        const embed = new EmbedBuilder()
            .setTitle(`👤 ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Joined Server', value: `${member.joinedAt.toDateString()}`, inline: true },
                { name: 'Account Created', value: `${user.createdAt.toDateString()}`, inline: true }
            )
            .setColor('Blue');
        await message.channel.send({ embeds: [embed] });
    }
    
    const result = addXP(message.author.id, Math.floor(Math.random() * 15) + 5);
    if (result.leveledUp) {
        const embed = new EmbedBuilder()
            .setTitle('🎉 Level Up! 🎉')
            .setDescription(`${message.author} reached Level ${result.newLevel}!`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor('Gold');
        await message.channel.send({ embeds: [embed] });
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const targetChannelId = '1507857397136228404';
    const bot = newState.guild.members.me;
    if (!bot.voice.channelId || bot.voice.channelId !== targetChannelId) {
        const channel = newState.guild.channels.cache.get(targetChannelId);
        if (channel && channel.isVoiceBased()) {
            await channel.join();
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
