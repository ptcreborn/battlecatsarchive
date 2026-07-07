// Made in June 19, 2026

(async () => {
    const selector_version = document.querySelector('#acc_version');
    const selector_accounts = document.getElementById('type_accounts');
    const btn_version = document.getElementById('btn_version');
    const btn_send = document.getElementById('submit_btn');
    const links = document.getElementById('links');
    const form = document.getElementById('form');
    let useremail = '';

    await initFunctions(['supabase', 'FirebaseModule', 'DiscordAPI', 'BCA_Users']);
    let acc_ver = '';

    const admin_uuid = [
        'ef33a291-0a55-47e2-b56a-1fd64571b9fd',
        'd1d960f1-a364-4d15-909e-073127bef432',
        '547da049-1a80-4803-8587-995f2e91a4fb'
    ];

    let isAdmin = await supabase.auth.getSession();

    if (!admin_uuid.includes(isAdmin.data?.session?.user?.id))
        return;

    await main_execute();

    // Functions will inherit new update of server upload.

    async function main_execute() {
        let versions_data = await getVersionsData();
        await renderAccountChoices(versions_data);

        triggerVersionSelector();
        triggerAddVersion();
    }
    async function getAccountsDataQTY(acc_lang, acc_ver) {
        let { data, error } = await supabase.rpc('check_accounts_quantity', {
            acc_lang: acc_lang,
            acc_ver: acc_ver
        });

        if (!data?.length === 0 || error)
            return;

        return data;
    }
    async function getVersionsData() {
        let { data, error } = await supabase.rpc('get_account_lang_ver');

        if (!data?.length === 0 || error)
            return;

        return data;
    }
    async function sendAccountsToBucket(batch_arr) {
        let send_result = await supabase.rpc('upload_bulk_account_images', {
            p_acc_names: batch_arr.map(item => item.name),
            p_lang_codes: batch_arr.map(item => item.lang),
            p_ver_codes: batch_arr.map(item => item.ver),
            p_urls: batch_arr.map(item => item.raw),
            p_statuses: batch_arr.map(item => item.status),
            p_dates: batch_arr.map(item => item.dates)
        });

        if (!send_result.success || send_result.error)
            return;

        // notify discord
        let users_data = await BCA_Users.getUserInfo();
        users_data = users_data[0];
        let payload_info = batch_arr[0];

        await notifyDiscord(
            `NEW UPLOADS for **${payload_info.name}** by Admin ${users_data.username}`,
            `There are **${batch_arr.length}** accounts added to **${payload_info.name}** version **${payload_info.ver}** lang **${payload_info.lang}**!`
        );

        let admin_data = await BCA_Users.getMemberInfoCustom('email, prof_img', 'email', 'jasonbourne181997@gmail.com')
        admin_data = admin_data[0];

        await FirebaseModule.patch(`https://storehaccounts-website-default-rtdb.firebaseio.com/highkeep.json`,
            JSON.stringify({
                [new Date().getTime()]: {
                    email: admin_data.email,
                    profile: admin_data.prof_img,
                    acc: payload_info.name,
                    ver: `${payload_info.lang}-${payload_info.ver}`,
                    qty: batch_arr.length
                }
            })
        );

        window.location.reload();
    }
    async function renderAccountChoices(data) {
        if (!data) {
            window.alert("No data versions has been found in the database.");
            return;
        }

        const select = document.getElementById('acc_version');

        data.map(item => {
            let lang_ver = item.r_lang + '-' + item.r_version;
            select.innerHTML += `<option name="${lang_ver}" value="${lang_ver}">${lang_ver}</option>`
        });
    }
    async function renderAccountsQuantity(acc_lang, acc_ver) {
        let result_json = await getAccountsDataQTY(acc_lang, acc_ver);
        if (!result_json) {
            window.alert("No data was returned from the supabase specifically with accounts qty.");
            return;
        }

        const table = document.getElementById('table_of_accounts');
        table.innerHTML = ``;
        selector_accounts.innerHTML = ``;
        links.value = '';

        result_json.forEach(item => {
            table.innerHTML += `<tr>
                <td style="width: 398px;">&nbsp;${item.r_acc_name}</td>
                <td style="width: 398px;">&nbsp;${item.r_acc_qty < 100 ? `<b>${item.r_acc_qty}</b>` : `${item.r_acc_qty}`}</td>
                </tr>`;

            // build account selector
            selector_accounts.innerHTML += `<option value='${item.r_acc_name}'>${item.r_acc_name}</option>`;
        });

        //         for (const items of accounts) {                    
        //             table.innerHTML += `<tr>
        //         <td style="width: 398px;">&nbsp;${items.name}</td>
        //         <td style="width: 398px;">&nbsp;${items.qty < 100 ? `<b>${items.qty}</b>` : `${items.qty}`}</td>
        //         </tr>`;
        // }
        document.querySelector('#form').style.display = 'block';
    }
    function triggerVersionSelector() {
        const selector_version = document.querySelector('#acc_version');
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

            let acc_lang = acc_ver.split('-')[0];
            let arr_ver = acc_ver.split('-');
            arr_ver.shift();

            acc_ver = arr_ver.join('-');

            await renderAccountsQuantity(acc_lang, acc_ver);

            selector_version.removeAttribute('disabled');
        });
    }
    function createBatchLinks() {
        let selector_arr = selector_version.value.split('-');
        let lang = selector_arr.shift();
        let ver = selector_arr.join('-');
        let status = 'X';
        let date = 'now()';
        let touched = null;
        let acc_name = selector_accounts.value;

        try {
            let batch_arrs = links.value.trim().split('\n').map(item => {
                return {
                    name: acc_name,
                    lang: lang,
                    ver: ver,
                    raw: new URL(item).pathname,
                    status: status,
                    dates: new Date().toISOString()
                }
            });

            return batch_arrs;
        } catch (error) {
            window.alert("Error in converting URL! \n", error);
            return;
        }
    }
    window.triggerSend = async () => {
        form.style.opacity = '0.7';
        form.style.pointerEvents = 'none';
        let data_arr = createBatchLinks();
        await sendAccountsToBucket(data_arr);
    }
    async function notifyDiscord(title, message) {
        await DiscordAPI.post(
            '@BCA_Stock_Manager',
            'https://m.media-amazon.com/images/I/517yWUpySPL._AC_UF894,1000_QL80_.jpg',
            `${title}`,
            `${message}`,
            '',
            'https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html',
            'https://discord.com/api/webhooks/1524060727936291069/tBnS9j3yWwgtzQgLUnb2xLnnSIN8NiAE9ZzZV-zputHntrmiQc7v_QmaBFzW67AtwAhy'
        );
    }
    function triggerAddVersion() {
        btn_version.addEventListener('click', async () => {
            let lang = window.prompt('Enter Language (ex. EN, JP, KR): ');
            if (!lang)
                return;

            let ver = window.prompt('Enter version (ex. 15-4-0, 15-4-1): ');
            if (!ver)
                return;

            if (lang.length !== 2 || ver.split('-').length !== 3)
                return;

            let acc_lang_res = await supabase.from('account_lang').upsert({
                date: 'now()',
                lang: lang.toUpperCase()
            },
                {
                    onConflict: 'lang',
                    ignoreDuplicates: true
                });

            if (!acc_lang_res.success)
                return;

            let acc_ver_res = await supabase.from('account_versions').upsert({
                date: 'now()',
                version: ver.toUpperCase()
            },
                {
                    onConflict: 'version',
                    ignoreDuplicates: true
                });

            if (!acc_ver_res.success)
                return;

            await notifyDiscord(
                `New Version Added! [${lang} ${ver}]`,
                `**${lang}-${ver}** added a new versions in the BCA database.`
            );
            window.location.reload();
        });
    }
})();
