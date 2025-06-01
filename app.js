

const mapWidth = 16;
const mapHeight = 16;

const mapData = {
  minX: 0,
  maxX: mapWidth,
  minY: 0,
  maxY: mapHeight,
  blockedSpaces: {},
};


function drawMapTiles() {
  console.log("Rajzolás indul", mapData.blockedSpaces);

  const gameContainer = document.querySelector(".game-container");

  // 🔁 Először töröljük az összes régi csempét
  document.querySelectorAll(".Map_tile").forEach(tile => tile.remove());

  // 🔁 Ezután új csempék hozzáadása a konténer LEGELEJÉRE
  for (let y = mapData.minY; y < mapData.maxY; y++) {
    for (let x = mapData.minX; x < mapData.maxX; x++) {
      const tile = document.createElement("div");
      tile.classList.add("Map_tile");

      if (isSolid(x, y)) {
        tile.classList.add("Map_blocked");
      } else {
        tile.classList.add("Map_walkable");
      }

      tile.style.left = (x * 16) + "px";
      tile.style.top = (y * 16) + "px";

      // ⬇️ Insert before first child so it's rendered at the bottom
      gameContainer.insertBefore(tile, gameContainer.firstChild);
    }
  }
}




function generateRandomMap() {
  const mapRef = firebase.database().ref("map");

  mapRef.once("value").then((snapshot) => {
  if (snapshot.exists()) {
    mapData.blockedSpaces = snapshot.val();
    drawMapTiles(); // ✔️ csak akkor fut, ha van térkép
    } else {
      // Még nincs, generálunk
      const newBlocked = {};
      for (let y = mapData.minY; y < mapData.maxY; y++) {
        for (let x = mapData.minX; x < mapData.maxX; x++) {
          const key = getKeyString(x, y);
          if (Math.random() < 0.15) {
            newBlocked[key] = true;
          }
        }
      }

      // Mentsd el a Firebase-be
          mapRef.set(newBlocked);
          mapData.blockedSpaces = newBlocked;
          drawMapTiles(); // ✔️ csak akkor fut, ha új térkép generálódik
    }
  });
}

function regenerateMap() {
  const mapRef = firebase.database().ref("map");
  const mapVersionRef = firebase.database().ref("mapVersion");
  const coinsRef = firebase.database().ref("coins");

  const newBlocked = {};
  for (let y = mapData.minY; y < mapData.maxY; y++) {
    for (let x = mapData.minX; x < mapData.maxX; x++) {
      const key = getKeyString(x, y);
      if (Math.random() < 0.15) {
        newBlocked[key] = true;
      }
    }
  }

  // 🔥 Térkép mentése + coinok törlése + map verzió növelés
  Promise.all([
    mapRef.set(newBlocked),
    coinsRef.remove(), // ⬅️ minden coin törlése
    mapVersionRef.transaction(current => (current || 0) + 1)
  ]).then(() => {
    mapData.blockedSpaces = newBlocked;

    // Térkép újrarajzolása
    document.querySelectorAll(".Map_tile").forEach(tile => tile.remove());
    drawMapTiles();
  });
}


function loadMapFromFirebase() {
  const mapRef = firebase.database().ref("map");
  mapRef.once("value").then(snapshot => {
    if (snapshot.exists()) {
      mapData.blockedSpaces = snapshot.val();

      // töröljük az előző térképcsempéket
      document.querySelectorAll(".Map_tile").forEach(tile => tile.remove());

      drawMapTiles();
    }
  });
}







// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
  return `${x}x${y}`;
}

function createName() {
  const prefix = randomFromArray([
    "COOL",
    "SUPER",
    "HIP",
    "SMUG",
    "COOL",
    "SILKY",
    "GOOD",
    "SAFE",
    "DEAR",
    "DAMP",
    "WARM",
    "RICH",
    "LONG",
    "DARK",
    "SOFT",
    "BUFF",
    "DOPE",
  ]);
  const animal = randomFromArray([
    "BEAR",
    "DOG",
    "CAT",
    "FOX",
    "LAMB",
    "LION",
    "BOAR",
    "GOAT",
    "VOLE",
    "SEAL",
    "PUMA",
    "MULE",
    "BULL",
    "BIRD",
    "BUG",
  ]);
  return `${prefix} ${animal}`;
}

