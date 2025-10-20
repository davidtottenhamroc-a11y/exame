// O script.js deve ser salvo em um arquivo separado na mesma pasta.

const dataLimiteInput = document.getElementById('data-limite');
const iniciarTesteBtn = document.getElementById('iniciar-teste');
const statusArea = document.getElementById('status-area');
const micStatus = document.getElementById('mic-status');
const cameraStatus = document.getElementById('camera-status');
const logsStatus = document.getElementById('logs-status');
const cameraFeed = document.getElementById('camera-feed');

// Função de utilidade para atualizar o status
function updateStatus(message, color = 'yellow') {
    statusArea.textContent = `Status: ${message}`;
    statusArea.style.color = color;
}

// ----------------------------------------------------
// FUNÇÕES DE TESTE DE MICROFONE (WebRTC)
// ----------------------------------------------------

async function testarMicrofone() {
    updateStatus('Iniciando teste de microfone (requer permissão do navegador)...');
    micStatus.textContent = "Status Microfone: Aguardando detecção...";

    try {
        // Pede acesso apenas ao áudio
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let volumePico = 0;
        
        // Coleta o nível de som por 3 segundos
        const tempoFim = Date.now() + 3000;
        
        function medirVolume() {
            analyser.getByteFrequencyData(dataArray);
            const volumeAtual = dataArray.reduce((a, b) => a + b) / dataArray.length;
            if (volumeAtual > volumePico) volumePico = volumeAtual;

            if (Date.now() < tempoFim) {
                requestAnimationFrame(medirVolume);
            } else {
                // Para o stream
                stream.getTracks().forEach(track => track.stop());
                
                const limiteVolume = 10; // Limite baixo para detecção de áudio
                if (volumePico > limiteVolume) {
                    micStatus.textContent = "✅ Microfone: FUNCIONANDO (som detectado).";
                    updateStatus('Microfone testado com sucesso!', 'lightgreen');
                } else {
                    micStatus.textContent = "❌ Microfone: SILENCIOSO. Verifique se você deu a permissão e se o microfone está ligado.";
                    updateStatus('Microfone testado. Detecção de som baixa.', 'orange');
                }
            }
        }
        medirVolume();

    } catch (err) {
        micStatus.textContent = "❌ Microfone: ERRO! Permissão negada ou microfone não encontrado.";
        updateStatus('Erro no teste de microfone.', 'red');
    }
}

// ----------------------------------------------------
// FUNÇÕES DE TESTE DE CÂMERA (WebRTC)
// ----------------------------------------------------

async function testarCamera() {
    updateStatus('Iniciando teste de câmera (requer permissão do navegador)...', 'yellow');
    cameraStatus.textContent = "Status Câmera: Aguardando feed...";
    cameraFeed.style.display = 'block'; // Mostra o elemento de vídeo

    try {
        // Pede acesso apenas ao vídeo
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraFeed.srcObject = stream;

        // Ação de 'Print' (Adaptada para Web): Tira uma foto do feed da câmera e exibe.
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = cameraFeed.videoWidth;
            canvas.height = cameraFeed.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
            
            // Exibe a 'foto' como print na tela
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.maxWidth = '100%';
            
            cameraFeed.parentNode.insertBefore(img, cameraFeed.nextSibling);

            // Para o stream da câmera após a 'captura'
            stream.getTracks().forEach(track => track.stop());
            cameraFeed.style.display = 'none';

            cameraStatus.textContent = "✅ Câmera: FUNCIONANDO (Imagem capturada e exibida).";
            updateStatus('Teste de câmera concluído.', 'lightgreen');

        }, 5000); // Espera 5 segundos para 'capturar' o print (em vez de 60s)

    } catch (err) {
        cameraFeed.style.display = 'none';
        cameraStatus.textContent = "❌ Câmera: ERRO! Permissão negada ou câmera não encontrada.";
        updateStatus('Erro no teste de câmera.', 'red');
    }
}


// ----------------------------------------------------
// FUNÇÃO PRINCIPAL DE INÍCIO
// ----------------------------------------------------

iniciarTesteBtn.addEventListener('click', async () => {
    // 1. Coleta a data (não é usada para logs, mas mantém a lógica de coleta de dados)
    const dataLimite = dataLimiteInput.value;
    logsStatus.textContent = `Logs do EasyProctor e Eventos do Windows NÃO podem ser coletados via web por segurança. Data Limite registrada: ${dataLimite}`;

    // Limpa resultados anteriores
    micStatus.textContent = "";
    cameraStatus.textContent = "";
    const oldImg = cameraFeed.nextElementSibling;
    if (oldImg && oldImg.tagName === 'IMG') {
        oldImg.remove();
    }
    
    iniciarTesteBtn.disabled = true;
    updateStatus('Iniciando testes...');

    // 2. Inicia os testes sequencialmente
    await testarMicrofone();
    await testarCamera();
    
    iniciarTesteBtn.disabled = false;
    updateStatus('Todos os testes de hardware concluídos!', 'lightgreen');
});


// Seta a data de hoje como padrão ao carregar a página
dataLimiteInput.valueAsDate = new Date();