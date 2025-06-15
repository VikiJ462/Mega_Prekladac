// script.js
let pinyinPro = null; // Globální proměnná pro uložení pinyin funkce

document.addEventListener('DOMContentLoaded', async () => {
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

    // --- Dynamické načtení pinyin-pro knihovny ---
    console.log("Pokouším se dynamicky načíst pinyin-pro.min.js...");
    try {
        // Použijeme 'import()' pro dynamické načtení modulu.
        // Tím zajistíme, že kód knihovny se spustí.
        // Protože pinyin-pro.min.js je starší UMD modul, jeho export se objeví na window.
        // Někdy je potřeba přímo importovat z "pinyin-pro", pokud je to ES modul.
        // Pro tuto verzi by se mělo objevit na window.
        await import('./pinyin-pro.min.js'); 
        
        // Zde zkontrolujeme, zda se pinyin funkce skutečně objevila na window
        if (typeof window.pinyin === 'function') {
            pinyinPro = window.pinyin;
            console.log("Knihovna pinyin-pro úspěšně načtena a funkce 'pinyin' je dostupná.");
            errorMessageDiv.textContent = ''; // Smažeme případnou chybu, pokud se načte později
        } else {
            console.error("Knihovna pinyin-pro se načetla, ale funkce 'pinyin' nebyla nalezena na window.");
            errorMessageDiv.textContent = 'Chyba: Pinyin generátor se nenačetl správně (funkce nenalezena).';
        }
    } catch (error) {
        console.error('Chyba při dynamickém načítání pinyin-pro.min.js:', error);
        errorMessageDiv.textContent = 'Chyba: Pinyin generátor není dostupný (problém s načítáním souboru).';
    }
    // --- Konec dynamického načítání pinyin-pro knihovny ---


    async function performTranslation() {
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
            // A pokud je pinyinPro funkce dostupná
            if (selectedTargetLang === 'zh' && translation) {
                if (typeof pinyinPro === 'function') { // Používáme naši uloženou referenci
                    pinyinText = pinyinPro(translation, {
                        toneType: 'symbol',
                        pattern: 'pinyin',
                        splitter: ' '
                    });
                    console.log('Zjištěný Pinyin z pinyin-pro:', pinyinText);
                } else {
                    console.warn('Pinyin funkce není dostupná pro generování pinyinu, i když je cílový jazyk čínština.');
                    errorMessageDiv.textContent = 'Pinyin není k dispozici (načítání se nezdařilo).'; // Zobrazíme zprávu, pokud funkce chybí
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
    }

    translateButton.addEventListener('click', performTranslation);
});