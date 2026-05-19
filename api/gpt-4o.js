import crypto from "node:crypto";

const API = "https://api.overchat.ai/v1/chat/completions";

const sessions = new Map();

function getOrCreateSession(chatId, deviceId) {
  const finalChatId = chatId || crypto.randomUUID();
  const finalDeviceId = deviceId || crypto.randomUUID();
  const key = `${finalChatId}:${finalDeviceId}`;
  
  if (!sessions.has(key)) {
    sessions.set(key, {
      chatId: finalChatId,
      deviceId: finalDeviceId,
      messages: []
    });
  }
  
  return sessions.get(key);
}

async function ask(message, session) {
  const userMessageId = crypto.randomUUID();
  const systemMessageId = crypto.randomUUID();

  const userMessage = {
    id: userMessageId,
    role: "user",
    content: message,
  };

  const systemMessage = {
    id: systemMessageId,
    role: "system",
    content: "",
  };

  const messagesToSend = [...session.messages, userMessage, systemMessage];

  const body = {
    chatId: session.chatId,
    model: "openai/gpt-4o",
    messages: messagesToSend,
    personaId: "gpt-4o-landing",
    frequency_penalty: 0,
    max_tokens: 4000,
    presence_penalty: 0,
    stream: false,
    temperature: 0.5,
    top_p: 0.95,
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "x-device-uuid": session.deviceId,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile": "?1",
    "x-device-language": "id-ID",
    "x-device-platform": "web",
    "x-device-version": "1.0.44",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
    accept: "*",
    "content-type": "application/json",
    origin: "https://overchat.ai",
    referer: "https://overchat.ai/",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    priority: "u=1, i",
  };

  const response = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      status: false,
      code: response.status,
      error: text,
    };
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || "";
  const model = data.model;
  
  session.messages.push(userMessage);
  session.messages.push({
    id: crypto.randomUUID(),
    role: "assistant",
    content: answer,
  });

  return {
    status: true,
    answer,
    model,
    chatId: session.chatId,
    deviceId: session.deviceId,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method === "GET") {
    return res.status(200).send("🚩 ingresa el parametro <message>");
  }

  if (req.method === "POST") {
    try {
      const { message, chatId, deviceId } = req.body;
      if (!message) {
        return res.status(200).json({
          creator: "ig @srt.conti",
          status: false,
          type: "error",
          error: "🚩 Ingresa el mensaje al parametro"
        });
      }
      const session = getOrCreateSession(chatId, deviceId);
      const result = await ask(message, session);

      if (result.status) {
        return res.status(200).json({
          creator: "ig @srt.conti",
          status: true,
          type: "write",
          response: result.answer,
          model: result.model
        });
      } else {
        return res.status(result.code).json({
          creator: "ig @srt.conti",
          status: false,
          error: ":/"
        });
      }
    } catch (error) {
      return res.status(500).json({
        creator: "ig @srt.conti",
        status: false,
        error: ":/"
      });
    }
  }

  return res.status(405).json({
    creator: "ig @srt.conti",
    status: false,
    type: "error",
    error: "🚩 Método incorrecto usa POST"
  });
}
