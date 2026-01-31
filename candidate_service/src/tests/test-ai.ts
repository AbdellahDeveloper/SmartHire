import { generateText } from 'ai';
import { getModel } from '../lib/ai-provider';

async function test() {
    try {
        console.log("Testing gpt-5-nano...");
        const model = await getModel();
        const { text } = await generateText({
            model,
            prompt: 'Hello, are you there?'
        })
        console.log("Response:", text);
    } catch (error: any) {
        console.error("AI Error:", error.message);
    }
}

test();
