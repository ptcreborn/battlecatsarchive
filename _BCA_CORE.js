
appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');
appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');

var BCA_Notifications = {
    db: `https://ptc-notifications-default-rtdb.firebaseio.com/notifications`,
    db_contents: `https://ptc-notifications-default-rtdb.firebaseio.com/notif_contents`,
    LOCALSTORAGE_USER: "bca_user",
    LOCALSTORAGE_UNREAD_NOTIF: "bca_notif_unread",
    CACHE_CONTROL: "bca_cache_control",

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
        let user_email = await BCA_Users.checkIfUserOnline();
        const parent_id = `bca-notif-mother`;

        if (!user_email) {
            this.showLoginHTML(parent_id);
            return;
        }

        this.loadProfileInfo();
        this.createNotifChildren(btoa(user_email));
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
        this.setSkeleton(parent_id);
        document.getElementById(parent_id).innerHTML = `
        <div onclick="this.parentNode.style.display = 'none'" class="bca-notif-minimize">X</div>
<div id="bca-notif-profile" class="bca-notif-profile"><b>🔒 Welcome to Battle Cats Archive</b>
        <br><div style="
    padding: 0 20px;
"><img src="https://i.pinimg.com/736x/fc/9c/e8/fc9ce8648d0b39614092e9b06b750c0b.jpg" style="
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
        ">Login with Discord</a></div>
        `;
    },

    async fetch(encoded_email, status) {
        await initFunctions(['FirebaseModule']);

        let db = `${this.db}/${encoded_email}`;
        let params = new URLSearchParams({
            orderBy: '"$key"'
        });

        // let unread = await FirebaseModule.fetchJSON(`${db}/unread.json?${params}`);
        // let read = await FirebaseModule.fetchJSON(`${db}/read.json?${params}`);

        // return [unread, read];

        let data = await FirebaseModule.fetchJSON(`${db}/${status}.json?${params}`);

        return data;
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
        let data;

        // load from cache
        data = BCA_Cache.getItemWithExpiration(this.LOCALSTORAGE_USER);

        if (!data) { // Means the Cached is expired and we need a fresh data.
            data = await BCA_Users.getUserInfo("email, username, prof_img, rank_id(rank_name)");

            if (data.length === 1)
                data = data[0];

            BCA_Cache.setItemWithExpiration(this.LOCALSTORAGE_USER, data, 600000);
        }

        document.querySelector('.bca-notif-profile-username').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${data.email}`;
        document.querySelector('.bca-notif-profile-img').src = data.prof_img;
        document.querySelector('.bca-notif-profile-username').textContent = `@${data.username}`;
        document.querySelector('.bca-notif-profile-email').textContent = data.email;
        document.querySelector('.bca-notif-profile-rank span').textContent = data.rank_id.rank_name;
        document.querySelectorAll('.bca-notif-profile a')[1].href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${data.email}`;
        document.querySelectorAll('.bca-notif-profile a')[1].textContent = `Profile`;
    },

    async setSkeleton(parent_id) {
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

    async removeSkeleton(parent_id) {
        const parent = document.getElementById(parent_id);
        // remove skeleton
        parent.querySelector('.card')?.remove();
    },

    async createNotifChildren(encoded_email) {
        let ready_html = ``;
        let parent_id = 'bca-notif-content';

        // check if requires rendering for new notifications
        let newNotifs = await this.getNumberOfUnread();
        let cached_data = BCA_Cache.get(this.LOCALSTORAGE_UNREAD_NOTIF);

        if (false) //!newNotifs && cached_data
            this.buildStringHTML(parent_id, cached_data);

        else {
            // get all notifications from unread to read
            let unread = await this.fetch(encoded_email, 'unread');
            // let read = BCA_Cache.get(this.LOCALSTORAGE_UNREAD_NOTIF) || await this.fetch(encoded_email, 'read');
            let read = await this.fetch(encoded_email, 'read');

            // const template = document.getElementById('bca-notif-child-template');

            //skeleton
            await this.setSkeleton('bca-notif-content');

            // NOT LOGGED IN
            if (!unread && !read) {
                ready_html = `<h2>Empty</h2>`;
                document.getElementById(parent_id).classList.add('bca-notif-content-empty');
                this.buildStringHTML(parent_id, ready_html);
                return;
            }

            // INITIALIZE APIS...
            await this.initFirebase();
            await this.initMoment();
            document.getElementById('bca-notif-content').classList.remove('bca-notif-content-empty');

            await this.buildChildHTML(parent_id, unread, "unread");

            if (typeof read === "string")
                this.appendStringHTML(parent_id, read);
            else
                await this.buildChildHTML(parent_id, read, "read");
        }

        // ADD EVENT LISTENER MARKING READ when NOTIF IS CLICKED.
        document.getElementById('bca-notif-content').addEventListener('click', async (e) => {
            const link = e.target.closest('.bca-notif-child');

            if (link?.dataset?.status == "unread") {
                document.getElementById('bca-notif-content').style.pointerEvents = 'none';
                await this.markRead(link.dataset.fbid, atob(encoded_email));
                link.dataset.status = "read";
                link.className = "bca-notif-child bca-notif-read";

                // for READ only, once unread is clicked, just add the content to the cache of unreads.
                const parent = document.getElementById(parent_id);
                let cached = BCA_Cache.get(this.LOCALSTORAGE_UNREAD_NOTIF);
                cached = link.outerHTML + '' + cached;
                BCA_Cache.set(this.LOCALSTORAGE_UNREAD_NOTIF, cached);
            }

            if (link?.dataset?.href)
                window.location.href = link.dataset.href;
        });
    },

    async buildChildHTML(parent_id, notif_data, status) {
        if (!notif_data)
            return "";

        let html_str = '';
        let keys = Object.keys(notif_data);
        keys.sort((a, b) => b - a);

        const works = keys.map(async (item) => {
            let data = notif_data[item];
            // let clone = template.content.cloneNode(true).children[0];
            // let notif_data = await FirebaseModule.fetchJSON(`${this.db_contents}/${item}.json`);

            // Append all the child notif container first, this maintain chronological order.
            html_str = `
                <a data-status="${status}" data-fbid="${item}" data-href="${data.url}" class='bca-notif-child ${status === "read" ? `bca-notif-read` : `bca-notif-unread`}' style='cursor: pointer;'></a>`;

            this.appendStringHTML(parent_id, html_str);

            // This will asynchronously run and will wait for their data later.
            let user_data = await BCA_Users.getMemberInfo("prof_img, username, email", data.user);
            user_data = user_data[0] || {
                prof_img: 'https://i.imgur.com/eac6XvU.png',
                username: 'Anonymous',
                email: ''
            };

            document.querySelector(`[data-fbid="${item}"]`).innerHTML = `
                    <img class='bca-notif-child-profimg'
                            src='${user_data.prof_img}' />
                    <p class='bca-notif-child-right'>
                        <span class='bca-notif-child-right-time'>${moment(parseInt(item)).fromNow()}</span>
                        <p href="https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${data.email}" class='bca-notif-child-right-user'>@${user_data.username}</p>
                        <span class='bca-notif-child-right-action'>${data.action}</span>
                        <p class='bca-notif-child-right-target'>${data.title}</p>
                    </p>
                `;

        });

        await Promise.all(works);

        let ready_html = '';
        let getUnread = document.querySelectorAll('#bca-notif-content a[data-status="read"]');
        
        Array.from(getUnread).forEach(item => ready_html += getUnread.outerHTML);
        BCA_Cache.set(this.LOCALSTORAGE_UNREAD_NOTIF, ready_html);
    },

    async buildStringHTML(parent_id, ready_html) {
        const parent = document.getElementById(parent_id);
        this.removeSkeleton(parent_id);

        // fully build ready_html
        parent.innerHTML = ready_html;
    },

    async appendStringHTML(parent_id, ready_html) {
        const parent = document.getElementById(parent_id);
        this.removeSkeleton(parent_id);

        // fully build ready_html
        parent.innerHTML += ready_html;
    },

    async buildHTMLClone(parent_id, ready_clones) {
        const parent = document.getElementById(parent_id);
        this.removeSkeleton(parent_id);

        // fully build ready_html
        for (const clone of ready_clones)
            parent.appendChild(clone);
    },

    async getNumberOfUnread() {
        let user_email = await BCA_Users.checkIfUserOnline();
        let data = await FirebaseModule.fetchJSON(`${this.db}/${btoa(user_email)}/unread.json?shallow=true`);

        if (!data) return;

        let keys = Object.keys(data);

        return keys.length;
    },

    async checkNotifCount() {
        // Check Notif Count
        const notif_count = document.getElementById('notif_count');
        let num_of_notifs = await this.getNumberOfUnread();

        if (!num_of_notifs)
            notif_count.remove();
        else {
            notif_count.style.display = 'flex';
            notif_count.textContent = num_of_notifs;
        }
    },
    clearNotificationsCache(triggerBtn) {
        let cache_cleared = BCA_Cache.getItemWithExpiration(this.CACHE_CONTROL);
        if (cache_cleared) {
            BCA_Display.disableElem(triggerBtn);
            window.alert("Try again after 2 minutes.");
            return;
        }

        BCA_Cache.deleteItem(this.LOCALSTORAGE_UNREAD_NOTIF);
        BCA_Cache.deleteItem(this.LOCALSTORAGE_USER);
        BCA_Cache.setItemWithExpiration(this.CACHE_CONTROL, "set", 1000 * 60 * 2); // 2 minutes
        window.alert("Notifications cache was cleared. Only use this when notifications are behaving abnormal.");
        window.location.reload();
    }
}

