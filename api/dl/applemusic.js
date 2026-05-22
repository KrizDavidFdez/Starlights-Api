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
        const res = await fetch(this.baseUrl, {
            headers: { ...this.headers, Cookie: this.getCookieString() }
        });
        const setCookies = res.headers.get('set-cookie');
        if (setCookies) {
            const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];
            cookies.forEach(c => {
                const m = c.match(/([^=]+)=([^;]+)/);
                if (m) this.setCookie(m[1], m[2]);
            });
        }
        return res.text();
    }

    async getInfo(url) {
        const response = await fetch(url, {
            headers: {
                'User-Agent': this.currentUserAgent,
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const html = await response.text();
        
        const scriptMatch = html.match(/<script[^>]*id="schema\\:song"[^>]*>([\s\S]*?)<\/script>/i);
        if (!scriptMatch) {
            return {
                titulo: null, artista: null, album: null,
                imagen: null, fecha: null, duracion: null, audio_url: null
            };
        }
        
        const json = JSON.parse(scriptMatch[1]);
        const audio = json.audio?.audio || json.audio || {};
        const artist = audio.byArtist?.[0] || json.audio?.byArtist?.[0] || {}
        const albumArtist = audio.inAlbum?.byArtist?.[0] || {};
        
        const albumTitleMatch = html.match(/<h1[^>]*data-testid="non-editable-product-title"[^>]*>([^<]*)<\/h1>/i);
        const albumTitle = albumTitleMatch ? albumTitleMatch[1].trim() : null;
        
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
        
        const res = await fetch(`${this.baseUrl}/song.php`, {
            method: 'POST',
            headers: {
                ...this.headers,
                Cookie: this.getCookieString()
            },
            body: form
        });
        return res.text();
    }

    async prep(track, artist, url, quality) {
        const form = new FormData();
        form.append('song_name', track || '');
        form.append('artist_name', artist || '');
        form.append('url', url);
        form.append('token', 'none');
        form.append('quality', quality);
        
        const res = await fetch(`${this.baseUrl}/api/composer/swd.php`, {
            method: 'POST',
            headers: {
                ...this.headers,
                Cookie: this.getCookieString(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: form
        });
        return res.json();
    }

    async ffmpeg(url) {
        const res = await fetch(`${this.baseUrl}/api/composer/ffmpeg/redirect.php?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: { ...this.headers, Cookie: this.getCookieString() },
            redirect: 'manual'
        });
        return res.headers.get('location') || url;
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
        
        const titleMatch = html.match(/<h2[^>]*>([^<]*)<\/h2>/i);
        const titleHtml = titleMatch ? titleMatch[1].trim() : null;
        
        const artistMatch = html.match(/<div[^>]*class="media-info"[^>]*>[\s\S]*?<p[^>]*>([^<|]*)/i);
        const artistHtml = artistMatch ? artistMatch[1].trim() : null;
        
        const albumMatch = html.match(/<td[^>]*>Album:<\/td>\s*<td[^>]*>([^<]*)<\/td>/i);
        const albumHtml = albumMatch ? albumMatch[1].trim() : null;
        
        const durationMatch = html.match(/<td[^>]*>Duration:<\/td>\s*<td[^>]*>([^<]*)<\/td>/i);
        const durationHtml = durationMatch ? durationMatch[1].trim() : null;
        
        const thumbnailMatch = html.match(/<div[^>]*class="image[^"]*is-square[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i);
        const thumbnailHtml = thumbnailMatch ? thumbnailMatch[1] : null;
        
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
        const qualityValue = quality === '320' ? '320' : '256';
        const result = await downloader.getSong(url, qualityValue);
        const jsonString = JSON.stringify(result, null, 2);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(jsonString);
        
    } catch (error) {
        console.error('Error:', error);
        const errorJson = JSON.stringify({ 
            error: "://"
        }, null, 2);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).send(errorJson);
    }
}
