import { translateToMalayalam } from './lib/gemini';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'TRANSLATE') {
        chrome.storage.local.get(['dravida_api_key'], (result) => {
            const apiKey = result.dravida_api_key as string;
            if (!apiKey) {
                sendResponse({ success: false, error: 'Please set your API Key in the DravidaTalk extension settings.' });
                return;
            }

            translateToMalayalam(request.text, apiKey)
                .then(translated => {
                    sendResponse({ success: true, translated });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
        });
        return true;
    }

    if (request.type === 'PLAY_AUDIO') {
        const encodedText = encodeURIComponent(request.text);
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ml&client=tw-ob`;

        fetch(audioUrl)
            .then(res => res.arrayBuffer())
            .then(buffer => {
                const base64 = btoa(
                    new Uint8Array(buffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                sendResponse({ success: true, audioData: `data:audio/mpeg;base64,${base64}` });
            })
            .catch(err => {
                sendResponse({ success: false, error: err.message });
            });
        return true;
    }
});