var BCA_Users = {
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
    },
    async checkIfUserCompleteRegistration() {
        await this.initialize();

        if (window.location.href == `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`)
            return;

        let email = await this.checkIfUserOnline();
        if (!email)
            return;

        let { data, error } = await supabase.from('users').select('id').eq('email', email);

        if (error || data?.length == 0) {
            await supabase.auth.signOut();
            window.alert("Please kindly finish setting up your account. Login again.");
            window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            return;
        }

        return true;
    }
}

var BCA_Cache = {
    set(key, val) {
        localStorage.setItem(key, val);
    },
    setJSON(key, jsonObject) {
        localStorage.setItem(key, JSON.stringify(jsonObject));
    },
    get(key) {
        return localStorage.getItem(key);
    },
    getParseItem(key) {
        return JSON.parse(this.get(key));
    },
    getItemWithExpiration(key) {
        let isExpired = this.checkExpiry(key);
        if (isExpired === false)
            return this.getParseItem(key).data;
        else return;
    },
    setItemWithExpiration(key, val, expiry_ms) {
        let now = new Date().getTime();

        localStorage.setItem(key, JSON.stringify({
            data: val,
            expiry: expiry_ms,
            set: now
        }));
    },
    checkExpiry(key) {
        let data = JSON.parse(this.get(key));
        if (!data)
            return null;

        let now = new Date().getTime();

        return now - parseInt(data.set) >= parseInt(data.expiry);
    },
    deleteItem(key) {
        localStorage.removeItem(key);
    }
}

