function Lekeres()
{
    fetch('/users')
    .then(res => res.json())
    .then(users => {
        const classmoney = users.reduce((sum, u) => sum + u.Balance, 0);
        document.getElementById("felhasznalofelulet").innerText = ("A teljes osztálypénz összege: " + classmoney.toLocaleString('hu-HU') + " FT");
    })
    .catch(err => console.error(err));

}

function beker()
{
    szam = window.prompt("Kérek egy számot");
    szam = Number(szam);
    szam2 = window.prompt("Kérek adj még egy számot");
    szam2 = Number(szam2);
    return { szam, szam2 };
}
/* Bejelentkezés */
function Login() {
    const username = document.getElementById("fhn").value;
    const password = document.getElementById("jelszo").value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            if (data.role === "A") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "./11-team-members-showcase/main.html";
            }
            localStorage.setItem("activeUserIndex", data.felhaszi);
        } else {
            window.alert(data.message);
        }
    })
    .catch(err => window.alert("Hiba a bejelentkezésnél!"));
}

function RegisterPage() {
    window.location.href = "reg.html";
}

function register() {
    let newFh = document.getElementById("newFh").value;
    let newJelszo = document.getElementById("newJelszo").value;
    let confirmJelszo = document.getElementById("confirmJelszo").value;
    if (newJelszo !== confirmJelszo) {
        window.alert("A jelszavak nem egyeznek!");
        return;
    }
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newFh, password: newJelszo })
    })
    .then(res => res.text())
    .then(msg => {
        window.alert(msg);
        if (msg === "Sikeres regisztráció") {
            window.location.href = "Login_Reg.html";
        }
    })
    .catch(err => window.alert("Hiba a regisztrációnál!"));
}

function Logout() {
    window.location.href = "http://localhost:3000/Login_Reg.html";
    window.alert("Sikeres kijelentkezés!");
    localStorage.clear();
}

function feltoltSelect() {
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            const select = document.getElementById('userSelect');
            select.innerHTML = "";
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = `Név: ${user.username} | Jelszó: ${user.password} | Rang: ${user.role} | Egyenleg: ${user.Balance} FT`;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Hiba a felhasználók betöltésekor:', error));
}

// Hívás az admin oldal betöltésekor
window.onload = function() {
    if (window.location.pathname.endsWith("/admin.html")) {
        feltoltSelect();
    }
};

function deleteSelectedUser() {
    const select = document.getElementById('userSelect');
    const username = select.value;
    if (!username) {
        window.alert("Nincs kiválasztva felhasználó!");
        return;
    }
    if (!window.confirm(`Biztosan törlöd ezt a felhasználót?\n${username}`)) return;

    fetch('/deleteuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    .then(res => res.text())
    .then(msg => {
        window.alert(msg);
        feltoltSelect();
    })
    .catch(err => window.alert("Hiba a törlésnél!"));
}

function addUser() {
    const username = document.getElementById('ujFh').value;
    const password = document.getElementById('ujJelszo').value;
    const rank = document.getElementById('ujRang').value;

    if (!username || !password || !rank) {
        window.alert("Minden mezőt ki kell tölteni!");
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rank })
    })
    .then(res => res.text())
    .then(msg => {
        window.alert(msg);
        feltoltSelect(); // Frissíti a listát
    })
    .catch(err => window.alert("Hiba a hozzáadásnál!"));
}

//Bal felső sarok aktív felhasználó neve és összege
function activefelh(index) {
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            if (index >= 0 && index < users.length) {
                document.getElementById("activeUser").innerText = users[index].username + " \nEgyenleg: " + users[index].Balance.toLocaleString('hu-HU') + " FT";
            } else {
                document.getElementById("activeUser").innerText = "Ismeretlen felhasználó";
            }
        })
        .catch(error => console.error('Hiba az aktív felhasználó lekérésekor:', error));
    }

