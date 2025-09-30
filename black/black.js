document.addEventListener('DOMContentLoaded', () => {
  const dealerCards = document.getElementById("dealerCards");
  const playerCards = document.getElementById("playerCards");
  const startBtn = document.getElementById("startBtn");
  const hitBtn = document.getElementById("hitBtn");
  const standBtn = document.getElementById("standBtn");
  const betInput = document.getElementById("bet");
  const moneyBox = document.getElementById("moneyBox");
  // opcionális eredmény doboz, ha van az UI-ban
  const resultBox = document.getElementById("resultBox") || null;

  let playerHand = [];
  let dealerHand = [];
  let hiddenCard = null;
  let playerTotal = 0;
  let dealerTotal = 0;
  let money = 0;
  let currentBet = 0;

  // Betöltjük az aktív felhasználó egyenlegét (ha van)
  async function loadActiveUserBalance() {
    try {
      const res = await fetch('/users');
      const users = await res.json();
      const idx = parseInt(localStorage.getItem('activeUserIndex'), 10);
      if (!isNaN(idx) && users[idx]) {
        money = Number(users[idx].Balance) || 0;
      } else {
        money = parseInt(moneyBox.textContent, 10) || 0;
      }
    } catch (err) {
      console.error('Hiba a felhasználók lekérésekor:', err);
      money = parseInt(moneyBox.textContent, 10) || 0;
    }
    moneyBox.textContent = money;
    console.log('Aktuális pénz:', money);
  }

  // UI segédfüggvények
  function createCard(value) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.textContent = value;
    return card;
  }

  function drawCard() {
    // egyszerűsített kártyahúzás 1-11 értékekkel (szabály szerint módosítható)
    return Math.floor(Math.random() * 11) + 1;
  }

  function handValue(hand) {
    return hand.reduce((s, v) => s + v, 0);
  }

  function resetTable() {
    dealerCards.innerHTML = '';
    playerCards.innerHTML = '';
    playerHand = [];
    dealerHand = [];
    hiddenCard = null;
    playerTotal = 0;
    dealerTotal = 0;
    if (resultBox) resultBox.textContent = '';
  }

  // Start
  startBtn.addEventListener('click', async () => {
    resetTable();

    const bet = parseInt(betInput.value, 10);
    if (!Number.isInteger(bet) || bet <= 0) {
      alert('Adj meg érvényes tétet!');
      return;
    }
    if (bet > money) {
      alert('Nincs elég pénzed a tétre!');
      return;
    }

    currentBet = bet;

    // tét levonása kliens oldalon (szerverre a kör végén frissítünk)
    money -= bet;
    moneyBox.textContent = money;

    // kártyák kiosztása
    playerHand.push(drawCard(), drawCard());
    playerHand.forEach(v => playerCards.appendChild(createCard(v)));
    playerTotal = handValue(playerHand);

    dealerHand.push(drawCard());
    hiddenCard = drawCard();
    dealerCards.appendChild(createCard(dealerHand[0]));
    dealerCards.appendChild(createCard('?'));

    // gombok állapota
    startBtn.disabled = true;
    betInput.disabled = true;
    hitBtn.disabled = false;
    standBtn.disabled = false;

    // ha azonnal 21 (blackjack) — automatikusan befejezzük a kört
    if (playerTotal === 21) {
      await finishRound();
    }
  });

  // Hit
  hitBtn.addEventListener('click', () => {
    const newCard = drawCard();
    playerHand.push(newCard);
    playerCards.appendChild(createCard(newCard));
    playerTotal = handValue(playerHand);

    if (playerTotal > 21) {
      // bust -> vége
      finishRound();
    }
  });

  // Stand
  standBtn.addEventListener('click', () => {
    playerTotal = handValue(playerHand);
    finishRound();
  });

  // Kör lezárása: dealer kirakja a lapokat, kiértékelés, szerver frissítés
  async function finishRound() {
    // mutassuk a rejtett kártyát
    dealerCards.innerHTML = '';
    dealerHand.push(hiddenCard);
    dealerHand.forEach(v => dealerCards.appendChild(createCard(v)));
    dealerTotal = handValue(dealerHand);

    // ha a játékos nem bust-olt, a dealer húz (standard szabály: <17)
    if (playerTotal <= 21) {
      while (dealerTotal < 17) {
        const c = drawCard();
        dealerHand.push(c);
        dealerCards.appendChild(createCard(c));
        dealerTotal = handValue(dealerHand);
      }
    }

    // eredmény kiszámolása (a bet már levonódott korábban)
    let result = '';
    if (playerTotal > 21) {
      result = `Vesztettél! Túllépted a 21-et (${playerTotal}).`;
      // money változtatás: a tét már lekerült, így semmit nem adunk hozzá
    } else if (dealerTotal > 21) {
      result = `Nyertél! Az osztó túllépte a 21-et (${dealerTotal}).`;
      money += currentBet * 2; // visszakapja a tétet + nyereményt
    } else if (dealerTotal > playerTotal) {
      result = `Vesztettél! Osztó: ${dealerTotal}, Te: ${playerTotal}`;
    } else if (dealerTotal < playerTotal) {
      result = `Nyertél! Osztó: ${dealerTotal}, Te: ${playerTotal}`;
      money += currentBet * 2;
    } else {
      result = `Döntetlen! Mindkettő: ${playerTotal}`;
      money += currentBet; // visszakapja a tétet
    }

    moneyBox.textContent = money;
    if (resultBox) resultBox.textContent = result;
    alert(result);

    // szerver frissítése: beállítjuk a user.Balance-t a kliensen lévő money-re,
    // tranzakciót a valós változás alapján jegyezzük
    try {
      const res = await fetch('/users');
      const users = await res.json();
      const idx = parseInt(localStorage.getItem('activeUserIndex'), 10);
      if (!isNaN(idx) && users[idx]) {
        const user = users[idx];
        const prevBalance = Number(user.Balance) || 0;
        const change = money - prevBalance; // mennyi a nettó különbség
        user.Balance = money;
        if (!user.transactions) user.transactions = [];
        // ha szeretnéd, csak akkor pusholj tranzakciót, ha change !== 0
        user.transactions.push({
          type: "Blackjack",
          amount: change,
          date: new Date().toISOString(),
          description: result
        });

        await fetch('/updateUsers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users)
        });

        // ha van ilyen függvény a projektedben, frissítjük az aktív felhasználó UI-t
        if (typeof activefelh === 'function') activefelh(idx);
      } else {
        console.warn('Nincs aktív felhasználó a szerveren vagy az index érvénytelen.');
      }
    } catch (err) {
      console.error('Hiba az egyenleg frissítésénél:', err);
      alert('Hiba az egyenleg frissítésénél — nézd a konzolt részletekért.');
    }

    // visszaállítjuk az UI-t egy új körre
    startBtn.disabled = false;
    betInput.disabled = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    currentBet = 0;
  }

  // alapállapot
  hitBtn.disabled = true;
  standBtn.disabled = true;

  // betöltjük az aktív user balanszát
  loadActiveUserBalance();
});
