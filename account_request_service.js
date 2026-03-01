(async() => {

    // Account Service Management
    // This script runs the accounts service such as requesting, displaying and managing accounts to the users.

    const cards_parent = document.getElementById('cards_parent');
    const disable = 'opacity: 7; pointer-events: none';
    const enable = 'opacity: 1; pointer-events: auto';
    let session = '';
    let userRequestLimit = 0;
    let isUpdating = false;
    let userEmail = ``;
    let acc_ver = ``;
    const maxLimit = 50;

    await initFunctions(['supabase']);
    await selectAccountVersion();

    // Functions
    window.request = async(account_name, account_id, account_ads) => {
        event.target.innerText = "Please wait...";
        await requestAccount(account_name, account_id, account_ads);
    }

    async function requestAccount(account_name, account_id, account_ads) {
        cards_parent.style = disable;
        // search Firebase for available codes.
        // x = available
        // y = processing
        // z = not available

        //let acc_name_ver = `${acc_ver.split('-').length == 3 ? `EN-${acc_ver}`: `${acc_ver}`} (${account_name})`;

        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${acc_ver}`;

        await initFunctions(['FirebaseModule']);

        let accounts = await FirebaseModule.fetchJSON(`${db}/${account_name}.json`);
        let keys = Object.keys(accounts);

        // find account from firebase and check its status        
        let code = keys.find(item => accounts[item].status == "x");
        await FirebaseModule.patch(`${db}/${account_name}/${code}.json`, JSON.stringify({
            modified: new Date().getTime(),
            status: "y"
        }));

        // store the code to HEAP in firebase
        const heap_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap.json`;

        let url_id = await FirebaseModule.post(`${heap_db}`, JSON.stringify({
            code: code,
            ads: account_ads,
            progress: 0,
            time: new Date().getTime(),
            name: account_name,
            id: account_id,
            ver: `${acc_ver.split('-').length == 3 ? `EN-${acc_ver}`: `${acc_ver}`} (${account_name})`
        }));

        url_id = JSON.parse(url_id).name;

        // increment request count on the particular account from supabase
        await supabase.rpc('add_account_request_count', {
            arg_id: account_id
        });

        // create a session in firebase
        const session_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/session_db/${btoa(userEmail)}.json`;
        await FirebaseModule.post(`${session_db}`, JSON.stringify({
            time: new Date().getTime(),
            heap_code: url_id,
            acc_name: account_name,
            acc_id: account_id
        }));

        let request_parameters = JSON.stringify({
            targ: `https://battlecatsarchive.blogspot.com/p/account-verify.html?code=${url_id}&ver=${acc_ver}`,
            clicks: 0,
            max: account_ads,
            account: {
                code: url_id,
                email: userEmail
            }
        });

        window.location.href = `https://battlecatsarchive.blogspot.com/p/account-reservation.html?request=${btoa(request_parameters)}`;
        //window.location.href = `https://battlecatsarchive.blogspot.com/p/ads-central.html?code=${url_id}`;
    }
    async function checkRequestLimit() {
        let { data, error } = await supabase.rpc('account_request_check_limit', {
            arg_email: userEmail
        });

        if (error) {
            window.alert(`Error detected: ${error.message}`);
            return;
        }

        return data;
    }
    async function checkForSession() {
        // check if the user has pending session
        // if yes, redirect to that session
        // let the user finish the session
        // or the user can cancel it
        await initFunctions(['FirebaseModule']);

        if (!userEmail) {
            window.alert(`Please login first.`);
            window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            return;
        }

        const session_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/session_db/${btoa(userEmail)}.json`;
        let data = await FirebaseModule.fetchJSON(`${session_db}`);

        if (!data) return;

        try {
            let keys = Object.keys(data);
            data = data[keys[0]];

            /*
            ask the user if the ongoing account should be continued or not. 
            If not, delete heap code, 
            decrement total request count, 
            delete session and 
            restore the "Y" code to "X" code.
             */
            const isContinue = window.confirm(`
            You have an ongoing account requests right now.
            
                Account: ** ${data.acc_name} **
                Date: ${new Date(data.time)}

            Do you want to continue getting this account?
            Click "OK" if yes. "Cancel" if no.

            `);

            if (isContinue) {
                window.alert(`                    
                You have an ongoing (${keys.length}x) account requests right now:
                
                Account: ** ${data.acc_name} **
                Date: ${new Date(data.time)}
                
                You need to finish this before requesting again for new account. This is to avoid account request spam for other users. So the stock will remain in high value and serve its purpose.`);

                return `${data.heap_code}`;
            } else {
                // get the heap code
                let heap_data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${data.heap_code}.json`);

                // change the status code of the account back to X       
                await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${acc_ver}/${heap_data.name}/${heap_data.code}.json`, JSON.stringify({
                    status: "x"
                }));

                // delete the heap code
                await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${data.heap_code}.json`, "null");

                // decrement database request count
                await supabase.rpc(`decrement_request_count`, {
                    arg_id: data.acc_id
                });

                // delete session
                await FirebaseModule.patch(`${session_db}`, `null`);
                return;
            }
        } catch (e) {
            // means error in getting the keys of the JSON
            // delete the record and start a new.
            await FirebaseModule.patch(session_db, "null");
            return;
        }

    }
    async function buildMenu() {
        if (!await checkIfUserOnline()) return;

        let { data, error } = await supabase.from('accounts').select('id, description, name, ads, qty, request_count').order('ads', { ascending: false });

        if (error) {
            window.alert(`Error: ${error.message}`);
            return;
        }

        if (data.length > 0) {
            for (const val of data) {
                // val.ads
                let qty = await getAccountQty(`${val.name}`);

                cards_parent.innerHTML += `<div class="card">
                <div class="content">
                <img class="right floated mini ui image" src="https://i.imgur.com/3m1fXmw.png" />
                <div class="header">
                    ${val.name}
                </div>
                <div class="meta">
                    Stocks Left: ${qty}
                </div>
                <div class="meta">
                    Requested: ${val.request_count}x
                </div>
                <div class="ui basic label">
                    Number of ADS: ${val.ads}
                </div>
                <div class="description" style='max-height: 150px; overflow: auto;'>
                    ${val.description.replaceAll('\n', '<br/>')}
                </div>
                </div>
                <div class="extra content">
                <div class="ui two buttons">
                    <button ${qty <= 0 ? "style='display: none;'" : ""} onclick="request('${val.name}', ${val.id}, ${val.ads})" class="ui green button">Request</button>
                    <button ${qty > 99 ? "style='display: none;'" : ""} class="ui red button">Ask to Replenish</button>
                </div>
                </div>
            </div>`;
            }
            document.getElementById('form_parent').classList.remove('ui', 'segment', 'loading');
        }
    }

    async function checkIfUserOnline() {
        let { data, error } = await supabase.auth.getSession();
        if (error) {
            window.alert(`${error.message}`);
            return;
        }

        if (!data.session || !localStorage.getItem('user')) {
            window.alert(`You need to login first.`);
            window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            return;
        }

        return data.session.user.email;
    }    

    async function selectAccountVersion() {
        // this function will generate all available account versions
        // when user selected a version, then menu will build afterwards..

        let version_selector = document.querySelector('#account_version');

        await initFunctions(['FirebaseModule']);
        let versions = await FirebaseModule.fetchJSON('https://storehaccounts-website-default-rtdb.firebaseio.com/account_ver.json');

        let keys = Object.keys(versions);

        keys.forEach(val => document.getElementById('account_version').innerHTML += `<option value='${val}'>${val.split('-').length == 3 ? `EN ${val}`: `${val}`}</option>`);

        version_selector.addEventListener('change', async() => {
            acc_ver = version_selector.value;
            document.getElementById('h2_title').innerText = `Request Battle Cats Accounts Version ${acc_ver} for FREE!`;
            document.getElementById('form_parent').classList.add('ui', 'segment', 'loading');
            cards_parent.innerHTML = '';
            version_selector.setAttribute('disabled', '');

            // Main Execution
            if (!isUpdating) {
                userEmail = await checkIfUserOnline();
                if(!userEmail)
                    return;
                
                session = await checkForSession();
                userRequestLimit = await checkRequestLimit();

                if (!session) {
                    await buildMenu();
                    version_selector.removeAttribute('disabled');
                    if (userRequestLimit >= maxLimit) {
                        window.alert(`You have reached your max request [${userRequestLimit}] limit for today. Try again tomorrow!`);
                        return;
                    }

                    window.alert(`Dear user,
        
        You have requested ${userRequestLimit} for today.
        The max account request is ${maxLimit} to avoid
        abusing the server. Thank you!`);
                } else {

                    await initFunctions(['FirebaseModule']);

                    let data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${session}.json`);

                    let request_parameters = JSON.stringify({
                        targ: `https://battlecatsarchive.blogspot.com/p/account-verify.html?code=${session}&ver=${acc_ver}`,
                        clicks: 0,
                        max: data.ads,
                        account: {
                            code: session,
                            email: userEmail
                        }
                    });

                    window.location.href = `https://battlecatsarchive.blogspot.com/p/account-reservation.html?request=${btoa(request_parameters)}`;
                    //window.location.href = `https://battlecatsarchive.blogspot.com/p/ads-central.html?code=${session}`;
                }
            } else {
                document.getElementById('h2_title').innerText = document.getElementById('h2_title').innerText + ' (LIVE) - [UPDATING...]';
            }
        });
    }

    async function getAccountQty(account_name) {
        // Account Quantity will now depend from the stock available in Firebase instead of Supabase..
        // The function will accept the correct account name, and check the status of available accounts from FB

        await initFunctions(['FirebaseModule']);

        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${acc_ver}/${account_name}.json`;

        let data = await FirebaseModule.fetchJSON(db);

        if(!data) 
            return 0;

        let keys = Object.keys(data);
        let acc_left = keys.filter(item => data[item].status == "x");
        let processed_accs = keys.filter(item => data[item].status == "y");
        await checkAccountProcessExpiration(account_name, processed_accs)

        return acc_left.length;
    }

    async function checkAccountProcessExpiration(acc_name, acc_key_arr) {
        // This function checks all the codes in the FB, if the process time took morethan 10 minutes,
        // Then the status Y will be changed to X again.
        await initFunctions(['FirebaseModule']);

        const ms = 600000;
        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${acc_ver}/${acc_name}`;



        for(const item of acc_key_arr) {
            let data = await FirebaseModule.fetchJSON(`${db}/${item}.json`);

            if (new Date().getTime() - data.modified > ms) {
                await FirebaseModule.patch(`${db}/${item}.json`, JSON.stringify({
                    status: "x"
                }));
            }
        }
    }
})();
