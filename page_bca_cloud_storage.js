// Created on April 5, 2026
// Created in 2 days
// FBDB: https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint

(async () => {
    //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/824309794e18edf23fe3d414dfa29e738db0a235/bca-chatbox-widget.js');
    appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');

    await initFunctions(['FirebaseModule']);

    // Dispatch requests more than 30 minutes!
    dispatchCheckpointExpired();
    buildRelatedDownloads();
    await sleep(3000);

    let param = new URL(window.location.href).searchParams;
    let checkpoint = decodeURIComponent(param.get('checkpoint'));
    param = decodeURIComponent(param.get('api'));

    const message = document.getElementById('message');
    const dlBtn = document.getElementById('triggerBtn');

    const worker = atob('aHR0cHM6Ly9kcnktZ2xhZGUtZWFlMS5qYXNvbmJvdXJuZTE4MTk5Ny53b3JrZXJzLmRldi8=');
    const isLinkTerminalPassed = await FirebaseModule.fetchJSON(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint/${checkpoint}.json`);

    if (!param || !checkpoint || !isLinkTerminalPassed?.progress || !isLinkTerminalPassed?.api || isLinkTerminalPassed.progress !== "completed") {
        dlBtn.textContent = `No download will proceed.`;
        errorMessage("Invalid or Expired API Point. Please restart in the beginning and dont try to alter the url.");
        return;
    }

    const ext = await FirebaseModule.fetchJSON(`https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_download_stats/${btoa(param)}/ext.json`);
    const root = await FirebaseModule.fetchJSON(`https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_download_stats/${btoa(param)}/root.json`);

    dlBtn.textContent = `Download ${param}${ext}`;

    message.textContent = `Great! You have make it here! You are now ready to download your mod.`;
    dlBtn.style.pointerEvents = 'auto';
    dlBtn.style.opacity = '1';

    dlBtn.addEventListener('click', async () => {
        // Firebase Fetch
        dlBtn.style.opacity = '0.7';
        dlBtn.style.pointerEvents = 'none';
        message.textContent = `Downloading...`;
        let temp_key = "cloud-" + checkpoint;

        try {
            const response = await fetch(worker, {
                method: "POST",
                referrerPolicy: "no-referrer-when-downgrade", // Forces the full URL to be sent
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: isLinkTerminalPassed.api,
                    key: param,
                    ext: ext,
                    root: root || "dump"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.log(data);
                throw new Error(`Security check failed: ${JSON.stringify(data)}`);
            }

            if (data.downloadUrl) {
                dlBtn.textContent = `[Started] ${dlBtn.textContent}`;
                infoMessage("Link authorized! Starting download...");
                download_item(data.downloadUrl, param, ext);

                setTimeout(() => {
                    infoMessage(`"Download has initiated. Enjoy! Share this to your friends!" You earn 10XP!`);
                }, 1000);

                // Do not over download...
                if (!localStorage.getItem(temp_key)) {
                    addUserXP(10);
                    localStorage.setItem(temp_key, new Date().getTime());
                }
            } else
                throw new Error(`No download URL received. ${JSON.stringify(data)}`);

        } catch (err) {
            errorMessage(`Error detected: ${err}`);
            dlBtn.textContent = `No download will proceed.`;
        }

    });

    function download_item(url, filename, ext) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}${ext}`; // force filename

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function errorMessage(str) {
        message.textContent = str;
        message.className = 'alert-message error';
    }

    function infoMessage(str) {
        message.textContent = str;
        message.className = 'alert-message success';
    }

    async function dispatchCheckpointExpired() {
        const db = `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint.json`;
        let data = await FirebaseModule.fetchJSON(db);

        if (!data)
            return;

        let keys = Object.keys(data);

        keys.map(key => {
            let isKeyExpired = Math.floor((new Date().getTime() - key) / 1000 / 60) >= 30;
            if (isKeyExpired)
                FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint/${key}.json`, "null");
        });

        // dispatched unused localstorage
        let local_keys = Object.keys(localStorage);
        let cloud_keys = local_keys.filter(item => item.includes('cloud-'))
        cloud_keys.map(item => {
            let now = new Date().getTime();
            let expiry_date = parseInt(localStorage.getItem(item));
            if (Math.floor(now - expiry_date / 1000 / 60) >= 30)
                localStorage.removeItem(item);
        });

    }

    async function addUserXP(xp) {
        // must be online
        // must complete the following task
        // must finish the assignment

        let { data, error } = await supabase.auth.getSession();

        if (error)
            return;

        if (!data.session)
            return;

        let email = data.session.user.email;

        await supabase.rpc('add_xp_to_user', {
            user_email: email,
            xp_to_add: xp
        });
    }

    async function buildRelatedDownloads() {
        const db = `https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_download_keys.json?orderBy="$value"&limitToFirst=50`;
        await initFunctions(['FirebaseModule']);
        const localStorageCache = "/bca-cloud-storage-cached";
        let cached_data = localStorage.getItem(localStorageCache);
        let data = JSON.parse(cached_data || null)?.data || await FirebaseModule.fetchJSON(`${db}`);
        let keys = Object.keys(data);

        if (!data || !keys)
            return;

        let fragment = document.createDocumentFragment();

        for (const key of keys) {
            let clone = document.querySelector('[related-child-template]').content.cloneNode(true).children[0];
            let link = clone.querySelector('a');
            link.href = `https://battlecatsarchive.blogspot.com/p/download-initialize.html?id=${encodeURIComponent(atob(key))}`;
            link.setAttribute('target', '_blank');
            link.textContent = `Download ${atob(key)}...`;
            fragment.appendChild(clone);
        }

        document.getElementById('related_downloads_container').appendChild(fragment);

        // Check localStorageCache, dispatch if morethan 24 hours...
        if (cached_data) {
            let parsed = JSON.parse(cached_data);
            let now = new Date().getTime();
            let expiry = parsed.exp;

            if (Math.floor(now - expiry) / 1000 / 60 / 60 >= 24) {
                // EXPIRED, remove the localstorage    
                localStorage.removeItem(localStorageCache);
            }
        } else {
            // Create a new cache.
            let now = new Date();
            now.setDate(now.getDate() + 1);
            localStorage.setItem(localStorageCache, JSON.stringify({
                data: data,
                exp: now
            }));
        }
    }
})();
