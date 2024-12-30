const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { scrapeCrashGameData, scrapeBackground } = require("./scrap");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const _salt = "0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6";
let _hash = null;

function sha256Hash(data) {
	return crypto.createHash("sha256").update(data).digest("hex");
}

function gameResult(seed, salt) {
	const n_bits = 52;
	const seedBytes = Buffer.from(seed, "hex");
	const saltBytes = Buffer.from(salt, "utf-8");

	const hmac = crypto.createHmac("sha256", saltBytes);
	hmac.update(seedBytes);
	const hmacHex = hmac.digest("hex");

	seed = hmacHex.slice(0, n_bits / 4);
	const r = parseInt(seed, 16);

	let X = r / 2 ** n_bits;
	X = Math.round(X * 1e9) / 1e9;

	X = 99 / (1 - X);

	const result = Math.floor(X);
	return Math.max(1, result / 100);
}

function backgroundScraping() {
	setInterval(async () => {
		let data = await scrapeCrashGameData();
		if (data === null) return;

		let temp = data;
		_hash = data;
		const results = [];

		for (let i = 0; i < 10; i++) {
			const temp1 = gameResult(temp, _salt);
			results.push(temp1);
			temp = sha256Hash(temp);
		}

		io.emit("update_data", { data: results });
	}, 1000);
}

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
	console.log("A user connected");

	socket.on("request_info", () => {
		socket.emit("send_info", { info: "Data" });
	});

	socket.on("disconnect", () => {
		console.log("User disconnected");
	});
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

backgroundScraping();
scrapeBackground();
