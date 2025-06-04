function selectCharacter(characterName) {
    if (!localStorage.getItem('playerName')) {
        const playerName = prompt("Digite seu nome:");
        if (playerName) {
            localStorage.setItem('playerName', playerName);
        }
    }
    localStorage.setItem('selectedCharacter', characterName);
    window.location.href = 'game.html';
}