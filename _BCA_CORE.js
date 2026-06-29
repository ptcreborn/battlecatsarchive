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

        // // check if the url is black listed
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
        let comments_data = await this.getCommentsData();
        await this.renderCommentChild(comments_data);
        this.updateCommentCount();
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
        await this.notifyRepliedUser(this.replyToTarget(), sp_id);

        // RENDERS AFTERWARDS
        await this.renderCommentChild(comments_data);
        this.scrollWhenExists(`${this.id_tag}${sp_id.id}`);
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
        let current_href = window.location.href;
        let payload = {
            "action": "replied",
            "url": `${BCA_Url.addURLParam(current_href, "target_comment", `${this.id_tag}${target_id}`)}`,
            "title": document.title,
            "thumb": user_prof_img
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
    },

    // this functions loads the comments from the url
    async getCommentsData() {
        let id = await this.getPathnameID();
        let { data, error } = await supabase.from('bca-comments').select('*, user_id(prof_img, username, email)').eq('bca_posts', id).order('id', { ascending: true });

        if (data?.length === 0 || error)
            return;

        return data;
    },
    async getFBCommentData(id, root) {
        let data = await FirebaseModule.fetchJSON(`${this.fb_comments}/${id}/${root}.json`);

        return data;
    },
    async renderCommentChild(comments_data) {
        // Descending
        const template = this.pQuery('comment-child-template');
        const parent = this.query('comments-parent-holder');

        if (!template || !parent || !comments_data)
            return;

        await Promise.all(comments_data.map(item => this.buildCommentChildUserData(template, parent, item)));
        await Promise.all(comments_data.map(item => this.buildCommentContents(parent, item)));
        comments_data.map(item => this.buildReplyEmbed(item));

        this.updateCommentCount();
    },
    async buildCommentChildUserData(template, parent, data) {
        let users_data = data.user_id;
        let clone = template.content.cloneNode(true).children[0];

        clone.id = `${this.id_tag}${data.id}`;
        this.wQuery(clone, 'bca-username').textContent = `${users_data.username}`;
        this.wQuery(clone, 'bca-profile').src = `${users_data.prof_img}`;
        this.wQuery(clone, 'bca-username').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${users_data.email}`;
        this.wQuery(clone, 'bca-reply-trigger').addEventListener('click', (e) => {
            this.appendCommentEditor(e.target);
        });

        parent.appendChild(clone);
    },
    async buildCommentContents(parent, data) {
        let comment = await this.getFBCommentData(data.fb_id, 'content');
        let attach = await this.getFBCommentData(data.fb_id, 'attach');
        this.wQuery(this.query(`${this.id_tag}${data.id}`), 'bca-message').textContent = `${comment?.val ? comment.val : comment}`;
        this.wQuery(this.query(`${this.id_tag}${data.id}`), 'bca-timestamp').textContent = `${moment(data.date).fromNow()}`;

        if (attach)
            this.buildCommentAttachments(parent, attach, data.id);
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
