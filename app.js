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

(function (){

  let playerId;
  let playerRef;

  function initGame(){
    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);
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
