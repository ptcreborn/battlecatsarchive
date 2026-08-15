(async() => {
const db = `https://storehaccounts-threads-default-rtdb.firebaseio.com/email_accounts`;

    await initFunctions(['FirebaseModule', 'BCA_Url', 'supabase']);

    let key = new Date().getTime();
    let payload = generatePayload(key);

    if (!payload)
        return;

    let target_payload = payload[key];

    let numAds = await getNumAds(target_payload.accName);

    if (!numAds) {
        window.alert("Invalid request, missing ad parameter. Please report this one.");
        return;
    }

    // Adding number of ads as parameter.
    target_payload.ads = numAds;
    let logs = document.getElementById('logs');

    // creating a record to the database.
    await FirebaseModule.patch(`${db}.json`, JSON.stringify(payload));

    logs.textContent = `Reading requested url...`;
    await sleep(3000);
    logs.textContent = `Decoding parameters...`;
    await sleep(3000);
    logs.textContent = `Finalizing...`;
    await sleep(3000);
    logs.textContent = `Ready to go...`;
    await sleep(2000);

    window.location.href = `https://battlecatsarchive.blogspot.com/p/account-preview.html#process=${ptcEncryptor(key.toString())}&method=new`;

    async function getNumAds(accName) {
        let { data, error } = await supabase.from('accounts').select('ads').ilike('name', accName);

        if (data?.length === 0 || error)
            return;

        return data?.length === 1 ? data[0].ads : data;
    }

    function generatePayload(key) {
        let parameters = getULRParameters();
        if (!parameters)
            return;

        let payload = {
            [key]: {
                img_key: parameters[0],
                img_path: parameters[1],
                email: parameters[2],
                accName: parameters[3].replace('.jpg', '')
            }
        }
        return payload;
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

    function getULRParameters() {
        let request_data = getHashCodeParam('request') || BCA_Url.getParamValue('request');
        console.log(request_data);

        if (!request_data) {
            window.alert("No parameters were loaded in this request. No action will continue.");
            return;
        }

        try {
            let data = request_data.split('-27-');
            let decrypted_data = data.map(item => atob(item));

            return decrypted_data;
        } catch (error) {
            window.alert("Invalid HTML Structure and parameter structure. No action will continue.");
            return;
        }
    }

    function ptcEncryptor(str) {
        let new_str = str.split('').reverse().join('').toString();
        return btoa(new_str);
    }

    function ptcDecryptor(str) {
        let new_str = atob(str);
        return new_str.split('').reverse().join('').toString();
    }
})();
