(async () => {
    await buildInformation();

    // Functions \\
    function getURLParameters(key) {
        let url = new URL(window.location.href);
        let is_using_hash = checkHashCodeParam(key) || url.hash;
        let param = is_using_hash ? getHashCodeParam(key) : url.searchParams.get(key);

        if (!param) 
            return;

        return param;
    }

    async function getAccountInfo() {
        let data_param = getURLParameters('reserved');
        let acc_param = getURLParameters('verified');

        console.log(data_param);
        console.log(acc_param);

        if (!data_param || !acc_param)
            return;

        let data = decodeURIComponent(data_param);
        let acc = decodeURIComponent(acc_param);

        try {
            data = atob(data);
            data = JSON.parse(data);
            acc = atob(acc);
        } catch (error) {
            window.alert("Error in decoding data.");
            return;
        }

        if (data.account.email != acc) {
            window.alert("Verification failed. Incorrect account.");
            return;
        }

        return data;
    }

    async function buildInformation() {
        let data = await getAccountInfo();
        if (!data)
            return;

        await initFunctions(['FirebaseModule']);
        let fb_data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${data.account.code}.json`);

        if (!fb_data) {
            window.alert("Cant find what you're requesting to. The session might has been expired.");
            return;
        }

        const container = document.querySelector('.parent-container');
        container.innerHTML = `<div><b>You requests:</b></div>`;
        await sleep(1500);
        container.innerHTML += `<div>Account: ${fb_data.name}</div>`;
        await sleep(1500);
        container.innerHTML += `<div>Email: ${data.account.email}</div>`;
        await sleep(1500);
        container.innerHTML += `<div>Number of Ads: ${fb_data.ads}</div>`;
        await sleep(1500);
        container.innerHTML += `<button class="button-15" id="go-btn" style="display: none;">Proceed Now</button>`;
        await sleep(1500);

        const btn = document.getElementById('go-btn');

        btn.style.display = 'block';
        btn.addEventListener('click', () => {
            window.location.href = `https://battlecatsarchive.blogspot.com/p/account-progress.html#ongoing=${getURLParameters('reserved')}&verified=${encodeURIComponent(btoa(fb_data.name))}`;
        });
    }

    function checkHashCodeParam(param) {
        let hash = window.location.hash.substring(1);

        if (!hash)
            return;

        let hash_parts = hash.split('=');

        return hash_parts.includes(`${param}`) || null;
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
})();
