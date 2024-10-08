import { load } from "cheerio"
//const url = "https://rj.app/pm/Xw1l6eaj"
const getPlaylistUrl = async (url) => {
	const response = await fetch(url)
	const data = await response.text()
	const $ = load(data)
	const playlistUrl = $("head > link")[0].attribs
	return playlistUrl.href
}

export default getPlaylistUrl
