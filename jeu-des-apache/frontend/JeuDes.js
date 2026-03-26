class JeuDes {
  constructor() {
    this.multiNode = new MultiNode("ws://" + window.location.hostname + ":8080/multinode");
    this.multiNode.confirmerConnexion = () => this.confirmerConnexion();
    this.multiNode.confirmerAuthentification = (autresParticipants) =>
      this.confirmerAuthentification(autresParticipants);
    this.multiNode.apprendreAuthentification = (pseudonyme) =>
      this.apprendreAuthentification(pseudonyme);
    this.multiNode.recevoirVariable = (variable) => this.recevoirVariable(variable);

    this.listeJoueur = {};
    this.pseudonymeJoueur = "";
    this.pseudonymeAutreJoueur = "";

    this.listeScoresElement = document.getElementById("liste-scores");
    this.formulaireAuthentification = document.getElementById("formulaire-authentification");
    this.champPseudonyme = document.getElementById("champ-pseudonyme");
    this.boutonAuthentification = document.getElementById("bouton-authentification");

    this.formulaireJeu = document.getElementById("formulaire-jeu");
    this.champPointDuDe = document.getElementById("champ-point-de-de");
    this.boutonLancer = document.getElementById("bouton-lancer");
    this.informationAutreJoueur = document.getElementById("information-autre-joueur");
    this.champPointDuDeAutreJoueur = document.getElementById("champ-point-de-de-autre-joueur");
    this.champNombreTour = document.getElementById("champ-nombre-tour");
    this.initialiserModalFin();
    this.mettreAJourStatut("");
    this.nombreTour = 0;
    this.valeurDEJoueur = null;
    this.valeurDEAutreJoueur = null;

    this.partieTerminee = false;
    this.premierTourPret = false;

    this.rejouerEnAttente = false;
    this.demandeRejouerRecue = false;
    this.reponseRejouerEnvoyee = false;
    this.monChoixFinPartie = null;

    this.formulaireAuthentification.addEventListener("submit", (e) =>
      this.soumettreAuthentificationJoueur(e)
    );

    this.formulaireJeu.addEventListener("submit", (e) =>
      this.soumettreLancer(e)
    );

    this.formulaireJeu.style.display = "none";
    this.boutonLancer.disabled = true;
    this.champNombreTour.value = "0";
  }

  log(message) {
    console.log(message);
  }

  incrementerNombreTours() {
    this.nombreTour++;
    this.champNombreTour.value = this.nombreTour;
  }

  confirmerConnexion() {
    this.pseudonymeJoueur = this.champPseudonyme.value.trim();

    if (!this.pseudonymeJoueur) {
      alert("Entre un pseudonyme.");
      this.boutonAuthentification.disabled = false;
      return;
    }

    this.multiNode.demanderAuthentification(this.pseudonymeJoueur);
  }

  confirmerAuthentification(autresParticipants) {
    this.formulaireAuthentification.querySelector("fieldset").disabled = true;
    this.ajouterJoueur(this.pseudonymeJoueur);
    this.afficherScores();

    if (autresParticipants.length > 0) {
      this.pseudonymeAutreJoueur = autresParticipants[0];
      this.ajouterJoueur(this.pseudonymeAutreJoueur);
      this.afficherScores();
      this.afficherPartie();
      this.determinePremierJoueur();
    }
  }

  apprendreAuthentification(pseudonyme) {
    if (pseudonyme === this.pseudonymeJoueur) return;
    if (this.listeJoueur[pseudonyme]) return;

    this.ajouterJoueur(pseudonyme);
    this.pseudonymeAutreJoueur = pseudonyme;
    this.afficherScores();
    this.afficherPartie();
    this.determinePremierJoueur();
  }

  afficherScores() {
    this.listeScoresElement.innerHTML = "";

    for (const pseudonyme in this.listeJoueur) {
      const score = this.listeJoueur[pseudonyme].pointDuDe;
      const li = document.createElement("li");
      li.textContent = `${pseudonyme}: ${score} points`;
      this.listeScoresElement.appendChild(li);
    }
  }

  ajouterJoueur(pseudonyme) {
    if (!this.listeJoueur[pseudonyme]) {
      this.listeJoueur[pseudonyme] = { pointDuDe: 0 };
    }
  }

  afficherPartie() {
    if (!this.pseudonymeJoueur || !this.pseudonymeAutreJoueur) return;

    this.informationAutreJoueur.textContent = `Dés de ${this.pseudonymeAutreJoueur}`;
    this.champPointDuDe.value = this.listeJoueur[this.pseudonymeJoueur]?.pointDuDe ?? 0;
    this.champPointDuDeAutreJoueur.value =
      this.listeJoueur[this.pseudonymeAutreJoueur]?.pointDuDe ?? 0;

    this.formulaireJeu.style.display = "block";
  }

  genererForceLancer() {
    return Math.floor(Math.random() * 6) + 1;
  }

  determinePremierJoueur() {
    if (!this.pseudonymeJoueur || !this.pseudonymeAutreJoueur) return;

    this.valeurDEJoueur = this.genererForceLancer();
    this.valeurDEAutreJoueur = null;
    this.boutonLancer.disabled = true;

    this.champPointDuDe.value = `Valeur initiale : ${this.valeurDEJoueur}`;
    this.champPointDuDeAutreJoueur.value = "En attente...";

    this.multiNode.posterVariableTextuelle(
      "DETERMINER_PREMIER_TOUR",
      JSON.stringify({
        pseudonyme: this.pseudonymeJoueur,
        valeur: this.valeurDEJoueur
      })
    );
  }

  debutJeu(pseudonyme, valeur) {
    if (pseudonyme === this.pseudonymeJoueur) {
      this.valeurDEJoueur = valeur;
      this.champPointDuDe.value = `Valeur initiale : ${valeur}`;
    } else {
      this.valeurDEAutreJoueur = valeur;
      this.champPointDuDeAutreJoueur.value = `Valeur initiale : ${valeur}`;
    }

    if (this.valeurDEJoueur === null || this.valeurDEAutreJoueur === null) return;

    if (this.valeurDEJoueur > this.valeurDEAutreJoueur) {
      this.boutonLancer.disabled = false;
    } else if (this.valeurDEJoueur < this.valeurDEAutreJoueur) {
      this.boutonLancer.disabled = true;
    } else {
      setTimeout(() => this.determinePremierJoueur(), 300);
    }

    this.afficherPartie();
  }

  recevoirVariable(variable) {
    const message = JSON.parse(variable.valeur);

    switch (variable.cle) {
      case "POINT_DU_DE":
        if (message.pseudonyme === this.pseudonymeJoueur) {
          this.changerPointduDeJoueur(message.valeur, message.de1, message.de2);
        } else {
          this.changerPointduDeAutreJoueur(message.valeur, message.de1, message.de2);
        }
        break;

      case "DETERMINER_PREMIER_TOUR":
        this.debutJeu(message.pseudonyme, message.valeur);
        break;

      case "JEUDES":
        this.subirLancer(message.pseudonyme, message.valeur, message.de1, message.de2);
        break;
    }
  }

  soumettreAuthentificationJoueur(e) {
    e.preventDefault();
    this.multiNode.connecter();
    this.boutonAuthentification.disabled = true;
  }

  soumettreLancer(e) {
    e.preventDefault();

    if (this.boutonLancer.disabled) return;

    this.incrementerNombreTours();

    const de1 = this.genererForceLancer();
    const de2 = this.genererForceLancer();
    const forceLancer = de1 + de2;

    this.champPointDuDe.value = `de1 = ${de1}, de2 = ${de2}`;

    this.multiNode.posterVariableTextuelle(
      "JEUDES",
      JSON.stringify({
        pseudonyme: this.pseudonymeJoueur,
        valeur: forceLancer,
        de1: de1,
        de2: de2
      })
    );
  }

  subirLancer(pseudonyme, valeur, de1, de2) {
    if (!this.listeJoueur[pseudonyme]) return;

    const nouveauTotal = this.listeJoueur[pseudonyme].pointDuDe + valeur;

    this.multiNode.posterVariableTextuelle(
      "POINT_DU_DE",
      JSON.stringify({
        pseudonyme: pseudonyme,
        valeur: nouveauTotal,
        de1: de1,
        de2: de2
      })
    );

    if (pseudonyme === this.pseudonymeJoueur) {
      this.boutonLancer.disabled = true;
    } else {
      this.boutonLancer.disabled = false;
    }
  }

  changerPointduDeAutreJoueur(nouveauPointDuDe, de1, de2) {
  if (!this.listeJoueur[this.pseudonymeAutreJoueur]) return;

  this.listeJoueur[this.pseudonymeAutreJoueur].pointDuDe = nouveauPointDuDe;
  this.champPointDuDeAutreJoueur.value = `de1 = ${de1}, de2 = ${de2}`;
  this.afficherScores();
  this.verifierGagnant();
}
  changerPointduDeJoueur(nouveauPointDuDe, de1, de2) {
  if (!this.listeJoueur[this.pseudonymeJoueur]) return;

  this.listeJoueur[this.pseudonymeJoueur].pointDuDe = nouveauPointDuDe;
  this.champPointDuDe.value = `de1 = ${de1}, de2 = ${de2}`;
  this.afficherDes(de1, de2);
  this.afficherScores();
  this.verifierGagnant();
}
mettreAJourStatut(message) {
  const status = document.getElementById("status");
  if (status) {
    status.textContent = message;
  }
}

ajouterLog(message) {
  const log = document.getElementById("log");
  if (log) {
    log.textContent = message;
  }
}

afficherDes(de1, de2) {
  const die1 = document.getElementById("die1");
  const die2 = document.getElementById("die2");

  if (die1) die1.textContent = de1;
  if (die2) die2.textContent = de2;
}

afficherFinPartie(titre, texte) {
  const backdrop = document.getElementById("end-backdrop");
  const endTitle = document.getElementById("end-title");
  const endText = document.getElementById("end-text");

  if (endTitle) endTitle.textContent = titre;
  if (endText) endText.textContent = texte;
  if (backdrop) backdrop.classList.add("show");
}

initialiserModalFin() {
  const btnClose = document.getElementById("btn-close");
  const btnReplay = document.getElementById("btn-replay");
  const backdrop = document.getElementById("end-backdrop");

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      if (backdrop) backdrop.classList.remove("show");
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

verifierGagnant() {
  if (!this.pseudonymeJoueur || !this.pseudonymeAutreJoueur) return;

  const scoreMoi = this.listeJoueur[this.pseudonymeJoueur]?.pointDuDe ?? 0;
  const scoreAutre = this.listeJoueur[this.pseudonymeAutreJoueur]?.pointDuDe ?? 0;

  if (scoreMoi >= 60 || scoreAutre >= 60) {
    let gagnant = "";
    let texte = "";

    if (scoreMoi > scoreAutre) {
      gagnant = this.pseudonymeJoueur;
    } else if (scoreAutre > scoreMoi) {
      gagnant = this.pseudonymeAutreJoueur;
    } else {
      gagnant = "Égalité";
    }

    if (gagnant === "Égalité") {
      texte = `La partie est terminée sur une égalité à ${scoreMoi} points.`;
      this.mettreAJourStatut("Égalité");
      this.ajouterLog(texte);
      this.afficherFinPartie("Égalité", texte);
    } else {
      texte = `Le gagnant est ${gagnant}. Score final : ${scoreMoi} à ${scoreAutre}.`;
      this.mettreAJourStatut(`Gagnant : ${gagnant}`);
      this.ajouterLog(texte);
      this.afficherFinPartie("Partie terminée", texte);
    }

    this.boutonLancer.disabled = true;
    this.partieTerminee = true;
  }
}
}

new JeuDes();