function isSolid(x,y) {

  const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
  return (
    blockedNextSpace ||
    x >= mapData.maxX ||
    x < mapData.minX ||
    y >= mapData.maxY ||
    y < mapData.minY
  )
}

function getAllSafeSpots() {
  return [
    { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 5 }, { x: 2, y: 6 },
    { x: 2, y: 8 }, { x: 2, y: 9 }, { x: 4, y: 8 }, { x: 5, y: 5 },
    { x: 5, y: 8 }, { x: 5, y: 10 }, { x: 5, y: 11 }, { x: 11, y: 7 },
    { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 13, y: 6 }, { x: 13, y: 8 },
    { x: 7, y: 6 }, { x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 },
    { x: 10, y: 8 }, { x: 11, y: 4 }
  ];
}


function getRandomSafeSpot() {
  const candidates = [];

  for (let y = mapData.minY; y < mapData.maxY; y++) {
    for (let x = mapData.minX; x < mapData.maxX; x++) {
      const key = getKeyString(x, y);
      if (!mapData.blockedSpaces[key]) {
        candidates.push({ x, y });
      }
    }
  }

  return randomFromArray(candidates);
}




(function () {

  let canMove = true;
  let movementDelay = 500; // alapértelmezett mozgási késleltetés

  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};

  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.querySelector("#player-name");
  const playerColorButton = document.querySelector("#player-color");


  function placeCoin() {
  console.log("🎯 placeCoin meghívva");
  const { x, y } = getRandomSafeSpot();
  const coinId = firebase.database().ref().push().key;
  firebase.database().ref(`coins/${coinId}`).set({ id: coinId, x, y });

  const coinTimeouts = [8000, 12000, 16000, 20000];
  setTimeout(() => {
    placeCoin();
  }, randomFromArray(coinTimeouts));
}


  function attemptGrabCoin(x, y) {
  const foundKey = Object.keys(coins).find(key => {
  const coin = coins[key];
  return coin.x === x && coin.y === y;
});

if (foundKey) {
  firebase.database().ref(`coins/${foundKey}`).remove();


    const currentCoins = players[playerId]?.coins ?? 0;
    playerRef.update({
      coins: currentCoins + 1,
    });

    // ⏩ Power-up: gyors mozgás 5 másodpercig
    movementDelay = 50;

    const statsDiv = document.getElementById("player-stats");
    if (statsDiv) statsDiv.style.color = "lime";

    setTimeout(() => {
      movementDelay = 500;
      if (statsDiv) statsDiv.style.color = "";
    }, 2000);
  }
}




  function handleArrowPress(xChange=0, yChange=0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    if (!isSolid(newX, newY)) {
      //move to the next space
      players[playerId].x = newX;
      players[playerId].y = newY;
      if (xChange === 1) {
        players[playerId].direction = "right";
      }
      if (xChange === -1) {
        players[playerId].direction = "left";
      }
      if (yChange === 1) {
        players[playerId].direction = "down";
      }
      if (yChange === -1) {
        players[playerId].direction = "up";
      }

      playerRef.set(players[playerId]);
      attemptGrabCoin(newX, newY);
    }
  }

 

  function initGame() {


    placeCoin();
    generateRandomMap();

    let currentMapVersion = null;

    const mapVersionRef = firebase.database().ref("mapVersion");





    mapVersionRef.on("value", (snapshot) => {
      const newVersion = snapshot.val();
      if (newVersion !== currentMapVersion) {
        currentMapVersion = newVersion;
        loadMapFromFirebase(); // betölti az aktuális térképet
      }
    });

    let killsSinceLastMap = 0;


    

document.addEventListener("keydown", (e) => {
  if (e.repeat) return; // ne reagáljon folyamatos nyomásra
  switch (e.key) {
    case "ArrowUp": delayedArrowPress(0, -1); break;
    case "ArrowDown": delayedArrowPress(0, 1); break;
    case "ArrowLeft": delayedArrowPress(-1, 0); break;
    case "ArrowRight": delayedArrowPress(1, 0); break;
  }
});



function delayedArrowPress(x, y) {
  if (!canMove) return;
  canMove = false;
  handleArrowPress(x, y);
  setTimeout(() => {
    canMove = true;
  }, movementDelay); // ⬅️ ezt használja!
}





    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);

    allPlayersRef.on("value", (snapshot) => {
      // Csak az első játékos indítja el a coin-spawn ciklust
      firebase.database().ref("coinSpawner").transaction(current => {
        if (current === true) return; // már fut
        return true; // beállítjuk, hogy elindult
      }).then((result) => {
        if (result.committed && result.snapshot.val() === true) {
          setTimeout(() => {
            placeCoin(); // csak egyszer hívjuk meg
          }, 10000); // 10 másodperc múlva indul az első coin
        }
      });

      //Fires whenever a change occurs
      players = snapshot.val() || {};
      Object.keys(players).forEach((key) => {
        const characterState = players[key];
        let el = playerElements[key];
        // Now update the DOM
        el.querySelector(".Character_name").innerText = characterState.name;
        el.querySelector(".Character_name").innerText = characterState.name;

        const myPlayer = players[playerId];
        if (myPlayer) {
          const statsDiv = document.getElementById("player-stats");
          statsDiv.innerText = `${myPlayer.coins} 💰 | ${myPlayer.hp ?? 100} ❤️ | ${myPlayer.kills ?? 0} ☠️`;
        }



        el.setAttribute("data-color", characterState.color);
        el.setAttribute("data-direction", characterState.direction);

        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y + 4 + "px";
        
        el.style.transform = `translate3d(${left}, ${top}, 0)`;

        if (characterState.dead) {
        el.style.display = "none";
        } else {
        el.style.display = "block";
        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y + 4 + "px";
        el.style.transform = `translate3d(${left}, ${top}, 0)`;
      }

      const overlay = document.getElementById("respawn-overlay");
      const counter = document.getElementById("respawn-counter");

if (players[playerId]?.dead) {
  overlay.classList.remove("hidden");

  // Egyszerű visszaszámlálás 5→0
  let remaining = 5;
  counter.innerText = remaining;

  const countdown = setInterval(() => {
    remaining--;
    counter.innerText = remaining;
    if (remaining <= 0 || !players[playerId]?.dead) {
      clearInterval(countdown);
      overlay.classList.add("hidden");
    }
  }, 1000);
} else {
  overlay.classList.add("hidden");
}


      })
    })
    allPlayersRef.on("child_added", (snapshot) => {
      //Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");
      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
      playerElements[addedPlayer.id] = characterElement;

      //Fill in some initial state
      characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);
      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      gameContainer.appendChild(characterElement);
    })


    //Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    })


    //New - not in the video!
    //This block will remove coins from local state when Firebase `coins` value updates
    allCoinsRef.on("value", (snapshot) => {
      coins = snapshot.val() || {};
    });
    //

    allCoinsRef.on("child_added", (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      coins[key] = true;

      // Create the DOM Element
      const coinElement = document.createElement("div");
      coinElement.classList.add("Coin", "grid-cell");
      coinElement.innerHTML = `
        <div class="Coin_shadow grid-cell"></div>
        <div class="Coin_sprite grid-cell"></div>
      `;

      // Position the Element
      const left = 16 * coin.x + "px";
      const top = 16 * coin.y - 4 + "px";
      coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      coinElements[key] = coinElement;
      gameContainer.appendChild(coinElement);
    })
    allCoinsRef.on("child_removed", (snapshot) => {
      const {x,y} = snapshot.val();
      const keyToRemove = getKeyString(x,y);
      gameContainer.removeChild( coinElements[keyToRemove] );
      delete coinElements[keyToRemove];
    })


    //Updates player name with text input
    playerNameInput.addEventListener("change", (e) => {
      const newName = e.target.value || createName();
      playerNameInput.value = newName;
      playerRef.update({
        name: newName
      })
    })

    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
      const mySkinIndex = playerColors.indexOf(players[playerId].color);
      const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
      playerRef.update({
        color: nextColor
      })
    })






    //Place my first coin


    const allBulletsRef = firebase.database().ref("bullets");
