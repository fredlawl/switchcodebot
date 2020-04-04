module.exports.parseMessage = function (message)
{
	let args = [];
	if (message.substring(0, 1) !== '!') {
		return null;
	}

	let splitArgs = message.substring(1).split(' ');
	args = splitArgs.filter(function (arg) {
		return arg.trim().length > 0;
	});

	let cmd = args[0];
	args = args.splice(1);

	return {
		cmd: cmd,
		args: args
	}
};

module.exports.parseSwitchCode = function (code)
{
	let codePattern = /^(sw-)?(\d{12}|\d{4}|\d{4}-\d{4}-\d{4})$/i;

	if (!code.match(codePattern)) {
		return '';
	}

	let formattedCode = code;
	formattedCode = formattedCode.replace(/sw-/gi, '').replace(/-/g, '');
	let final = 'SW-';
	for (let i = 1; i <= formattedCode.length; i++) {
		final += formattedCode[i - 1];
		if (i % 4 === 0 && i !== formattedCode.length) {
			final += '-';
		}
	}

	return final;
}
