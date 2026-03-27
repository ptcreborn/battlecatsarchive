(async () => {

    const scheduled_times = [
        new Date().setHours(0, 0, 0, 0),
        new Date().setHours(6, 0, 0, 0),
        new Date().setHours(18, 0, 0, 0)
    ];

    let real_sched_time = '';

    query('h2-title').textContent = `Please wait while loading cart...`;

    // misc
    await initFunctions(['supabase', 'FirebaseModule', 'moment']);

    // variables
    let user_email = '';
    let cart_db = '';
    let acc_ver = '';

    // main functions
    if (!await checkSession())
        return;

    await buildCartItems();

    async function checkSession() {
        // check the session if existing...
        let {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            window.alert(`Session error: ${error.message}`);
            return;
        }

        if (!data.session) {
            window.alert(`User is not logged in, please login first. Thank you!`);
            document.querySelector('#postBody').textContent = `User is not logged in, please login first. Thank you!`;
            window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            return;
        }

        // check whether the user is requesting its own email address records...
        if (data.session.user.email != getUrlParam()) {
            query('h2-title').textContent = `You are requesting a forbidden user activity, please dispatch. Thank you!`;
            document.querySelector('#postBody').textContent = `You are requesting a forbidden user activity, please dispatch. Thank you!`;
            window.alert(`You are requesting a forbidden user activity, please dispatch. Thank you!`);
            return;
        }

        document.querySelector(`div.parent-cart`).style.display = "block";

        user_email = data.session.user.email;
        document.title = `Cart (${user_email})`;
        return true;
    }

    function getUrlParam() {
        return atob(new URL(window.location.href).searchParams.get('user'));
    }

    async function getUserCartData() {
        // check the record of user's cart from firebase
        // each cart contains item
        // encoded{email}/01894384/
        // time of ordered account
        // account id from suapabase
        // user_id from supabase

        cart_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/bca_cart/${btoa(user_email)}`;

        let cart_data = await FirebaseModule.fetchJSON(`${cart_db}.json`);

        if (!cart_data) {
            return;
        }

        return cart_data;
    }

    async function buildCartItems() {
        let user_cart_data = await getUserCartData();
        let client_time_now = new Date(new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Manila'
        }));

        if (!user_cart_data) { // empty cart
            query('h2-title').innerHTML = `Empty Cart - <a class='add-account' href='https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html'>Add Account Now</a>`;
            return;
        }

        let keys = Object.keys(user_cart_data);

        // FOR LOOP
        for (const key of keys) { // loop through cart details
            let user_data = user_cart_data[key];

            // Checking for expired item in the CART
            if (user_data.exp <= new Date().getTime()) {
                // Expired Cart
                await removeCartItem(user_email, key);
                continue;
            }

            if (user_data.get_exp <= new Date().getTime()) {
                // Expired Bypass Session      
                // Reset the account to available in the bucket.
                await restoreHeapCode(user_data);
                await removeCartItem(user_email, key);
                continue;
            }

            new Promise(async (resolve, reject) => {
                const template = query('cart-item-template');
                const clone = template.cloneNode(true).content.children[0];
                const stock = await checkCurrentStock(user_data.ver, user_data.name);

                let sched_time = `${getNearestHour(
                    queryP(clone, 'counter-data'),
                    scheduled_times, 
                    client_time_now
                )}`;
                let format_sched_time = new Date(sched_time).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                });

                getID('cart-item-container').appendChild(clone);

                clone.id = key;
                queryP(clone, 'cart-item-name').textContent = `${user_data.name} (v${user_data.ver})`;
                queryP(clone, 'exact-time').textContent = `Please get back here ASAP at exactly ${format_sched_time}`;
                queryP(clone, 'cart-added-expiry').textContent = `Expiring in ${moment(user_data.exp).fromNow()}`;
                queryP(clone, 'cart-added-date').textContent = `Order #: ${key}`;
                queryP(clone, 'cart-status').textContent = `${stock < 1 ? "Out of Stock": "Creating"}`;
                queryP(clone, 'acc-ads').textContent = `${user_data.ads}x ads`;

                // Cancel Button
                queryP(clone, 'btn-cancel-order').addEventListener('click', async () => {
                    cancelOrder(queryP(clone, 'btn-cancel-order'), key);
                });

                // Activating Get Button depending on conditions
                if (isAccountReady()) {
                    // Add Button
                    queryP(clone, 'btn-get-acc').addEventListener('click', async (event) => {
                        getAccount(key, event.target);
                    });

                    // Means the account is to be resumed.
                    if (user_data.status == "processing") {
                        queryP(clone, 'btn-get-acc').classList.remove('disabled');
                        queryP(clone, 'btn-get-acc').classList.add('available');
                        queryP(clone, 'btn-get-acc').textContent = `Resume`;

                        // Set status to available
                        queryP(clone, 'cart-status').textContent = "In Process.";
                        queryP(clone, 'cart-status').classList.add('warning');
                        queryP(clone, 'cart-status').classList.remove('creating');

                        // Set warning status 
                        queryP(clone, 'exact-time').classList.remove('warning');
                        queryP(clone, 'exact-time').classList.add('available');
                        queryP(clone, 'cart-item-status').innerHTML = `You can now get your account enclosed with the time specified below.`;

                        queryP(clone, 'cart-added-expiry').textContent = `Expiring in ${moment(user_data.get_exp).fromNow()}`;
                        queryP(clone, 'cart-added-expiry').classList.add('warning', 'bold');
                    } else {
                        // Means new to bypasss.                    
                        queryP(clone, 'btn-get-acc').classList.remove('disabled');
                        queryP(clone, 'btn-get-acc').classList.add('available');

                        // Set status to available
                        queryP(clone, 'cart-status').textContent = "Available";
                        queryP(clone, 'cart-status').classList.add('available');
                        queryP(clone, 'cart-status').classList.remove('creating');

                        // Set warning status 
                        queryP(clone, 'exact-time').classList.remove('warning');
                        queryP(clone, 'exact-time').classList.add('available');
                        queryP(clone, 'cart-item-status').innerHTML = `You can now get your account enclosed with the time specified below.`;
                    }

                    // if the time is 9 pm, then the time limit would be 10 pm, added by 1 hour.
                    let next_hour = new Date(real_sched_time).setHours(new Date(real_sched_time).getHours() + 2, 0, 0, 0);
                    timeCountdown(
                        queryP(clone, 'exact-time'),
                        next_hour,
                        'You only have 2 hours to get all your accounts, if you missed it, wait for the next time batch. Time left: '
                    );
                }
            });
        }
        getID('cart-item-container').style.display = 'block';
        let cart_count = document.querySelector('#bca_cart span').textContent || 0;
        query('h2-title').textContent = `${cart_count > 1 ? `${cart_count} items`: `${cart_count} item`} in the Cart.`;
        if(cart_count == 0)
            query('h2-title').innerHTML = `Empty Cart - <a class='add-account' href='https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html'>Add Account Now</a>`;
        sortItems();
    }

    async function checkCurrentStock(ver, name) {
        const acc_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${ver}/${name}.json`;
        let data = await FirebaseModule.fetchJSON(acc_db);
        let keys = Object.keys(data);

        let fresh_accs = keys.filter(key => data[key].status == "x");

        return fresh_accs.length;
    }

    async function processAccount(account_name, account_id, account_ads, cart_fbdb_id, cart_data) {
        // search Firebase for available codes.
        // x = available
        // y = processing
        // z = not available

        //let acc_name_ver = `${acc_ver.split('-').length == 3 ? `EN-${acc_ver}`: `${acc_ver}`} (${account_name})`;

        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${acc_ver}`;

        await initFunctions(['FirebaseModule']);

        let accounts = await FirebaseModule.fetchJSON(`${db}/${account_name}.json`);
        let keys = Object.keys(accounts);
        let code = '';

        // check if the trigger is to resume the bypass..
        if (cart_data.status == "processing")
            code = cart_data.heap_code;
        else {
            // find account from firebase and check its status        
            code = keys.find(item => accounts[item].status == "x");

            // store the code to bca_cart
            await FirebaseModule.patch(
                `https://storehaccounts-website-default-rtdb.firebaseio.com/bca_cart/${btoa(user_email)}/${cart_fbdb_id}.json`,
                JSON.stringify({
                    heap_code: code
                }));

            await FirebaseModule.patch(`${db}/${account_name}/${code}.json`, JSON.stringify({
                modified: new Date().getTime(),
                status: "y"
            }));
        }

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

        // // create a session in firebase
        // const session_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/session_db/${btoa(user_email)}.json`;
        // await FirebaseModule.post(`${session_db}`, JSON.stringify({
        //     time: new Date().getTime(),
        //     heap_code: url_id,
        //     acc_name: account_name,
        //     acc_id: account_id
        // }));

        let request_parameters = JSON.stringify({
            targ: `https://battlecatsarchive.blogspot.com/p/account-verify.html?code=${url_id}&ver=${acc_ver}&cart=${cart_fbdb_id}`,
            clicks: 0,
            max: account_ads,
            account: {
                code: url_id,
                email: user_email
            }
        });

        await addUserXP(1);

        window.location.href = `https://battlecatsarchive.blogspot.com/p/account-reservation.html?request=${btoa(request_parameters)}`;
        //window.location.href = `https://battlecatsarchive.blogspot.com/p/ads-central.html?code=${url_id}`;
    }

    // BUTTON FUNCTIONS
    async function cancelOrder(elem, key) {
        let choice = window.confirm(`Do you really want to cancel this Order#${key} ?`);

        if (!choice)
            return;

        elem.classList.add('disabled');
        elem.textContent = `Removing...`;

        let cart_data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/bca_cart/${btoa(user_email)}/${key}.json`);

        if (cart_data.status == "processing") {
            // check fro the heap code
            await restoreHeapCode(cart_data);
            await removeCartItem(user_email, key);
        } else await removeCartItem(user_email, key);

        // remove the element.
        getID(key).remove();

        let items = document.querySelectorAll('#cart-item-container > div').length;

        if (items == 0) query('h2-title').innerHTML = `Empty Cart - <a class='add-account' href='https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html'>Add Account Now</a>`;
        else query('h2-title').textContent = `${items < 2 ? `${items} item in the Cart`: `${items} items in the Cart`}.`;

        decrementCartCount();
    }

    async function getAccount(key, btn) {
        // change the status first from the firebase to processing
        // execute bypass account
        let status = getID(key).querySelector('[cart-status]');
        document.querySelector('div#cart-item-container').classList.add('disabled');

        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/bca_cart/`;

        let acc_data = await FirebaseModule.fetchJSON(`${db}/${btoa(user_email)}/${key}.json`);

        if (!acc_data) {
            window.alert(`This item has already been received or finished bypassing.`);
            window.location.reload();
            return;
        }

        // check first if expired
        if (isItemExpired(acc_data)) {
            window.alert(`This item has already expired!`);
            window.location.reload();
            return;
        }

        await FirebaseModule.patch(`${db}/${btoa(user_email)}/${key}.json`, JSON.stringify({
            status: 'processing'
        }));

        status.classList.remove('available');
        status.classList.add('out-of-stock');
        status.textContent = `In Process.`;
        btn.textContent = `Processing`;
        btn.classList.add('disabled');

        acc_ver = acc_data.ver;

        // adding new expiry for accounts that started bypassing
        // to lessen account bypass spam.
        let date_now = new Date();
        // once user starts bypassing, 30 minutes grace period is offered to get their account.
        date_now.setMinutes(new Date().getMinutes() + 30);

        if (!acc_data.status)
            await FirebaseModule.patch(
                `${db}/${btoa(user_email)}/${key}.json`,
                JSON.stringify({
                    get_exp: date_now.getTime()
                })
            );

        processAccount(acc_data.name, acc_data.id, acc_data.ads, key, acc_data);
    }

    // TIME FUNCTIONS
    function isAccountReady() {
        let client_time_now = new Date(new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Manila'
        }));

        let isScheduled = false;


        for (const hour of scheduled_times) {
            if (client_time_now.getHours() == new Date(hour).getHours() || client_time_now.getHours() == new Date(hour).getHours() + 1) {
                // extend schedule to two hours
                isScheduled = true;
                real_sched_time = hour;
                break;
            }
        }

        return isScheduled;
    }

    function getNearestHour(elem, arr_time, client_time) {
        // This function searches for the closest time based on the scheduled one
        // By default set to tomorrow date (12:00 am)
        let nearest_hour = new Date();
        nearest_hour.setDate(new Date().getDate() + 1);
        nearest_hour = nearest_hour.setHours(0, 0, 0, 0);

        for (const item of arr_time) {
            if (client_time.getTime() < item) {
                nearest_hour = item;
                break;
            }
        };

        let later_sched = new Date(nearest_hour);
        timeCountdown(elem, later_sched, '');

        return new Date(nearest_hour);
    }

    async function timeCountdown(elem, later_time, message) {
        let date_now = new Date();
        while (later_time > date_now) {
            date_now = new Date();
            let time_remains = new Date(later_time).getTime() - date_now.getTime();
            let hour = time_remains / 1000 / 60 / 60;
            let min = Math.floor((hour - Math.floor(hour)) * 60);

            let spanElement = elem;

            if (later_time <= date_now)
                spanElement.innerText = `${message} time is UP!`;
            else
                spanElement.innerText = `${message} ${Math.floor(hour)} hr ${min} min`;

            await sleep(1000);
        }
    }

    async function sleep(ms) {
        return await new Promise(resolve => setTimeout(resolve, ms));
    }

    function getID(id) {
        return document.getElementById(id);
    }

    // QUERY FUNCTIONS
    function query(id) {
        return document.querySelector(`[${id}]`);
    }

    async function restoreHeapCode(user_data) {
        await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${user_data.ver}/${user_data.name}/${user_data.heap_code}.json`, JSON.stringify({
            status: "x"
        }));
    }

    async function removeCartItem(user_email, key) {
        await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/bca_cart/${btoa(user_email)}/${key}.json`, 'null');
        decrementCartCount();
    }

    function isItemExpired(cart_data) {
        return cart_data.get_exp <= new Date().getTime() || cart_data.exp <= new Date().getTime();
    }

    function decrementCartCount() {
        let count_elem = document.querySelector('#bca_cart span');
        let total_count = parseInt(count_elem.innerText);
        total_count -= 1;

        if (total_count == 0)
            count_elem.remove();

        count_elem.textContent = total_count;
    }

    function sortItems() {
        // call this after all items were added in the div.
        let items = Array.from(document.querySelectorAll('.item-card-container'));

        items.sort((a, b) => {
            let elemA = a.querySelector('[cart-status]').textContent;
            let elemB = b.querySelector('[cart-status]').textContent;
            return elemA.localeCompare(elemB);
        });

        items = items.reverse();

        getID('cart-item-container').innerHTML = ``;

        items.forEach(item => getID('cart-item-container').appendChild(item));
    }

    function queryP(clone, id) {
        return clone.querySelector(`[${id}]`);
    }

    // This function will rank the users for each bypass of ads, or request of accounts.
    async function addUserXP(xp) {
        // must be online
        // must complete the following task
        // must finish the assignment

        let {
            data,
            error
        } = await supabase.auth.getSession();

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
})();
