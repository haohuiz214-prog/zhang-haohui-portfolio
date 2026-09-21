const DEFAULT_COZE_API_BASE = 'https://api.coze.cn';
const MAX_MESSAGE_LENGTH = 1200;
const POLL_INTERVAL_MS = 900;
const POLL_TIMEOUT_MS = 45000;

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const safeJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Coze returned an invalid response.');
  }
};

const getRequestBody = (request) => {
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  if (request.body && typeof request.body === 'object') return request.body;
  return {};
};

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

const buildCozeClient = ({ token, baseUrl }) => async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await safeJson(response);
  if (!response.ok || (typeof payload.code === 'number' && payload.code !== 0)) {
    const error = new Error(payload.msg || `Coze API request failed with status ${response.status}.`);
    error.status = response.status >= 400 && response.status < 500 ? 502 : 503;
    throw error;
  }
  return payload;
};

const createChat = async ({ coze, botId, message, userId, conversationId }) => {
  const query = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : '';
  const payload = await coze(`/v3/chat${query}`, {
    method: 'POST',
    body: JSON.stringify({
      bot_id: botId,
      user_id: userId,
      stream: false,
      auto_save_history: true,
      additional_messages: [{ role: 'user', content: message, content_type: 'text' }],
    }),
  });
  return payload.data;
};

const waitForChat = async ({ coze, conversationId, chatId }) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const query = new URLSearchParams({ conversation_id: conversationId, chat_id: chatId });
    const payload = await coze(`/v3/chat/retrieve?${query}`);
    const chat = payload.data || {};
    if (chat.status === 'completed') return chat;
    if (['failed', 'requires_action', 'canceled'].includes(chat.status)) {
      throw new Error(chat.last_error?.msg || '智能体未能完成本次回答。');
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error('智能体响应超时，请稍后重试。');
};

const getAnswer = async ({ coze, conversationId, chatId }) => {
  const query = new URLSearchParams({ conversation_id: conversationId, chat_id: chatId });
  const payload = await coze(`/v3/chat/message/list?${query}`);
  const answers = (payload.data || []).filter(
    (item) => item.role === 'assistant' && item.type === 'answer' && item.content_type === 'text' && item.content,
  );
  if (!answers.length) throw new Error('智能体没有返回可显示的文本回答。');
  return answers.map((item) => item.content).join('\n\n');
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: '仅支持 POST 请求。' });
  }

  const token = process.env.COZE_API_TOKEN;
  const botId = process.env.COZE_BOT_ID;
  if (!token || !botId) {
    return response.status(503).json({ error: 'Live Demo 尚未完成服务端配置。' });
  }

  try {
    const body = getRequestBody(request);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return response.status(400).json({ error: '请输入旅行需求。' });
    if (message.length > MAX_MESSAGE_LENGTH) {
      return response.status(400).json({ error: `消息不能超过 ${MAX_MESSAGE_LENGTH} 个字符。` });
    }
    if (body.responseMode && body.responseMode !== 'blocking') {
      return response.status(400).json({ error: '当前版本仅支持非流式响应。' });
    }

    const baseUrl = normalizeBaseUrl(process.env.COZE_API_BASE || DEFAULT_COZE_API_BASE);
    const coze = buildCozeClient({ token, baseUrl });
    const requestedUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const userId = /^[a-zA-Z0-9_-]{8,80}$/.test(requestedUserId)
      ? requestedUserId
      : `portfolio-${crypto.randomUUID()}`;
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;
    const chat = await createChat({ coze, botId, message, userId, conversationId });
    if (!chat?.id || !chat?.conversation_id) throw new Error('Coze 未返回有效的对话标识。');

    await waitForChat({ coze, conversationId: chat.conversation_id, chatId: chat.id });
    const reply = await getAnswer({ coze, conversationId: chat.conversation_id, chatId: chat.id });

    return response.status(200).json({
      reply,
      conversationId: chat.conversation_id,
      chatId: chat.id,
      responseMode: 'blocking',
    });
  } catch (error) {
    console.error('Coze chat request failed:', error);
    return response.status(error.status || 500).json({ error: error.message || '服务暂时不可用，请稍后再试。' });
  }
}
