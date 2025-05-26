// Firebase beállítás

import firebase from "firebase/app";
import "firebase/auth";


// 🔁 Saját Firebase configodat ide másold be:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// 🔧 Hasznos segédfüggvények
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y) {
  return `(${x}, ${y})`;
}

function createName() {
  const prefix = randomFromArray([
    "ZSOTYAX", "ZSO", "ZSOX", "ZSOTY", "ZSOY", "ZSOAX", "ZSOYX", "ZSOTYX",
    "MATYI", "MATY", "MATYX", "MATYAX", "MAYX", "MAY", "MAJKA", "MAJKAX",
    "DOGGYANDI", "DOMINIK", "KOPPÁNY"
  ]);

  const ship = randomFromArray([
    "Barquentine", "Schooner", "Barque", "Brig", "Brigantine", "Gunboat",
    "Caravel", "Clipper", "Baguette", "Nosztalgia kifli"
  ]);

  return `${prefix} ${ship}`;
}

// 🕹️ Játék inicializálás
(function () {
  let playerId;
  let playerRef;
  let playerElements = {};
  const gameContainer = document.querySelector(".game-container");

  function initGame() {
    const allPlayersRef = firebase.database().ref("players");

    allPlayersRef.on("child_added", (snapshot) => {
      const addedPlayer = snapshot.val();

      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");

      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }

      characterElement.innerHTML = `
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `;

      // 🔄 Helyes azonosító használata kulcsként
      playerElements[addedPlayer.id] = characterElement;

      characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
      characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins ?? 0;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);

      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      gameContainer.appendChild(characterElement);
    });
  }

  // 🔐 Firebase anoním autentikáció
  firebase.auth().onAuthStateChanged((user) => {
    console.log("Bejelentkezve:", user);

    if (user) {
      playerId = user.uid;
      playerRef = firebase.database().ref(`players/${playerId}`);

      const name = createName();

      playerRef.set({
        id: playerId,
        name: name,
        direction: "right",
        color: "blue",
        x: 3,
        y: 3,
        coins: 0,
        bullets: 0
      });

      playerRef.onDisconnect().remove(); // játékos eltávolítása ha kilép
      initGame();
    }
  });

  firebase.auth().signInAnonymously().catch((error) => {
    console.error("Bejelentkezési hiba:", error.code, error.message);
  });

})();
