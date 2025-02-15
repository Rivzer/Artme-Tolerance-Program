document.getElementById('language-select').addEventListener('change', (event) => {
    const selectedLanguage = event.target.value;
    fetch('/setLanguage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: selectedLanguage }),
    }).then(() => {
        window.location.reload();
    });
});