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
            console.log('Volám API:', apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorDetail = await response.text().catch(() => 'Neznámý detail chyby');
                console.error(`Chyba při volání API (${response.status} ${response.statusText}):`, errorDetail);
                displayError(`Nepodařilo se dokončit překlad. Zkuste to prosím znovu.`);
                return;
            }

            const data = await response.json();

            let translation = '';
            if (data && typeof data.translation === 'string') {
                translation = data.translation;
            } else {
                console.warn('API vrátilo neočekávanou strukturu dat pro překlad:', data);
                displayError('Překlad se nezdařil. Neočekávaná odpověď z překladače.');
                return;
            }

            let pinyin = '';
            // Zkusíme najít pinyin v různých částech 'pronunciation' objektu
            if (selectedTargetLang === 'zh' && data.info && data.info.pronunciation) {
                const pronunciation = data.info.pronunciation;

                // 1. Zkusíme data.info.pronunciation.pinyin (pole)
                if (Array.isArray(pronunciation.pinyin) && pronunciation.pinyin.length > 0) {
                    pinyin = pronunciation.pinyin.join(' ');
                }
                // 2. Zkusíme data.info.pronunciation.romanization (řetězec)
                else if (typeof pronunciation.romanization === 'string' && pronunciation.romanization.trim() !== '') {
                    pinyin = pronunciation.romanization.trim();
                }
                // 3. Zkusíme data.info.pronunciation.text (řetězec, někdy se používá pro fonetický přepis)
                else if (typeof pronunciation.text === 'string' && pronunciation.text.trim() !== '') {
                    pinyin = pronunciation.text.trim();
                }

                if (pinyin) {
                    console.log('Zjištěný Pinyin/Romanizace:', pinyin);
                } else {
                    console.warn('Pro čínštinu nebyl nalezen žádný pinyin/romanizace v očekávaných polích.');
                }
            }


            // Zobrazení překladu a pinyinu
            let outputHtml = `<div>${translation}</div>`;
            if (pinyin) {
                outputHtml += `<div class="pinyin-text">${pinyin}</div>`;
            }
            translatedTextDiv.innerHTML = outputHtml;

        } catch (error) {
            console.error('Došlo k chybě při překladu:', error);
            displayError('Došlo k chybě při komunikaci s překladačem. Zkuste to prosím znovu.');
        }
    });
});