const db = `https://storehaccounts-threads-default-rtdb.firebaseio.com/email_accounts`;
    const container = document.getElementById('container');

    await initFunctions(['FirebaseModule', 'BCA_Url', 'supabase']);

    let id = getHashCodeParam('process') || BCA_Url.getParamValue('process');
    let new_method = getHashCodeParam('method') || BCA_Url.getParamValue('method');

    if (!id) {
        window.alert("Missing Param Value. No action will proceed.");
        return;
    }

    let data = await FirebaseModule.fetchJSON(`${db}/${ptcDecryptor(id)}.json`);
    if (!data) {
        window.alert("The record you are fetching does not exists anymore. Please go back to your email inbox and click the link from that.");
        return;
    }

    await sleep(1000);
    container.appendChild(createParagraph(`Email: ${data.email}`));
    await sleep(1000);
    container.appendChild(createParagraph(`Account: ${data.accName}`));
    await sleep(1000);
    container.appendChild(createParagraph(`Number of Ads: ${data.ads}`));

    let payload = {
        a: data.ads,
        t: encodeURIComponent(`https://battlecatsarchive.blogspot.com/p/email-account-preview.html#acc=${btoa(id)}${new_method ? `&method=${new_method}`: ``}`)
    }

    await sleep(3000);
    container.innerHTML += `<a href='https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html#request=${btoa(JSON.stringify(payload))}' class='button-15'>Bypass Now</a>`;

    function createParagraph(str) {
        let p = document.createElement('p');
        p.innerText = str;
        return p;
    }

    function ptcDecryptor(str) {
        let new_str = atob(str);
        return new_str.split('').reverse().join('').toString();
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
