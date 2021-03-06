const common = require('../common.js');
const discord = require('../discordwrapper.js');
const logger = require('../logger.js');
const localize = require('../localization.js');

const devFlag = process.env.NODE_ENV === 'development' ? true : false;

async function commandJoin(message, args) {
    let channelId = undefined;
    /* If voiceMap is not created, create it first */
    if (!discord.voiceMap.get(message.guild.id)) discord.voiceMap.set(message.guild.id, new discord.Voice(message.guild.id));
    const voice = discord.voiceMap.get(message.guild.id);
    /* check if channel id is provided as argument */
    if (args.length > 0) channelId = args[0];

    /* check if user joined in any voice channel or passed channel id */
    if (!channelId && !message.member.voice.channel) {
        logger.log('error', '[discord.js] Failed to join voice channel: channel id not provided');
        message.channel.send(localize.get('error.discord.voice.user_not_found', message.author));
        return;
    }
    const selectedId = channelId ? channelId : message.member.voice.channel.id;
    /* check if channel is available */
    const channel = message.client.channels.cache.get(selectedId);
    if (!channel) {
        logger.log('error', '[discord.js] Failed to join voice channel: unknown channel id');
        message.channel.send(localize.get('error.discord.unknown_channel'));
        return;
    }
    /* check if bot has permission to join target channel */
    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        logger.log('error', '[discord.js] Failed to join voice channel: bot has no permission to access channel');
        message.channel.send(localize.get('error.discord.bot_no_permission'));
        return;
    }

    /* try to join voice channel w/ provided channel id or used joined */
    try {
        await voice.join(channel);
        logger.log('verbose', `[discord.js] Joined voice channel ${channel.id}.`);
        message.channel.send(localize.get('message.discord.voice.joined', voice.channel.name));
    } catch(err) {
        const errorReport = new discord.MessageAttachment(Buffer.from(err.stack), `report-${common.datetime()}.txt`);
        logger.log('error', `[discord.js] Error occured while joining voice channel:\n  ${err.stack}\n`);
        /* send error message to discord channel */
        message.channel.send(localize.get('error.generic'), errorReport);
        return;
    }
    return;
}

module.exports = {
    name: 'join',
    cooldown: 8,
    execute: commandJoin
}
