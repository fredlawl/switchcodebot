export class Command
{
    static get EXIT_SUCCESS() { return 0; }
    static get EXIT_HELP() { return 1; }
    static get EXIT_GENERAL_ERROR() { return 2; }
    static get EXIT_FATAL_ERROR() { return 3; }

    constructor(name, description, help)
    {
        this.name = name;
        this.description = description;
        this.help = help;
    }
}
