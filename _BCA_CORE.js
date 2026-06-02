
appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');
appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/02502d435d4cd43ec7c12aebfe3b6d79bf6ac12f/notification.css');

var Notifications = {
    db: `https://ptc-notifications-default-rtdb.firebaseio.com/notifications`,
    db_contents: `https://ptc-notifications-default-rtdb.firebaseio.com/notif_contents`,

    async initFirebase() {
        await initFunctions(['FirebaseModule']);
    },

    async initMoment() {
        await initFunctions(['moment']);

        moment.updateLocale('en', {
            relativeTime: {
                future: 'in %s',
                past: '%s ago',
                s: '1s',
                ss: '%ss',
                m: '1m',
                mm: '%dm',
                h: '1h',
                hh: '%dh',
                d: '1d',
                dd: '%dd',
                M: '1mo',
                MM: '%dmo',
                y: '1y',
                yy: '%dy'
            }
        });
    },

    async initialize() {
        // check if the user is online or not.
        let user_email = await Users.checkIfUserOnline();
        const parent_id = `bca-notif-mother`;

        if (!user_email) {
            this.showLoginHTML(parent_id);
            return;
        }

        await this.loadProfileInfo();
        await this.createNotifChild(btoa(user_email));
    },

    async send(user_id, recipent_email, payload) {
        await initFunctions(['FirebaseModule']);
        // payload = {
        //     "action": "comment/reply/like",
        //     "url": "url to the path of the action",
        //     "title": "title of the webpage",
        //     "thumb": "img src"
        // }

        let b64_email = btoa(recipent_email);

        // writing to the content first
        let key = new Date().getTime();
        // let result = await FirebaseModule.patch(`${this.db_contents}/${key}.json`, JSON.stringify(payload));

        // if (!result) {
        //     window.alert("Failed in writing notification contents.");
        //     return;
        // }

        payload.user = user_id;

        // write to the notification bucket of the user.
        let result = await FirebaseModule.patch(`${this.db}/${b64_email}/unread/${key}.json`, JSON.stringify(payload));

        if (!result) {
            // fallback, delete the notif contents
            await FirebaseModule.patch(`${this.db_contents}/${key}.json`, "null");
            window.alert("Failed in writing notifications to the user database");
            return;
        }
    },

    async showLoginHTML(parent_id) {
        this.initContent(parent_id);
        document.getElementById(parent_id).innerHTML = `    <div onclick="this.parentNode.style.display = 'none'" class="bca-notif-minimize">X</div>
<div id='bca-notif-profile' class="bca-notif-profile"><b>🔒 Welcome to Battle Cats Archive</b>
        <br><div><img src="https://i.pinimg.com/736x/fc/9c/e8/fc9ce8648d0b39614092e9b06b750c0b.jpg" style="
            height: 50px;
            width: 50px;
            float: right;
        "><p>Complete the joy and journey in playing battle cats through creating account in the server. You can store your progress, make friends with anyone and access limited resources like <i>mods and fan made bcu packs</i>.</p></div>
        <br><a href="https://battlecatsarchive.blogspot.com/p/signin-to-bca.html" class="main-button button" style="
            background: #0c3e6a;
        ">Login with Google</a>
        <div style="
            align-self: center;
        ">OR</div><a href="https://battlecatsarchive.blogspot.com/p/signin-to-bca.html" class="main-button button " style="
            background: #3e5d84;
        ">Login with Discord</a></div></div>`;
    },

    async fetch(encoded_email) {
        await initFunctions(['FirebaseModule']);

        let db = `${this.db}/${encoded_email}`;
        let params = new URLSearchParams({
            orderBy: '"$key"'
        });

        let unread = await FirebaseModule.fetchJSON(`${db}/unread.json?${params}`);
        let read = await FirebaseModule.fetchJSON(`${db}/read.json?${params}`);

        return [unread, read];
    },

    async markRead(fbid, recipent_email) {
        await initFunctions(['FirebaseModule']);

        let db = `${this.db}/${btoa(recipent_email)}/unread/${fbid}.json`;
        let unread_data = await FirebaseModule.fetchJSON(db);

        if (!unread_data)
            return;

        FirebaseModule.patch(`${this.db}/${btoa(recipent_email)}/unread/${fbid}.json`, "null");

        await FirebaseModule.patch(`${this.db}/${btoa(recipent_email)}/read/${fbid}.json`,
            JSON.stringify(unread_data)
        );
    },

    async loadProfileInfo() {
        // assume the user is logged in.
        let data = await Users.getUserInfo("email, username, prof_img, rank_id(rank_name)");

        if (!data) {
            let email = await Users.checkIfUserOnline();
            window.alert(`The email ${email} is not registered in the database`);
            return;
        }

        if (data.length === 1)
            data = data[0];

        document.querySelector('.bca-notif-profile-username').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${data.email}`;
        document.querySelector('.bca-notif-profile-img').src = data.prof_img;
        document.querySelector('.bca-notif-profile-username').textContent = `@${data.username}`;
        document.querySelector('.bca-notif-profile-email').textContent = data.email;
        document.querySelector('.bca-notif-profile-rank span').textContent = data.rank_id.rank_name;
        document.querySelectorAll('.bca-notif-profile a')[1].href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${data.email}`;
        document.querySelectorAll('.bca-notif-profile a')[1].textContent = `Profile`;
    },

    async initContent(parent_id) {
        appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/6a70c531b260975b772cfe55c73bf12dba1f1eee/skeleton.css');

        const skeleton_html = `<div class="card">
            <div class="skeleton line"></div>
            <div class="skeleton line"></div>
            <div class="skeleton line"></div>
            <div class="skeleton line"></div>
            <div class="skeleton line"></div>
        </div>`;

        document.getElementById(parent_id).innerHTML = skeleton_html;
    },

    async createNotifChild(encoded_email) {
        // get all notifications from unread to read
        let data = await this.fetch(encoded_email);
        let unread = data[0];
        let read = data[1];
        let ready_html = ``;
        let parent_id = 'bca-notif-content';
        const template = document.getElementById('bca-notif-child-template');

        //skeleton
        await this.initContent('bca-notif-content');

        if (!unread && !read) {
            ready_html = `<h2>Empty</h2>`;
            document.getElementById(parent_id).classList.add('bca-notif-content-empty');
            this.buildStringHTML(parent_id, ready_html);
            return;
        }

        if (unread) {
            await this.initFirebase();
            await this.initMoment();
            document.getElementById('bca-notif-content').classList.remove('bca-notif-content-empty');
            let keys = Object.keys(unread);
            const notiflets = keys.map(async (item) => {
                let data = unread[item];
                let clone = template.content.cloneNode(true).children[0];
                // let notif_data = await FirebaseModule.fetchJSON(`${this.db_contents}/${item}.json`);
                let user_data = await Users.getMemberInfo("prof_img, username, email", data.user);
                user_data = user_data[0];

                if (!user_data)
                    user_data = {
                        prof_img: 'https://i.imgur.com/eac6XvU.png',
                        username: 'Anonymous',
                        email: ''
                    }

                clone.querySelector('.bca-notif-child-right-time').textContent = moment(parseInt(item)).fromNow();
                clone.querySelector('.bca-notif-child-right-user').textContent = `@${user_data.username}`;
                clone.href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${user_data.email}`;
                clone.querySelector('.bca-notif-child-right-action').textContent = data.action;
                clone.querySelector('.bca-notif-child-right-target').textContent = data.title;
                clone.querySelector('.bca-notif-child-right-target').href = data.url;
                clone.querySelector('.bca-notif-child-profimg').src = user_data.prof_img;
                return clone;
            });

            const allNotifs = await Promise.all(notiflets);
            this.buildHTMLClone(parent_id, allNotifs);
        }
    },

    async buildStringHTML(parent_id, ready_html) {
        const parent = document.getElementById(parent_id);
        // remove skeleton
        parent.innerHTML = ``;

        // fully build ready_html
        parent.innerHTML = ready_html;
    },

    async buildHTMLClone(parent_id, ready_clones) {
        const parent = document.getElementById(parent_id);
        // remove skeleton
        parent.innerHTML = ``;

        // fully build ready_html
        for (const clone of ready_clones)
            parent.appendChild(clone);
    },
}

var Users = {
    async initialize() {
        await initFunctions(['supabase']);
    },
    async checkIfUserOnline() {
        await this.initialize();

        let { data, error } = await supabase.auth.getSession();

        if (!data?.session || error)
            return;

        return data.session.user.email;
    },
    async getUserInfo(select_parameters) {
        await this.initialize();

        // This gets the basic details of user such as 

        let email = await this.checkIfUserOnline();

        if (!email)
            return;

        let { data, error } = await supabase.from('users').
            select(select_parameters).eq('email', email);

        if (data?.length === 0 || error)
            return;

        return data;
    },
    async getMemberInfo(select_parameters, id) {
        await this.initialize();

        let { data, error } = await supabase.from('users').select(select_parameters).eq('id', id);

        if (data?.length === 0 || error)
            return;

        return data;
    },
    async getMemberInfoCustom(select_parameters, column, value) {
        await this.initialize();

        let { data, error } = await supabase.from('users').select(select_parameters).eq(column, value);

        if (data?.length === 0 || error)
            return;

        return data;
    }
}

document.getElementById('bca_user').addEventListener('click', async (e) => {
    e.preventDefault();
    document.getElementById('bca-notif-mother').style.display = 'flex';
    await Notifications.initialize();
});