function Befizet() {
    let szam = window.prompt("Kérek egy összeget a befizetéshez");
    szam = Number(szam);
    if (isNaN(szam) || szam <= 1) {
        window.alert("Érvénytelen összeg!");
        return;
    }
    let index = localStorage.getItem("activeUserIndex");
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            if (index >= 0 && index < users.length) {
                users[index].Balance += szam;
                if (!users[index].transactions) users[index].transactions = [];
                users[index].transactions.push({
                    type: "befizetés",
                    amount: szam,
                    date: new Date().toISOString()
                });
                fetch('/updateUsers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(users)
                })
                .then(res => res.text())
                .then(msg => {
                    document.getElementById("felhasznalofelulet").innerText = ("Sikeres befizetés! Új egyenleg: " + users[index].Balance.toLocaleString('hu-HU') + " FT");
                    activefelh(index);
                    // Tranzakciók megjelenítése
                })
                .catch(err => window.alert("Hiba az egyenleg frissítésénél!"));
            } else {
                window.alert("Ismeretlen felhasználó!");
            }
        })
        .catch(error => console.error('Hiba a felhasználók lekérésekor:', error));
}

// Tranzakciók megjelenítése
function showTransactions() {
    let html = "<h3>Tranzakciók:</h3><ul>";
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            for (let user of users) {
                if (user.transactions && user.transactions.length > 0) {
                    for (let tx of user.transactions) {
                        html += `<li>${user.username}:  ${tx.date}: ${tx.type} - ${tx.amount.toLocaleString('hu-HU')} FT</li>`;
                    }
                } else {
                    //html += "<li>Nincsenek tranzakciók.</li>";
                }
            }
            html += "</ul>";
            document.getElementById("felhasznalofelulet").innerHTML = html;
        })
        .catch(error => console.error('Hiba a tranzakciók lekérésekor:', error));
}

// main.html betöltésekor is jelenjen meg:
window.onload = function() {
    if (window.location.pathname.endsWith("/main.html")) {
        let index = localStorage.getItem("activeUserIndex");
        //fetch('/users')
         //   .then(response => response.json())
         //   .then(users => {
          //      if (index >= 0 && index < users.length) {
          //          showTransactions(users[index]);
         //       }
         //   });
    }
    if (window.location.pathname.endsWith("/admin.html")) {
        feltoltSelect();
    }
};

function Kiad()
{
        let szam = window.prompt("Kérek egy összeget a kivételhez");
    szam = Number(szam);
    if (isNaN(szam) || szam <= 0) {
        window.alert("Érvénytelen összeg!");
        return;
    }
    let index = localStorage.getItem("activeUserIndex");
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            if (index >= 0 && index < users.length) {
                if (users[index].Balance < szam) {
                    window.alert("Nincs elég egyenleg a kivételhez!");
                    return;
                }
                users[index].Balance -= szam;
                fetch('/updateUsers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(users)
                })
                .then(res => res.text())
                .then(msg => {
                   document.getElementById("felhasznalofelulet").innerText = ("Sikeres kivétel! Új egyenleg: " + users[index].Balance.toLocaleString('hu-HU') + " FT");
                    activefelh(index); // Frissíti a megjelenített egyenleget
                })
                .catch(err => window.alert("Hiba az egyenleg frissítésénél!"));
            } else {
                window.alert("Ismeretlen felhasználó!");
            }
        })
        .catch(error => console.error('Hiba a felhasználók lekérésekor:', error));
}

function changePassword() {
    const select = document.getElementById('userSelect');
    const username = select.value;
    const newPassword = document.getElementById('ujJelszoAdmin').value;
    if (!username || !newPassword) {
        window.alert("Válassz ki egy felhasználót és add meg az új jelszót!");
        return;
    }
    fetch('/users')
        .then(res => res.json())
        .then(users => {
            const user = users.find(u => u.username === username);
            if (user) {
                user.password = newPassword;
                fetch('/updateUsers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(users)
                })
                .then(res => res.text())
                .then(msg => {
                    window.alert("Jelszó sikeresen módosítva!");
                    feltoltSelect();
                })
                .catch(err => window.alert("Hiba a módosításnál!"));
            }
        });
}

