
// CREATED April 5, 2026
// Created in 2 days
// FBDB: https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint

window.addEventListener('load', async () => {
    // check params
    appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
    await initFunctions(['FirebaseModule']);

    const message = document.getElementById('message');
    const btn = document.getElementById('triggerBtn');
    const dl_count = document.getElementById('dl_count');
    const dl_filename = document.getElementById('dl_filename');

    await sleep(5000);

    let param = new URL(window.location.href).searchParams.get('id');
    param = decodeURIComponent(param);

    await getDLInfo(btoa(param));

    if (!param || param == 'null') {
        message.className = `alert-message warning`;
        message.innerText = "Oops invalid file request. The process will not continue.";
        return;
    }

    // create a checkpoint
    message.innerText = "Creating checkpoint...";
    let key = new Date().getTime();
    let sand = await encryptData(key, param);
    await FirebaseModule.patch(
        `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint.json`,
        JSON.stringify({
            [key]: {
                api: sand,
                id: param
            }
        })
    );

    await sleep(5000);

    message.innerText = "Checkpoint created. You can now proceed.";

    btn.style.display = 'block';
    btn.addEventListener('click', async (e) => {
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
        await incrementCount(btoa(param));
        window.location.href = `https://battlecatsarchive.blogspot.com/p/decode-page.html?id=${key}&decode=${param}`;
    }, false);


    async function getEncryptionKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );
        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }
    async function encryptData(text, password) {
        const enc = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await getEncryptionKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            enc.encode(text)
        );

        // Combine salt, iv, and content for storage
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);

        return btoa(String.fromCharCode(...result));
    }

    async function incrementCount(api) {
        await FirebaseModule.post(`https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_download_stats/${api}.json`,
            JSON.stringify({
                a: "b"
            })
        );
    }

    async function getDLInfo(api) {
        let count = await FirebaseModule.fetchJSON(`https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_download_stats/${api}.json`);
        dl_filename.textContent = `${count ? `${atob(api)}${count.ext}` : `cant find request...`}`;
        dl_count.textContent = `${count ? Object.keys(count).length : 0} downloads`;
    }
}, false);
