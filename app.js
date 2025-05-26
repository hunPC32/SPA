const { default: firebase } = require("firebase/compat/app");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y){
    return `(${x}, ${y})`;
}
function createName(){

}
(function (){

  let playerId;
  let playerRef;
  let playerElements = {};

  const gameContainer = document.querySelector(".game-container");
  function initGame(){
    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);

    allPlayersRef.on("value", (snapshot) => {

    })
    allPlayersRef.on("child_added", (snapshot) => {
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell")
      if (addedPlayer.id === playerId){
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
            <span class="Character_name"></span>
            <span class="Character_coins">0</span>

        </div>
        <div class="Character_you-arrow"><div>
        `);
        playerElements[addedPlayer] = characterElement;

        characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
        characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
        characterElement.setAttribute("data-color", addedPlayer.color);
          characterElement.setAttribute("data-direction", addedPlayer.direction);
          const left = 16 *addedPlayer.x + "px";
          const top = 16 *addedPlayer.y -4 + "px";
          characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
          gameContainer.appendChild(characterElement);
    })
  }

  firebase.auth().onAuthStateChanged((user) => {
    console.log(user);
    if (user){
      playerId = user.uid;
      playerRef = firebase.database().ref(`player/${playerId}`)

      playerRef.set({
        id: playerId,
        name: "ZSOTYAX",
        direction: "RIGHT",
        color: "blue",
        x: 3,
        y: 3,
        bullets: 0,
      })
      playerRef.onDisconnect().remove()
      initGame();
    }else{
      
    }
  })
  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode,errorMessage)
  });

})();
