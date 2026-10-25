// Vercel serverless function: POST /api/chat
// Add GEMINI_API_KEY in Vercel Project Settings > Environment Variables.
// Never put the API key in public HTML or commit it to GitHub.

const ALLOWED_ORIGINS = new Set([
  "https://martaedhyx.github.io",
]);

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan metode POST." });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "Backend belum dikonfigurasi: tambahkan GEMINI_API_KEY di Environment Variables hosting." });

  const body = req.body || {};
  const question = typeof body.message === "string" ? body.message.trim() : "";
  const filter = typeof body.filter === "string" ? body.filter.slice(0, 40) : "Semua Web";
  if (!question) return res.status(400).json({ error: "Pertanyaan masih kosong." });
  if (question.length > 6000) return res.status(413).json({ error: "Pertanyaan terlalu panjang (maksimal 6.000 karakter)." });

  const filterInstructions = {
    "Semua Web": "Gunakan Google Search bila perlu.",
    "YouTube": "Prioritaskan hasil dan tautan dari youtube.com. Jika tidak menemukan sumber relevan, katakan demikian.",
    "TikTok": "Prioritaskan sumber publik dari tiktok.com. Jangan mengarang hasil.",
    "X": "Prioritaskan sumber publik dari x.com atau twitter.com. Jelaskan jika akses terbatas.",
    "GitHub": "Prioritaskan github.com untuk kode dan repositori.",
    "Reddit": "Prioritaskan diskusi publik di reddit.com.",
    "Scholar": "Prioritaskan paper ilmiah, jurnal, dan Google Scholar; bedakan penelitian dari opini.",
    "News": "Prioritaskan berita terbaru dan sertakan tanggal serta tautan sumber bila tersedia."
  };
  const instructions = filterInstructions[filter] || filterInstructions["Semua Web"];

  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Kamu adalah Edhy Robot, asisten AI berbahasa Indonesia yang membantu dan jujur. Untuk informasi terkini, gunakan Google Search dan sertakan sumber/tautan bila tersedia. Jangan mengaku telah menjalankan tindakan di perangkat, akun, atau internet jika tidak benar-benar dilakukan. Saat diminta menjalankan tugas, jelaskan langkah yang bisa dilakukan dan minta persetujuan sebelum tindakan berisiko. " + instructions }]
        },
        contents: [{ role: "user", parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      const status = upstream.status;
      const message = data?.error?.message || "Layanan AI gagal merespons.";
      return res.status(status === 429 ? 429 : 502).json({
        error: status === 400 || status === 403
          ? "API Gemini menolak permintaan. Periksa API key, akses model, dan pengaturan proyek Google AI."
          : status === 429
            ? "Batas penggunaan API tercapai. Coba lagi nanti."
            : message
      });
    }

    const candidate = data?.candidates?.[0];
    const answer = candidate?.content?.parts?.map(p => p.text || "").join("\n").trim();
    if (!answer) {
      const reason = candidate?.finishReason;
      return res.status(502).json({ error: "AI tidak mengembalikan jawaban teks" + (reason ? " (status: " + reason + ")" : "") + ". Coba tulis ulang pertanyaan." });
    }

    const grounding = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = grounding
      .map(item => item?.web)
      .filter(web => web?.uri && web?.title)
      .map(web => ({ title: String(web.title).slice(0, 240), url: web.uri }))
      .filter((item, index, all) => all.findIndex(x => x.url === item.url) === index)
      .slice(0, 8);

    return res.status(200).json({ answer, sources });
  } catch (err) {
    return res.status(502).json({ error: "Tidak bisa terhubung ke layanan AI. Periksa koneksi backend dan coba lagi." });
  }
};
