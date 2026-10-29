/*
God bless you if you are reading the source because now you are going to read this rant.
IT WAS A PAIN IN THE FUCKING ASS TO GET THIS TO WORK. TRUST ME WHEN I SAY THIS, I SPENT HALF A MONTH FINDING THE CORRECT GOOGLE-GENAI LIBRARY FOR THIS SHIT TO WORK.
AND THAT WAS JUST TO FIND THE CORRECT LIBRARY. THERE WERE OTHER LIBRARIES TOO EVEN AND... PLEASE DON'T MAKE ME DO THIS AGAIN
Really, this should be a method of torture.

- Ethan
*/


import { GoogleGenAI } from 'https://cdn.jsdelivr.net/npm/@google/genai@1.21.0/dist/index.mjs';

let ai;
let generateContent;
let history = [];
let listenersAttached = false;
let currentTopic = 'general';
let pendingFiles = [];

async function loadGeminiKey() {
  try {
    const key = await fetch('/data/sj27a3j.k', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error("Key fetch failed");
        return r.text();
      })
      .then(t => atob(t.trim()));

    return key;
  } catch (e) {
    console.error("Gemini key load failed:", e);
    return null;
  }
}

const topicConfigs = {
  'general': {
    name: '💬 General',
    systemPrompt: 'You are Delta AI, a helpful and friendly assistant. Answer questions on any topic clearly and concisely.'
  },
  'math': {
    name: '🧮 Math',
    systemPrompt: 'You are Delta AI, a math tutor. Help users solve math problems step by step. Explain concepts clearly, show your work, and use proper mathematical notation when helpful.'
  },
  'reading': {
    name: '📖 Language',
    systemPrompt: 'You are Delta AI, a reading comprehension and writing assistant. Help users understand texts, analyze literature, identify themes, and improve their reading skills.'
  },
  'history': {
    name: '📜 History',
    systemPrompt: 'You are Delta AI, a history expert. Help users learn about historical events, figures, and time periods. Provide accurate historical context and explain cause-and-effect relationships.'
  },
  'science': {
    name: '🔬 Science',
    systemPrompt: 'You are Delta AI, a science tutor. Explain scientific concepts clearly, help with biology, chemistry, physics, and other sciences.'
  },
  'coding': {
    name: '💻 Coding',
    systemPrompt: 'You are Delta AI, a programming assistant. Help users write code, debug issues, explain programming concepts, and provide code examples.'
  }
};

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function renderPendingFiles() {
  const wrap = document.getElementById('pendingFilesPreview');
  if (!wrap) return;
  if (!pendingFiles.length) { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = pendingFiles.map((f, i) => `
    <div class="pending-file-chip">
      <span title="${f.name}">${f.name}</span>
      <button onclick="removePendingFile(${i})" title="Remove">✕</button>
    </div>`).join('');
}

window.removePendingFile = function(i) {
  pendingFiles.splice(i, 1);
  renderPendingFiles();
};

function getCustomInstructions() {
  return localStorage.getItem('delta_custom_instructions') || '';
}

function getElements() {
  return {
    promptInput: document.getElementById('prompt'),
    sendButton: document.getElementById('send'),
    chatScroll: document.getElementById('scroll'),
    introDiv: document.getElementById('intro')
  };
}

function displayMessage(text, sender) {
  const { chatScroll, introDiv } = getElements();
  if (!chatScroll) return;

  const msg = document.createElement('div');
  msg.classList.add('msg', sender === 'user' ? 'user' : 'model');

  if (introDiv) introDiv.style.display = 'none';

  if (sender === 'model') {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let finalHtml = '';
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      let before = text.substring(lastIndex, match.index).trim();
      if (before) {
        finalHtml += DOMPurify.sanitize(marked.parse(before));
      }

      const language = match[1] || 'plaintext';
      const code = match[2].trim();

      try {
        const highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value;
        finalHtml += `
                  <div class="code-block">
                    <div class="code-header">
                      <span>${language.toUpperCase()}</span>
                      <button class="copy-btn">Copy</button>
                    </div>
                    <pre><code class="language-${language}">${highlighted}</code></pre>
                  </div>
                `;
      } catch {
        finalHtml += `
                  <div class="code-block">
                    <div class="code-header">
                      <span>${language.toUpperCase()}</span>
                      <button class="copy-btn">Copy</button>
                    </div>
                    <pre><code>${code}</code></pre>
                  </div>
                `;
      }

      lastIndex = codeBlockRegex.lastIndex;
    }

    let remaining = text.substring(lastIndex).trim();
    if (remaining) {
      finalHtml += DOMPurify.sanitize(marked.parse(remaining));
    }

    msg.innerHTML = finalHtml;
  } else {
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    msg.innerHTML = `<p>${safe.replace(/\n/g, '<br>')}</p>`;
  }

  chatScroll.appendChild(msg);
  chatScroll.scrollTop = chatScroll.scrollHeight;

  msg.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const codeBlock = btn.closest('.code-block').querySelector('pre');
      const text = codeBlock.innerText;
      await navigator.clipboard.writeText(text);
      const old = btn.innerText;
      btn.innerText = '✓ Copied!';
      setTimeout(() => btn.innerText = old, 2000);
    });
  });
}

