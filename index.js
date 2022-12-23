import express from "express";
import cors from "cors";
import exec from "child_process";
import axios from "axios";

export function verifyPostData(req, res, next) {
	req.headers['is_release'] = req.headers["x-github-event"] === "release";

	return next()
}

const app = express();

app.get ("/", (req, res) => {
	res.send("Hello World");
} );

app.post ("/update", verifyPostData, async (req, res) => {
	if (req.headers['is_release']) {
		console.log("Updating");
		await exec.execSync("rm -rf build/")
		await axios.get (" https://api.github.com/repos/yaltopia/globedockweb/releases/latest", {
			headers: {
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28"
			}
		}).then (async (response) => {
			console.log(response.data);
			await exec.execSync("wget " + response.data.assets[0].browser_download_url);
			await exec.execSync("unzip build.zip -d build/");
			await exec.execSync("rm build.zip");
			await exec.execSync("rm -rf /var/www/html/staticPage/*");
			await exec.execSync("cp -r build/* /var/www/html/staticPage/");
			await exec.execSync("rm -rf build/");
			await exec.execSync("systemctl restart apache2.service");
		}
		).catch (err => {
			console.log(err);
			return res.status(500).send("Error");
		});

		return res.status(200).send("Updated");
	}
	return res.status(404).send("Not Found");
} );
app.use(cors());

app.use(express.json());

app.listen(3555, 'localhost', () => {
	console.log("Server started");
});

