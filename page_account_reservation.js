(async() => {
        // wait for 5 seconds before executing any functions
    await sleep(1000);
    let email_ver = await recordUserRequesting();
    if(!email_ver)
        return;

    // if the user has been recorded to a table for all users currently bypassing now
    // append to the url the b64 encoded of email, which will be checked on the account setup page.

    const btn = document.querySelector('#go-btn');

    btn.style.display = 'block';
    btn.addEventListener('click', async() => {
        window.location.href = `https://battlecatsarchive.blogspot.com/p/account-setup.html?reserved=${getURLParameters('request')}&verified=${encodeURIComponent(email_ver)}`;
    }, false);
    

    function getURLParameters(key) {
        let url = new URL(window.location.href);
        let param = url.searchParams;
        param = param.get(key);

        if (!param) {
            window.alert("No request parameter in the url.");
            return;
        }

        return param;
    }

    async function recordUserRequesting() {
        // this function registers the user as currently bypassing account
        // the lists will be shown at the Account Progress Page.
        const db = `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-account-requests`;
        const param = getURLParameters('request');
        if(!param)
            return;
        
        let data = decodeURIComponent(param);

        try {
            data = atob(data);
        } catch (error) {
            window.alert("Decoding the url has encountered error.");
            return;
        }

        // Pattern
        //     targ: `https://battlecatsarchive.blogspot.com/p/account-verify.html?code=${url_id}&ver=${acc_ver}`,
        //     clicks: 0,
        //     max: account_ads,
        //     account: {
        //         code: url_id,
        //         email: userEmail
        //     }

        data = JSON.parse(data);
        if(!data) 
            return;

        let email_encoded = btoa(data.account.email);
        let acc_name = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${data.account.code}.json`);

        if(!acc_name) {
            window.alert("Can't find the code from the database. Please try again");
            return;
        }          

        await initFunctions(['FirebaseModule', 'supabase']);

        let sp_db = await supabase.from('users').select('prof_img').eq('email', data.account.email);

        if(sp_db.error) {
            window.alert(`Error encountered: ${sp_db.error.message}`);
            return;
        }

        if(sp_db.data.length == 0) {
            window.alert("No result was returned");
            return;
        }

        await FirebaseModule.patch(`${db}/${email_encoded}.json`, JSON.stringify({
            ads: acc_name.ads,
            prog: data.clicks,
            acc: acc_name.ver,
            username: data.account.email.split('@')[0],
            img: sp_db.data[0].prof_img
        }));

        return email_encoded;
    }    
})();
