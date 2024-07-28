import get from "axios"
import { load } from "cheerio"

const host = "https://host2.rj-mw1.com/media/"

function shortenBytes(n) {
  const k = n > 0 ? Math.floor((Math.log2(n)/10)) : 0
  const count = Math.floor(n / Math.pow(1024, k))
  return count
}

const rjdl = async (url) => {
  const type = url.includes("rj.app/m/") ? "mp3/" : "podcast/"
  const result = await get(url)
  const $ = load(result.data)
  const link = $("#__NEXT_DATA__")
  const datas = JSON.parse(link.text())
  // console.log(datas.props.pageProps)
  const { pageProps: { media: d } } = datas.props
  // const src = host + type + d.permlink + ".mp3"
  const res = await get(d.link)
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
