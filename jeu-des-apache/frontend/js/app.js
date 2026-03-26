const rollBtn = document.getElementById("rollBtn");
const loadScoresBtn = document.getElementById("loadScoresBtn");
const resultDiv = document.getElementById("result");
const scoresList = document.getElementById("scores");

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`;

rollBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_BASE}/roll`, {
      method: "POST"
    });

    const data = await response.json();
    resultDiv.textContent = `Dé 1: ${data.dice1} | Dé 2: ${data.dice2} | Total: ${data.total}`;
  } catch (error) {
    console.error(error);
    resultDiv.textContent = "Erreur de connexion au backend";
  }
});

loadScoresBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_BASE}/scores`);
    const data = await response.json();

    scoresList.innerHTML = "";

    data.forEach((score, index) => {
      const li = document.createElement("li");
      li.textContent = `Partie ${index + 1} : ${score.dice1} + ${score.dice2} = ${score.total}`;
      scoresList.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    scoresList.innerHTML = "<li>Impossible de charger les scores</li>";
  }
});
