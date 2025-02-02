document.addEventListener('DOMContentLoaded', () => {
    const modelDropdown = document.getElementById('model-dropdown');
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const fileButton = document.getElementById('file-button');
    const fileUpload = document.getElementById('file-upload');
    const aiResponseBox = document.getElementById('ai-response-box');

    // Load selected model from local storage
    const loadSelectedModel = () => {
        return localStorage.getItem('selectedModel');
    };

    // Save selected model to local storage
    const saveSelectedModel = (model) => {
        localStorage.setItem('selectedModel', model);
    };

    // Fetch models from Ollama API
    const fetchModels = async () => {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (!response.ok) {
                 throw new Error("HTTP error! status: " + response.status);
            }
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

            // Set selected model from local storage or default to first model
            const selectedModel = loadSelectedModel();
            if (selectedModel) {
                modelDropdown.value = selectedModel;
            } else if (data.models.length > 0) {
                modelDropdown.value = data.models[0].name;
                saveSelectedModel(data.models[0].name);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            modelDropdown.innerHTML = '<option value="" disabled>Error loading models</option>';
        }
    };

    fetchModels();

    // Event listener for model dropdown change
    modelDropdown.addEventListener('change', (event) => {
        saveSelectedModel(event.target.value);
    });


    // Send message to Ollama API
    const sendMessage = async (message, model) => {
        if (!message || !model) return;

        const messageDiv = document.createElement('div');
        messageDiv.textContent = `User: ${message}`;
        chatLog.appendChild(messageDiv);

        chatInput.value = '';
        aiResponseBox.style.display = 'block'; // Show AI response box

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
            aiResponseBox.style.display = 'none'; // Hide AI response box after response
            let content = data.message.content;

            // Format content with markdown-like paragraph breaks and code blocks
            content = content.split('\n\n').map(paragraph => {
                if (paragraph.startsWith('```')) {
                    const codeBlock = paragraph.match(/```([\w-]+)?\n([\s\S]*?)```/s);
                    if (codeBlock) {
                        const lang = codeBlock[1] || 'plaintext';
                        const code = codeBlock[2];
                        const highlightedCode = hljs.highlight(code, { language: lang }).value;
                        return `<div class="code-message"><pre><code class="hljs language-${lang}">${highlightedCode}</code></pre></div>`;
                    }
                }
                return `<p>${paragraph}</p>`;
            }).join('');


            responseDiv.innerHTML = `Ollama: ${content}`;
            chatLog.appendChild(responseDiv);
            chatLog.scrollTop = chatLog.scrollHeight;
            hljs.highlightAll(); // Re-highlight any new code blocks


        } catch (error) {
            console.error('Failed to send message:', error);
            const errorDiv = document.createElement('div');
            errorDiv.textContent = 'Error sending message.';
            chatLog.appendChild(errorDiv);
            aiResponseBox.style.display = 'none'; // Hide AI response box on error
        }
    };

    fileButton.addEventListener('click', () => {
        fileUpload.click(); // Trigger file input when button is clicked
    });

    fileUpload.addEventListener('change', () => {
        const file = fileUpload.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const fileContent = event.target.result;
                chatInput.value += `\n\nFile Content:\n${file.name}\n\`\`\`\n${fileContent}\n\`\`\``;
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Failed to read file.");
            };
            reader.readAsText(file); // Or readAsDataURL, etc., depending on needs
        }
    });

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
