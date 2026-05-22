import { randomBytes } from 'crypto';

function generateUUID() {
    return randomBytes(16).toString('hex');
}

class PoppopAI {
    constructor() {
        this.uuid = generateUUID();
        this.cookies = {
            pll_language: 'en',
            nablamind: this.uuid
        };
        this.result = null;
    }

    get headers() {
        const cookieHeader = Object.entries(this.cookies)
            .map(([key, value]) => `${key}=${value}`).join('; ');
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/event-stream',
            'Accept-Language': 'es-PE,es-419;q=0.9,es;q=0.8',
            'Referer': 'https://poppop.ai/',
            'Origin': 'https://poppop.ai',
            'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'Cookie': cookieHeader
        };
    }

    async streamTaskProgress(taskKey) {
        const response = await fetch('https://aiapi.poppop.ai/task_info2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...this.headers
            },
            body: new URLSearchParams({
                uuid: this.uuid,
                key: taskKey
            }).toString()
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\r\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        // Evento ignorado
                    } else if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            this.handleSSEEvent(data);
                        } catch {}
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    handleSSEEvent(data) {
        if (data.task?.data?.title) {
            if (!this.result) this.result = {};
            this.result.title = data.task.data.title;
        } else if (data.file_url) {
            this.result = {
                title: this.result?.title || '',
                voice: this.result?.voice || '',
                link: data.file_url,
                cover: data.file_cover,
                size_mb: (data.file_size / 1024 / 1024).toFixed(1),
                duration: data.duration,
                format: data.format
            };
        }
    }

    async apiPost(url, bodyData, contentType = 'application/json') {
        const body = contentType === 'application/x-www-form-urlencoded'
            ? new URLSearchParams(bodyData).toString()
            : JSON.stringify(bodyData);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': contentType, ...this.headers },
            body
        });

        const result = await response.json();
        return result.data;
    }

    async uploadToS3(presignedUrl, fileBuffer) {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: fileBuffer,
            duplex: 'half'
        });
        return response.headers.get('etag') || '';
    }

    async getVoiceInfo(slug) {
        return this.apiPost('https://aiapi.poppop.ai/voice_info2', { uuid: this.uuid, slug }, 'application/x-www-form-urlencoded');
    }

    async checkCredits() {
        return this.apiPost('https://aiapi.poppop.ai/times', { uuid: this.uuid, type: 'voice_cover' });
    }

    async createVoiceCover(vozSlug, audioBuffer, filename = 'audio.mp3') {
        const voiceInfo = await this.getVoiceInfo(vozSlug);
        const credits = await this.checkCredits();

        this.result = { voice: vozSlug, voiceName: voiceInfo.name };

        const uploadData = await this.initiateMultipartUpload(filename);
        const presignedUrl = await this.generatePresignedUrl(uploadData.key, uploadData.uploadId);
        const etag = await this.uploadToS3(presignedUrl, audioBuffer);
        await this.completeMultipartUpload(uploadData.key, uploadData.uploadId, etag);

        const taskKey = await this.generateVoiceCover(
            await this.getCoverUrl(uploadData.key),
            voiceInfo.key, filename
        );
        return taskKey;
    }

    async initiateMultipartUpload(filename) {
        return this.apiPost('https://aiapi.poppop.ai/initiate-multipart-upload', {
            filename, uuid: this.uuid, app: 'ai_cover'
        });
    }

    async generatePresignedUrl(key, uploadId) {
        const result = await this.apiPost('https://aiapi.poppop.ai/generate-presigned-url', {
            uuid: this.uuid, key, uploadId, partNumber: 1
        });
        return result.url;
    }

    async completeMultipartUpload(key, uploadId, etag) {
        await this.apiPost('https://aiapi.poppop.ai/complete-multipart-upload', {
            uuid: this.uuid, key, uploadId, parts: [{ PartNumber: 1, ETag: etag }]
        });
    }

    async generateVoiceCover(coverUrl, voiceKey, sourceName) {
        const result = await this.apiPost('https://aiapi.poppop.ai/voice_cover', {
            uuid: this.uuid, coverUrl, voiceKey, sourceName,
            vocal_vol: '0', inst_vol: '4', vocal_pitch: '0', inst_pitch: '0', duration: 0, stream: false
        });
        return result.key;
    }

    async getCoverUrl(key) {
        return `https://d.poppop.ai/${encodeURIComponent(key)}`;
    }

    bufferToObject(buffer) {
        if (!buffer) return null;
        return {
            type: 'Buffer',
            data: Array.from(buffer) 
        };
    }

    async run(vozSlug, audioBuffer, filename = 'audio.mp3') {
        try {
            const taskKey = await this.createVoiceCover(vozSlug, audioBuffer, filename);
            await this.streamTaskProgress(taskKey);
            let audioBuffer_result = null;
            if (this.result?.link) {
                const audioResponse = await fetch(this.result.link);
                const arrayBuffer = await audioResponse.arrayBuffer();
                audioBuffer_result = Buffer.from(arrayBuffer);
            }
            
            return {
                title: this.result?.title || '',
                voice: vozSlug,
                audio: this.bufferToObject(audioBuffer_result),
                size_mb: this.result?.size_mb || null,
                duration: this.result?.duration || null,
                format: this.result?.format || null
            };
        } catch (error) {
            console.error('Error:', error.message);
            return {
                title: null,
                voice: vozSlug,
                audio: null,
                error: "://"
            };
        }
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        const errorResponse = { error: '🚩 Solo metodo POST' };
        const jsonString = JSON.stringify(errorResponse, null, 2);
        return res.status(405).send(jsonString);
    }
    try {
        const { voice, url, filename = 'audio.mp3' } = req.body;        
        if (!voice || !url) {
            const errorResponse = { 
                error: '🚩 Ingresa parametro voice y url' 
            };
            const jsonString = JSON.stringify(errorResponse, null, 2);
            return res.status(400).send(jsonString);
        }
        const audioResponse = await fetch(url);
        if (!audioResponse.ok) {
            const jsonString = JSON.stringify(errorResponse, null, 2);
            return res.status(400).send(jsonString);
        }
        
        const arrayBuffer = await audioResponse.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);
        
        const poppop = new PoppopAI();
        const result = await poppop.run(voice, audioBuffer, filename);
        
        const responseData = {
            success: true,
            ...result
        };
        
        const jsonString = JSON.stringify(responseData, null, 2);
        res.status(200).send(jsonString);
        
    } catch (error) {
        const errorResponse = { 
            success: false, 
            error: "://" 
        };
        const jsonString = JSON.stringify(errorResponse, null, 2);
        res.status(500).send(jsonString);
    }
}
