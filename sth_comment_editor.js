async() => {
    await initFunctions([
        'supabase',
        'jQuery',
        'FirebaseModule'
    ]);

    let commentid = '';
    let replyid = '';
    let replytargetdummy;
    let isReplying = false;
    let user_id = '';
    let thread_id = '';
    let user_email = '';

    // initialize parent comment editor
    await initializeParentEditor();
    const parent_editor = getId('ptc_comment_container');
    const comment_editor = document.querySelector('#ptc_comment_editor');

    // check if the user is logged in
    if (!await checkIfUserLoggedIn())
        return;
    // if user is logged in, build the comment editor form
    if (!await buildCommentEditor())
        return;
    const editor = document.getElementById('ql-comment-editor');
    const actionText = document.getElementById('ql-comment-action');
    const postBtn = document.getElementById('postBtn');
    const cancelBtn = document.getElementById('cancelReplyBtn');

    // build Quill Editor
    await buildQuillEditor();

    async function initializeParentEditor() {
        let parent_html = document.createElement('div');
        parent_html.innerHTML = `<div id='comment_editor_footer_loader' class="ui segment"> <div class="ui active dimmer"> <div class="ui indeterminate text loader">Preparing Comment Editor</div> </div> <br/> <br/> <br/> </div> <div id='ptc_comment_editor' class='ui inverted message' style='display: none; padding: 0;'> </div>`;
        document.querySelector('#postBody').appendChild(parent_html);
    }

    async function checkIfUserLoggedIn() {
        let { data, error } = await supabase.auth.getSession();

        if (error) {
            window.alert(`Error encountered: ${error.message}`);
            return;
        }

        if (!data.session) {
            // user has been logged in right now...
            comment_editor.classList.add('ui', 'compact', 'floating', 'warning', 'message', 'inverted');
            comment_editor.innerHTML = `<h4>Please <a class="ui blue basic label" href="https://storehaccounts.blogspot.com/p/sign-in-with-storehaccounts.html"><i icon="blind icon"></i>sign in first</a> before commenting :)</h4>`;
            comment_editor.style.display = 'block';
            getId('comment_editor_footer_loader').remove();
            return;
        }

        user_email = data.session.user.email;

        // checking thread id too!
        thread_id = atob(new URL(window.location.href).searchParams.get('thread'));
        if (!thread_id) {
            window.alert(`Invalid thread id! Please reload the page.`);
            return;
        }

        return true;
    }

    async function buildCommentEditor() {
        // user has been logged in now...
        let userData = await supabase.from('users').select('id, username, prof_img').eq('email', `${user_email}`).single();

        if (userData.error) {
            window.alert(`Error detected: ${userData.error.message}`);
            return;
        }

        if (!userData.data) {
            window.alert(`User ${data.session.user.email} does not exists in the website.`);
            return;
        }

        userData = userData.data;
        user_id = userData.id;

        let tempo_comment_html = document.createElement('div');
        tempo_comment_html.innerHTML = `<div class='ui floating message'><div>Please be respectful! Add your <span class='ui inverted large black label' id='ql-comment-action'></span></div></div> <div id="ql-comment-editor" class='ui loading inverted attached segment'> </div> <div id="ql-toolbar-container" class='ui inverted attached segment' style='background: beige;'> <div class="ui blue image label"> <img src="${userData.prof_img}"> ${userData.username} </div> <span class="ql-formats"> <button class="ql-bold"></button> <button class="ql-italic"></button> <button class="ql-underline"></button> <button class="ql-strike"></button> </span> <span class="ql-formats"></span> <span class="ql-formats"> <button class="ql-list" value="ordered"></button> <button class="ql-list" value="bullet"></button> </span> <span class="ql-formats"> <button class="ql-link"></button> <button class="ql-image"></button> <button class="ql-video"></button> </span> <span class="ql-formats"> <button class="ql-clean"></button> </span> </div> <div class="ui inverted attached segment" style="min-height: 80px;"> <button id="postBtn" class="ui blue disabled inverted button" style="float: left;">Type something...</button>
<button id="cancelReplyBtn" style="display: none; float: right;" class="ui red inverted button">Cancel Reply</button> </div>`;
        getId('ptc_comment_editor').appendChild(tempo_comment_html);

        return true;
    }

    async function buildQuillEditor() {
        getId('ql-comment-action').innerText = "Comment";

        // Appending JQUERY for Quill
        (() => {
            let script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
            document.querySelector('body').appendChild(script);
        })();

        // setting up Quill Editor
        await initFunctions(['Quill']);
        const quill = new Quill('#ql-comment-editor', {
            modules: {
                syntax: false,
                toolbar: '#ql-toolbar-container'
            },
            theme: "snow"
        });

        comment_editor.style.display = 'block';
        getId('comment_editor_footer_loader').remove();

        quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
            let ops = []
            delta.ops.forEach(op => {
                if (op.insert && typeof op.insert === 'string') {
                    ops.push({
                        insert: op.insert
                    })
                }
            })
            delta.ops = ops
            return delta
        })

        const limit = 1000;
        const minlimit = 10;

        quill.on('text-change', function(delta, old, source) {
            if (source == 'user') {
                if (quill.getLength() > limit) {
                    quill.deleteText(limit, quill.getLength());
                } else if (quill.getLength() < minlimit) {
                    postBtn.innerText = "Type something...";
                    postBtn.classList.add('disabled');
                } else if (quill.getLength() > minlimit && quill.getLength() < limit) {
                    postBtn.classList.remove('disabled');
                    postBtn.innerText = `${actionText.innerText}`;
                }
            }
        });

        let editorForm = document.querySelector('#ql-comment-editor > div');
        while (!editorForm) {
            setTimeout(() => {
                editorForm = document.querySelector('#ql-comment-editor > div');
            }, 300);
        }
        editorForm.classList.add('ui', 'inverted', 'attached', 'segment');
        document.querySelector('#ql-comment-editor').classList.remove('loading');

        // load all button listeners
        loadListeners();
    }

    getId('postBtn').addEventListener('click', async() => {
        submitComment();
    });

    window.appendEditor = async(elem) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        let comment_target;
        let reply_target;
        replyid = undefined;

        if (elem.parentNode.id.includes('reply')) {
            replyid = elem.parentNode.id;
            reply_target = getId(replyid);

            while (elem.parentNode.id.includes('reply'))
                elem = elem.parentNode;
        }
        comment_target = getId(elem.parentNode.id);


        if (!comment_target || !comment_editor) {
            await initFunctions(['ModalCreator']);
            ModalCreator.popFunction(new Date().getTime(), "Please Login first before replying to a comment.",
                "You are not yet logged in. To share your ideas and thoughts, you can log in with google account or discord account for free. Do you want to log in?",
                'google icon', 'Login', () => {
                    window.location.href = 'https://storehaccounts.blogspot.com/p/sign-in-with-storehaccounts.html';
                });
            return;
        }

        if (reply_target) {
            replytargetdummy = reply_target.querySelector('[thread-comments] > p').cloneNode(true);
            replytargetdummy.innerHTML = `<span class="ui"><i class="reply icon"></i></span>${reply_target.querySelector('[thread-user-img]').outerHTML} ${reply_target.querySelector('[thread-user-name]').outerHTML} ${reply_target.querySelector('[thread-action]').outerHTML}... ${replytargetdummy.textContent.substring(0, 50)}...`;
            replytargetdummy.classList.add('ui', 'basic', 'label');
            replytargetdummy.style.cursor = 'pointer';
            replytargetdummy.setAttribute('onclick', `spotCommentFromCommentEditor("${replyid}")`);
            reply_target.appendChild(comment_editor);
        } else comment_target.appendChild(comment_editor);

        scrollIntoViewportByElement(comment_editor);

        commentid = comment_target.id;

        if (getId('ql-comment-action')) {
            getId('ql-comment-action').innerText = "Reply";
            getId('postBtn').innerText = "Reply";
        }
        if (getId('cancelReplyBtn'))
            getId('cancelReplyBtn').style.display = "block";

        isReplying = true;
    }

    async function submitComment() {
        // check the description
        // check the user_id
        // check the thread_id
        // check if the comment is a reply

        disableForm();

        let reply_id = null;

        await initFunctions(['FirebaseModule', `supabase`]);

        await uploadAllImages();
        let description = getContent();

        console.log(description);

        if (isReplying) {
            reply_id = document.querySelector('#ptc_comment_editor').parentNode.id; // this is the target comment that will be replied to.
            reply_id = reply_id.split('ptc-child-comment-')[1];
        }

        // writing the comment in the supabase
        let { data, error } = await supabase.from('sth_comments').insert({
            date: 'now()',
            description: description,
            user_id: user_id,
            thread_id: thread_id,
            reply_id: reply_id
        });

        if (error) {
            window.alert(`Error in creating a record in comments table.
                
                ${error.message}`);
            return;
        }

        window.location.reload();
    }

    async function uploadAllImages() {
        let allImgs = document.querySelector('#ql-comment-editor div').querySelectorAll('img');

        if (allImgs.length > 0)
            for (const items of allImgs) {
                let newsrc = await ImgurJS.uploadB64Img(dataURItoBlob(items.src));
                const imgUrl = 'https://i.imgur.com/';
                let filename = newsrc.link.split(imgUrl)[1].split('.')[0];
                let extension = newsrc.link.split(imgUrl)[1].split('.')[1];
                items.classList.add('unclicked');
                items.setAttribute('onclick', 'magnifyImage(this)');
                if (extension != 'gif')
                    items.src = `${imgUrl}${filename}s.${extension}`;
                else
                    items.src = `${imgUrl}${filename}.${extension}`;
            }
    }

    function loadListeners() {
        cancelBtn.addEventListener('click', async() => {
            parent_editor.parentNode.insertBefore(comment_editor, parent_editor.nextSibling);
            actionText.innerText = "Comment";
            postBtn.innerText = "Comment";
            cancelReplyBtn.style.display = "none";
            isReplying = false;
        });
    }

    async function scrollIntoViewportByElement(element) {
        element.scrollIntoView({
            block: "center",
            behavior: "smooth"
        });
    }

    function dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ia], { type: mimeString });
    }

    function getContent() {
        return document.querySelector('#ql-comment-editor div').innerHTML.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '');
    }

    function getId(id) {
        return document.getElementById(id);
    }

    function disableForm() {
        postBtn.classList.add('disabled');
        postBtn.innerHTML = `<i class="loading spinner icon"></i>${actionText.innerText}ing...`;
        editor.querySelector('div').setAttribute('contenteditable', false);
        parent_editor.classList.add('disabled');
        cancelBtn.classList.add('disabled');
    }

}
