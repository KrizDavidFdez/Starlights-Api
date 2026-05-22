import axios from 'axios';
import cheerio from 'cheerio';
import FormData from 'form-data';
import crypto from 'crypto';

class AppleMusicDownloader {
    constructor() {
        this.baseUrl = 'https://aaplmusicdownloader.com';
        this.cookies = {};
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
        ];
        this.currentUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        this.headers = {
            'User-Agent': this.currentUserAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': this.baseUrl,
            'Referer': `${this.baseUrl}/`
        };
    }

    generatePHPSESSID() {
        return crypto.randomBytes(16).toString('hex');
    }

    setCookie(name, value, expiryHours = 24) {
        this.cookies[name] = {
            value,
            expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
        };
    }

    getCookieString() {
        const now = Date.now();
        return Object.entries(this.cookies)
            .filter(([_, v]) => v.expiry > now)
            .map(([k, v]) => `${k}=${v.value}`)
            .join('; ');
    }

    cnv(duration) {
        if (!duration) return null;
        if (/^\d+:\d{2}(:\d{2})?$/.test(duration)) return duration;
        const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
        if (!match) return duration;
        const horas = parseInt(match[1] || 0);
        const minutos = parseInt(match[2] || 0);
        const segundos = parseInt(match[3] || 0);
        if (horas > 0) {
            return `${horas}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        }
        return `${minutos}:${String(segundos).padStart(2, '0')}`;
    }

    async initSession() {
        this.setCookie('PHPSESSID', this.generatePHPSESSID());
        return true;
    }

    async getInitialPage() {
        const res = await axios.get(this.baseUrl, {
            headers: { ...this.headers, Cookie: this.getCookieString() }
        });
        const setCookies = res.headers['set-cookie'];
        if (setCookies) {
            setCookies.forEach(c => {
                const m = c.match(/([^=]+)=([^;]+)/);
                if (m) this.setCookie(m[1], m[2]);
            });
        }
        return res.data;
    }

    async getInfo(url) {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': this.currentUserAgent,
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const $ = cheerio.load(html);
        const jsn = $('script#schema\\:song').html();
        if (!jsn) {
            return {
                titulo: null, artista: null, album: null,
                imagen: null, fecha: null, duracion: null, audio_url: null
            };
        }
        const json = JSON.parse(jsn);
        const audio = json.audio?.audio || json.audio || {};
        const artist = audio.byArtist?.[0] || json.audio?.byArtist?.[0] || {}
        const albumArtist = audio.inAlbum?.byArtist?.[0] || {};
        const albumTitle = $('h1[data-testid="non-editable-product-title"]').text().trim();
        return {
            titulo: json.name || audio.name || null,
            artista: artist.name || albumArtist.name || null,
            album: albumTitle || audio.inAlbum?.name || null,
            imagen: audio.image || json.image || null,
            fecha: audio.uploadDate || json.datePublished || null,
            duracion: this.cnv(audio.duration || json.timeRequired),
            audio_url: audio.contentUrl || null
        };
    }

    async searchSong(url) {
        const form = new FormData();
        const match = url.match(/\/song\/([^\/]+)\/(\d+)/);
        const data = [decodeURIComponent(match[1].replace(/-/g, ' ')), '', '', '', null, url];
        form.append('data', JSON.stringify(data));
        const res = await axios.post(`${this.baseUrl}/song.php`, form, {
            headers: {
                ...this.headers,
                Cookie: this.getCookieString(),
                ...form.getHeaders()
            }
        });
        return res.data;
    }

    async prep(track, artist, url, quality) {
        const form = new FormData();
        form.append('song_name', track || '');
        form.append('artist_name', artist || '');
        form.append('url', url);
        form.append('token', 'none');
        form.append('quality', quality);
        const res = await axios.post(`${this.baseUrl}/api/composer/swd.php`, form, {
            headers: {
                ...this.headers,
                Cookie: this.getCookieString(),
                'X-Requested-With': 'XMLHttpRequest',
                ...form.getHeaders()
            }
        });
        return res.data;
    }

    async ffmpeg(url) {
        const res = await axios.get(`${this.baseUrl}/api/composer/ffmpeg/redirect.php`, {
            params: { url },
            headers: { ...this.headers, Cookie: this.getCookieString() },
            maxRedirects: 0,
            validateStatus: s => s === 302 || s === 200
        });
        return res.headers?.location || url;
    }

    async getSong(appleMusicUrl, quality = '256') {
        await this.initSession();
        await this.getInitialPage();
        let info = {};
        try {
            info = await this.getInfo(appleMusicUrl);
        } catch (e) {
            info = {};
        }
        const html = await this.searchSong(appleMusicUrl);
        const $ = cheerio.load(html);
        const titleHtml = $('h2').first().text().trim();
        const artistHtml = $('.media-info p').first().text().split('|')[0].trim();
        const albumHtml = $('td:contains("Album:")').next().text().trim();
        const durationHtml = $('td:contains("Duration:")').next().text().trim();
        const thumbnailHtml = $('.image.is-square img').attr('src');
        const title = info.titulo || titleHtml || null;
        const artist = info.artista || artistHtml || null;
        const album = info.album || albumHtml || null;
        const duration = info.duracion || durationHtml || null;
        const thumbnail = info.imagen || thumbnailHtml || null;
        const dl = await this.prep(title, artist, appleMusicUrl, quality);
        let dls = null;
        if (dl?.status === 'success' && dl?.dlink) {
            dls = await this.ffmpeg(dl.dlink);
        }
        return {
            title, artist, album, thumbnail,
            upload: info.fecha || null,
            timestamp: duration,
            dl_url: dls
        };
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        const errorJson = JSON.stringify({ error: '🚩 Metodo permitido GET' }, null, 2);
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).send(errorJson);
    }
    
    const { url, quality } = req.query;
    
    if (!url) {
        const errorJson = JSON.stringify({ 
            error: '🚩 Ingresa el parametro url'
        }, null, 2);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).send(errorJson);
    }
    
    try {
        const downloader = new AppleMusicDownloader();
        const qualityValue = quality === '320
        const result = await downloader.getSong(url, qualityValue);
        const jsonString = JSON.stringify(result, null, 2);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(jsonString);
        
    } catch (error) {
        const errorJson = JSON.stringify({ 
            error: "://"
        }, null, 2);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).send(errorJson);
    }
}
