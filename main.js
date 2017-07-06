const MenuBar = require('menubar')
const Rx = require('rxjs/Rx')
const TrackDetector = require('./trackDetector.js')
const LyricFetcher = require('./lyricFetcher.js')
const Path = require('path')
const Url = require('url')

const htmlUrl = Url.format({
  pathname: Path.join(__dirname, 'index.html'),
  protocol: 'file',
  slashes: true
})

const menubar = MenuBar({
  tooltip: 'Lyrics: click to show the lyric of the currenly playing song',
  icon: 'Icon/Icon.png',
  index: htmlUrl
})

const separator = '---'
let currentTrack = {}
let subscription = null

menubar.on('show', () => {
  notifyLoading()
  detectAndFetch()
})

function detectAndFetch() {
  if (subscription != null) {
    subscription.unsubscribe()
  }

  const observable = TrackDetector.detectTrack()
    .flatMap((track) => {
      if (JSON.stringify(currentTrack) !== JSON.stringify(track)) {
        currentTrack = track
        return LyricFetcher
          .fetchLyrics(track)
          .map((lyrics) => {
            return {
              track,
              lyrics
            }
          })
      } else {
        return Rx.Observable.empty()
      }
    })

  subscription = observable.subscribe(
    function (lyrics) {
      notifyContent(lyrics)
    },
    function (err) {
      notifyError()
    }
  )
}

function notifyLoading() {
  menubar.window.webContents.send('loading')
}

function notifyError() {
  menubar.window.webContents.send('error')
}

function notifyContent(data) {
  menubar.window.webContents.send('content', data)
}