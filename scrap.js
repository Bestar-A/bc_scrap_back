const puppeteer = require("puppeteer");

var firstGameHash = null;

const scrapeCrashGameData = () => {
	return firstGameHash;
};

const scrapeBackground = async () => {
	console.log(puppeteer.executablePath());

	const browser = await puppeteer.launch({
		headless: false,
		ignoreDefaultArgs: ["--disable-extensions"],
		args: ["--no-sandbox", "--use-gl=egl", "--disable-setuid-sandbox"],
		ignoreHTTPSErrors: true,
	});

	const page = await browser.newPage();
	await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.204 Safari/537.36");

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
