const dealerCards = document.getElementById("dealerCards");
const playerCards = document.getElementById("playerCards");
const startBtn = document.getElementById("startBtn");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const betInput = document.getElementById("bet");
const moneyBox = document.getElementById("moneyBox");

let playerHand = [];
let dealerHand = [];
let hiddenCard = null;
let playerTotal = 0;
let dealerTotal = 0;
let money = parseInt(moneyBox.textContent);

// segédfüggvény: kártya létrehozása
function createCard(value) {
  let card = document.createElement("div");
  card.classList.add("card");
  card.textContent = value;
  return card;
}

// véletlen kártya 1–11 között
function drawCard() {
  return Math.floor(Math.random() * 11) + 1;
}

// összeg kiszámítása
function handValue(hand) {
  return hand.reduce((a, b) => a + b, 0);
}

// játék indítása
startBtn.addEventListener("click", () => {
  dealerCards.innerHTML = "";
  playerCards.innerHTML = "";
  playerHand = [];
  dealerHand = [];
  hiddenCard = null;

  const bet = parseInt(betInput.value);

  if (bet > money) {
    alert("Nincs elég pénzed a tétre!");
    return;
  }

  // pénz levonás
  money -= bet;
  moneyBox.textContent = money;

  // játékos 2 lap
  playerHand.push(drawCard());
  playerHand.push(drawCard());

  playerHand.forEach(val => {
    playerCards.appendChild(createCard(val));
  });

  // osztó 1 látható + 1 rejtett
  dealerHand.push(drawCard());
  hiddenCard = drawCard();

  dealerCards.appendChild(createCard(dealerHand[0]));
  dealerCards.appendChild(createCard("?"));

  console.log("Player hand:", playerHand);
  console.log("Dealer hidden:", hiddenCard);

  // 🔒 Start gomb és tét letiltása
  startBtn.disabled = true;
  betInput.disabled = true;
});

// Hit gomb
hitBtn.addEventListener("click", () => {
  let newCard = drawCard();
  playerHand.push(newCard);
  playerCards.appendChild(createCard(newCard));

  // ha több mint 21, azonnal vége (mintha stand-et nyomtunk volna)
  if (handValue(playerHand) > 21) {
    standBtn.click(); 
  }
});

// Stand gomb
standBtn.addEventListener("click", () => {
  playerTotal = handValue(playerHand);

  // osztó kártyák megjelenítése
  dealerCards.innerHTML = "";
  dealerHand.push(hiddenCard); // a rejtett kártya is bekerül
  dealerHand.forEach(val => {
    dealerCards.appendChild(createCard(val));
  });

  dealerTotal = handValue(dealerHand);

  // osztó húz, amíg <16 vagy amíg nem nagyobb a játékosnál
  while (dealerTotal < 16 || (dealerTotal <= playerTotal && dealerTotal < 21)) {
    let newCard = drawCard();
    dealerHand.push(newCard);
    dealerCards.appendChild(createCard(newCard));
    dealerTotal = handValue(dealerHand);
  }

  // kiértékelés
  let result = "";
  const bet = parseInt(betInput.value);

  if (playerTotal > 21) {
    result = `Vesztettél! Túllépted a 21-et (${playerTotal}).`;
  } else if (dealerTotal > 21) {
    result = `Nyertél! Az osztó túllépte a 21-et (${dealerTotal}).`;
    money += bet * 2;
  } else if (dealerTotal > playerTotal) {
    result = `Vesztettél! Osztó: ${dealerTotal}, Te: ${playerTotal}`;
  } else if (dealerTotal < playerTotal) {
    result = `Nyertél! Osztó: ${dealerTotal}, Te: ${playerTotal}`;
    money += bet * 2;
  } else {
    result = `Döntetlen! Mindkettő: ${playerTotal}`;
    money += bet; // visszakapja a tétet
  }

  moneyBox.textContent = money;
  alert(result);

  // 🔓 Start gomb és tét újra engedélyezése
  startBtn.disabled = false;
  betInput.disabled = false;
});
