(async () => {
    const bypass_button = document.getElementById('bypass_button');
    const status_msg = document.getElementById('status_msg');
    const bypass_msg = document.getElementById('bypass_msg');
    let emo = ['🤔', '😎', '🤩'];

    let time_in_sec = 5000;

    await initFunctions(['FirebaseModule', 'moment']);
    //activeUsers();
    // dispatchExpiredUsers();
    // dispatchExpiredLinkTerminalSession();
    await loadData();

    async function loadData() {
        // This is for download bypass including automatically generated url from website and intentionally shorten url
        if (checkCodeParam('code')) {
            initDownloadBypass(getCodeParams('code'));
            finalizeAction(downloadBypass);
        }
        // This is specifically for account bypass which is used for bypassing accounts. This not to show any progress in the screen
        else if (checkCodeParam('acc_code')) {
            initAccountBypass();
            finalizeAction(accountBypass);
        }
    }

    function finalizeAction(actionCallback) {
        let timeout = setInterval(async () => {
            if (elementInViewport('bypass_button')) {
                time_in_sec = time_in_sec - 40;
                status_msg.innerText = `${emo[Math.abs(time_in_sec) % emo.length]} Please wait ${Math.ceil(time_in_sec / 1000)} ${Math.ceil(time_in_sec / 1000) > 1 ? `seconds` : `second`}...`;
                if (time_in_sec <= -1) {
                    clearInterval(timeout);

                    // activate button and its function                    
                    bypass_button.innerText = "Proceed Now";
                    bypass_button.addEventListener('click', async () => {
                        await actionCallback();
                    }, false);
                }
            }
        }, 100);
    }

    async function initAccountBypass() {
        bypass_msg.innerText = `You are bypassing for account request...`;
        // you can add more here
    }

    async function accountBypass() {
        // get the parameter of "acc_code"
        // this method should not show progress and a goal
        // after a clear bypassing, make sure to increment the clicks
        // check the account name from parameter "verified" and the heap data account name if the same
        bypass_button.style = 'pointer-events: none; opacity: 0.7';
        bypass_button.innerText = "Redirecting...";

        let code = decodeURIComponent(getCodeParams('acc_code'));
        let acc_name = decodeURIComponent(getCodeParams('verified'));
        let identity_param = decodeURIComponent(getCodeParams('ongoing'));

        if (!code || !acc_name || !identity_param) {
            window.alert("The url parameter has missing datas.");
            return;
        }

        try {
            acc_name = atob(acc_name);
            identity_param = JSON.parse(atob(identity_param));
        } catch (error) {
            window.alert("Sorry the system cant verify the request parameter of the source. The parameters cant be decoded completely.");
            return;
        }

        const heap_db = `https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap`;

        let data = await FirebaseModule.fetchJSON(`${heap_db}/${code}.json`);

        if (!data) {
            window.alert("The request you are trying to bypass has been canceled or expired.");
            return;
        }

        if (data.name != acc_name) {
            window.alert("The requested link might have been altered, the signature of your request and the verification does not matched. Maybe you have skipped some page? All you need to do is to start all over again, no worries. Your can still request for account for free.");
            return;
        }


        data.progress += 1;

        // patch the progress to the heap code
        await FirebaseModule.patch(`${heap_db}/${code}.json`, JSON.stringify({
            progress: data.progress
        }));
        // patch the progress to the widget data
        await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-account-requests/${btoa(identity_param.account.email)}.json`, JSON.stringify({
            prog: data.progress
        }));

        await addUserXP(1);

        window.location.href = `https://battlecatsarchive.blogspot.com/p/account-progress.html?ongoing=${getCodeParams('ongoing')}&verified=${getCodeParams('verified')}`;
    }

    async function initDownloadBypass(param) {
        let code_data, prog_data, code;
        code = decodeURIComponent(param);
        if (!code) return;

        prog_data = await FirebaseModule.fetchJSON(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/link-terminal/${code}.json`);

        if (prog_data == "null" || !prog_data) {
            window.alert("The code you're requesting has already expired, please start all over again. Thank you!");
            return;
        }

        code_data = await FirebaseModule.fetchJSON(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users/${prog_data.active}.json`);
        bypass_msg.innerText = `Bypassing: ${code_data.prog}/${code_data.goal}`;

        return [code_data, prog_data, code];
    }

    async function downloadBypass() {
        bypass_button.style = 'pointer-events: none; opacity: 0.7';
        bypass_button.innerText = "Redirecting...";
        let data = await initDownloadBypass(getCodeParams('code'));
        if (!data)
            return;

        let code_data = data[0];
        let prog_data = data[1];
        let code = data[2];

        // check if the progress hits the goal
        if (code_data.prog == code_data.goal) {
            bypass_msg.innerHTML = "🫡You have made it comrade! Bypass Finish!🫡";

            // remove record from active users
            await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users/${prog_data.active}.json`, 'null');

            // remove record from link terminal
            await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/link-terminal/${code}.json`, 'null');

            // for mega, push to mega downloader
            if (new URL(decodeURIComponent(prog_data.targ)).origin == "https://mega.nz") {
                localStorage.setItem(`${btoa(prog_data.targ)}`, new Date().getTime());
                window.location.href = `https://battlecatsarchive.blogspot.com/p/download-center.html?code=${btoa(prog_data.targ)}`;
                return;
            }

            // for new download system, create a patch to the checkpoint in order to mark that it passes link terminal
            if (new URL(decodeURIComponent(prog_data.targ)).searchParams.get('checkpoint')) {
                await FirebaseModule.patch(
                    `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint/${new URL(decodeURIComponent(prog_data.targ)).searchParams.get('checkpoint')}.json`,
                    JSON.stringify({
                        progress: "completed"
                    })
                );

                window.location.href = prog_data.targ;
                return;
            }

            window.location.href = `${decodeURIComponent(prog_data.targ)}`;
        } else {
            // increment the progress on the active users widget in link terminal
            await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users/${prog_data.active}.json`, JSON.stringify({
                prog: code_data.prog + 1
            }));
            window.location.href = `https://battlecatsarchive.blogspot.com/p/bca-link-terminal.html?code=${code}&prog=${code_data.prog + 1}`;
        }
    }

    async function activeUsers() {
        // this function displays people bypassing link terminal
        const db = `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users.json`;
        const parent_container = document.querySelector('#bypass-widget');

        let data = await FirebaseModule.fetchJSON(db);

        if (!data)
            return;

        let keys = Object.keys(data);

        keys = keys.reverse();

        for (const item_key of keys) {
            let user_data = data[item_key];

            // build child html
            parent_container.innerHTML += `<div class="bypass-widget-child">
                <img src="${user_data.img}" />
                <div class="snippet">
                <a href="https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${user_data.user}">${user_data.user}</a>
                <span class="action">bypassing...</span>
                <span>${user_data.prog}/${user_data.goal}</span>
                <span class="time-ago">${moment(parseInt(item_key)).fromNow()}</span>
                </div>
            </div>`;
        }
    }

    function dispatchExpiredUsers() {
        const db = `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users.json`;

        fetch(`${db}`)
            .then(data => data.json())
            .then(async (data) => {
                let keys = Object.keys(data);
                for (const value of keys) {
                    let now = new Date().getTime();
                    if (now - value >= 86400000) { // after 1 day
                        await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users/${value}.json`, "null")
                    }
                }
                //await activeUsers();
            })
            .catch(error => window.alert(`Error detected in dispatchExpiredUsers: `, error.message));
    }

    function dispatchExpiredLinkTerminalSession() {
        const db = `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/link-terminal.json`;

        fetch(`${db}`)
            .then(data => data.json())
            .then(async (data) => {
                let keys = Object.keys(data);
                for (const key of keys) {
                    let new_data = data[key];
                    if (!await FirebaseModule.fetchJSON(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-users/${new_data.active}.json`))
                        await FirebaseModule.patch(`https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/link-terminal/${key}.json`, 'null');
                }
            })
            .catch(error => window.alert(`Error detected in dispatchExpiredLinkTerminalSession: `, error.message));

    }

    function getCodeParams(param) {
        let url = window.location.href;
        let params = new URL(url).searchParams;

        if (!params.get(param)) {
            window.alert(`Requested ${param} is invalid, code not found`);
            return;
        }

        return params.get(param);
    }

    function checkCodeParam(param) {
        let url = window.location.href;
        let params = new URL(url).searchParams;

        return params.get(param);
    }

    function elementInViewport(id) {
        let el = document.getElementById(id);
        var top = el.offsetTop;
        var left = el.offsetLeft;
        var width = el.offsetWidth;
        var height = el.offsetHeight;

        while (el.offsetParent) {
            el = el.offsetParent;
            top += el.offsetTop;
            left += el.offsetLeft;
        }

        return (
            top >= window.pageYOffset &&
            left >= window.pageXOffset &&
            (top + height) <= (window.pageYOffset + window.innerHeight) &&
            (left + width) <= (window.pageXOffset + window.innerWidth)
        );
    }


    // This function will rank the users for each bypass of ads, or request of accounts.
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
})();
