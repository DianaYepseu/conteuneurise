class MultiNode {
  constructor(adresse) {
    // messages envoyés
    this.messageTransfertVariable = { etiquette: "NOTIFICATION_VARIABLE", variable: null };
    this.messageDemandeAuthentification = { etiquette: "DEMANDE_AUTHENTIFICATION", pseudonyme: "" };

    // callbacks attendus par JeuDes.js
    this.confirmerConnexion = () => {};
    this.confirmerAuthentification = () => {};
    this.apprendreAuthentification = () => {};
    this.recevoirVariable = () => {};

    this.adresse =
      adresse || ("ws://" + window.location.hostname + ":8080/multinode");

    this.contact = null;
  }

  connecter() {
    try {
      this.contact = new WebSocket(this.adresse);
    } catch (erreur) {
      console.log("erreur " + JSON.stringify(erreur));
      return;
    }

    this.contact.addEventListener("open", (evenementopen) => {
      console.log("ouverture " + JSON.stringify(evenementopen));
      this.confirmerConnexion();
    });

    this.contact.addEventListener("close", (evenementclose) => {
      console.log("fermeture " + JSON.stringify(evenementclose));
    });

    this.contact.addEventListener("message", (evenementmessage) => {
      try {
        const data = JSON.parse(evenementmessage.data);
        console.log("message reçu", data);

        if (data.type === "authentification") {
          this.confirmerAuthentification(data.autresParticipants || []);
          return;
        }

        if (data.type === "nouveauParticipant") {
          this.apprendreAuthentification(data.pseudonyme);
          return;
        }

        if (data.type === "variable") {
          this.recevoirVariable(data.variable);
          return;
        }

        if (data.type === "erreur") {
          alert(data.message);
          return;
        }
      } catch (erreur) {
        console.log("erreur message " + JSON.stringify(erreur));
      }
    });
  }

  demanderAuthentification(pseudonyme) {
    const message = {
      type: "authentification",
      pseudonyme: pseudonyme
    };

    this.contact.send(JSON.stringify(message));
  }

  posterVariableTextuelle(cle, valeur) {
    const message = {
      type: "variable",
      variable: {
        cle: cle,
        valeur: valeur
      }
    };

    this.contact.send(JSON.stringify(message));
  }
}
