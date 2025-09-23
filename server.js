const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;
const usersFile = 'Userdetails.json';

app.use(express.json());
app.use(express.static(__dirname)); // statikus fájlok kiszolgálása

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Login_Reg.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({
            success: true,
            felhaszi: users.findIndex(u => u.username === username),
            role: user.role
        });
    } else {
        res.status(401).json({ success: false, message: 'Hibás felhasználónév vagy jelszó.' });
    }
});

// Felhasználók lekérése
app.get('/users', (req, res) => {
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Hiba a fájl olvasásakor');
        res.type('application/json').send(data);
    });
});

app.get('/moneys', (req, res) => {
    fs.readFile('Money.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Hiba a fájl olvasásakor');
        res.send(data);
    });
});

// Új felhasználó hozzáadása
app.post('/register', (req, res) => {
    const { username, password, rank } = req.body;
    if (!username || !password)
        return res.status(400).send('Hiányzó adat');
    const userRank = rank ? rank : 'U';

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Hiba a fájl olvasásakor');
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Hibás JSON formátum');
        }
        if (users.find(u => u.username === username)) {
            return res.status(400).send('A felhasználónév már létezik!');
        }
        users.push({ username, password, role: userRank, Balance: 0 });
        fs.writeFile(usersFile, JSON.stringify(users, null, 2), err2 => {
            if (err2) return res.status(500).send('Hiba a fájl írásakor');
            res.send('Sikeres regisztráció');
        });
    });
});

app.post('/deleteuser', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).send('Hiányzó felhasználónév');
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Hiba a fájl olvasásakor');
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Hibás JSON formátum');
        }
        const newUsers = users.filter(u => u.username !== username);
        fs.writeFile(usersFile, JSON.stringify(newUsers, null, 2), err2 => {
            if (err2) return res.status(500).send('Hiba a fájl írásakor');
            res.send('Felhasználó törölve');
        });
    });
});

app.post('/updateUsers', (req, res) => {
    const users = req.body;
    if (!Array.isArray(users)) return res.status(400).send('Hibás adat');
    fs.writeFile(usersFile, JSON.stringify(users, null, 2), err => {
        if (err) return res.status(500).send('Hiba a fájl írásakor');
        res.send('Felhasználók frissítve');
    });
});

app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});