var BCA_IMGBB = {
    proxy: "https://bca-image-proxy.jasonbourne181997.workers.dev/",
    host: "https://i.ibb.co/",
    inputBtn: null,
    uploadBtn: null,
    uploadBtnText: null,

    initialize(inputElem, buttonElem) {
        this.inputBtn = inputElem;
        this.uploadBtn = buttonElem;
        this.uploadBtnText = buttonElem.innerText;
    },
    async uploadImage(file) {
        // check if initialized
        if (!this.inputBtn || !this.uploadBtn) {
            window.alert(`
          Please initialize BCA_IMGBB first using the function <BCA_IMGBB : initialize ()>
        `);
            return;
        }

        this.disableButton();
        // disable html element while uploading...
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/bmp",
            "image/webp"
        ];

        if (!file || !file.type.match(/image.*/)) {
            window.alert("No image file has been selected.");
            this.enableButton();
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            alert("Only JPG, PNG, GIF, BMP, WEBP allowed!");
            this.enableButton();
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        const apiKey = "07f1351d4e674784012d92ae6e03b49d";

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            window.alert(`
          Failed in uploading image: ${file.name}
          Please try again.
      `);
            this.enableButton();
            return;
        }

        const data = await res.json();

        if (data.success || data.status === 200) {
            this.enableButton();
            return data.data;
        }

        window.alert(`
    Error in fetching the uploaded image: ${file.name}.
    Please try re-uploading again.
    `);
        this.enableButton();
    },

    getThumbnail(image_data) {
        if (!image_data) {
            window.alert("Please upload image first.");
            return;
        }

        let thumb = image_data.thumb;

        if (thumb)
            return thumb.url.includes(this.host) ? thumb.url.replace(this.host, this.proxy) : thumb.url;
    },

    getOriginal(image_data) {
        if (!image_data) {
            window.alert("Please upload image first.");
            return;
        }

        let original = image_data.image;

        if (original)
            return original.url.includes(this.host) ? original.url.replace(this.host, this.proxy) : original.url;
    },

    disableButton() {
        if (this.uploadBtn === true) // means customized used
            return;
        this.uploadBtn.textContent = `Uploading...`;
        this.uploadBtn.style.opacity = `0.7`;
        this.uploadBtn.style.pointerEvents = `none`;
    },

    enableButton() {
        if (this.uploadBtn === true) // means customized used
            return;
        this.uploadBtn.textContent = this.uploadBtnText;
        this.uploadBtn.style.opacity = `1`;
        this.uploadBtn.style.pointerEvents = `auto`;
    }
}

var BCA_Display = {
    disableElem(elem) {
        elem.style.pointerEvents = 'none';
        elem.style.opacity = '0.7';
    },
    enableElem(elem) {
        elem.style.pointerEvents = 'auto';
        elem.style.opacity = '1';
    }
}
