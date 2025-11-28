// November 11, 2025

(async() => {
    let user_id;
    let win_title = document.title;

    window.submit = async() => {
        await createComment();
    }

    if(!document.querySelector('#file_attachments') || !document.getElementById('btn_uploadImage')) 
         return;

    await initFunctions(['FirebaseModule', 'supabase', 'ImgurJS']);
    await commentEditorSystem();

    ImgurJS.uploadMultipleImgs('file_attachments', 'img_attachments',
        () => {
            document.getElementById('btn_uploadImage').innerHTML = `<img src="https://png.pngtree.com/png-vector/20190508/ourmid/pngtree-upload-cloud-vector-icon-png-image_1027251.jpg">Uploading...`;
            document.getElementById('btn_uploadImage').style = 'opacity: 0.7; pointer-events: none';
            document.title = "Uploading image...";
        }, () => {
            document.getElementById('btn_uploadImage').innerHTML = `<img src="https://png.pngtree.com/png-vector/20190508/ourmid/pngtree-upload-cloud-vector-icon-png-image_1027251.jpg">Upload Image`;
            document.getElementById('btn_uploadImage').style = 'opacity: 1; pointer-events: auto';
            document.title = win_title;
        }, () => console.log("Error!"));

    // Image Upload Function
    document.getElementById('btn_uploadImage').addEventListener('click', () => {
        document.querySelector('#file_attachments').click();
    });

    // functions //
    async function createComment() {
        disableForm();
        let result = await patchUserID();
        if (!result)
            return;
        let comment_form = document.querySelector('#comment_form');
        let content = document.querySelector('#comment_form textarea').value;
        let comment_key = new Date().getTime();
        let uploaded_imgs = document.querySelectorAll('#img_attachments img');
        let imgs_html = '';
        let reply_data = ''; // stored as base64 encoded html
        let imgs = [];
        uploaded_imgs.forEach(item => {
            imgs.push(item.src);
            imgs_html += item.outerHTML;
        });
        // Check for reply-data attribute from the comment-form element. Then store!
        if (comment_form.hasAttribute('reply-data'))
            reply_data = comment_form.getAttribute('reply-data');
        // Creating comment record in the FBDB
        await FirebaseModule.patch(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments.json`, JSON.stringify({
            [comment_key]: {
                content: {
                    val: content,
                    attachments: imgs,
                    reply_data: reply_data
                },
                auth: user_id[0].toString()
            }
        }));
        // Creating personal record of the comment for the user in FBDB
        await FirebaseModule.patch(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_users/${user_id[0]}.json`, JSON.stringify({
            [new Date().getTime()]: {
                fb_id: comment_key
            }
        }));
        // Creating a record in the SBDB
        let { data, error } = await supabase.from('bca-comments').insert({
            date: 'now()',
            fb_id: comment_key,
            user_id: user_id[0],
            bca_posts: await createBCAUrlRecord()
        });
        if (error) {
            window.alert(error.message);
            return;
        }
        // Success comment!
        // Append latest comment to the parent comment container instead of reloading the page.
        document.getElementById('parent_container_comment').innerHTML += `
            <div class="comment-child" style="background: beige;">
                <img style="width: 64px !important; height: 64px !important; object-fit: cover;" src="${document.querySelector('#comment_form button img').src}">
                <div style="display:block;padding-left:5px;">
                    <span>Your comment has been submitted.</span>
                    <p style="background: white;border: 1px solid seagreen;padding: 0 5px;">${content}</p>
                    <div style="margin: 10px;">${imgs_html}</div>
                </div>
            </div>`;

        await restoreComment();
    }

    async function createBCAUrlRecord() {
        let url = new URL(window.location.href);
        // supabase functions takes here
        let key = await checkIfURLinSPDB();
        if (!key) {
            let { data, error } = await supabase.from('bca-website-posts').insert({
                date: 'now()',
                url: url.pathname
            }).select('id');
            if (error) {
                window.alert("Error in creating record: " + error.message);
                return;
            }
            key = data[0].id;
        }
        return key;
    }

    async function checkIfURLinSPDB() {
        let url = new URL(window.location.href);
        let { data, error } = await supabase.from('bca-website-posts').select('id').eq(
            'url', url.pathname
        );
        if (error) {
            window.alert("Error has been encountered! " + error.message);
            return;
        }
        if (data.length > 0) return data[0].id;
        else return;
    }

    async function patchUserID() {
        // user_id will be filled with value from function getUserInfo()
        if (!user_id) return;
        // index 0: user_id
        // index 1: user_email
        await FirebaseModule.patch(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_users.json`, JSON.stringify({
            [user_id[0]]: new Date().getTime()
        }));
        return true;
    }

    async function commentEditorSystem() {
        let user_info = await getUserInfo();
        if (!user_info) return;

        async function getUserInfo() {
            user_id = await checkIfUserOnline();
            // index 0: user_id
            // index 1: user_email

            if (!user_id) return;

            let { data, error } = await supabase.from('users').select('prof_img, username').eq('email', user_id[1]).single();

            if (error) {
                window.alert(error.message);
                return;
            }

            const comment_username = document.querySelector('#comment_form span');
            const comment_avatar = document.querySelector('#comment_form img');

            comment_username.innerText = data.username;
            comment_avatar.src = data.prof_img;

            if(document.querySelector('#comment_form')) {                
                document.querySelector('#comment_form').classList.remove('inactive-form');
                document.querySelector('#comment_form').classList.add('active-form');
            }


            return user_id;
        }

        async function checkIfUserOnline() {
            let { data, error } = await supabase.auth.getSession();
            if (error) {
                window.alert("Error occured! " + error.message);
                return;
            }
            if (!data.session) {
                if(document.querySelector('#comment_form')) {
                    document.querySelector('#comment_form').classList.remove('inactive-form');
                    document.querySelector('#comment_form').classList.add('active-form');
                    document.getElementById('comment_form').innerHTML = `<a href='https://battlecatsarchive.blogspot.com/p/signin-to-bca.html' class="main-button button" style="width: 100%; margin: 5px;">Login First before commenting.
    </a>`;
                    document.getElementById('comment_form').setAttribute('login-status', 'failed');
                }
                return;
            }
            async function getUserIDFromSPDB(email) {
                let { data, error } = await supabase.from('users').select('id').eq('email', email);
                if (error) {
                    window.alert("Error in getting user-email. " + error.message);
                    return;
                }
                if (data.length == 0) {
                    window.alert("Empty records returned! " + data);
                    return;
                }
                return data[0].id;
            }
            let user_id = await getUserIDFromSPDB(data.session.user.email);
            return [user_id, data.session.user.email];
        }
    }

    function disableForm() {
        // this function will temporarily disable the form
        // will change the title to commenting
        // change the button text to commenting.
        document.querySelector('#comment_form').style = 'pointer-events: none; opacity: 0.5;';
    }

    async function scrollToElemID(id) {
        await sleep(100);
        document.getElementById(id).scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'center',
        });
        document.getElementById(id).style.background = `beige`;
        await sleep(1500);
        document.getElementById(id).style.background = `white`;
    }
    async function restoreCommentForm() {
        document.getElementById('reset-comment-form').style.display = 'none';
        document.querySelector('#comment_form textarea').placeholder = `Type comment here...`;
        document.querySelector('#comment_form textarea').value = ``;
        document.querySelector('#comment_form').style = 'pointer-events: auto; opacity: 1;';
        document.getElementById('parent_container_comment').parentNode.insertBefore(document.querySelector('#comment_form'), document.getElementById('parent_container_comment').nextSibling);
        document.getElementById('img_attachments').innerHTML = '';
        document.querySelector('#comment_form').removeAttribute('reply-data');
        document.getElementById('cancel-reply-btn').style.display = 'none';
        await scrollToElemID('comment_form');
    }

    window.restoreComment = async() => {
        await restoreCommentForm();
    }
})();
