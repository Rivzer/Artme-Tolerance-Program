function logout() {
    fetch('/logout', { method: 'GET' })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            }
        })
        .catch(error => console.error('Fout bij uitloggen:', error));
}