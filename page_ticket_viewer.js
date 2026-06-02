
// TICKET VIEWER AND COMMENT EDITOR
(async () => {
    appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
    appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');

    await initFunctions(['supabase', 'FirebaseModule', 'moment']);

    const skeleton = document.getElementById('skeleton');
    const bca_ticket_parent = document.getElementById('bca_ticket_parent');

    let ticket_id = new URL(window.location.href).searchParams?.get('ticket');
    let target = new URL(window.location.href).searchParams?.get('target');

    if (!ticket_id) {
        document.getElementById('fallback').style.display = 'block';
        document.getElementById('fallback').querySelector('h2').textContent = `Invalid Ticket Number`;
        document.getElementById('skeleton').remove();
        document.getElementById('comment_count').remove();
        document.getElementById('comment_parent_container').remove();
        return;
    }

    let data = await getMetaData();
    if (!data) {
        document.getElementById('fallback').style.display = 'block';
        document.getElementById('fallback').querySelector('h2').textContent = `Invalid Ticket Number: ${ticket_id}`;
        document.getElementById('skeleton').remove();
        document.getElementById('comment_parent_container').remove();
        document.getElementById('comment_count').remove();
        return;
    }

    if (target)
        scrollWhenExists(target);

    buildHMTL(data);
    initCommentSystem(data);
    initLoadComments();

    async function buildHMTL(data) {
        let supabase = data[0];
        let firebase = data[1];
        let users_data = supabase.user_id;
        let ranks_data = users_data.rank_id;

        checkTimeRecent();

        document.title = supabase.title;
        document.getElementById('bca_ticket_avatar').src = users_data.prof_img;
        document.getElementById('bca_ticket_username').textContent = users_data.username;
        document.getElementById('bca_ticket_username').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${users_data.email}`;
        document.getElementById('bca_ticket_flag').src = users_data.country === "Anonymous" ? `https://i.imgur.com/4MofKJvs.png` : `https://flagsapi.com/${users_data.country}/shiny/64.png`;
        document.getElementById('bca_ticket_flag').setAttribute('alt', users_data.username);
        document.getElementById('bca_ticket_rank').src = ranks_data.rank_image;
        document.getElementById('bca_ticket_date').textContent = moment(parseInt(ticket_id)).fromNow();
        document.getElementById('bca_ticket_title').textContent = supabase.title;
        document.getElementById('bca_ticket_content').textContent = firebase.content;
        document.getElementById('bca_ticket_xp').textContent = `${users_data.xp} XP`;
        document.getElementById('bca_ticket_rankname').textContent = `${ranks_data.rank_name}`;
        document.getElementById('bca_ticket_parent').dataset.email = users_data.email;

        const templateAttachment = document.querySelector('[template-attachment]');
        const templateLinks = document.querySelector('[template-links]');

        // document.querySelector('h2.entry-title').textContent = `Ticket Viewer #${ticket_id}`;
        // document.querySelector('[prof-img]').src = users_data.prof_img;
        // document.querySelector('[prof-flag]').src = users_data.country === "Anonymous" ? `https://i.imgur.com/4MofKJvs.png` : `https://flagsapi.com/${users_data.country}/shiny/64.png`;
        // document.querySelector('[prof-rank]').src = ranks_data.rank_image;
        // document.querySelector('[prof-username]').textContent = users_data.username;
        // document.querySelector('[prof-username]').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${users_data.email}`;
        // document.querySelector('[prof-title]').textContent = supabase.title;
        // document.querySelector('[prof-date]').textContent = moment(parseInt(ticket_id)).fromNow();
        // document.querySelector('[prof-content]').textContent = firebase.content;

        document.getElementById('bca_ticket_avatar').addEventListener('click', () => {
            window.location.href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${users_data.email}`;
        });

        if (firebase.img || firebase.yt) {
            let clone = templateAttachment.content.cloneNode(true).children[0];
            document.getElementById('bca_ticket_parent').appendChild(clone);
        }

        if (firebase.link) {
            let clone = templateLinks.content.cloneNode(true).children[0];
            document.getElementById('bca_ticket_parent').appendChild(clone);
        }

        buildImgs(firebase.img);
        buildYT(firebase.yt);
        buildLink(firebase.link);

        skeleton.remove();
        bca_ticket_parent.style.display = 'block';
    }

    function checkTimeRecent() {
        // change the color
        let now = new Date().getTime();
        if ((now - parseInt(ticket_id)) / 1000 <= 1800)
            document.getElementById('bca_ticket_date').style.color = `#00ff00`;
    }

    function buildImgs(imgs) {
        if (!imgs || !document.getElementById('bca_ticket_attachment'))
            return;
        imgs.map(item => {
            let img = document.createElement('img');
            img.classList.add('bca-ticket-attachment-img');
            img.setAttribute('loading', 'lazy');
            img.setAttribute('alt', 'Ticket Attachment');

            img.addEventListener('click', () => {
                window.open(`https://battlecatsarchive.blogspot.com/p/image-viewer.html?view=${btoa(item)}`);
            });

            // minifying image size
            let temp = item.split('.');
            temp[2] += 'm';
            temp = temp.join('.');
            img.src = temp;
            img.style.cursor = 'pointer';

            document.getElementById('bca_ticket_attachment').appendChild(img);
        });
    }

    function buildYT(yt) {
        if (!yt)
            return;
        yt.map(item => {
            let iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${new URL(item).searchParams.get('v')}`;
            document.getElementById('bca_ticket_attachment').appendChild(iframe);
        });
    }

    function buildLink(link) {
        if (!link)
            return;
        let count = 1;
        link.map(item => {
            let a = document.createElement('a');

            // compressing url
            let payload = {
                "a": 1,
                "t": encodeURIComponent(item)
            }

            a.href = `https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html?request=${btoa(JSON.stringify(payload))}`;
            a.classList.add('bca-ticket-link-box');
            a.innerHTML = `<span class="bca-ticket-link-domain">${new URL(item).hostname}</span><span style='margin-left: auto;'>🔒#${count++}</span>`;
            document.getElementById('bca_ticket_links').appendChild(a);
        });
    }

    async function getContent() {
        // firebase
        const db = `https://storehaccounts-notifications-default-rtdb.firebaseio.com/bca-tickets`;
        let data = await FirebaseModule.fetchJSON(`${db}/${ticket_id}.json`);

        return data;
    }

    async function getMetaData() {
        // supabase
        let key = `ticket-viewer-${ticket_id}`
        let cached_data = retrievedData(key);

        if (cached_data)
            return cached_data;

        let { data, error } = await supabase.from('bca-ticket').select('*, user_id(xp, username, prof_img, country, rank_id(rank_name, rank_image), email)').eq('fb_id', ticket_id);

        if (error || data?.length == 0)
            return;

        let fb_data = await getContent();

        cachedData(key, [data[0], fb_data]);

        return [data[0], fb_data];
    }

    async function initCommentSystem(data) {
        const bca_ticket_comment_form = document.getElementById('bca_ticket_comment_form');
        const login_first = document.getElementById('login_first');

        let user_email = await checkUserLoggedin();
        if (!user_email) {
            bca_ticket_comment_form.remove();
            login_first.style.display = 'flex';
            return;
        }

        if (!data)
            return;

        let ticket_id = new URL(window.location.href).searchParams?.get('ticket');

        bca_ticket_comment_form.style.display = 'block';

        let user_data = await getUserID();
        let user_id = user_data.id;

        document.querySelector('#bca_ticket_comment_form .bca-comment-avatar').src = user_data.prof_img;

        const parent = document.getElementById('template_preview_parent');
        const template = document.querySelector('[template-attachment-preview]');
        let urls = [];
        let yt = [];
        let imgs = [];

        // Listeners ....
        initLinkAttachments();
        initYTAttachments();
        await initImageAttachments();

        window.commentToTicket = async () => {
            finalizeLinks();
            let ticket = new URL(window.location.href).searchParams?.get('ticket');
            const form = document.getElementById('bca_ticket_comment_form');
            const submit = document.getElementById('comment_submit');

            submit.textContent = `Commenting...`;
            form.style.opacity = '0.7';
            form.style.pointerEvents = 'none';

            let fb_id = new Date().getTime();

            let data = {
                [fb_id]: {
                    con: document.getElementById('comment_content').value,
                    url: urls,
                    yt: yt,
                    imgs: imgs
                }
            }

            await FirebaseModule.patch(`https://storehaccounts-notifications-default-rtdb.firebaseio.com/bca-ticket-comments/${ticket}.json`, JSON.stringify(data));

            let payload;

            const comment_form = document.getElementById('bca_ticket_comment_form');
            // check if the parentnode have a class called "bca-ticket-comment-header"
            if (comment_form.parentNode.classList.contains('bca-ticket-comment-container'))
                payload = {
                    date: 'now()',
                    user_id: user_id,
                    parent_id: ticket_id,
                    fb_id: fb_id,
                    reply_to: comment_form.parentNode.id
                }
            else
                payload = {
                    date: 'now()',
                    user_id: user_id,
                    parent_id: ticket_id,
                    fb_id: fb_id
                }

            let { error } = await supabase.from('bca-ticket-comment').insert(payload);

            if (error) {
                window.alert("Error in inserting supabase record. " + error.message);
                return;
            }

            let url = new URL(window.location.href);
            url.searchParams.set('target', fb_id);

            // Notifications
            // Check first if the user is not the same to the poster..

            let target_html, action, title, user, target_email;

            let poster_email = document.getElementById('bca_ticket_parent').dataset.email;
            let commentor_email = await Users.checkIfUserOnline();

            if (payload.reply_to) {
                target_html = document.getElementById(payload.reply_to);
                if (document.getElementById(payload.reply_to).dataset.email !== commentor_email) {
                    action = "replied on the ticket";
                    title = document.getElementById('comment_content').value.substring(0, 50) + '...';
                    user = await Users.getUserInfo('id');
                    user = user[0].id;
                    target_email = target_html.dataset.email;

                    payload = {
                        "action": action,
                        "url": url,
                        "title": title
                    }
                } else payload = null;
            } else {
                if (poster_email != commentor_email) {
                    // Notify the poster.
                    action = "commented on the ticket";
                    title = document.getElementById('comment_content').value.substring(0, 50) + '...';
                    user = await Users.getUserInfo('id');
                    user = user[0].id;
                    target_email = poster_email;

                    payload = {
                        "action": action,
                        "url": url,
                        "title": title
                    }
                } else payload = null;
            }

            await initFunctions(['Notifications', 'Users']);
            if (payload)
                await Notifications.send(user, target_email, payload);

            window.location.href = url;
        }

        async function checkUserLoggedin() {
            await initFunctions(['supabase']);

            let { data, error } = await supabase.auth.getSession();

            if (error || !data?.session)
                return;

            return data.session.user.email;
        }

        function initLinkAttachments() {
            document.getElementById('addlink').addEventListener('click', () => {
                // ask for link
                let url = window.prompt("Enter a valid link: ");
                try {
                    new URL(url);
                } catch (error) {
                    window.alert("Not a valid URL. Please try again.");
                    return;
                }

                if (urls.includes(url)) {
                    window.alert('This url has already been added.');
                    return;
                }

                urls.push(url);

                const clone = template.content.cloneNode(true).children[0];
                clone.querySelector('b').textContent = "Link";
                clone.querySelector('p').textContent = url;

                parent.appendChild(clone);
            });
        }

        function initYTAttachments() {
            document.getElementById('addyt').addEventListener('click', () => {
                // ask for link
                let yt_url = window.prompt("Enter a valid youtube url: ");
                if (!isYouTubeUrl(yt_url)) {
                    window.alert("Invalid youtube url. Please copy an authentic youtube video.");
                    return;
                }

                if (yt.includes(yt_url)) {
                    window.alert('This url has already been added.');
                    return;
                }

                yt.push(yt_url);

                const clone = template.content.cloneNode(true).children[0];
                clone.querySelector('b').textContent = "Youtube";
                clone.querySelector('p').textContent = yt;

                parent.appendChild(clone);
            });
        }

        async function initImageAttachments() {
            appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/ae9403b157ad59a490e8b4dd7f3e5c57a0980f88/ImgurJS.js');

            const uploadImg = document.getElementById('addimg');
            const input = document.getElementById('file_attachments');

            await initFunctions(['ImgurJS']);

            uploadImg.addEventListener('click', () => {
                input.click();
            });

            ImgurJS.uploadMultipleImgs('file_attachments', 'dummy',
                () => {
                    uploadImg.textContent = `Uploading...`;
                    uploadImg.style.opacity = `0.7`;
                    uploadImg.style.pointerEvents = `none`;
                },
                (img_link) => {
                    uploadImg.textContent = `Upload Image`;
                    uploadImg.style.opacity = `1`;
                    uploadImg.style.pointerEvents = `auto`;

                    const clone = template.content.cloneNode(true).children[0];
                    clone.querySelector('b').textContent = "Image";
                    clone.querySelector('p').textContent = img_link;

                    parent.appendChild(clone);
                },
                () => {
                    console.log('Upload error.');
                    uploadImg.textContent = `Upload Image`;
                    uploadImg.style.opacity = `1`;
                    uploadImg.style.pointerEvents = `auto`;
                }
            );
        }

        function finalizeLinks() {
            let attachments = Array.from(document.querySelectorAll('.bca-comment-attach-preview'));

            urls.length = 0;
            yt.length = 0;
            imgs.length = 0;

            attachments.map(item => {
                let type = item.querySelector('b').textContent;
                let val = item.querySelector('p').textContent;
                switch (type) {
                    case "Link": urls.push(val); break;
                    case "Youtube": yt.push(val); break;
                    case "Image": imgs.push(val); break;
                }
            });
        }

        function isYouTubeUrl(yt_url) {
            return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(yt_url);
        }

        async function getUserID() {
            let { data, error } = await supabase.from('users').select('id, prof_img').eq('email', user_email).single();

            if (error) {
                window.alert("There's no id particular to email: " + user_email);
                return;
            }

            return data;
        }
    }

    async function initLoadComments() {
        let ticket = new URL(window.location.href).searchParams.get('ticket');
        if (!ticket) // failed loading a ticket
            return;


        await buildCommentHTML();

        async function getCommentMetadata() {
            let { data, error } = await supabase.from('bca-ticket-comment')
                .select('id, fb_id, reply_to, user_id(username, country, prof_img, xp, email, rank_id(rank_name, rank_image))')
                .eq('parent_id', ticket)
                .order('fb_id', { ascending: true });

            if (error || data?.length === 0)
                return;

            return data;
        }

        async function buildCommentHTML() {
            let data = await getCommentMetadata();
            const comment_count = document.getElementById('comment_count');

            if (!data) {
                comment_count.textContent = `Start the comment!`;
                return;
            }

            comment_count.textContent = `${data.length} ${(data.length > 1 ? `comments` : `comment`)}`;

            const template = document.querySelector('[comment-template]');
            const parent = document.getElementById('comment_parent_container');
            const fb_data = await getContentData(ticket);

            // REMOVE Skeleton Loading..
            comment_parent_container.innerHTML = '';

            // Build Skeleton HTML
            data.map(item => {
                let users_data = item.user_id;
                let ranks_data = item.user_id.rank_id;
                let comment_id = item.fb_id;

                const clone = template.content.cloneNode(true).children[0];

                clone.id = comment_id;

                // USERS METADATA
                clone.querySelector('#username').textContent = `@${users_data.username}`;
                clone.querySelector('#username').parentNode.href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${users_data.email}`;
                clone.querySelector('#xp').textContent = users_data.xp + ' XP';
                clone.querySelector('#rankname').textContent = ranks_data.rank_name;
                clone.querySelector('#avatar').src = users_data.prof_img;
                clone.querySelector('#rankimg').src = ranks_data.rank_image;
                clone.querySelector('#country').src = users_data.country === "Anonymous" ? `https://i.imgur.com/4MofKJvs.png` : `https://flagsapi.com/${users_data.country}/shiny/64.png`;
                clone.dataset.email = users_data.email;

                // POST METADATA
                clone.querySelector('#date').textContent = moment(parseInt(comment_id)).fromNow();
                clone.querySelector('#content').textContent = fb_data[comment_id].con;

                // BUILDING ATTACHMENTS
                buildAttachments(clone, fb_data[comment_id]);
                buildReply(clone, item);

                parent.appendChild(clone);
            });
        }

        function buildReply(clone, data) {
            if (!data.reply_to) {
                clone.querySelector('#reply_to').remove();
                return;
            }

            clone.querySelector('#reply_to').addEventListener('click', () => {
                scrollWhenExists(data.reply_to);
            });

            clone.querySelector('#reply_to span').textContent = `Replied to ${document.getElementById(data.reply_to).querySelector('#username').textContent}`;
            clone.querySelector('#reply_to p').textContent = `${document.getElementById(data.reply_to).querySelector('#content').textContent.substring(0, 200)}`;
        }

        function buildAttachments(clone, data) {
            // images
            if (data.imgs) {
                data.imgs.map(item => {
                    let img = document.createElement('img');
                    img.setAttribute('loading', 'lazy');
                    img.setAttribute('alt', 'Attachment');
                    img.addEventListener('click', () => {
                        window.open(`https://battlecatsarchive.blogspot.com/p/image-viewer.html?view=${btoa(item)}`);
                    });
                    // minifying image size
                    let temp = item.split('.');
                    temp[2] += 't';
                    temp = temp.join('.');

                    img.src = temp;
                    img.style.cursor = 'pointer';
                    clone.querySelector('#attachments').appendChild(img);
                });
            }

            // yt
            if (data.yt) {
                data.yt.map(item => {
                    let iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${new URL(item).searchParams.get('v')}`;
                    clone.querySelector('#attachments').appendChild(iframe);
                });
            }

            // url
            if (data.url) {
                let count = 1;
                data.url.map(item => {
                    let link = document.createElement('a');

                    // compressing url
                    let payload = {
                        "a": 1,
                        "t": encodeURIComponent(item)
                    }

                    link.href = `https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html?request=${btoa(JSON.stringify(payload))}`;
                    link.classList.add('main-button');
                    link.classList.add('button');
                    link.textContent = `🔒#${count++} ${new URL(item).hostname}`;
                    link.setAttribute('target', '_blank');
                    clone.querySelector('#attachments').appendChild(link);
                });
            }

            if (!data.imgs && !data.url && !data.yt)
                clone.querySelector('#attachments').remove();
            else clone.querySelector('#attachments').style.display = 'flex';
        }

        async function getContentData(fb_id) {
            let data = await FirebaseModule.fetchJSON(`https://storehaccounts-notifications-default-rtdb.firebaseio.com/bca-ticket-comments/${fb_id}.json`);
            return data;
        }
    }

    // MISCELLANEOUS FUNCTIONS
    window.replyTrigger = () => {
        const comment_form = document.getElementById('bca_ticket_comment_form');
        event.target.parentNode.insertAdjacentElement('afterend', comment_form);
    }

    function scrollWhenExists(id) {
        const wait = setInterval(() => {
            const el = document.getElementById(id);

            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                clearInterval(wait);
            }
        }, 300);
    }

    function cachedData(key, data) {
        let exp = new Date().getTime();
        let str_data = JSON.stringify(data);

        localStorage.setItem(key, JSON.stringify({
            exp: exp,
            data: str_data
        })
        );
    }

    function retrievedData(key) {
        // check for pathname as key
        let data = localStorage.getItem(key);
        let base_data, new_data;

        if (!data)
            return;

        try {
            base_data = JSON.parse(data);
            new_data = JSON.parse(base_data.data);
        } catch (error) {
            console.log('error!');
            return;
        }

        // check for expiration time
        let now = new Date().getTime();
        if (now - JSON.parse(data).exp >= 120000) {
            localStorage.removeItem(key);
            return;
        }

        return new_data;
    }
})();
