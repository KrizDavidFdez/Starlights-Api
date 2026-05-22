import fetch from 'node-fetch';

class ytConvert {
  constructor(options = {}) {
    this.downloadUrl = "https://hub.ytconvert.org/api/download"

    this.defaults = {
      format: "mp3",
      type: "audio",
      bitrate: "128k",
      requesting: 25,
      interval: 2000,
      retries: 5,
      timeout: 20000,
      ...options
    }
  }

  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  _formatDuration(seconds) {
    if (!seconds && seconds !== 0) return null
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`
  }

  async _fetch(url, options = {}) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.defaults.timeout)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  async download(url, options = {}) {
    const {
      format,
      type,
      bitrate,
      requesting,
      interval,
      retries
    } = {
      ...this.defaults,
      ...options
    }

    let err = null

    for (let retry = 0; retry < retries; retry++) {
      const payload = {
        url,
        os: "android",
        output: {
          type,
          format
        },
        audio: {
          bitrate
        }
      }

      const createRes = await this._fetch(this.downloadUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        body: JSON.stringify(payload)
      })

      const texts = await createRes.text()
      const jsson = JSON.parse(texts)

      if (!createRes.ok || !jsson?.statusUrl) {
        lastError = {
          success: false,
          step: "create",
          code: createRes.status,
          error: jsson?.message || jsson?.error || "No vino statusUrl",
          raw: jsson
        }
        continue
      }

      let stats = null

      for (let i = 0; i < requesting; i++) {
        await this._sleep(interval)

        const ressing = await this._fetch(jsson.statusUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
          }
        })

        const statusText = await ressing.text()
        const statson = JSON.parse(statusText)
        stats = statson

        if (statson?.downloadUrl) {
          return {
            success: true,
            title: statson.title || jsson.title || null,
            duration: statson.duration || jsson.duration || null,
            durationFormatted: this._formatDuration(statson.duration || jsson.duration),
            downloadUrl: statson.downloadUrl
          }
        }
      }

      err = {
        success: false,
        step: "status",
        error: "🚩 Error de Api"
      }
    }

    return lastError || {
      success: false,
      error: "🚩 Error de Api"
    }
  }

  async getInfo(url, options = {}) {
    return await this.download(url, {
      ...options,
      returnBuffer: false
    })
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    const jsonString = JSON.stringify({ success: true }, null, 2);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(jsonString);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    const jsonString = JSON.stringify({ 
      success: false, 
      error: '🚩 Usa el metodo get' 
    }, null, 2);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).send(jsonString);
  }

  const videoUrl = req.method === 'GET' ? req.query.url : req.body?.url;

  if (!videoUrl) {
    const jsonString = JSON.stringify({ 
      error: '🚩 Ingrese parameteo url' 
    }, null, 2);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).send(jsonString);
  }

  const options = {
    format: req.query.format || req.body?.format || "mp3",
    type: req.query.type || req.body?.type || "audio",
    bitrate: req.query.bitrate || req.body?.bitrate || "128k"
  };

  const dl = new ytConvert();
  const result = await dl.getInfo(videoUrl, options);

  const jsonString = JSON.stringify(result, null, 2);
  res.setHeader('Content-Type', 'application/json');
 
  if (!result.success) {
    return res.status(500).send(jsonString);
  }
  return res.status(200).send(jsonString);
}
