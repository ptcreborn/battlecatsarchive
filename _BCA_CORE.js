

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

        if (!user_id || !recipent_email || !payload)
            return;

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
        <br><a href="https://battlecatsarchive.blogspot.com/p/signin-to-bca.html" class="button-15" style="
            background: #0c3e6a;
        ">Login with Google</a>
        <div style="
            align-self: center;
        ">OR</div><a href="https://battlecatsarchive.blogspot.com/p/signin-to-bca.html" class="button-15" style="
            background: #3e5d84;
        ">Login with Discord</a></div>
        `;
    },

    async fetch(encoded_email, status, params) {
        await initFunctions(['FirebaseModule']);

        let db = `${this.db}/${encoded_email}`;

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
        let isRegistered = await BCA_Users.checkIfUserCompleteRegistration();
        if (!isRegistered)
            return;

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
        appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/26f4b9da39d1b7bda64f3cf1c03da50f0534a7c9/skeleton.css');

        const skeleton_html = `<div class="bca-skeleton-card">
            <div class="bca-skeleton bca-skeleton-line"></div>
            <div class="bca-skeleton bca-skeleton-line"></div>
            <div class="bca-skeleton bca-skeleton-line"></div>
            <div class="bca-skeleton bca-skeleton-line"></div>
            <div class="bca-skeleton bca-skeleton-line"></div>
        </div>`;

        document.getElementById(parent_id).innerHTML = skeleton_html;
    },

    async removeSkeleton(parent_id) {
        const parent = document.getElementById(parent_id);
        // remove skeleton
        parent.querySelector('.bca-skeleton-card')?.remove();
    },

    async createNotifChildren(encoded_email) {
        let isUserRegistered = await BCA_Users.checkIfUserCompleteRegistration();
        if (!isUserRegistered)
            return;

        let ready_html = ``;
        let parent_id = 'bca-notif-content';

        // check if requires rendering for new notifications
        let newNotifs = await this.getNumberOfUnread();
        let cached_data = BCA_Cache.get(this.LOCALSTORAGE_UNREAD_NOTIF);

        if (false) //!newNotifs && cached_data
            this.buildStringHTML(parent_id, cached_data);

        else {
            // get all notifications from unread to read
            let unread = await this.fetch(encoded_email, 'unread', new URLSearchParams({
                orderBy: '"$key"'
            }));
            let cached_read = BCA_Cache.get(this.LOCALSTORAGE_UNREAD_NOTIF);
            // let read = (BCA_Display.isHTML(cached_read) && BCA_Display.isValidNotifHTML(cached_read)) ? cached_read : await this.fetch(encoded_email, 'read', new URLSearchParams({
            //     orderBy: '"$key"',
            //     limitToFirst: 20
            // }));

            let read = await this.fetch(encoded_email, 'read', new URLSearchParams({
                orderBy: '"$key"',
                limitToLast: 10
            }));

            // const template = document.getElementById('bca-notif-child-template');
            //skeleton
            this.setSkeleton('bca-notif-content');

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
                BCA_Cache.appendStrToItem(this.LOCALSTORAGE_UNREAD_NOTIF, link.outerHTML);
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

        if (status === "read") {
            let ready_html = '';
            let getUnread = document.querySelectorAll('#bca-notif-content a[data-status="read"]');

            Array.from(getUnread).forEach(item => { ready_html += item.outerHTML });
            BCA_Cache.set(this.LOCALSTORAGE_UNREAD_NOTIF, ready_html);
        }
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
        await this.initFirebase();

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

        let email = await this.checkIfUserOnline();
        if (!email)
            return;

        let { data, error } = await supabase.from('users').select('id').eq('email', email);

        if (error || data?.length == 0)
            return;

        return true;
    },
    async signOut() {
        await supabase.auth.signOut();
    },
    getCountry() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    },
    appendStrToItem(key, val) {
        let previous_item = this.get(key);
        let new_item = val + '' + previous_item;
        this.set(key, new_item);
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

    getRaw(image_data) {
        if (!image_data) {
            window.alert("Please upload image first.");
            return;
        }

        let original = image_data.image;

        return original.url;
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
    },
    isHTML(str) {
        var doc = new DOMParser().parseFromString(str, "text/html");
        return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
    },
    isValidNotifHTML(str) {
        // this will parse the string and check whether it complies the html pattern of child notifications.
        let div = document.createElement('div');
        div.innerHTML = str;

        let count_nodes = div.childNodes.length;
        let allLinkTags = div.querySelectorAll('a').length;

        return count_nodes === allLinkTags;
    },
    async scrollWhenExists(id) {
        const wait = setInterval(async () => {
            const el = document.getElementById(id);

            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                await sleep(500);

                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                el.style.border = "3px solid #c52020";
                clearInterval(wait);

                setTimeout(() => {
                    el.style.border = "none";
                }, 5000);

            }
        }, 300);
    }
}

var BCA_Url = {
    getUrl() {
        return window.location.href;
    },
    getPathname() {
        return new URL(this.getUrl()).pathname;
    },
    getSearhParams() {
        this.getSearchParams();
    },
    getSearchParams() {
        return new URL(this.getUrl()).searchParams;
    },
    getParamValue(key) {
        return new URL(this.getUrl()).searchParams.get(key);
    },
    addParam(url, param) {
        return `${url}?${param}`;
    },
    addURLParam(url, key, val) {
        try {
            let new_url = new URL(url);
            new_url.searchParams.set(key, val);
            return new_url.toString();
        } catch (error) {
            console.log("Invalid url. ", error)
            return;
        }
    },
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    },
    isYoutubeVideo(url) {
        try {
            // Ensure it's a valid URL format first
            const parsedUrl = new URL(url);

            // Check hostname
            const host = parsedUrl.hostname.replace('www.', '');
            if (host !== 'youtube.com' && host !== 'youtu.be' && host !== 'm.youtube.com') {
                return false;
            }

            // Handle youtu.be/VIDEO_ID
            if (host === 'youtu.be') {
                // The pathname includes the leading slash, so it must be exactly '/' + 11 character ID
                return /^\/[a-zA-Z0-9_-]{11}$/.test(parsedUrl.pathname);
            }

            // Handle youtube.com/watch?v=VIDEO_ID
            if (parsedUrl.pathname === '/watch') {
                const videoId = parsedUrl.searchParams.get('v');
                return videoId ? /^[a-zA-Z0-9_-]{11}$/.test(videoId) : false;
            }

            // Handle youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID
            if (parsedUrl.pathname.startsWith('/embed/') || parsedUrl.pathname.startsWith('/v/')) {
                const segments = parsedUrl.pathname.split('/');
                const videoId = segments[2]; // Index 2 because path starts with a slash
                return videoId ? /^[a-zA-Z0-9_-]{11}$/.test(videoId) : false;
            }

            // Handle youtube.com/shorts/VIDEO_ID
            if (parsedUrl.pathname.startsWith('/shorts/')) {
                const segments = parsedUrl.pathname.split('/');
                const videoId = segments[2];
                return videoId ? /^[a-zA-Z0-9_-]{11}$/.test(videoId) : false;
            }

            return false;
        } catch (e) {
            // Invalid URL format
            return false;
        }
    },
    isImgBB(url) {
        // return the pathname
        try {
            let origin = new URL(url).origin;
            return origin === 'https://i.ibb.co';
        } catch (error) {
            return null;
        }
    },
    changeState(url, key, val) {
        let cur_url = new URL(url);
        cur_url.searchParams.set(key, val);
        window.history.replaceState({}, "", cur_url);
    }
}

var BCA_Comment = {
    comment_form: document.getElementById('bca_universal_comment'), // this can be null before initialize
    comment_form_parent: document.getElementById('bca_univ_parent_container'),
    user_id: '',
    user_email: '',
    user_prof_img: '',
    username: '',
    id_tag: 'bca-comments-',
    fb_users: 'https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_users',
    fb_comments: 'https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments',
    url_bucket: [],
    black_lists: ['/p/ticket-creator.html', '/p/ticket-support.html'],
    isReplying: false,

    async initialize() {
        if (!this.comment_form_parent)
            return;

        // check if the url is black listed
        await initFunctions(['BCA_Url', 'FirebaseModule', 'supabase', 'moment']);
        if (!this.black_lists.includes(BCA_Url.getPathname())) {
            Array.from(this.renderCommentEditor()).forEach(child => this.comment_form_parent.appendChild(child));
            document.body.appendChild(this.renderChildTemplate());
        }

        this.comment_form = document.getElementById('bca_universal_comment');

        // if the form cant be seen, dont initialize!
        if (!this.comment_form)
            return;

        // check if the user is logged in...
        let email = await BCA_Users.checkIfUserOnline();

        if (!email)
            await this.initUsersData({ id: 7783 });
        else
            await this.initUsersData({ email: email });

        // initializing apis
        this.initUploadAPI();
        this.initLinkAPI();
        this.initCancelReplyAPI();
        this.initCommentEditor(this.user_id);

        // event listener for comment
        this.comment_form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.postComment();
        });

        // render the comment
        await this.renderTargetComment();
        let comments_data = await this.getCommentsData();
        await this.renderCommentChild(comments_data);
        this.updateCommentCount();
    },
    getContents() {
        const content = this.comment_form.querySelector('textarea').value;

        return this.trimToTwoNewlines(content);
    },
    getAttachments() {
        let attachments = this.comment_form.querySelector('#attachments').querySelectorAll(`p span[url]`);

        if (!attachments)
            return;

        let arr_data = Array.from(attachments).map(item => item.innerText);
        return arr_data;
    },
    async postComment() {
        // disable the form
        BCA_Display.disableElem(this.comment_form);

        // post to firebase
        await this.authenticFirebase();
        let post_id = await this.getPathnameID();
        let fb_id = await this.postToFirebase();

        // post to supabase       
        let sp_id = await this.postToSupabase(fb_id, post_id, this.user_id);

        if (!sp_id) {
            window.alert("Error posting comment to supabase!");
            return;
        }

        // Process comment data
        let reply_target = this.replyToTarget();
        let comments_data = [{
            bca_posts: post_id,
            date: new Date().toISOString(),
            fb_id: fb_id,
            id: sp_id.id,
            parent_id: reply_target,
            root_id: reply_target,
            user_id: {
                email: this.user_email,
                username: this.username,
                prof_img: this.user_prof_img
            }
        }];

        // Process Notifications
        this.notifyRepliedUser(this.replyToTarget(), sp_id.id);

        // RENDERS AFTERWARDS
        BCA_Url.changeState(window.location.href, 'target_comment', `${this.id_tag}${sp_id.id}`);
        await this.renderCommentChild(comments_data);
        // this.scrollWhenExists(`${this.id_tag}${sp_id.id}`, this.comment_form);
        this.resetCommentForm();
    },
    async getPathnameID() {
        let pathname = BCA_Url.getPathname();

        // check the path if exists
        let { data, error } = await supabase.from('bca-website-posts').select('id').eq('url', pathname);

        if (data?.length === 1)
            return data[0].id;

        let upsert_data = await supabase.from('bca-website-posts').upsert({
            date: 'now()',
            url: pathname
        }).select('id').single();

        return upsert_data.data.id;
    },
    async authenticFirebase() {
        // post auth to firebase

        await FirebaseModule.patch(`${this.fb_users}.json`, JSON.stringify({
            [this.user_id]: new Date().getTime()
        }));
    },
    async postToFirebase() {
        const fb_id = new Date().getTime();
        // post content to firebase
        await FirebaseModule.patch(`${this.fb_comments}/${fb_id}.json`, JSON.stringify({
            auth: this.user_id.toString(),
            content: this.getContents(),
            attach: this.getAttachments()
        }));

        return fb_id;
    },
    async postToSupabase(fb_id, post_id, user_id) {
        let { data, error } = await supabase.from('bca-comments').insert({
            date: 'now()',
            fb_id: fb_id,
            bca_posts: post_id,
            user_id: user_id,
            parent_id: this.replyToTarget(),
            root_id: this.replyToTarget()
        }).select('id').single();

        if (error)
            return;

        return data;
    },
    async notifyRepliedUser(reply_target_id, target_id) {
        if (!reply_target_id)
            return;

        let user_profile = document.getElementById(`${this.id_tag}${reply_target_id}`)?.querySelector('a').href;
        let target_email = new URL(user_profile).searchParams.get('view');

        if (target_email === this.user_email)
            return;

        let current_href = window.location.href;
        let payload = {
            "action": "replied on the post",
            "url": `${BCA_Url.addURLParam(current_href, "target_comment", `${this.id_tag}${target_id}`)}`,
            "title": document.title,
            "thumb": this.user_prof_img
        }

        await BCA_Notifications.send(this.user_id, target_email, payload);
    },
    async initUploadAPI() {
        if (!this.comment_form)
            return;

        const uploadBtn = this.comment_form.querySelector('button[btn-upload]');
        const uploadInput = this.comment_form.querySelector('#bca_universal_comment_image');
        const attach_parent = this.comment_form.querySelector('#attachments');

        BCA_IMGBB.initialize(uploadInput, uploadBtn);

        uploadBtn.addEventListener('click', () => uploadInput.click());

        uploadInput.addEventListener('input', async (e) => {
            const file = e.target.files[0];
            let image_data = await BCA_IMGBB.uploadImage(file);
            let url = BCA_IMGBB.getRaw(image_data);

            // build attachment child
            attach_parent.appendChild(this.buildAttachHTML("IMG", url));
        }, false);
    },
    initLinkAPI() {
        if (!this.comment_form)
            return;

        const uploadBtn = this.comment_form.querySelector('button[btn-link]');
        const attach_parent = this.comment_form.querySelector('#attachments');

        uploadBtn.addEventListener('click', () => {
            let url = window.prompt("Add some url (Youtube, Reddit, etc.)");

            if (!url)
                return;

            if (!BCA_Url.isValidURL(url)) {
                window.alert("Invalid URL. Please paste some valid url.");
                return;
            }

            if (this.url_bucket.includes(url)) {
                window.alert("Already added!");
                return;
            }

            this.url_bucket.push(url);
            attach_parent.appendChild(this.buildAttachHTML("URL", url));
        });
    },
    initCancelReplyAPI() {
        this.wQuery(this.comment_form, 'btn-cancel').addEventListener('click', (e) => {
            this.cancelReply();
        });
    },
    async initCommentEditor(user_id) {
        let users_data = await BCA_Users.getMemberInfo('prof_img, username', user_id);
        this.wQuery(this.comment_form, 'comment_username').textContent = this.username = users_data[0].username;
        this.wQuery(this.comment_form, 'comment_prof_img').src = this.user_prof_img = users_data[0].prof_img;
    },
    async initUsersData(user_data) {
        if (user_data.id) {
            let users_data = await BCA_Users.getMemberInfoCustom('id, email, prof_img, username', 'id', user_data.id);
            this.user_id = users_data[0].id;
            this.user_email = users_data[0].email;
            this.user_prof_img = users_data[0].prof_img;
            this.username = users_data[0].username;
            return;
        }

        if (user_data.email) {
            let users_data = await BCA_Users.getMemberInfoCustom('id, email, prof_img, username', 'email', user_data.email);
            this.user_id = users_data[0].id;
            this.user_email = users_data[0].email;
            this.user_prof_img = users_data[0].prof_img;
            this.username = users_data[0].username;
            return;
        }
    },
    buildAttachHTML(type, url) {
        let div = document.createElement('div');
        div.classList = 'bca-univ-comment-attachment-child';
        let snippet = `<p class="bca-univ-comment-attachment-child-info">
        <span>${type}: </span>
        <span url="">${url}</span>
      </p>
      <span onclick="javascript:BCA_Comment.removeChildAttachment(this);" class="bca-univ-comment-attachment-child-delete">
        X
      </span>`;

        div.innerHTML = snippet;
        return div;
    },
    resetAttachments() {
        this.url_bucket = [];
        const attach_parent = this.comment_form.querySelector('#attachments');
        attach_parent.innerHTML = ``;
    },
    removeChildAttachment(e) {
        let elem = e.parentNode;
        let filtered = this.url_bucket.filter(item => elem.querySelector('span[url]').innerText !== item);
        this.url_bucket = filtered;
        elem.remove();
    },
    renderCommentEditor() {
        let template = document.createElement('template');
        template.innerHTML = `<h3 comment_count>Loading comments...</h3>
        <div id='comments-parent-holder'></div>
        <form class='bca-univ-comment-form admPs' id='bca_universal_comment'>
        <div class='bca-univ-comment-header'>
            <span comment_username></span>
            <img comment_prof_img src='https://cdn-icons-png.flaticon.com/512/5486/5486152.png' />
            <button btn-cancel style='display: none;' type='button' role='button' class='button-15'>X</button>
        </div>
        <textarea required type='text' class='bca-univ-comment-content' contenteditable="plaintext-only" placeholder="Enter your comment!"></textarea>
        <div class='bca-univ-comment-attachment' id='attachments'>
        </div>
        <div class='bca-univ-comment-footer' id='comment-footer'>
            <input id='bca_universal_comment_image' style='display: none;' type="file" accept="image/jpeg, image/png, image/gif, image/bmp"/>
            <button btn-upload type='button' role='button' class='button-15'>Upload</button>
            <button btn-link type='button' role='button' class='button-15'>Links</button>
            <button btn-comment type='submit' role='button' class='button-15' style='margin-left: auto;'>Comment</button>
        </div>
        </form>`;
        return template.content.children;
    },
    renderChildTemplate() {
        let template = document.createElement('template');
        template.innerHTML = `<template comment-child-template>
        <div class="bc-message-box">
        <div class="bc-content">
            
            <!-- Header row -->
            <div class="bc-header">
            <div class="bc-profile-wrapper">
                <img bca-profile src="" alt="Profile" class="bc-profile-img">
            </div>
            <a bca-username class="bc-title"></a>
            <div bca-timestamp class="bc-timestamp"></div>
            </div>
            
            <!-- Comment Body Container -->
            <div class="bc-text-container">
            <!-- Embedded Target Replied Content -->
            <div class="bc-reply-preview">
            </div>
            
            <!-- Comment Text -->
            <p bca-message></p>
            </div>

            <!-- ATTACHMENT PREVIEW AREA (SQUARE SIDES-BY-SIDE) -->
            <div bca-attachments class="bc-attachments-area">

            </div>

            <!-- Footer row -->
            <div class="bc-footer">
            <!-- <button class="bc-btn bc-btn-heart" aria-label="Heart">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span>Like</span>
            </button> -->
            <button class="bc-btn bc-btn-reply" aria-label="Reply">
                <svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                <span bca-reply-trigger>Reply</span>
            </button>
            </div>

        </div>
        </div>
        </template>`;

        return template.content.firstElementChild;
    },
    updateCommentCount() {
        let comment_count = this.query('comments-parent-holder').children?.length;

        this.wQuery(this.comment_form_parent, 'comment_count').textContent = `${!comment_count || comment_count === 0 ? `Start your comment!` :
            `${comment_count} ${comment_count < 2 ? `Comment` : `Comments`}`}`;
    },
    resetCommentForm() {
        // reset comment form
        BCA_Display.enableElem(this.comment_form);
        this.comment_form.reset();
        this.cancelReply();
        this.query('attachments').innerHTML = ``;
        this.url_bucket.length = 0;
    },
    trimToTwoNewlines(text) {
        return text.replace(/\n{3,}/g, '\n\n');
    },

    // this functions loads the comments from the url
    async getCommentsData() {
        let id = await this.getPathnameID();
        let { data, error } = await supabase.from('bca-comments').select('*, user_id(prof_img, username, email)').eq('bca_posts', id).order('id', { ascending: true });

        if (data?.length === 0 || error)
            return;

        return data;
    },
    async getSingleCommentData(target_id) {
        if (!target_id)
            return;

        let { data, error } = await supabase.from('bca-comments').select('*, user_id(prof_img, username, email)').eq('id', target_id);

        if (data?.length === 0 || error)
            return;

        return data;
    },
    async getFBCommentData(id, root) {
        let data = await FirebaseModule.fetchJSON(`${this.fb_comments}/${id}/${root}.json`);

        return data;
    },
    async renderTargetComment() {
        if (!BCA_Url.getParamValue('target_comment'))
            return;

        let id = BCA_Url.getParamValue('target_comment')?.replace('bca-comments-', '');
        let target_comment_data = await this.getSingleCommentData(id);

        // // this is just identifier so that when rendering comment it knows its a target comment.
        let temp_arr = Array.from(target_comment_data);
        if (target_comment_data.length === 1)
            temp_arr.unshift({
                val: target_comment_data[0]?.parent_id
            });

        // rendering the comment
        await this.renderCommentChild(temp_arr);
    },
    async renderCommentChild(comments_data) {
        // Descending
        const template = this.pQuery('comment-child-template');
        const parent = this.query('comments-parent-holder');

        if (!template || !parent || !comments_data)
            return;

        // checking if the render is requested by target comment
        let isTargetComment = comments_data[0]?.val;
        if (comments_data[0]?.hasOwnProperty('val')) comments_data.shift();

        await Promise.all(comments_data.map(item => this.buildCommentChildUserData(template, parent, item)));

        await Promise.all(comments_data.map(item => this.buildCommentContents(parent, item, isTargetComment)));
        comments_data.map(item => this.buildReplyEmbed(item));

        this.updateCommentCount();

        // after building children, focus to target comment if exists
        if (BCA_Url.getParamValue('target_comment'))
            BCA_Display.scrollWhenExists(`${BCA_Url.getParamValue('target_comment')}`);
    },
    async buildCommentChildUserData(template, parent, data) {
        let users_data = data.user_id;
        let clone = template.content.cloneNode(true).children[0];

        if (document.getElementById(`${this.id_tag}${data.id}`))
            return;

        clone.id = `${this.id_tag}${data.id}`;
        this.wQuery(clone, 'bca-username').textContent = `${users_data.username}`;
        this.wQuery(clone, 'bca-profile').src = `${users_data.prof_img}`;
        this.wQuery(clone, 'bca-username').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${users_data.email}`;
        this.wQuery(clone, 'bca-reply-trigger').addEventListener('click', (e) => {
            this.appendCommentEditor(e.target);
        });

        parent.appendChild(clone);
    },
    async buildCommentContents(parent, data, isReplyTarget) {
        let comment = await this.getFBCommentData(data.fb_id, 'content');
        let attach = await this.getFBCommentData(data.fb_id, 'attach');

        this.wQuery(this.query(`${this.id_tag}${data.id}`), 'bca-message').innerText = `${comment?.val ? comment.val : comment}`;
        this.wQuery(this.query(`${this.id_tag}${data.id}`), 'bca-timestamp').innerText = `${moment(data.date).fromNow()}`;

        if (attach)
            this.buildCommentAttachments(parent, attach, data.id);

        // This will execute if its loading a target comment.
        if (!isReplyTarget)
            return;

        let reply_data = await this.buildHTMLReply(isReplyTarget);
        if (reply_data) {
            this.query(`${this.id_tag}${data.id}`).querySelector('.bc-text-container').before(reply_data);
            this.wQuery(this.query(`${this.id_tag}${data.id}`), 'bca-username').textContent += " replied to you.";
        }
    },
    async buildCommentAttachments(parent, attachments, id) {
        let parent_attachments = this.wQuery(this.query(`${this.id_tag}${id}`), 'bca-attachments');
        // filter if the attachment has i.bb.co origin means this is a picture attachment

        // else if the attachment is a youtube video create an iframe

        // else treat everything as links

        attachments.forEach(item => {
            if (BCA_Url.isYoutubeVideo(item)) {
                parent_attachments.innerHTML += `<div class="bc-attach-item bc-attach-video">
        <iframe src="${item}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>`;
                return;
            }
            if (BCA_Url.isImgBB(item)) {
                parent_attachments.innerHTML += `<div class="bc-attach-item bc-attach-image">
        <img onclick='window.location.href = "https://battlecatsarchive.blogspot.com/p/image-viewer.html?view=${btoa(`https://bca-image-proxy.jasonbourne181997.workers.dev${new URL(item).pathname}`)}"' src="https://bca-image-proxy.jasonbourne181997.workers.dev${new URL(item).pathname}" alt="User Attachment">
      </div>`;
                return;
            }

            // Build URL Item
            parent_attachments.innerHTML += `<a href="${item}" target="_blank" class="bc-attach-item bc-attach-link">
        <div class="bc-link-icon">
          <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        </div>
        <div class="bc-link-details">
          <div class="bc-link-title">${new URL(item).host}</div>
          <div class="bc-link-url">Open Link</div>
        </div>
      </a>`;
        });
    },
    async buildHTMLReply(targetReply) {
        let reply_data = await this.getSingleCommentData(targetReply);
        let fb_data = await this.getFBCommentData(reply_data[0]?.fb_id, 'content');

        if (!fb_data)
            return;

        let p = document.createElement('p');
        p.style.background = 'black';
        p.style.padding = '10px';
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => {
            this.scrollWhenExists(`${this.id_tag}${targetReply}`);
        });

        p.textContent = `You said: ${fb_data}`;

        return p;
    },
    buildReplyEmbed(item) {
        let comment = document.getElementById(`${this.id_tag}${item.id}`);
        let attachment_parent = comment.querySelector('.bc-reply-preview');
        if (!attachment_parent)
            return;

        // getting the target
        let target_id = `${this.id_tag}${item.parent_id}`
        if (!this.query(target_id)) {
            attachment_parent.remove();
            return;
        }

        let target = document.getElementById(target_id);
        let username = target.querySelector('[bca-username]').innerText;
        let content = target.querySelector('[bca-message]').innerText;
        attachment_parent.addEventListener('click', () => {
            this.scrollWhenExists(target_id);
        });
        attachment_parent.innerHTML += `<span bca-reply-to-username="" class="bc-preview-author">@${username}:</span>`;
        attachment_parent.innerHTML += `<span bca-reply-to-message="" class="bc-preview-text">${content}</span>`;
    },
    wQuery(elem, str) {
        return elem.querySelector(`[${str}]`);
    },
    pQuery(str) {
        return document.querySelector(`[${str}]`);
    },
    query(id) {
        return document.getElementById(id);
    },
    appendCommentEditor(replyNode) {
        this.isReplying = true;
        this.comment_form.querySelector('[btn-cancel]').style.display = 'block';
        this.wQuery(this.comment_form, 'btn-comment').textContent = 'Reply';
        let parent = replyNode.parentNode.parentNode;
        parent.after(this.comment_form);
    },
    cancelReply() {
        this.isReplying = false;
        this.query('comments-parent-holder').after(this.comment_form);
        this.wQuery(this.comment_form, 'btn-comment').textContent = 'Comment';
        this.wQuery(this.comment_form, 'btn-cancel').style.display = 'none';
    },
    replyToTarget() {
        let target_parent = this.comment_form.parentNode.parentNode.id;
        if (this.isReplying && target_parent.includes(`${this.id_tag}`))
            return parseInt(target_parent.replace(`${this.id_tag}`, ''));
        else return;
    },
    scrollWhenExists(id) {
        const wait = setInterval(() => {
            const el = document.getElementById(id);

            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                el.style.border = "3px solid beige";
                clearInterval(wait);

                setTimeout(() => {
                    el.style.border = "none";
                }, 3000);

            }
        }, 300);
    }
}

var BCA_Blogger = {
    url: 'https://battlecatsarchive.blogspot.com/',
    async getData(label, num_results) {
        let data = await fetch(`${this.url}feeds/posts/default/-/${label}?alt=json&max-results=${num_results}`);

        if (data.ok) {
            data = await data.json();
            return data;
        }

        return;
    },

    filterData(data) {
        let filtered_data = data?.feed?.entry;
        if (!filtered_data)
            return;

        let lists = [];

        filtered_data.forEach(item => {
            let payload = {};
            payload.thumb = item.media$thumbnail.url;
            payload.date = item.published.$t;
            payload.title = item.title.$t;

            payload.url = item.link.map(link => link.rel === 'alternate' ? link.href : null).filter(_ => _)[0];

            lists.push(payload);
        });

        return lists;
    }
}

var BCA_Encryptor = {
    // Derive an AES-GCM key from a password using PBKDF2
    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    bufToBase64(buf) {
        return btoa(String.fromCharCode(...new Uint8Array(buf)));
    },

    base64ToBuf(b64) {
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    },

    async encrypt(plaintext, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);
        const enc = new TextEncoder();
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
        );

        // Package salt + iv + ciphertext into one base64 blob
        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

        return this.bufToBase64(combined);
    },

    async decrypt(blob, password) {
        const combined = this.base64ToBuf(blob);
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);
        const key = await this.deriveKey(password, salt);
        const plainBuf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv }, key, ciphertext
        );
        return new TextDecoder().decode(plainBuf);
    }
}
