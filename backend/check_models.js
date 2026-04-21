import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // There isn't a direct listModels method on the client instance in some versions,
        // but let's try a simple generation to see if 'gemini-pro' works,
        // or use the modelManager if available in recent SDKs.
        // Actually, simply try to generate with 'gemini-1.5-flash' and print the error detailedly.
        // Or better, standard `gemini-pro`.

        console.log("Checking gemini-1.5-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash: OK");
        } catch (e) { console.log("gemini-1.5-flash: FAILED - " + e.message); }

        console.log("Checking gemini-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello");
            console.log("gemini-pro: OK");
        } catch (e) { console.log("gemini-pro: FAILED - " + e.message); }

        console.log("Checking gemini-1.5-flash-latest...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash-latest: OK");
        } catch (e) { console.log("gemini-1.5-flash-latest: FAILED - " + e.message); }

    } catch (err) {
        console.error("Script error:", err);
    }
}

listModels();
