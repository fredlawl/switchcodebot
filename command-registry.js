const registry = {};

function register(regex, cmd)
{
    if (!!!registry[regex]) {
        registry[regex] = cmd;
    }
}

function getCommands()
{
    return registry;
}

function execute(cmdRegex, args)
{
    // todo: make this work
}

module.exports = {
    register,
    getCommands,
    execute
};
