import axios from 'axios';

class SoundCloudScraper {
    constructor() {
        this.clientId = 'KKzJxmw11tYpCs6T24P4uUYhqmjalG6M';
        this.baseUrl = 'https://api-mobi.soundcloud.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/javascript, ; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://m.soundcloud.com',
            'Referer': 'https://m.soundcloud.com/',
            'Content-Type': 'application/json'
        };
    }

    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    async getTrackInfo(url) {
        try {
            const resolvedUrl = await this.resolveSoundCloudUrl(url);
            const permalink = this.extractPermalink(resolvedUrl);
            
            const resolveUrl = `${this.baseUrl}/resolve`;
            const params = {
                url: `https://soundcloud.com/${permalink}`,
                client_id: this.clientId
            };

            const response = await axios.get(resolveUrl, { params, headers: this.headers });
            const trackData = response.data;
            let dl_url = null;
            
            if (trackData.media?.transcodings?.length > 0) {
                const progressiveTranscoding = trackData.media.transcodings.find(t => 
                    t.format?.protocol === 'progressive'
                );
                
                if (progressiveTranscoding?.url) {
                    try {
                        const progressiveResponse = await axios.get(progressiveTranscoding.url, {
                            params: {
                                client_id: this.clientId,
                                track_authorization: trackData.track_authorization
                            },
                            headers: this.headers
                        });
                        if (progressiveResponse.data?.url) {
                            dl_url = progressiveResponse.data.url;
                        }
                    } catch (e) {
                    }
                }
            }

            const result = {
                creator: "ig : @srt.conti",
                id: trackData.id,
                title: trackData.title,
                image: trackData.artwork_url?.replace('-large.', '-t500x500.'), 
                user: trackData.user?.username || 'darling.444',
                duration: this.formatDuration(trackData.duration),
                genre: trackData.genre,
                plays: trackData.playback_count,
                likes: trackData.likes_count,
                comments: trackData.comment_count,
                repost: trackData.reposts_count,
                publised: trackData.created_at,
                desc: trackData.description,
                dl_url: dl_url 
            };
            return result;
        } catch (error) {
            return {
                error: "://"
            };
        }
    }

    async resolveSoundCloudUrl(url) {
        if (!url.includes('on.soundcloud.com')) {
            return url;
        }

        try {
            const response = await axios.get(url, {
                maxRedirects: 0,
                validateStatus: (status) => status >= 300 && status < 400,
                headers: this.headers
            });

            if (response.headers.location) {
                return response.headers.location;
            }
        } catch (error) {
            if (error.response?.headers?.location) {
                return error.response.headers.location;
            }
        }
        return url;
    }

    extractPermalink(url) {
        try {
            const urlObj = new URL(url);
            let pathname = urlObj.pathname.replace(/^\//, '').split('?')[0];
            pathname = pathname.replace(/\/$/, '');
            return pathname || null;
        } catch (e) {
            return null;
        }
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
        return res.status(405).json({ error: '🚩 Metodo permitido get' });
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ 
            error: '🚩 Ingresa el parametro url',
            example: '/api/soundcloud?url=https://on.soundcloud.com/xiYJTjHgLPQnYxZXjW'
        });
    }
    
    try {
        const scraper = new SoundCloudScraper();
        const result = await scraper.getTrackInfo(url);
        
        if (result.error) {
            return res.status(404).json(result);
        }
        
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ 
            error: '://'
        });
    }
}
