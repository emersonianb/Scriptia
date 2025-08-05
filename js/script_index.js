document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  });
  
  document.querySelectorAll('.fade-section').forEach(section => {
    observer.observe(section);
  });
  

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const prompt = input.value;
    if (!prompt.trim()) return;

    try {
      console.log("Enviando solicitação para a API da Groq...");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      const data = await response.json();
      console.log("Resposta da API recebida:", data);

      const reply = data.choices?.[0]?.message?.content || "Em breve.";
      const encodedReply = encodeURIComponent(reply);
      window.location.href = `demo.html?resposta=${encodedReply}`;

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar com a API.");
    }
  });
});
