const express = require("express");
const multer = require("multer");
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} = require("@google/generative-ai");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(express.static("public"));

// Multer를 사용하여 이미지 업로드 처리
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
});

// 루트 경로에 대한 GET 요청 처리
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI("api key");
        const model = genAI.getGenerativeModel({
            model: "gemini-pro-vision"
        });

        const generationConfig = {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
        };

        const safetySettings = [{
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
        ];

        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const parts = [{
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: req.file.buffer.toString("base64"),
                },
            },
            {
                text: "이 꽃에 대해 설명해 줘."
            },
        ];

        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts
            }],
            generationConfig,
            safetySettings,
        });

        const response = result.response;
        res.send(response.text());
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
