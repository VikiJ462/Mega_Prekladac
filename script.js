// script.js
// Zde už nepotřebujeme let pinyinPro = null; ani dynamický import.
// Spoleháme se na to, že pinyin-pro.min.js definuje window.pinyin.

document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const translateButton = document.getElementById('translateButton');
    const translatedTextDiv = document.getElementById('translatedText');
    const errorMessageDiv = document.getElementById('errorMessage');

    const LINGVA_API_BASE_URL = 'https://lingva.ml/api/v1/';

    function displayError(message) {
        errorMessageDiv.textContent = message;
        translatedTextDiv.innerHTML = 'Překlad se nezdařil.';
    }

    function clearMessages() {
        errorMessageDiv.textContent = '';
        translatedTextDiv.innerHTML = 'Překládám...';
    }

    // Odstranili jsme kód pro dynamický import, protože na webovém serveru by měl fungovat přímo tag <script>.
    // Funkce getPinyin teď pouze kontroluje window.pinyin.
    function getPinyin(chineseText) {
        // Zde je klíčová kontrola - čekáme na window.pinyin
        if (typeof window.pinyin === 'function') {
            console.log('Používám window.pinyin pro generování pinyinu.');
            // 'pattern: "pinyin"' zajistí, že se vrátí skutečný pinyin, ne původní znaky
            // 'splitter: " "' pro mezery mezi slabikami
            // 'toneType: "symbol"' pro tóny (nǐ hǎo)
            return window.pinyin(chineseText, { toneType: 'symbol', pattern: 'pinyin', splitter: ' ' });
        } else {
            console.error('Kritická chyba: Funkce window.pinyin není dostupná i po načtení.');
            // Tato zpráva by se neměla objevit na správně nasazeném serveru
            return '';
        }
    }

    translateButton.addEventListener('click', async () => {
        const textToTranslate = inputText.value.trim();
        const selectedSourceLang = sourceLang.value;
        const selectedTargetLang = targetLang.value;

        clearMessages();

        if (!textToTranslate) {
            displayError('Prosím, zadejte text k překladu.');
            return;
        }

        if (selectedSourceLang !== 'auto' && selectedSourceLang === selectedTargetLang) {
            displayError('Zdrojový a cílový jazyk nemohou být stejné, pokud není zdrojový jazyk "Automaticky detekovat".');
            return;
        }

        try {
            const apiUrl = `${LINGVA_API_BASE_URL}${selectedSourceLang}/${selectedTargetLang}/${encodeURIComponent(textToTranslate)}`;
            console.log('Volám Lingva API:', apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorDetail = await response.text().catch(() => 'Neznámý detail chyby');
                console.error(`Chyba při volání Lingva API (${response.status} ${response.statusText}):`, errorDetail);
                displayError(`Nepodařilo se dokončit překlad. Zkuste to prosím znovu.`);
                return;
            }

            const data = await response.json();
            console.log('Odpověď z Lingva API:', data);

            let translation = '';
            if (data && typeof data.translation === 'string') {
                translation = data.translation;
            } else {
                console.warn('Lingva API vrátilo neočekávanou strukturu dat pro překlad, nebo prázdný překlad:', data);
                displayError('Překlad se nezdařil. Neočekávaná odpověď z překladače.');
                return;
            }

            let pinyinText = '';
            // Pinyin získáme pouze pokud je cílovým jazykem čínština A pokud existuje přeložený text
            if (selectedTargetLang === 'zh' && translation) {
                pinyinText = getPinyin(translation); // Voláme naši pomocnou funkci
                if (!pinyinText) { // Pokud getPinyin vrátí prázdný řetězec
                    errorMessageDiv.textContent = 'Pinyin není k dispozici (načítání se nezdařilo).';
                } else {
                    errorMessageDiv.textContent = ''; // Vymažeme zprávu, pokud pinyin funguje
                }
            }

            // Zobrazení překladu a pinyinu
            let outputHtml = `<div>${translation}</div>`;
            if (pinyinText) {
                outputHtml += `<div class="pinyin-text">${pinyinText}</div>`;
            }
            translatedTextDiv.innerHTML = outputHtml;

        } catch (error) {
            console.error('Došlo k chybě při překladu nebo generování pinyinu:', error);
            displayError('Došlo k chybě při komunikaci s překladačem nebo generování pinyinu. Zkuste to prosím znovu.');
        }
    });
});