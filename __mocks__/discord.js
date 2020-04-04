const discord = jest.genMockFromModule('discord.io');

discord.sendMessage = function (options, callback) {};

module.exports = discord;
