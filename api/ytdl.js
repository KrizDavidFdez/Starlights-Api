// api/download.js
import axios from "axios";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import stream from "stream";

const finished = promisify(stream.finished);

class UltraFastDownloader {
  constructor(concurrentChunks = 5) {
    this.concurrentChunks = concurrentChunks;
    this.activeDownloads = new Map();
  }

  async downloadToBuffer(url, options = {}) {
    const {
      chunkSize = 1024 * 1024 * 9, // 9MB chunks
      showProgress = false
    } = options;

    try {
      console.log("🚀 Iniciando descarga...");

      const metadata = await this._fetchMetadata(url);
      
      const buffer = await this._parallelDownloadToBuffer(
        metadata.audioUrl,
        metadata.size,
        chunkSize,
        showProgress
      );

      console.log("✅ Descarga completada");
      
      return {
        buffer: buffer,
        filename: metadata.filename,
        title: metadata.title,
        size: buffer.length,
        duration: metadata.duration,
        source: 'ultrafast-chunks'
      };

    } catch (error) {
      console.error("❌ Error:", error.message);
      throw error;
    }
  }

  async _fetchMetadata(url) {
    const { data } = await axios.get(
      `https://ytdlss-7l8w.vercel.app/api/index?url=${encodeURIComponent(url)}`,
      { timeout: 15000 }
    );

    if (!data?.success || !data?.audio?.url) {
      throw new Error("No se encontró audio");
    }

    const headRes = await axios.head(data.audio.url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    const size = Number(headRes.headers["content-length"] || 0);

    return {
      audioUrl: data.audio.url,
      title: data.title || "audio",
      filename: data.audio.filename || `${data.title.replace(/[\\/:*?"<>|]/g, "_")}.mp3`,
      size,
      duration: data.duration || 0
    };
  }

  async _parallelDownloadToBuffer(url, totalSize, chunkSize, showProgress) {
    const startTime = Date.now();
    const chunks = [];

    try {
      if (totalSize === 0) {
        return await this._streamToBuffer(url, showProgress);
      }

      // Dividir en chunks
      const chunkList = [];
      for (let start = 0; start < totalSize; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, totalSize - 1);
        chunkList.push({ start, end, index: chunkList.length });
      }

      console.log(`📦 Descargando ${chunkList.length} chunks...`);

      let downloadedBytes = 0;
      const progressInterval = showProgress ? setInterval(() => {
        const progress = ((downloadedBytes / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r⚡ Progreso: ${progress}%   `);
      }, 500) : null;

      // Descargar chunks en paralelo
      for (let i = 0; i < chunkList.length; i += this.concurrentChunks) {
        const batch = chunkList.slice(i, i + this.concurrentChunks);
        const batchPromises = batch.map(chunk => 
          this._downloadChunkToBuffer(url, chunk)
            .then(result => {
              downloadedBytes += chunk.end - chunk.start + 1;
              return result;
            })
        );
        const batchResults = await Promise.all(batchPromises);
        chunks.push(...batchResults);
      }

      if (progressInterval) {
        clearInterval(progressInterval);
        console.log("");
      }

      // Ordenar chunks por índice
      chunks.sort((a, b) => a.index - b.index);

      // Combinar todos los buffers
      const totalBuffer = Buffer.concat(chunks.map(c => c.buffer));
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      const speed = (totalSize / ((endTime - startTime) / 1000) / 1024 / 1024).toFixed(2);
      
      console.log(`⚡ Velocidad: ${speed} MB/s | Tiempo: ${duration}s`);

      return totalBuffer;

    } catch (error) {
      console.error("Error en descarga paralela:", error.message);
      throw error;
    }
  }

  async _downloadChunkToBuffer(url, chunk) {
    const { start, end, index } = chunk;
    
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Range": `bytes=${start}-${end}`
        },
        timeout: 30000
      });

      return {
        index: index,
        buffer: Buffer.from(response.data)
      };
    } catch (error) {
      console.error(`Error en chunk ${index}:`, error.message);
      throw error;
    }
  }

  async _streamToBuffer(url, showProgress) {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let downloaded = 0;
    const chunks = [];

    if (showProgress) {
      response.data.on("data", chunk => {
        downloaded += chunk.length;
        process.stdout.write(`\r📥 Descargado: ${(downloaded / 1024 / 1024).toFixed(1)} MB`);
      });
    }

    return new Promise((resolve, reject) => {
      response.data.on("data", chunk => chunks.push(chunk));
      response.data.on("end", () => resolve(Buffer.concat(chunks)));
      response.data.on("error", reject);
    });
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      creator: "ig @srt.conti",
      status: true,
      message: "API de descarga de audio - Usa POST con { url }"
    });
  }

  if (req.method === "POST") {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          creator: "ig @srt.conti",
          status: false,
          error: "Se requiere una URL de YouTube"
        });
      }

      const downloader = new UltraFastDownloader(3); // 3 chunks para Vercel
      
      const result = await downloader.downloadToBuffer(url, {
        showProgress: false
      });

      // Devolver el buffer como base64 para JSON
      return res.status(200).json({
        creator: "ig @srt.conti",
        status: true,
        type: "audio",
        filename: result.filename,
        title: result.title,
        duration: result.duration,
        size: result.size,
        audio: result.buffer.toString("base64"), // buffer en base64
        size_mb: (result.size / 1024 / 1024).toFixed(2)
      });

    } catch (error) {
      return res.status(500).json({
        creator: "ig @srt.conti",
        status: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
