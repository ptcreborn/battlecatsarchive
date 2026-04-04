(async () => {
        // verify the progress of account bypass
    // decrement the qty value of the account
    // delete session
    // delete heap
    // change status of account bucket
    // add future reference to account-requests in supabase

    // 1) Getting the URL
    let url = window.location.href;
    let status = document.getElementById('status');
    let params = new URL(url).searchParams;
    let ver = '';
    let code = '';
    const email = await getUserEmail();

    if(!email)
        return;

    code = params.get('code');
    ver = params.get('ver');

    if (!code || !ver) {
        status.innerText = 'Sorry but you have redirected here without any provision from the server. The request is failed to load. Thank you.';
        window.alert("Sorry but you have redirected here without any provision from the server. The request is failed to load. Thank you.");
        return;
    }

    await isBypassDone(code);

    async function getUserEmail() {
        await initFunctions(['supabase']);
        let {data, error} = await supabase.auth.getSession();

        if(error) {
            window.alert("You're not logged in the website, please login first.");
            return;
        }

        if(!data.session) {
            window.alert("No active user's is logged in the website.");
            return;
        }

        return data.session.user.email;
    }

    async function isBypassDone(code) {
        // 2) Checking if bypass is done or not.
        // If it is done, then the heap code is deleted hence, notifying user that the session is ended
        await initFunctions(['FirebaseModule']);
        let data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${code}.json`);
        if (data == "null" || !data) {
            status.innerText = 'Dear user, this session has already been expired. You can start requesting for an account again.';
            window.alert("Dear user, this session has already been expired. You can start requesting for an account again.");
            return;
        }

        if (data.progress >= data.ads) {
            await processAccount();
        } else {
            status.innerText = `You haven't bypass the ads yet. Please bypass first, before using this link. You will be automatically redirected to the bypass link. Thank you!`;
            window.alert("You haven't bypass the ads yet. Please bypass first, before using this link. You will be automatically redirected to the bypass link. Thank you!");
            let request_code = {
                targ: `https://battlecatsarchive.blogspot.com/p/account-verify.html?code=${code}&ver=${ver}`,
                clicks: data.progress,
                max: data.ads,
                account: {
                    code: code
                }
            };
            window.location.href = `https://storehaccounts.blogspot.com/p/link-assimilator.html?request=${btoa(JSON.stringify(request_code))}`;
        }
    }

    async function processAccount() {
        await initFunctions(['supabase']);

        status.innerText = `Processing your account, kindly wait...`;

        // get informations from the code (acocunts_heap);
        const db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${code}.json`;
        let heap_info = await FirebaseModule.fetchJSON(`${db}`);

        // get informations from the accounts bucket;
        const bucket_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_bucket/${ver}/${heap_info.name}/${heap_info.code}.json`;
        let bucket_info = await FirebaseModule.fetchJSON(`${bucket_db}`);

        if (!bucket_info || bucket_info == "null") {
            status.innerText = `Sorry but the requested code cannot be processed! It is either you have altered the url above. Please restart.`;
            window.alert(`Sorry but the requested code cannot be processed! It is either you have altered the url above. Please restart.`);
            return;
        }
        // update the qty count from supabase
        await supabase.rpc('decrement_account_qty', {
            arg_id: heap_info.id
        });

        // delete heap record
        await FirebaseModule.patch(`${db}`, "null");

        // delete session
        const session_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/session_db/${btoa(email)}.json`;
        await FirebaseModule.patch(session_db, "null");

        // delete item in the cart
        await FirebaseModule.patch(
            `https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_cart/${btoa(email)}/${params.get('cart')}.json`,
            `null`
        )

        // update status from the bucket
        await FirebaseModule.patch(bucket_db, JSON.stringify({
            modified: new Date().getTime(),
            status: "z"
        }));

        // build b64 data information for the account
        let acc_encoded_info = btoa(JSON.stringify({
            name: `${ver.split('-').length == 3 ? `EN-${ver}`: `${ver}`} (${heap_info.name})`,
            date: new Date().getTime(),
            progress: heap_info.progress,
            link: atob(bucket_info.link)
        }));

        // store to account-requests for future reference
        await supabase.from('account-requests').insert({
            date: "now()",
            type: heap_info.id,
            email: email,
            code: acc_encoded_info,
            status: true
        });

        window.location.href = `https://battlecatsarchive.blogspot.com/p/account-generator.html?resource=${acc_encoded_info}`;
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
})();
