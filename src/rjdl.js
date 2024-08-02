import axios from "axios"
import { load } from "cheerio"
import { HttpsProxyAgent } from "https-proxy-agent"

const host = "https://host2.rj-mw1.com/media/"

function shortenBytes(n) {
  const k = n > 0 ? Math.floor((Math.log2(n)/10)) : 0
  const count = Math.floor(n / Math.pow(1024, k))
  return count
}

const httpsAgent = new HttpsProxyAgent({ host: "127.0.0.1", port: 9051 })

const req = axios.create({ httpsAgent })

const rjdl = async (url) => {
  const type = url.includes("rj.app/m/") ? "mp3/" : "podcast/"
  const result = await axios.get(url)
  const $ = load(result.data)
  const link = $("#__NEXT_DATA__")
  const datas = JSON.parse(link.text())
  // console.log(datas.props.pageProps)
  const { pageProps: { media: d } } = datas.props
  // console.log(d)
  const src = host + type + d.permlink + ".mp3"
  // console.log(src)
  const res = await axios.get(d.link)
  const size = shortenBytes(res.headers["content-length"])
  // const newSrc = Number.isNaN(size) ? d.link : src
  // const destRes = await get(newSrc)
  return {
    title: d.title,
    photo: d.photo,
    artist: d.artist || d.podcast_artist,
    song: d.song || d.title,
    plays: d.plays,
    likes: d.likes,
    src: d.link,
    size: size,
    date: d.date_added || d.date
  }
}
export default rjdl
