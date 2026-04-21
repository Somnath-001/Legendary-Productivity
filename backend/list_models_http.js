import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function check() {
    try {
        const r = await fetch(url);
        const data = await r.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