function displayFilePreview(file, sender) {
  const { chatScroll } = getElements();
  if (!chatScroll) return;
  const msg = document.createElement('div');
  msg.classList.add('msg', sender === 'user' ? 'user' : 'model');

  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    msg.innerHTML = `<div class="file-msg-wrap"><img class="file-preview-img" src="${url}" alt="${file.name}"><div class="file-meta"><span class="file-size">${formatBytes(file.size)}</span><span class="file-type-label">${file.name}</span></div></div>`;
  } else if (file.type.startsWith('text/') || /\.(js|ts|py|json|md|html|css)$/i.test(file.name)) {
    const reader = new FileReader();
    reader.onload = e => {
      const preview = e.target.result.slice(0, 500);
      msg.querySelector('.file-text-preview pre').textContent = preview + (e.target.result.length > 500 ? '\n…' : '');
    };
    reader.readAsText(file);
    msg.innerHTML = `<div class="file-msg-wrap"><div class="file-meta"><span class="file-type-label">${file.name}</span><span class="file-size">${formatBytes(file.size)}</span></div><div class="file-text-preview"><pre></pre></div></div>`;
  } else {
    msg.innerHTML = `<div class="file-msg-wrap file-generic"><i class="fas fa-file" style="color:var(--color-accent);font-size:1.4rem;"></i><div><div style="font-size:0.82rem;color:#c9d1e0;">${file.name}</div><div class="file-size">${formatBytes(file.size)}</div></div></div>`;
  }

  chatScroll.appendChild(msg);
  chatScroll.scrollTop = chatScroll.scrollHeight;
}

window.clearChatHistory = function () {
  history = [];
  const { chatScroll, introDiv } = getElements();
  if (chatScroll) chatScroll.innerHTML = '';
  if (introDiv) introDiv.style.display = 'block';
  if (window.refreshConversationPanel) window.refreshConversationPanel();
};

window.handleTopicChange = function (topicId) {
  currentTopic = topicId;
  const config = topicConfigs[topicId] || topicConfigs.general;
  const topicHint = document.getElementById('topic-hint');
  if (topicHint) topicHint.textContent = `Topic: ${config.name}`;
};

async function sendMessage() {
  const { promptInput, sendButton, chatScroll } = getElements();
  const message = promptInput.value.trim();
  if ((!message && !pendingFiles.length) || !generateContent) return;

  const filesToSend = [...pendingFiles];
  pendingFiles = [];
  renderPendingFiles();

  if (message) displayMessage(message, 'user');

  for (const f of filesToSend) {
    displayFilePreview(f, 'user');
  }

  promptInput.value = '';
  sendButton.disabled = true;
  promptInput.disabled = true;

  const thinking = document.createElement('div');
  thinking.classList.add('msg', 'model', 'typing-indicator');
  thinking.innerHTML = '<span>Thinking...</span><div class="loader"></div><div class="loader"></div><div class="loader"></div>';
  chatScroll.appendChild(thinking);
  chatScroll.scrollTop = chatScroll.scrollHeight;

  const topic = topicConfigs[currentTopic] || topicConfigs.general;
  const customInstructions = getCustomInstructions();
  const systemInstruction = {
    role: "user",
    parts: [{ text: customInstructions ? `[System Instruction: ${topic.systemPrompt}]\n[Custom Instructions: ${customInstructions}]` : `[System Instruction: ${topic.systemPrompt}]` }]
  };

  const userParts = [];
  for (const f of filesToSend) {
    const b64 = await fileToBase64(f);
    userParts.push({ inlineData: { mimeType: f.type || 'application/octet-stream', data: b64 } });
  }
  if (message) userParts.push({ text: message });

  history.push({ role: "user", parts: userParts });

  const contents = history.length === 1 ? [systemInstruction, ...history] : history;

  try {
    const result = await generateContent({ model: "gemini-2.5-flash", contents });
    chatScroll.removeChild(thinking);
    const responseText = result.text.trim();
    displayMessage(responseText, 'model');
    history.push({ role: "model", parts: [{ text: responseText }] });
  } catch (e) {
    chatScroll.removeChild(thinking);
    history.pop();
    console.error("Gemini API Error:", e);
    displayMessage("An error occured. Please try again. ", 'model');
  } finally {
    sendButton.disabled = false;
    promptInput.disabled = false;
    promptInput.focus();
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function attachListeners() {
  const { promptInput, sendButton } = getElements();
  if (!promptInput || !sendButton) return;

  sendButton.removeEventListener('click', sendMessage);
  promptInput.removeEventListener('keydown', handleKeydown);

  sendButton.addEventListener('click', sendMessage);
  promptInput.addEventListener('keydown', handleKeydown);

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      for (const f of fileInput.files) pendingFiles.push(f);
      renderPendingFiles();
      fileInput.value = '';
    });
  }

  listenersAttached = true;
}

window.loadConversation = function (id) {
  const conversations = JSON.parse(localStorage.getItem('delta_conversations') || '[]');
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;
  history = conv.messages;
  window.handleTopicChange(conv.topic);
  const { chatScroll, introDiv } = getElements();
  if (!chatScroll) return;
  chatScroll.innerHTML = '';
  history.forEach(msg => displayMessage(msg.parts[0].text, msg.role));
  if (introDiv) introDiv.style.display = history.length ? 'none' : 'block';
  chatScroll.scrollTop = chatScroll.scrollHeight;
  if (window.refreshConversationPanel) window.refreshConversationPanel();
};

window.initChatbot = async function () {
  if (!ai) {
    const key = await loadGeminiKey();
    if (!key) {
      console.error("No API key available");
      return;
    }

    ai = new GoogleGenAI({ apiKey: key });
    generateContent = ai.models.generateContent;
    console.log("Gemini SDK initialized");
  }

  listenersAttached = false;
  attachListeners();

  const { chatScroll, introDiv } = getElements();
  if (chatScroll) {
    chatScroll.innerHTML = '';
    if (history.length > 0) {
      history.forEach(msg => {
        displayMessage(msg.parts[0].text, msg.role);
      });
      if (introDiv) introDiv.style.display = 'none';
    } else if (introDiv) {
      introDiv.style.display = 'block';
    }
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }
};