const bulletElements = {};

allBulletsRef.on("child_added", (snapshot) => {
  const bullet = snapshot.val();
  const el = document.createElement("div");
  el.classList.add("Bullet", "grid-cell", `Bullet_direction-${bullet.direction}`);
  el.style.left = (bullet.x * 16 + 5) + "px";
  el.style.top = (bullet.y * 16 + 5) + "px";
  document.querySelector(".game-container").appendChild(el);
  bulletElements[bullet.id] = el;

  // Mozgatás és ütközés lokálisan
  const interval = setInterval(() => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    if (isSolid(bullet.x, bullet.y)) {
      firebase.database().ref(`bullets/${bullet.id}`).remove();
      clearInterval(interval);
      return;
    }

    el.style.left = (bullet.x * 16 + 5) + "px";
    el.style.top = (bullet.y * 16 + 5) + "px";

    // Ütközés más játékossal csak az "owner" kliens döntsön róla
    if (playerId === bullet.owner) {
      Object.keys(players).forEach((key) => {
        if (key !== bullet.owner) {
          const p = players[key];
          if (p.x === bullet.x && p.y === bullet.y) {
            const targetRef = firebase.database().ref(`players/${key}`);
            const attackerRef = firebase.database().ref(`players/${bullet.owner}`);

            let newHp = (p.hp ?? 100) - 50;
            if (newHp <= 0) {
            targetRef.update({ dead: true });
            const attackerKills = players[bullet.owner]?.kills ?? 0;
            const newKillCount = attackerKills + 1;
            attackerRef.update({ kills: newKillCount });

            // ÚJ: kill számláló növelése és ellenőrzés
            if (bullet.owner === playerId) {
              killsSinceLastMap++;
              if (killsSinceLastMap >= 3) {
                killsSinceLastMap = 0;
                regenerateMap();
              }
            }

            setTimeout(() => {
              const { x: respawnX, y: respawnY } = getRandomSafeSpot();
              targetRef.update({
                x: respawnX,
                y: respawnY,
                hp: 100,
                dead: null,
              });
            }, 5000);
          }else {
              targetRef.update({ hp: newHp });
            }

            firebase.database().ref(`bullets/${bullet.id}`).remove();
            clearInterval(interval);
          }
        }
      });
    }

  }, 100);
});

