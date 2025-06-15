// script.js
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const translateButton = document.getElementById('translateButton');
    const translatedTextDiv = document.getElementById('translatedText');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Základní API pro většinu jazyků
    const LINGVA_API_BASE_URL = 'https://lingva.ml/api/v1/';
    // API pro čínštinu (neoficiální Google Translate, který může vracet pinyin)
    const GOOGLE_TRANSLATE_API_URL = 'https://translate.googleapis.com/translate_a/single';

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

        let translation = '';
        let pinyinText = '';

        try {
            if (selectedTargetLang === 'zh') {
                // *** Speciální logika pro čínštinu ***
                console.log('Překládám do čínštiny, používám Google Translate API pro pinyin.');
                const googleApiUrl = `${GOOGLE_TRANSLATE_API_URL}?client=gtx&sl=${selectedSourceLang}&tl=${selectedTargetLang}&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&kc=7&hl=en&q=${encodeURIComponent(textToTranslate)}`;
                
                const googleResponse = await fetch(googleApiUrl);
                if (!googleResponse.ok) {
                    const errorDetail = await googleResponse.text().catch(() => 'Neznámý detail chyby');
                    console.error(`Chyba při volání Google Translate API (${googleResponse.status} ${googleResponse.statusText}):`, errorDetail);
                    displayError(`Nepodařilo se přeložit do čínštiny. Zkuste prosím Lingva API (nebo jiné jazyky).`);
                    return;
                }

                const googleData = await googleResponse.json();
                console.log('Odpověď z Google Translate API:', googleData);

                if (googleData && googleData[0] && googleData[0][0] && typeof googleData[0][0][0] === 'string') {
                    translation = googleData[0][0][0]; // Hlavní překlad
                } else {
                    console.warn('Google Translate API vrátilo neočekávanou strukturu dat pro překlad do čínštiny:', googleData);
                    displayError('Překlad do čínštiny se nezdařil. Neočekávaná odpověď z překladače.');
                    return;
                }

                // Zkusíme najít pinyin v odpovědi (struktura je složitá, může se lišit)
                // Pinyin je často v googleData[0][0][3] nebo podobně, ale není zaručeno
                if (googleData[0] && Array.isArray(googleData[0])) {
                    // Procházíme segmenty překladu
                    googleData[0].forEach(segment => {
                        if (segment[3] && typeof segment[3] === 'string') {
                            pinyinText += segment[3] + ' '; // Přidáváme pinyin s mezerou
                        }
                    });
                    pinyinText = pinyinText.trim(); // Odstraníme trailing mezeru
                    console.log('Zjištěný Pinyin z Google Translate API:', pinyinText);
                }
                if (!pinyinText && translation) {
                    errorMessageDiv.textContent = 'Pro čínštinu se pinyin nepodařilo získat (překlad funguje).';
                } else {
                     errorMessageDiv.textContent = ''; // Vymažeme chybu, pokud se pinyin najde
                }

            } else {
                // *** Standardní logika pro ostatní jazyky (Lingva API) ***
                const lingvaApiUrl = `${LINGVA_API_BASE_URL}${selectedSourceLang}/${selectedTargetLang}/${encodeURIComponent(textToTranslate)}`;
                console.log('Volám Lingva API:', lingvaApiUrl);

                const lingvaResponse = await fetch(lingvaApiUrl);

                if (!lingvaResponse.ok) {
                    const errorDetail = await lingvaResponse.text().catch(() => 'Neznámý detail chyby');
                    console.error(`Chyba při volání Lingva API (${lingvaResponse.status} ${lingvaResponse.statusText}):`, errorDetail);
                    displayError(`Nepodařilo se dokončit překlad. Zkuste to prosím znovu.`);
                    return;
                }

                const lingvaData = await lingvaResponse.json();
                console.log('Odpověď z Lingva API:', lingvaData);

                if (lingvaData && typeof lingvaData.translation === 'string') {
                    translation = lingvaData.translation;
                } else {
                    console.warn('Lingva API vrátilo neočekávanou strukturu dat pro překlad:', lingvaData);
                    displayError('Překlad se nezdařil. Neočekávaná odpověď z překladače.');
                    return;
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