const fs = require('fs');
const https = require('https');
const accept = require('../utils/acceptance');
const remotePackagePath = 'https://raw.githubusercontent.com/greenpress/greenpress/master/package.json';

function setUpgradeCommand(program) {
	program
		.command('upgrade')
		.description('upgrade modules to their latest version')
		.action(async function () {
			const localPackagePath = process.env.PWD + '/package.json';

			// create local json objects for package.json from local and remote repos
			const localPackage = require(localPackagePath);
			const { dependencies = {} } = await getJSON(remotePackagePath);
			const localDependencies = localPackage.dependencies || {};

			console.log('checking for outdated dependencies...');

			// update needed dependencies
			for (const name in dependencies) {
				const remoteValue = dependencies[name];
				const currentValue = localDependencies[name];
				console.log(`Checking ${name} version`);
				if (remoteValue !== currentValue) {
					console.log(`Found a difference in ${name}:\n
				local: ${currentValue} <--> ${remoteValue} :remote\n`);
					localDependencies[name] = await checkAndUpgradeDependency(name, currentValue, remoteValue);
					console.log(`Updated ${name}'s version to: ${localDependencies[name]}`);
				} else {
					console.log(`${name}'s version is the latest! Proceeding.`)
				}
			}

			// // save updated json
			fs.writeFileSync(localPackagePath, JSON.stringify(localPackage, null, 2));
			console.log('Upgrade ended successfully!');
		});
}

function getJSON(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (resp) => {
			let data = '';
			resp.on('data', chunk => data += chunk);
			resp.on('end', () => resolve(JSON.parse(data)));
			resp.on('error', (err) => reject(err));
		});
	});
}

function checkAndUpgradeDependency(name, currentValue, remoteValue) {
	return accept(`Would you like to upgrade to remote's version?`)
	       .then(answer => upgradeFunc(answer, name, remoteValue, currentValue));
}

function upgradeFunc(answer, name, remoteValue, currentValue) {
	if (answer) {
		console.log(`Upgrading ${name}`);
		return remoteValue;
	} else {
		console.log(`Not upgrading ${name}`);
		return currentValue;
	}
}
module.exports = setUpgradeCommand
