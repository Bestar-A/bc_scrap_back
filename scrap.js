const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

var firstGameHash = null;

const scrapeCrashGameData = () => {
	return firstGameHash;
};

const logFilesInDirectory = (dir) => {
	let i = 0;
	// Use fs.readdir() to read the contents of the directory.
	fs.readdir(dir, (err, files) => {
		i++;
		if (err) {
			return console.error(`Unable to scan directory: ${err}`);
		}

		// Loop through the files array to log each file name.
		files.forEach((file) => {
			const filePath = path.join(dir, file);
			console.log(i + ":" + filePath);

			// Check if the current file is a directory
			fs.stat(filePath, (err, stats) => {
				if (err) {
					return console.error(`Unable to get stats for file: ${err}`);
				}

				if (stats.isDirectory()) {
					// If it's a directory, call the function recursively
					logFilesInDirectory(filePath);
				}
			});
		});
	});
};

logFilesInDirectory("/opt/render/project/.render/chrome/usr/bin/google-chrome");

const scrapeBackground = async () => {
	const browser = await puppeteer.launch({
		executablePath: "/opt/render/project/.render/chrome/usr/bin/google-chrome",
		headless: false,
		ignoreDefaultArgs: ["--disable-extensions"],
		args: ["--no-sandbox", "--use-gl=egl", "--disable-setuid-sandbox"],
		ignoreHTTPSErrors: true,
	});

	const page = await browser.newPage();

	const url = "https://bc.game/game/crash";
	await page.goto(url);

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	await sleep(5000);

	const postDataToAPI = async (dataToPost) => {
		return await page.evaluate(async (data) => {
			return await fetch("https://bc.game/api/game/bet/multi/history", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			}).then((response) => response.json());
		}, dataToPost);
	};

	while (true) {
		await sleep(3000); // Sleep for 3 seconds
		const dataToPost = {
			gameUrl: "crash",
			page: 1,
			pageSize: 50,
		};

		try {
			const response = await postDataToAPI(dataToPost);

			if (response && typeof response === "object") {
				const firstGameDetail = response.data?.list[0]?.gameDetail || {};
				if (Object.keys(firstGameDetail).length > 0) {
					const gameHash = JSON.parse(firstGameDetail);
					firstGameHash = gameHash.hash || {};
				} else {
					console.log("First game hash not found in the response.");
				}
			} else {
				console.log("Invalid response format.");
			}
		} catch (error) {
			console.log(`Failed to fetch data: ${error}`);
		}
	}
};

module.exports = { scrapeCrashGameData, scrapeBackground };

//scrapeBackground();
