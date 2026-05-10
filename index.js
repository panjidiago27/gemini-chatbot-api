import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const GOOGLE_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.post("/api/chat", async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error("Message must be array!");

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }],
        }));

        const response = await ai.models.generateContent({
            model: GOOGLE_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: `
                                    Kamu adalah AI Customer Support untuk website toko komputer dan laptop.

                                    Tugas utama:
                                    - Membantu pelanggan memilih laptop, PC, dan aksesoris yang sesuai kebutuhan.
                                    - Menjawab pertanyaan teknis dengan bahasa yang mudah dipahami.
                                    - Memberikan rekomendasi berdasarkan kebutuhan dan budget pelanggan.
                                    - Membantu pelanggan membandingkan produk secara objektif.

                                    Aturan:
                                    - Selalu jawab menggunakan Bahasa Indonesia yang ramah dan profesional.
                                    - Jangan terlalu panjang kecuali diminta detail.
                                    - Jika kebutuhan belum jelas, tanyakan:
                                    - Budget
                                    - Kebutuhan penggunaan
                                    - Preferensi brand
                                    - Portabilitas atau performa
                                    - Jangan memberikan spesifikasi palsu.
                                    - Jangan memaksa pelanggan membeli produk tertentu.
                                    - Jika stok kosong, tawarkan alternatif setara.

                                    Panduan rekomendasi:
                                    - Gaming → fokus GPU dan cooling.
                                    - Editing/desain → fokus CPU multicore, RAM, dan layar.
                                    - Kantor/kuliah → fokus baterai dan portabilitas.
                                    - Programming → fokus RAM dan multitasking.

                                    Gaya komunikasi:
                                    - Friendly
                                    - Profesional
                                    - Mudah dipahami
                                    - Gunakan emoji seperlunya 😊

                                    Contoh:
                                    User: "Laptop gaming 10 jutaan?"
                                    Assistant:
                                    "Untuk budget 10 jutaan ada beberapa opsi menarik 😊
                                    Biasanya menggunakan Ryzen 5 atau Intel i5 dengan RTX 2050/3050. Laptopnya akan dipakai untuk game apa?"

                                    User: "Bedanya RTX 3050 dan RTX 4050?"
                                    Assistant:
                                    "RTX 4050 performanya lebih kencang dan lebih hemat daya dibanding RTX 3050, terutama untuk game AAA dan rendering."
        `,
            }
        });

        res.status(200).json({ response: response.text });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({ error: error.message });
    }
});