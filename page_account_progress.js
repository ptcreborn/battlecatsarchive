(async () => {
    // Account Progress
    await verifyRequest();

    // Functions \\
    function getURLParameters(key) {
        let url = new URL(window.location.href);
        let param = url.searchParams;
        param = param.get(key);

        if (!param) 
            return;
        
        return param;
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

    async function verifyRequest() {
        // the parameters ongoing and the verified must be the same
        // first get the data, by getting from db heap

        let is_hash_code = checkHashCodeParam('ongoing');

        let ongoing = is_hash_code ? getHashCodeParam('ongoing') : getURLParameters('ongoing');
        let verified = is_hash_code ? getHashCodeParam('verified') : getURLParameters('verified');
        let param_data = ongoing;
        let verification = verified;

        if (!param_data)
            return;

        try {
            param_data = decodeURIComponent(param_data);
            param_data = atob(param_data);
            param_data = JSON.parse(param_data);
            verification = atob(verification);
        } catch (error) {
            window.alert("There has been error in decoding the information from the url parameters. MAke sure you're not altering anything in the url. Thank you!");
            return;
        }

        await initFunctions(['FirebaseModule']);

        let data = await FirebaseModule.fetchJSON(`https://storehaccounts-website-default-rtdb.firebaseio.com/accounts_heap/${param_data.account.code}.json`);

        if (!data) {
            window.alert("No data has been returned.");
            return;
        }

        if (data.name == verification)
            showWidget();

        await sleep(3000);

        // display progress
        const span_progress = document.getElementById('span_progress');
        span_progress.style.display = 'block';
        span_progress.innerText = `${data.progress}/${data.ads}`;

        const bypass_btn = document.getElementById('bypass_btn');
        const span_msg = document.getElementById('span_msg');

        span_msg.innerText = "You are bypassing...";

        bypass_btn.style.display = 'block';

        bypass_btn.addEventListener('click', () => {
            bypass_btn.style.pointerEvents = 'none';
            bypass_btn.style.opacity = '0.5';
            if (data.progress >= data.ads)
                // redirect to the account verify page
                window.location.href = `${param_data.targ}`;
            else
                // redirect to link terminal with parameter
                window.location.href = `https://battlecatsarchive.blogspot.com/p/bca-link-terminal.html#acc_code=${param_data.account.code}&verified=${verified}&ongoing=${ongoing}&prog=${data.progress}`;
        });
    }

    async function showWidget() {
        // update the data from account requests widget, give the latest progress
        // get all the data from account requests widget and build some widget.

        const db_widget = `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/active-account-requests.json`;
        const fragment = document.createDocumentFragment();
        const widget_parent = document.querySelector('.widget-parent');

        let widget_data = await FirebaseModule.fetchJSON(`${db_widget}?orderBy="ads"&limitToLast=50`);
        let widget_keys = Object.keys(widget_data);

        if (!widget_data) {
            window.alert("Can't access the widget data from database");
            return;
        }

        for (const user of widget_keys) {
            let users_data = widget_data[user];
            let widget_child = document.createElement('div');
            widget_child.setAttribute('class', 'widget-child');
            widget_child.innerHTML = `<img onerror="this.src='https://i.imgur.com/wpQrEpL.gif'; this.onerror=null;" src='${users_data.img ? `${users_data.img}` : `https://i.imgur.com/wpQrEpL.gif`}'/>
                <div class='flex-middle-section'>
                    <a target='_blank' href='https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${atob(user)}' class="flex-items">${users_data.username}</a>
                    <span class='flex-items'>requesting</span>
                    <a target='_blank' href="https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html"><span class='flex-items'>${users_data.acc} account</span></a>
                </div>
                <div class='flex-progress flex-items'>${users_data.prog >= users_data.ads ? `Completed` : `${users_data.prog}/${users_data.ads}`}</div>`;

            fragment.appendChild(widget_child);
        }

        widget_parent.appendChild(fragment);
    }
})();
