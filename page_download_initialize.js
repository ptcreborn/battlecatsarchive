
// CREATED April 5, 2026
// Created in 2 days
// FBDB: https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint, https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_download_stats

(async () => {
    // check params

    if (typeof Storage !== "undefined") {
        console.log("LocalStorage is supported");
    } else {
        window.alert(`
            
            Please enable Local Storage, or download Google Chrome. Thank you!
            
            The request will not continue.
            `);
        return;
    }

    appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
    await initFunctions(['FirebaseModule']);

    const message = document.getElementById('message');
    const btn = document.getElementById('triggerBtn');
    const dl_count = document.getElementById('dl_count');
    const dl_filename = document.getElementById('dl_filename');
    const name = "bca_download";

    // Collect Garbage
    garbageCollect();

    let param = getHashCodeParam('id') || new URL(window.location.href).searchParams.get('id');
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

    insertLS(param, key);
    await sleep(3000);

    message.innerText = "Checkpoint created. You can now proceed.";

    btn.style.display = 'block';
    await incrementCount(btoa(param));

    let data = {
        a: 3,
        t: encodeURIComponent(`https://battlecatsarchive.blogspot.com/p/bca-cloud-storage.html?checkpoint=${key}&api=${param}`)
    }

    btn.style.display = 'block';
    btn.innerHTML = "✅Proceed Now";
    btn.href = `https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html#request=${btoa(JSON.stringify(data))}`;

    // btn.href = `https://battlecatsarchive.blogspot.com/p/decode-page.html?id=${key}&decode=${param}`;


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

    function getHashCodeParam(param) {
        let hash = window.location.hash.substring(1);

        if (!hash)
            return;

        let hash_parts = hash.split('&');

        let value = hash_parts.map(item => {
            let item_parts = item.split(/=(.*)/s).filter(_ => _);
            if (param === item_parts[0])
                return item_parts[1];
        }).filter(_ => _);

        return value ? decodeURIComponent(value) : null;
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

    function garbageCollect() {
        // delete expired localstorage downloads
        let contents = localStorage.getItem(name);

        if (!contents)
            return;

        try {
            contents = JSON.parse(contents);
            let keys = Object.keys(contents);
            let new_json = {};

            keys.map(key => {
                let data = contents[key];
                let now = new Date().getTime();
                let exp = new Date(data).getTime();
                let lapse = now - exp;
                lapse = lapse / 1000;

                if (lapse < 30)
                    new_json[key] = data;
            });

            localStorage.setItem(name, JSON.stringify(new_json));
        } catch (error) {
            localStorage.removeItem(name);
        }
    }

    function insertLS(param, key) {
        let contents = localStorage.getItem(name);

        if (!contents)
            contents = {};
        else
            contents = JSON.parse(contents);
        contents[param] = key;
        localStorage.setItem(name, JSON.stringify(contents));
    }
})();
