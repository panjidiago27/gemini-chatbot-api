const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  sunIcon.style.display = 'none';
  moonIcon.style.display = 'block';
}

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  
  if (isDark) {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
    localStorage.setItem('theme', 'dark');
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
    localStorage.setItem('theme', 'light');
  }
});

// Array to keep track of the conversation history
let conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Clear welcome message if it exists
  const welcome = document.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  // 1. Add the user's message to the chat box
  appendMessage('user', userMessage);
  
  // Update the conversation state with the user message
  conversation.push({ role: 'user', text: userMessage });
  
  input.value = '';
  sendBtn.disabled = true;

  // 2. Show a temporary "Thinking..." bot message with typing indicator
  const thinkingMessageElement = appendMessage('bot', '', true);

  try {
    // 3. Send the user's message as a POST request to /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    if (!response.ok) {
      throw new Error('Server responded with an error status.');
    }

    const data = await response.json();
    
    // 4. When the response arrives, replace the "Thinking..." message
    if (data.response) {
      // Format response simply to support basic markdown
      thinkingMessageElement.innerHTML = formatText(data.response);
      
      // Update the conversation state with the bot's response
      conversation.push({ role: 'model', text: data.response });
    } else {
      thinkingMessageElement.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    thinkingMessageElement.textContent = 'Failed to get response from server.';
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

// Function to append a message to the chat box and return the element
function appendMessage(sender, text, isThinking = false) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', sender);
  
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  if (isThinking) {
    msg.innerHTML = `
      <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
  } else {
    // For user text, just use textContent to avoid XSS
    msg.textContent = text;
  }
  
  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  // Return the created message element so we can modify it later
  return msg;
}

// Simple formatter for bot responses to handle markdown-like text
function formatText(text) {
  // Escape HTML first to prevent XSS
  let formatted = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Code blocks: ```code```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code: `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Line breaks -> <br>
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}
