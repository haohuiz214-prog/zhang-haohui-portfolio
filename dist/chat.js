const form = document.querySelector('[data-chat-form]');
const input = document.querySelector('[data-chat-input]');
const sendButton = document.querySelector('[data-chat-send]');
const messages = document.querySelector('[data-chat-messages]');
const suggestions = document.querySelector('[data-chat-suggestions]');

const CHAT_API_ENDPOINT = window.location.hostname.endsWith('github.io')
  ? 'https://zhang-haohui-portfolio.vercel.app/api/chat'
  : '/api/chat';

let isLoading = false;
const userId = `portfolio-${crypto.randomUUID()}`;

const scrollToLatest = () => {
  messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
};

const createMessage = (role, content) => {
  const item = document.createElement('article');
  item.className = 'chat-message';
  item.dataset.role = role;

  const label = document.createElement('span');
  label.className = 'chat-message-label';
  label.textContent = role === 'user' ? '你' : role === 'error' ? '连接错误' : '智能旅行助手';

  const bubble = document.createElement('div');
  bubble.className = 'chat-message-bubble';
  bubble.textContent = content;

  item.append(label, bubble);
  messages.append(item);
  scrollToLatest();
  return item;
};

const createLoadingMessage = () => {
  const item = document.createElement('article');
  item.className = 'chat-message';
  item.dataset.role = 'assistant';
  item.dataset.loading = 'true';
  item.innerHTML = '<span class="chat-message-label">智能旅行助手</span><div class="chat-message-bubble"><span class="chat-loading" aria-label="正在生成回复"><i></i><i></i><i></i></span></div>';
  messages.append(item);
  scrollToLatest();
  return item;
};

const resizeInput = () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
};

const updateComposer = () => {
  sendButton.disabled = isLoading || !input.value.trim();
  input.disabled = isLoading;
};

const sendMessage = async (text) => {
  if (isLoading || !text) return;

  isLoading = true;
  if (suggestions) suggestions.remove();
  createMessage('user', text);
  input.value = '';
  resizeInput();
  updateComposer();
  const loadingMessage = createLoadingMessage();

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(CHAT_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, userId, responseMode: 'blocking' }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || '服务暂时不可用，请稍后再试。');

    loadingMessage.remove();
    createMessage('assistant', payload.reply || '暂时没有收到有效回复，请换一种方式提问。');
  } catch (error) {
    loadingMessage.remove();
    const message = error.name === 'AbortError' ? '请求等待时间过长，请稍后重试。' : error.message;
    createMessage('error', message);
  } finally {
    window.clearTimeout(timeout);
    isLoading = false;
    updateComposer();
    input.focus();
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value.trim());
});

input.addEventListener('input', () => {
  resizeInput();
  updateComposer();
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (!sendButton.disabled) form.requestSubmit();
  }
});

suggestions?.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  input.value = button.textContent.trim();
  resizeInput();
  updateComposer();
  form.requestSubmit();
});

updateComposer();
