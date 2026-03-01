(async() => {

    // this JS file builds the widgets file in account request page.
    // widgets such as the top 10 account requester and recent account requests

    produceCSS();
    await initFunctions(['supabase', 'moment']);
    await cookieLoadFast();

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function produceCSS() {
        const css_link = 'https://rawcdn.githack.com/ptcreborn/battlecatsarchive/331e1ea6716611ca71bb16d2f33eeec9abc415db/acc-request-widget.css';

        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = css_link;

        document.head.appendChild(link);
    }

    async function buildRecentRequest() {
        let { data, error } = await supabase.from('account-requests').select('date, type(name), email').order('date', { ascending: false }).limit(60);
        if (error) {
            window.alert(error.message);
            return;
        }

        let users_email = data.map(item => item.email);
        let users_data = await supabase.rpc('return_user_prof_img', {
            emails: users_email
        });

        if(users_data.error) {
            window.alert(`Error detected: ${users_data.error.message}`);
            return;
        }

        if(users_data.data.length < 1) {
            window.alert("Error returning data of users image and username");
            return;
        }

        users_data = users_data.data;

        let collections_html = '';

        for (let i=0; i<data.length; i++) {
            let elem = data[i];
            let user_data = users_data[i];

            let html = `<div class='acc_req_child'>
                <img src='${user_data.split('#')[1]}'/>
                <div class='responsive-text'><a class='acc_req_user_link ' href='https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${elem.email}'>${user_data.split('#')[0]}</a> already got <a href='https://battlecatsarchive.blogspot.com/search/label/accounts'> ${elem.type.name}</a> account</div>
                <div class='responsive-text passive-text'>${moment(elem.date).fromNow()}</div>
            </div>`;
            
            document.getElementById('acc_req_parent').innerHTML += html;
        }


        document.getElementById('acc_req_parent').classList.remove('ui', 'loading', 'floating', 'segment');

        return document.getElementById('acc_req_parent').innerHTML;
    }

    async function cookieLoadFast() {
        // this loads the entire account request
        // store in the cookie for later and faster use
        // cookie expires depending on the configuration

        const label = 'acc_req_widget_cookie_data';
        const cookie_content = localStorage.getItem(label);

        if (!cookie_content) {
            // FRESHLY LOADED
            let acc_req_widget_cookie_data = {
                time: new Date().getTime(),
                content: await buildRecentRequest(),
                expiry_ms: 300000 // 5 minutes
            }
            localStorage.setItem(label, JSON.stringify(acc_req_widget_cookie_data));
        } else {
            // check cookie expiry
            let content = JSON.parse(cookie_content);

            if (new Date().getTime() - content.time >= content.expiry_ms) {
                // EXPIRED
                localStorage.removeItem(label);
                await cookieLoadFast();
            } else {
                document.getElementById('acc_req_parent').innerHTML = JSON.parse(cookie_content).content;
                document.getElementById('acc_req_parent').classList.remove('ui', 'loading', 'floating', 'segment');
            }
        }
    }


})();
