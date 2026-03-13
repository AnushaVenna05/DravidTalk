// Content script for DravidaTalk

let selectionTooltip: HTMLDivElement | null = null;
let translationPopup: HTMLDivElement | null = null;

function cleanup(target?: Node) {
    // If we clicked inside the popup, don't cleanup
    if (target && (translationPopup?.contains(target) || selectionTooltip?.contains(target))) {
        return;
    }

    if (selectionTooltip) {
        selectionTooltip.remove();
        selectionTooltip = null;
    }
    if (translationPopup) {
        translationPopup.remove();
        translationPopup = null;
    }
}

// Global listener to close popups when clicking elsewhere
document.addEventListener('mousedown', (e) => {
    cleanup(e.target as Node);
});

document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) {
        return;
    }


    // Only show tooltip if we are NOT clicking inside existing UI
    if (selectionTooltip?.contains(e.target as Node) || translationPopup?.contains(e.target as Node)) {
        return;
    }

    showTooltip(e.pageX, e.pageY, selectedText);
});

function showTooltip(x: number, y: number, text: string) {
    if (selectionTooltip) selectionTooltip.remove();

    selectionTooltip = document.createElement('div');
    selectionTooltip.id = 'dravida-talk-tooltip';

    // Styles for the floating action button
    Object.assign(selectionTooltip.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y - 45}px`,
        zIndex: '2147483647',
        cursor: 'pointer',
        background: '#0B3D2E',
        borderRadius: '14px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 15px -3px rgba(11, 61, 46, 0.2)',
        border: '2px solid #D4AF37',
        transition: 'transform 0.2s ease',
    });

    // A more custom icon representing the bridge (Telugu/Malayalam style)
    selectionTooltip.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 16px;">🌴</span>
      <span style="color: #D4AF37; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 800;">Translate</span>
    </div>
  `;

    selectionTooltip.addEventListener('mouseenter', () => {
        if (selectionTooltip) selectionTooltip.style.transform = 'scale(1.1)';
    });
    selectionTooltip.addEventListener('mouseleave', () => {
        if (selectionTooltip) selectionTooltip.style.transform = 'scale(1)';
    });

    selectionTooltip.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
    });

    selectionTooltip.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        e.preventDefault();
        translateAndShow(text, x, y);
    });

    document.body.appendChild(selectionTooltip);
}

