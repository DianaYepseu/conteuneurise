const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ message: "Serveur WebSocket MultiNode actif" }));
});

const wss = new WebSocketServer({
  server,
  path: "/multinode",
});

const clients = new Map(); // ws -> pseudonyme

function envoyer(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function diffuser(data, saufWs = null) {
  for (const client of wss.clients) {
    if (client !== saufWs && client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

function participantsAuthentifies() {
  return Array.from(clients.values()).filter(Boolean);
}

wss.on("connection", (ws) => {
  console.log("Client connecté sur /multinode");

  ws.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      // Authentification
      if (message.type === "authentification") {
        const pseudonyme = (message.pseudonyme || "").trim();

        if (!pseudonyme) {
          envoyer(ws, {
            type: "erreur",
            message: "Pseudonyme vide."
          });
          return;
        }

        // Empêche deux joueurs avec le même pseudonyme
        const dejaPris = participantsAuthentifies().includes(pseudonyme);
        if (dejaPris) {
          envoyer(ws, {
            type: "erreur",
            message: "Ce pseudonyme est déjà utilisé."
          });
          return;
        }

        const autresParticipants = participantsAuthentifies();
        clients.set(ws, pseudonyme);

        // Confirmation à celui qui vient de se connecter
        envoyer(ws, {
          type: "authentification",
          autresParticipants
        });

        // Informe les autres
        diffuser(
          {
            type: "nouveauParticipant",
            pseudonyme
          },
          ws
        );

        console.log(`Authentifié: ${pseudonyme}`);
        return;
      }

      // Variables de jeu
      if (message.type === "variable") {
        diffuser(
          {
            type: "variable",
            variable: message.variable
          },
          null
        );
        return;
      }
    } catch (error) {
      console.error("Message invalide:", error);
    }
  });

  ws.on("close", () => {
    const pseudonyme = clients.get(ws);
    if (pseudonyme) {
      console.log(`Déconnexion: ${pseudonyme}`);
    }
    clients.delete(ws);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur WebSocket MultiNode démarré sur le port ${PORT}`);
});
