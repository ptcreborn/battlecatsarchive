(async () => {
    let decoded_data = decodeURL();
    let parsed_data = parseData(decoded_data);
    const _signature_ = '\x62\x61\x74\x74\x6c\x65\x63\x61\x74\x73\x61\x72\x63\x68\x69\x76\x65';

    const go_btn = document.getElementById('go-btn');

    if (!decoded_data || !parsed_data)
        return;

    await initFunctions(['FirebaseModule']);

    // ads: 5
    // targ: url
    // exp: date
    // user: username
    // img: user photo

    // parameters should look like
    // { 
    //      a: [number of ads],
    //      t: [target url]
    //  }

    setTimeout(async () => {
        await initFunctions(['BCA_Users']);
        const user_country_code = 'BCA_USER_COUNTRY'
        let user_data = await BCA_Users.getUserInfo('email, prof_img');
        user_data = user_data?.length === 1 ? user_data[0] : null;

        let active_users_id = new Date().getTime();

        let fb_data = await FirebaseModule.post(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/link-terminal.json`, JSON.stringify({
            targ: parsed_data.t,
            active: active_users_id
        }));

        let code = getFBDBPostCode(fb_data);

        let country_code = BCA_Cache.getItemWithExpiration(user_country_code);

        if (!country_code) {
            country_code = await getCountryCode();
            BCA_Cache.setItemWithExpiration(user_country_code, country_code, 1000 * 60 * 60);
        }

        const flag_url = country_code == "ANONYMOUS" ? `https://bca-image-proxy.jasonbourne181997.workers.dev/zVdfRRz7/Qtvn-Qcw-Sgucy7cub-LRm-BAV.jpg` : `https://flagsapi.com/${country_code.toUpperCase()}/shiny/64.png`;

        // adding to the active user..
        await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users.json`, JSON.stringify({
            [active_users_id]: {
                user: user_data?.email || "bananamous",
                img: user_data?.prof_img || flag_url,
                code: code,
                prog: 1,
                goal: parsed_data.a
            }
        }));

        let new_params = await BCA_Encryptor.encrypt(
            JSON.stringify(parsed_data),
            _signature_
        );

        go_btn.style.display = 'block';
        go_btn.addEventListener('click', () => {
            window.location.href = `https://battlecatsarchive.blogspot.com/p/bca-link-terminal.html#${encodeURIComponent(new_params)}`;
        }, false);
    }, 3000);

    function getUserDetails() {
        if (!localStorage.getItem('user'))
            return {
                email: "bananamous",
                profile: "https://media.tenor.com/UTfN6nIPrlYAAAAM/banana-dance.gif"
            }
        return JSON.parse(atob(localStorage.getItem('user')));
    }

    function parseData(encoded_str) {
        // this function returns a JSON from url parameter.
        if (!encoded_str)
            return;
        try {
            return JSON.parse(atob(encoded_str));
        } catch (error) {
            window.alert("The url's parameter cant be decoded, please do not alter the url. Thank you. You can go back to the page where you requested the url and try again.");
            return;
        }
    }

    function decodeURL() {
        let url = window.location.href;
        let params = getHashCodeParam('request') || new URL(url).searchParams.get('request');

        if (!params.get('request')) {
            window.alert("The url that has been requested has no parameters. Process will not continue");
            return;
        }

        return params.get('request');
    }

    function getFBDBPostCode(str) {
        return JSON.parse(str).name;
    }

    async function getCountryCode() {
        try {
            // 1. Fetch the geolocation data based on the visitor's current IP
            const response = await fetch('https://ipwho.is/');

            if (!response.ok) throw new Error('Network response failed');

            const data = await response.json();

            // 2. Check if the API successfully found the location
            if (data && data.success) {
                return data.country_code;
            } else {
                throw new Error(data.message || 'API failed to resolve IP');
            }

        } catch (error) {
            console.warn("API failed, falling back to browser locale:", error.message);
            return "ANONYMOUS";
        }
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
