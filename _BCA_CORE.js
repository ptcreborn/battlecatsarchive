

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
            let read = (BCA_Display.isHTML(cached_read) && BCA_Display.isValidNotifHTML(cached_read)) ? cached_read : await this.fetch(encoded_email, 'read', new URLSearchParams({
                orderBy: '"$key"',
                limitToFirst: 20
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
        return new URL(this.getUrl()).searchParams;
    },
    getParamValue(key) {
        return new URL(this.getUrl()).searchParams.get(key);
    },
    addParam(url, param) {
        return `${url}?${param}`;
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
    }
}

var BCA_Comment = {
    comment_form: document.getElementById('bca_universal_comment'),
    user_id: '',
    fb_users: 'https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_users',
    fb_comments: 'https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments',
    url_bucket: [],
    async initialize() {
        // if the form cant be seen, dont initialize!
        if (!this.comment_form)
            return;

        await initFunctions(['supabase', 'FirebaseModule']);

        // check if the user is logged in...
        let email = await BCA_Users.checkIfUserOnline();

        if (!email)
            this.user_id = 7783; // reserved id for guests
        else {
            this.user_id = await BCA_Users.getMemberInfoCustom('id', 'email', email);
            this.user_id = this.user_id[0].id;
        }

        // initializing apis
        BCA_Comment.initUploadAPI();
        BCA_Comment.initLinkAPI();

        // event listener for comment
        this.comment_form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.postComment();
        });

        // render the comment
        await renderCommentChild();
    },
    getContents() {
        const content = this.comment_form.querySelector('textarea').value;

        return content;
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
        let res = await this.postToSupabase(fb_id, post_id, this.user_id);

        if (!res) {
            window.alert("Error posting comment to supabase!");
            return;
        }

        // Render comment


        // Enable comment form
    },
    renderComment() {

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

        console.log(`Pathname ID: ${data?.length === 1 ? data[0].id : upsert_data.data.id}`);
        return upsert_data.data.id;
    },
    async authenticFirebase() {
        // post auth to firebase
        console.log(this.user_id);

        await FirebaseModule.patch(`${this.fb_users}.json`, JSON.stringify({
            [this.user_id]: new Date().getTime()
        }));

        console.log(`Authenticated User with ID ${this.user_id}`);
    },
    async postToFirebase() {
        const fb_id = new Date().getTime();
        // post content to firebase
        await FirebaseModule.patch(`${this.fb_comments}/${fb_id}.json`, JSON.stringify({
            auth: this.user_id.toString(),
            content: this.getContents(),
            attach: this.getAttachments()
        }));

        console.log(`Posted to firebase ${fb_id}`);
        return fb_id;
    },
    async postToSupabase(fb_id, post_id, user_id) {
        let { data, error } = await supabase.from('bca-comments').insert({
            date: 'now()',
            fb_id: fb_id,
            bca_posts: post_id,
            user_id: user_id,
            parent_id: null,
            root_id: null
        });

        if (error)
            return;

        console.log(`Posted to supabase`);

        return true;
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

    // this functions loads the comments from the url
    async getCommentsData() {
        let id = await this.getPathnameID();
        let { data, error } = await supabase.from('bca-comments').select('*').eq('bca_posts', id);

        if (data?.length === 0 || error)
            return;

        return data;
    },
    async getFBCommentData(id) {
        let data = await FirebaseModule.fetchJSON(`${fb_comments}/${id}.json`);

        return data;
    },
    async renderCommentChild() {
        // Descending
        let comments_data = await this.getCommentsData();
        comments_data.forEach(item => console.log(item));
    },
    pQuery(str) {
        return document.querySelector(`[${str}]`);
    }
}

BCA_Comment.initialize();
