const message = jest.genMockFromModule('discord');

discord.message = {};

module.exports = message;