allBulletsRef.on("child_removed", (snapshot) => {
  const bullet = snapshot.val();
  const el = bulletElements[bullet.id];
  if (el) {
    el.remove();
    delete bulletElements[bullet.id];
  }
});


  }

  firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    playerId = user.uid;
    playerRef = firebase.database().ref(`players/${playerId}`);

    let name = "";
  while (!name) {
  name = prompt("Mi legyen a neved? (pl: SUPER CAT)").trim();
}
playerNameInput.value = name;


    const { x, y } = getRandomSafeSpot();

    playerRef.set({
      id: playerId,
      name,
      direction: "right",
      color: randomFromArray(playerColors),
      x,
      y,
      coins: 0,
      hp: 100,
      kills: 0,
    });

    playerRef.onDisconnect().remove();

    // ⏯️ A játék elindítása
    initGame();

    // ✅ CSAK az első játékos indítja el a coin spawn-t
    firebase.database().ref("coinSpawner").transaction(current => {
      if (current === true) return; // már fut
      return true;
    }).then((result) => {
      if (result.committed && result.snapshot.val() === true) {
        console.log("🟢 Coin spawn elindítva az első játékos által");
        setTimeout(() => {
          placeCoin(); // csak egyszer, és folytatja magát
        }, 10000); // 10 másodperc késleltetéssel indul
      }
    });

  } else {
    // Felhasználó nincs bejelentkezve
  }
});


  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });



  let canShoot = true;


  new KeyPressListener("KeyZ", () => handleShoot());

function handleShoot() {
  if (!canShoot) return;
  canShoot = false;
  setTimeout(() => { canShoot = true; }, 1000);

  const player = players[playerId];
  if (!player) return;

  let bulletX = player.x;
  let bulletY = player.y;
  let dx = 0, dy = 0;
  if (player.direction === "left") dx = -1;
  if (player.direction === "right") dx = 1;
  if (player.direction === "up") dy = -1;
  if (player.direction === "down") dy = 1;

  const bulletId = firebase.database().ref().push().key;
  const bulletData = {
    id: bulletId,
    x: bulletX,
    y: bulletY,
    dx,
    dy,
    owner: playerId,
    direction: player.direction
  };

  firebase.database().ref(`bullets/${bulletId}`).set(bulletData);
}


console.log("Bullet hit", p.name, "HP before:", p.hp);


})();

