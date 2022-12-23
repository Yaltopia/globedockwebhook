import express from "express";
import cors from "cors";
import exec from "child_process";
import axios from "axios";

export function verifyPostData(req, res, next) {
	req.headers['is_release'] = req.headers["x-github-event"] === "release";

	if (!req.rawBody) {
		req.headers['is_secure'] = false;
		console.log("Failed");
		return next('Request body empty');
	}

	const sig = Buffer.from(req.get(sigHeaderName) || '', 'utf8')
	const hmac = crypto.createHmac(sigHashAlg, secret)
	const digest = Buffer.from(sigHashAlg + '=' + hmac.update(req.rawBody).digest('hex'), 'utf8')

	if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
		req.headers['is_secure'] = false;
		console.log("Failed");
		return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${sig})`)
	}

	console.log("Success");
	req.headers['is_secure'] = true;
	return next()
}

const app = express();

app.get ("/", (req, res) => {
	res.send("Hello World");
} );

app.post ("/update", verifyPostData, async (req, res) => {
	if (req.headers['is_release']) {
		console.log("Updating");
		await exec("cd /root/globedockweb/");
		await exec("rm -rf build/")
		await axios.get (" https://api.github.com/repos/yaltopia/globedockweb/releases/latest", {
			headers: {}

			}
		).then (async (response) => {
			console.log(response.data);
			await exec("wget " + response.data.assets[0].browser_download_url);
			await exec("unzip build.zip -d build/");
			await exec("rm build.zip");
		}
		).catch (err => {
			console.log(err);
		});
	}
} );
app.use(cors());

app.use(express.json());

app.listen(3000, () => {
  console.log("Server started on port 3000!");
});

