document.addEventListener('DOMContentLoaded', () => {
    const modelDropdown = document.getElementById('model-dropdown');
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    // Fetch models from Ollama API
    const fetchModels = async () => {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (!response.ok) {
                 throw new Error("HTTP error! status: " + response.status);
            }
            const data = await response.json();
            modelDropdown.innerHTML = '';
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.text = model.name;
                modelDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to fetch models:', error);
            modelDropdown.innerHTML = '<option value="" disabled>Error loading models</option>';
        }
    };

    fetchModels();

    // Send message to Ollama API
    const sendMessage = async (message, model) => {
        if (!message || !model) return;

        const messageDiv = document.createElement('div');
        messageDiv.textContent = `User: ${message}`;
        chatLog.appendChild(messageDiv);

        chatInput.value = '';

        try {
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: message }],
                    stream: false
                }),
            });

            if (!response.ok) {
                 throw new Error("HTTP error! status: " + response.status);
            }

            const data  = await response.json();
            const responseDiv = document.createElement('div');
            const codeView = document.getElementById('code-view');
            const codeRegex = /```([\w-]+)?\n([\s\S]*?)```/g;
            let content = data.message.content;
            let match;
            let codeFound = false;

            while ((match = codeRegex.exec(content)) !== null) {
                codeFound = true;
                const lang = match[1] || 'plaintext';
                const code = match[2];
                const codeBlock = document.createElement('pre');
                codeBlock.innerHTML = `<code class="language-${lang}">${code}</code>`;
                codeView.appendChild(codeBlock);
                content = content.replace(match[0], '');
            }

            if (codeFound) {
                codeView.style.display = 'block';
                hljs.highlightAll();
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close Code View';
                closeButton.onclick = () => {
                    codeView.style.display = 'none';
                    codeView.innerHTML = '';
                };
                codeView.appendChild(closeButton);
            }

            responseDiv.textContent = `Ollama: ${content}`;
            chatLog.appendChild(responseDiv);
            chatLog.scrollTop = chatLog.scrollHeight;


        } catch (error) {
            console.error('Failed to send message:', error);
            const errorDiv = document.createElement('div');
            errorDiv.textContent = 'Error sending message.';
            chatLog.appendChild(errorDiv);
        }
    };

    sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        const selectedModel = modelDropdown.value;
        sendMessage(message, selectedModel);
    });

    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const message = chatInput.value.trim();
            const selectedModel = modelDropdown.value;
            sendMessage(message, selectedModel);
        }
    });
});