async function translateAndShow(text: string, x: number, y: number) {
    if (selectionTooltip) {
        selectionTooltip.remove();
        selectionTooltip = null;
    }

    translationPopup = document.createElement('div');
    translationPopup.id = 'dravida-talk-popup';

    Object.assign(translationPopup.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y + 15}px`,
        zIndex: '2147483647',
        background: 'white',
        color: '#1f2937',
        padding: '18px',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '280px',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        border: '2px solid #D4AF37',
        animation: 'mkFadeIn 0.2s ease-out'
    });

    // Add animation style to document if not present
    if (!document.getElementById('mk-styles')) {
        const style = document.createElement('style');
        style.id = 'mk-styles';
        style.innerHTML = `
      @keyframes mkFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mkSpin {
        to { transform: rotate(360deg); }
      }
      .mk-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #D4AF37;
        border-top-color: transparent;
        border-radius: 50%;
        animation: mkSpin 0.8s linear infinite;
      }
    `;
        document.head.appendChild(style);
    }

    translationPopup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #D4AF37; padding-bottom: 8px;">
      <span style="font-size: 20px;">🌴</span>
      <span style="font-size: 14px; color: #0B3D2E; font-weight: 900; letter-spacing: 0.02em;">DravidaTalk</span>
    </div>
    <div id="mk-loading" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5C6B66; font-style: italic;">
      <div class="mk-spinner"></div>
      Seeking meaning...
    </div>
    <div id="mk-result" style="font-size: 18px; font-weight: 700; color: #1A2421; margin-top: 4px; display: none; line-height: 1.5;"></div>
    <div id="mk-footer" style="display: none; gap: 10px; margin-top: 16px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
      <button id="mk-speak" style="background: #0B3D2E; border: 1px solid #D4AF37; border-radius: 10px; padding: 8px 14px; cursor: pointer; color: #D4AF37; font-size: 13px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
        <svg id="mk-speak-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        Listen
      </button>
      <button id="mk-stop" style="background: #ef4444; border: none; border-radius: 10px; padding: 8px 14px; cursor: pointer; color: white; font-size: 13px; display: none; align-items: center; gap: 8px; font-weight: 700;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="12" height="12" x="6" y="6" rx="1" ry="1" fill="white"/></svg>
        Stop
      </button>
      <button id="mk-copy" style="background: #FDFAF3; border: 1px solid #D4AF37; border-radius: 10px; padding: 8px 14px; cursor: pointer; color: #0B3D2E; font-size: 13px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        Copy
      </button>
    </div>
  `;

    document.body.appendChild(translationPopup);

    try {
        chrome.runtime.sendMessage({ type: 'TRANSLATE', text }, (response: { success: boolean, translated: string, error?: string }) => {
            const loadingEl = document.getElementById('mk-loading');
            const resultEl = document.getElementById('mk-result');
            const footerEl = document.getElementById('mk-footer');
            const speakBtn = document.getElementById('mk-speak');
            const stopBtn = document.getElementById('mk-stop');
            const copyBtn = document.getElementById('mk-copy');

            if (loadingEl) loadingEl.style.display = 'none';

            if (response && response.success) {
                if (resultEl) {
                    const parts = response.translated.split('(');
                    const malayalam = parts[0].trim();
                    const transliteration = parts[1] ? parts[1].replace(')', '') : '';

                    resultEl.innerHTML = `
                        <div style="font-size: 24px; color: #0B3D2E; margin-bottom: 4px;">${malayalam}</div>
                        ${transliteration ? `<div style="font-size: 15px; color: #165C45; font-weight: 700; font-style: italic; opacity: 0.9;">${transliteration}</div>` : ''}
                    `;
                    resultEl.style.display = 'block';
                }
                if (footerEl) footerEl.style.display = 'flex';

                let currentAudio: HTMLAudioElement | null = null;

                const toggleAudio = (playing: boolean) => {
                    if (speakBtn) speakBtn.style.display = playing ? 'none' : 'flex';
                    if (stopBtn) stopBtn.style.display = playing ? 'flex' : 'none';
                };

                if (speakBtn) {
                    speakBtn.onclick = () => {
                        if (currentAudio) {
                            currentAudio.pause();
                            toggleAudio(false);
                        }

                        const malayalamOnly = response.translated.split('(')[0].trim();

                        // Use background script to fetch audio and bypass CSP
                        chrome.runtime.sendMessage({ type: 'PLAY_AUDIO', text: malayalamOnly }, (audioResponse) => {
                            if (audioResponse && audioResponse.success) {
                                currentAudio = new Audio(audioResponse.audioData);
                                currentAudio.onplay = () => toggleAudio(true);
                                currentAudio.onended = () => toggleAudio(false);
                                currentAudio.onerror = () => toggleAudio(false);
                                currentAudio.play();
                            }
                        });
                    };
                }

                if (stopBtn) {
                    stopBtn.onclick = () => {
                        if (currentAudio) {
                            currentAudio.pause();
                            currentAudio = null;
                        }
                        toggleAudio(false);
                    };
                }

                if (copyBtn) {
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(response.translated).then(() => {
                            const originalContent = copyBtn.innerHTML;
                            copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied';
                            setTimeout(() => { copyBtn.innerHTML = originalContent; }, 2000);
                        });
                    };
                }
            } else {
                if (resultEl) {
                    resultEl.innerText = "Error: " + (response?.error || "Connection failed");
                    resultEl.style.display = 'block';
                    resultEl.style.color = '#ef4444';
                    resultEl.style.fontSize = '12px';
                }
            }
        });
    } catch (err) {
        const loadingEl = document.getElementById('mk-loading');
        if (loadingEl) loadingEl.innerText = "Please refresh the page to use DravidaTalk.";
    }
}
