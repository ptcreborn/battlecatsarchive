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

        if (users_data.error) {
            window.alert(`Error detected: ${users_data.error.message}`);
            return;
        }

        if (users_data.data.length < 1) {
            window.alert("Error returning data of users image and username");
            return;
        }

        users_data = users_data.data;

        let collections_html = '';

        for (let i = 0; i < data.length; i++) {
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

    // For getTopAccountRequester
    let rank = 1;
    const top_account_requester_parent = document.getElementById('top_account_requester');

    await getTopAccountRequester();

    async function getTopAccountRequester() {
        let data = await supabase.rpc('refresh_top_account_requesters');
        if (data.error) {
            window.alert(`${data.error.message}`);
            return;
        }

        if (data.status == 204) {
            // means successful requests

            let accs_data = await supabase.from('top_account_requester_data').select('*');

            if (accs_data.error) {
                window.alert(`${accs_data.error.message}`);
                return;
            }

            if (accs_data.data.length > 0) {
                accs_data.data.forEach((item, index) => {
                    if (index == 0) {
                        top_account_requester_parent.innerHTML = `<div style="
      display: flex;
      background: beige;
      height: auto;
      justify-content: space-evenly;
      align-items: center;
      padding: 5px;
      border: 1px solid black;
      ">
      <a href="https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}"><img loading="lazy" src="${item.prof_img}" style="
         flex-basis: 100px;
         max-width: 100px;
         height: 100px;
         object-fit: cover;
         aspect-ratio: 1/1;
         "></a>
      <div style="
         flex-basis: 80%;
         flex-grow: 3;
         display: flex;
         line-height: 20px;
         justify-content: space-between;
         align-items: center;
         ">
         <h2 style="
            line-height: 30px;
            padding: 10px;
            flex-basis: 130px;
            "><span>Top ${rank++}</span><br><span style="
    color: crimson;
    font-size: 2rem;
">${item.username}</span></h2>
         <div style="
    flex-basis: 150px;
    flex-grow: 1;
"><span style="
            font-weight: 500;
            font-size: clamp(1rem, 1.6vw, 1.6rem);
            "><a href="https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}">${item.username}</a> has joined ${moment(new Date(item.created_at)).fromNow()} and has able to <a href="https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}">requests</a> <b>${item.numofrequest} accounts</b></span></div>
      </div>
   </div>`;
                    } else {
                        top_account_requester_parent.innerHTML += `<div style="
      display: flex;
      background: white;
      height: auto;
      justify-content: space-between;
      align-items: center;
      border: 1px solid black;
      ">
      <h2 style="
    enter;
    min-width: 40px;
">#${rank}</h2><img loading="lazy" src="${item.prof_img}" style="
         flex-basis: 100px;
         max-width: 50px;
         height: 50px;
         object-fit: cover;
         aspect-ratio: 1/1;
         margin: 5px;
         align-self: center;
         ">
      <div style="
         flex-basis: 60%;
         flex-grow: 3;
         padding-right: 10px;
         line-height: 15px;
         ">
         <span style="
            font-weight: 600;
            "><a href="https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}">${item.username}</a> serves <b>Rank#${rank++}</b></span>
            <br/>
         <span style="
            ">Requested <b>${item.numofrequest} accounts</b></span>
      </div>
   <span style="
            line-height: 10px;
            margin: 10px;
            font-size: 12px;
            font-weight: 600;
            opacity: 0.7;
            ">${moment(new Date(item.created_at)).fromNow()}</span></div>`;
                    }
                    top_account_requester_parent.classList.remove('ui', 'loading', 'floating', 'segment');
                });
            } else {
                window.alert("No data has been returned or empty requests.");
                return;
            }
        }
    }
})();
