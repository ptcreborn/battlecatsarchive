(async () => {
    const selector_version = document.querySelector('#acc_version');
    const btn_version = document.getElementById('btn_version');
    let useremail = '';

    await initFunctions(['supabase', 'FirebaseModule', 'DiscordAPI', 'BCA_Cache']);
    let acc_ver = '';

    const admin_uuid = [
        'ef33a291-0a55-47e2-b56a-1fd64571b9fd',
        'd1d960f1-a364-4d15-909e-073127bef432',
        '547da049-1a80-4803-8587-995f2e91a4fb'
    ];

    if (!await checkIfAdmin())
        return;

    btn_version.addEventListener('click', async () => {
        let lang = window.prompt("Add language such as [EN, JP, KR]");
        let version = window.prompt("Please add a version, format (15-1-0)");

        try {
            if (version.split('-').length != 3) {
                window.alert("Invalid format.");
                return;
            }

            if (lang.length != 2) {
                window.alert("Language would contain for only 2 characters");
                return;
            }
        } catch (error) {
            window.alert("Invalid format, please follow the hyphen format.");
            return;
        }

        let data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/account_ver.json`);

        if (data.hasOwnProperty(version)) {
            window.alert("The version you are trying to add is already existing!");
            return;
        }

        if (lang == "EN")
            lang = '';

        else lang = `/${lang}-`;

        await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/account_ver.json`, JSON.stringify({
            [`${lang}${version}`]: new Date().getTime()
        }));

        await DiscordAPI.post(
            useremail,
            BCA_Cache.getParseItem('bca_user').data.prof_img,
            `NEW ACCOUNT VERSION WAS ADDED! by Admin ${useremail}`,
            `@everyone ADMIN added another account version **${lang} ${version}**!`,
            '',
            'https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html',
            'https://discord.com/api/webhooks/1477986793990127707/6IFzsFPkC4hQ7RwY91ZbgXrnrVKCtEQI-G74x0ngV-JxNHXBWWYF--X32Wnb84ATr2ep'
        );

        await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/highkeep.json`,
            JSON.stringify({
                [new Date().getTime()]: {
                    email: useremail,
                    profile: JSON.parse(atob(localStorage.getItem('user'))).profile,
                    acc: lang,
                    ver: version,
                    qty: 0
                }
            })
        );

        window.location.reload();
    });

    let accounts = await checkSupply();
    if (!accounts) return;

    await buildVersionOptions();

    // Functions
    window.submitForm = async () => {
        await processForm();
    }
    async function processForm() {
        // check the type of account by getting its value
        // check the links in the textbox
        // verify if they are URLS

        const types = document.getElementById('type_accounts'); // select
        const links = document.getElementById('links'); // textarea
        const webpage = document.getElementById('postBody');
        const submit = document.getElementById('submit_btn');

        webpage.style = 'opacity:0.7; pointer-events: none;';

        const account_id = types.value;
        const account_name = types.options[types.selectedIndex].text;

        let links_arr = links.value.trim().split('\n');

        // Filter for IMGBB to host Cloudflare
        links_arr = links_arr.map(item => item.replace('https://i.ibb.co/', 'https://bca-image-proxy.jasonbourne181997.workers.dev/'));

        for (const item of links_arr) {
            try {
                if (new URL(`${item}`).origin == "null") {
                    throw new Error(`Invalid link, please verify the links.
                        Error in: ${item}`);
                }
            } catch (e) {
                window.alert(`There's a text in the input that is NOT a URL. Please fix this: 
                ${item}
                
                Error: ${e}`);
                webpage.style = 'opacity:1; pointer-events: auto;';
                return;
            }
        }

        submit.innerText = "Uploading...";

        const fbdb = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${acc_ver}/${account_name}.json`;

        let payload_json = {};
        for (const item of links_arr) {
            let key_date = new Date().getTime();

            payload_json[key_date] = {
                link: btoa(item),
                status: "x",
                modified: key_date
            }

            await sleep(5);
            // await FirebaseModule.post(`${fbdb}`, JSON.stringify({
            //     link: btoa(item),
            //     status: "x",
            //     modified: new Date().getTime()
            // }));
        }

        let res = await sendPATCH(`${fbdb}`, JSON.stringify(payload_json));
        if (!res)
            return;

        // update the count of supabase
        await supabase.rpc('add_account_stocks', {
            new_stocks: links_arr.length,
            account_id: account_id
        });

        // Notify to Discord ...
        // username, avatar, title, message, thumbnail, url, webhook

        await DiscordAPI.post(
            useremail,
            JSON.parse(atob(localStorage.getItem('user'))).profile,
            `NEW RESTOCK ACCOUNTS! by Admin ${useremail}`,
            `@everyone ADMIN **${useremail}** has uploaded **${links_arr.length}x ${account_name} [${acc_ver}]** in the DATABASE. Please use the code properly!`,
            '',
            'https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html',
            'https://discord.com/api/webhooks/1477986793990127707/6IFzsFPkC4hQ7RwY91ZbgXrnrVKCtEQI-G74x0ngV-JxNHXBWWYF--X32Wnb84ATr2ep'
        );

        await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/highkeep.json`,
            JSON.stringify({
                [new Date().getTime()]: {
                    email: useremail,
                    profile: JSON.parse(atob(localStorage.getItem('user'))).profile,
                    acc: account_name,
                    ver: acc_ver,
                    qty: links_arr.length
                }
            })
        );

        window.alert(`You have successfully uploaded ${links_arr.length} ${account_name} in the Database.`);
        window.location.reload();
    }
    async function checkIfAdmin() {
        let {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            window.alert(`${error.message}`);
            return;
        }

        if (!data.session) {
            window.alert(`You are not logged in. Please login first`);
            window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            return;
        }

        if (admin_uuid.includes(data.session.user.id)) {
            useremail = data.session.user.email;
            return true;
        }
        else
            return;
    }
    async function buildTable() {
        // this function will build the content of the tables showing the quantity of each accounts.
        const table = document.getElementById('table_of_accounts');

        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket`;

        let data = await FirebaseModule.fetchJSON(`${db}/${acc_ver}.json`);

        if (!data || data == "null") {
            window.alert(`No codes were uploaded for the version ${acc_ver}`);
            return;
        }

        let keys = Object.keys(data);
        let result_json = [];

        keys.forEach(acc_name => {
            let item_keys = Object.keys(data[acc_name]);
            let count = item_keys.filter(active_accs => data[acc_name][active_accs].status == "x");
            result_json.push({
                acc: acc_name,
                qty: count.length
            });
        });

        result_json.sort((a, b) => a.qty - b.qty);

        result_json.forEach(item => {
            table.innerHTML += `<tr>
                <td style="width: 398px;">&nbsp;${item.acc}</td>
                <td style="width: 398px;">&nbsp;${item.qty < 100 ? `<b>${item.qty}</b>` : `${item.qty}`}</td>
                </tr>`;
        });

        //         for (const items of accounts) {                    
        //             table.innerHTML += `<tr>
        //         <td style="width: 398px;">&nbsp;${items.name}</td>
        //         <td style="width: 398px;">&nbsp;${items.qty < 100 ? `<b>${items.qty}</b>` : `${items.qty}`}</td>
        //         </tr>`;
        // }
        document.querySelector('#form').style.display = 'block';
        return true;
    }
    async function buildOptions() {
        // this function will build the options in the select in the html.
        const select = document.getElementById('type_accounts');
        document.querySelectorAll('#type_accounts option').forEach(item => item.remove());

        for (const items of accounts)
            select.innerHTML += `<option name="${items.name}" value="${items.id}">${items.name}</option>`;
    }

    async function checkSupply() {
        let {
            data,
            error
        } = await supabase.from('accounts').select('id, name, qty').order('qty', {
            ascending: false
        });
        if (error) {
            console.log(`error detected in checkSupply(): ${error.message}`);
            return;
        }

        if (data.length == 0) return;

        return data;
    }

    async function buildVersionOptions() {
        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/account_ver.json`;
        let data = await FirebaseModule.fetchJSON(`${db}`);
        let keys = Object.keys(data);
        keys = keys.reverse();

        keys.forEach(item => selector_version.innerHTML += `<option value="${item}">${item.split('-').length === 3 ? `EN-${item}`: item}</option>`);
        selectVersion();
    }

    async function selectVersion() {
        selector_version.addEventListener('change', async () => {
            acc_ver = selector_version.value;
            document.querySelector('#form').style.display = 'block';
            document.querySelector('#table_of_accounts').setAttribute('disabled', '');
            document.querySelector('#table_of_accounts').innerHTML =
                `<tbody>
                <tr>
                <td style="width: 398px;">&nbsp;<b>Account Type</b></td>
                <td style="width: 398px;">&nbsp;<b>Quantity</b></td>
                </tr>
                </tbody>`;
            selector_version.setAttribute('disabled', '');

            buildOptions();
            buildTable();

            selector_version.removeAttribute('disabled');
        });
    }

    async function sendPATCH(url, json_data) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open("PATCH", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = function () {
                // Only do something when the request is FINISHED (state 4)
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Return the parsed data only
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        // Only alert/reject if it actually failed
                        window.alert("Error: " + xhr.status);
                        reject(xhr.status);
                    }
                }
            };

            xhr.send(json_data);
        });
    }
})();
