const express = require('express');
const fs = require('fs');
const app = express();
const crypto = require('crypto');

app.use(express.json()); // Um JSON-Daten aus Anfragen zu extrahieren

process.env.BEARER_TOKEN = "Bearer";

// Middleware zur Authentifizierung mit Bearer-Token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === BEARER_TOKEN) {
        return next();
    } else {
        res.status(401).send('Nicht authentifiziert');
    }
};

// Handler für GET-Anfragen an die Root-URL
app.get('/', (req, res) => {
    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send('Ein Fehler ist aufgetreten');
        } else {
            res.send("HELLO WORLD!");
        }
    });
});

// Handler für GET-Anfragen an /entries (mit Authentifizierung)
app.get('/entries', authenticate, (req, res) => {
    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send('Ein Fehler ist aufgetreten');
        } else {
            res.send(JSON.parse(data));
        }
    });
});

// Handler für GET-Anfragen an /:slug zur Umleitung
app.get('/:slug', (req, res) => {
    const slug = req.params.slug;
    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send('Ein Fehler ist aufgetreten');
        } else {
            const entries = JSON.parse(data);
            const entry = entries.find(e => e.slug === slug);
            if (entry) {
                res.redirect(entry.url);
            } else {
                res.status(404).send('Eintrag nicht gefunden');
            }
        }
    });
});

// Handler für DELETE-Anfragen an /entry/:slug
app.delete('/entry/:slug', authenticate, (req, res) => {
    const slug = req.params.slug;
    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send('Ein Fehler ist aufgetreten');
            return;
        }
        let entries = JSON.parse(data);
        const entryIndex = entries.findIndex(e => e.slug === slug);
        if (entryIndex !== -1) {
            entries.splice(entryIndex, 1);
            fs.writeFile('data.json', JSON.stringify(entries), (err) => {
                if (err) {
                    res.status(500).send('Ein Fehler ist aufgetreten');
                } else {
                    res.status(200).send('Eintrag erfolgreich gelöscht');
                }
            });
        } else {
            res.status(404).send('Eintrag nicht gefunden');
        }
    });
});

// Handler für POST-Anfragen an /entry
app.post('/entry', authenticate, (req, res) => {
    const { url, slug } = req.body;
    if (!url) {
        res.status(400).send('URL ist erforderlich');
        return;
    }
    const newSlug = slug || crypto.randomBytes(6).toString('hex');
    const newEntry = { slug: newSlug, url: url };

    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send('Ein Fehler ist aufgetreten');
            return;
        }
        const entries = JSON.parse(data);
        entries.push(newEntry);
        fs.writeFile('data.json', JSON.stringify(entries, null, 2), (err) => {
            if (err) {
                res.status(500).send('Ein Fehler ist aufgetreten');
            } else {
                res.send('Eintrag erfolgreich gespeichert');
            }
        });
    });
});

// Server starten
app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
