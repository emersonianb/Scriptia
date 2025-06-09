  document.addEventListener("DOMContentLoaded", () => {
    const btnInsights = document.getElementById("btnInsights");
    const btnEmotion = document.getElementById("btnEmotion");
    const btnStoryboard = document.getElementById("btnStoryboard");
    const btnGoBack = document.getElementById("btnGoBack");
    const btnSave = document.getElementById("btnSave");
    const output = document.getElementById("insightsOutput");
    const toastEl = document.getElementById("myToast");
    const modalSuccess = new bootstrap.Modal(document.getElementById('modalSuccess'));
    const { jsPDF } = window.jspdf;
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          ['link', 'image'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });

    btnModifica.style.display = "none";

    const urlParams = new URLSearchParams(window.location.search);
    const resposta = urlParams.get('resposta');
    if (resposta) {
      const decoded = decodeURIComponent(resposta);
      quill.root.innerHTML = decoded;
    }

    function getTextoEditor() {
      return quill.getText().trim();
    }

    async function enviarPrompt(promptBase, userText) {
    if (!output || !toastEl) return;

    output.innerText = "Carregando...";

    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{
            role: "user",
            content: promptBase.replace("${userText}", userText)
          }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      let reply = data.choices?.[0]?.message?.content || "Sem resposta da IA.";

      reply = reply.replace(/"([^"]+)"/g, '**$1**');

      const sugestoesMatch = reply.match(/Sugestões:\s*([\s\S]*?)\nExemplo:/i);
      const exemploMatch = reply.match(/Exemplo:\s*([\s\S]*)/i);

      const sugestoes = sugestoesMatch ? sugestoesMatch[1].trim() : "";
      const exemplo = exemploMatch ? exemploMatch[1].trim() : "";

      output.dataset.fullText = sugestoes;
      output.dataset.exampleText = exemplo;

      output.innerText = sugestoes.length > 300
        ? sugestoes.substring(0, 300) + '...'
        : sugestoes;

      setTimeout(() => {
        const btnVerMais = document.getElementById("btnVerMais");
        const btnModifica = document.getElementById("btnModifica");

        btnVerMais?.addEventListener("click", () => {
          output.innerText = output.dataset.fullText;
        });

        btnModifica?.addEventListener("click", () => {
          quill.setText(output.dataset.exampleText || "");
          const toast = bootstrap.Toast.getInstance(toastEl);
          toast.hide();
        });
      }, 100);

    } catch (error) {
      console.error("Erro:", error);
      output.innerText = "Erro ao conectar com a API.";
    }
  }

    btnInsights?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("emotionCharts").style.display = "none";
      btnModifica.style.display = "inline-block";  // MOSTRA o botão aplicar
      const texto = getTextoEditor();
      if (!texto) return alert("Digite algo no editor primeiro.");

      const promptBase = `
        Analise e sugira melhorias para o seguinte texto:

        "${texto}"

        Responda EXATAMENTE neste formato:

        Sugestões:
        - 
        - 
        Exemplo:
        Aqui vai um exemplo corrigido do texto original com as melhorias aplicadas.

        Não adicione nada fora dessas seções.
        `;

      enviarPrompt(promptBase, ""); // Passa vazio pois já embutiu o texto
    });



    btnEmotion?.addEventListener("click", (e) => {
      e.preventDefault();
      btnModifica.style.display = "none";  // ESCONDE o botão aplicar
      const texto = getTextoEditor();
      if (!texto) return alert("Digite algo no editor primeiro.");

      output.innerText = "Carregando...";
      output.dataset.fullText = "";
      document.getElementById("emotionCharts").style.display = "none";

      const toast = new bootstrap.Toast(toastEl);
      toast.show();

      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{
            role: "user",
            content: `Analise que emoções o texto abaixo passa. Identifique principais emoções (alegria, tristeza, raiva, medo, surpresa, etc), classifique o tom geral (positivo, neutro, negativo) e mostre como as emoções variam ao longo do texto. Responda tudo isso sem asteriscos, so com pontos:\n\n"${texto}"`
          }],
          temperature: 0.7,
          max_tokens: 1000
        })
      })
      .then(res => res.json())
      .then(data => {
        const reply = data.choices?.[0]?.message?.content || "Sem resposta da IA.";
        output.dataset.fullText = reply;

        const preview = reply.length > 300 ? reply.slice(0, 300) + '...' : reply;
        output.innerText = preview;

        renderEmotionCharts({
          emotions: { alegria: 40, tristeza: 20, raiva: 15, medo: 10, surpresa: 15 },
          sentiment: { positivo: 60, negativo: 40 },
          timeline: [20, 40, 30, 50, 60]
        });

        document.getElementById("emotionCharts").style.display = "block";

        const btnVerMais = document.getElementById("btnVerMais");
        const btnModifica = document.getElementById("btnModifica");

        btnVerMais.onclick = () => {
          output.innerText = output.dataset.fullText;
        };
      })
      .catch(err => {
        console.error("Erro:", err);
        output.innerText = "Erro ao obter análise de emoções.";
      });
    });

    btnStoryboard.addEventListener("click", (e) => {
      e.preventDefault();

      // Esconde o botão aplicar, charts, etc
      btnModifica.style.display = "none";
      document.getElementById("emotionCharts").style.display = "none";

      // Mostrar o modal "Em Breve"
      const modalStoryboard = new bootstrap.Modal(document.getElementById('modalStoryboard'));
      modalStoryboard.show();
    });

    btnGoBack?.addEventListener("click", () => {
      window.history.back();
    });

    btnSave?.addEventListener("click", () => {
      const texto = quill.getText();
      if (!texto.trim()) {
        alert("O editor está vazio. Por favor, escreva algo antes de salvar.");
        return;
      }

      const doc = new jsPDF();
      const lines = doc.splitTextToSize(texto, 180);
      doc.text(lines, 10, 10);

      doc.save("scriptia.pdf");

      modalSuccess.show();
    });


    let chart1, chart2, chart3;

    function renderEmotionCharts(data) {
      const ctx1 = document.getElementById("chartEmotions").getContext("2d");
      const ctx2 = document.getElementById("chartSentiment").getContext("2d");
      const ctx3 = document.getElementById("chartTimeline").getContext("2d");

      chart1?.destroy();
      chart2?.destroy();
      chart3?.destroy();

      chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: Object.keys(data.emotions),
          datasets: [{
            label: 'Emoções',
            data: Object.values(data.emotions),
            backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff']
          }]
        }
      });

      chart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Positivo', 'Negativo'],
          datasets: [{
            label: 'Sentimento Geral',
            data: [data.sentiment.positivo, data.sentiment.negativo],
            backgroundColor: ['#4caf50', '#f44336']
          }]
        }
      });

      chart3 = new Chart(ctx3, {
        type: 'line',
        data: {
          labels: data.timeline.map((_, i) => `Trecho ${i + 1}`),
          datasets: [{
            label: 'Evolução Emocional',
            data: data.timeline,
            borderColor: '#2196f3',
            tension: 0.3
          }]
        }
      });
    }
  });
