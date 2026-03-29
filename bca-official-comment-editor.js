(async() => {
    let comment_html_old = `
 <div class="bca-comment-editor">
    <div class="bca-toolbar">
        <h4
            id="bca_action_status"
            style="text-align: left;flex: 1 0 100px;margin: 0;min-width: 100px;">Add
            a comment</h4>

        <input type="file" class="bca-file-input"
            accept=".jpg, .jpeg, .png, .gif, .bmp, image/jpeg, image/png, image/gif, image/bmp"
            style="display:none" onchange="handleFileUpload(this.files)">

    </div>

    <div class="bca-editor" contenteditable="true"
        placeholder="Discuss something with this topic..."></div>
    <div style="
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    border: 1px solid #9c9c9c;
    padding: 5px 10px;
    background: #dcdcdc;
">
        <button onclick="execCmd('info')" title="Info"><b>ℹ️Info</b></button>
        <button onclick="execCmd('success')"
            title="Success"><b>✅Success</b></button>
        <button onclick="execCmd('warning')"
            title="Warning"><b>⚠️Warning</b></button>
        <button onclick="execCmd('error')" title="Error"><b>❌Error</b></button>
        <button onclick="execCmd('code')" title="Code"><b>💻Code</b></button>
        <button onclick="execCmd('reset')" title="Code"><b>🚫Reset</b></button>
        <button onclick="execCmd('createLink')"
            title="Link">🔗Link</button><button
            onclick="document.querySelector('.bca-file-input').click()">🖼️Image</button><button
            onclick="addYoutubeVideo()">🎥Youtube</button></div>
    <div class="bca-footer">
        <div class="bca-user-info">
            <span id="location-text">Posting from: </span>
            <img id="user-flag" src="https://flagcdn.com/w40/ph.png" width="25"
                style="display: inline-block;" alt="Flag">
        </div>

        <div class="bca-actions" style="
    flex: 1 0 150px;
    width: 100%;
">
            <button class="bca-submit-btn" onclick="submitComment()">Post
                Comment</button>
        </div>
    </div>
</div>`;

    let comment_html = `
 <div class="bca-comment-editor">
    <div class="bca-toolbar">
        <h4
            id="bca_action_status"
            style="text-align: left;flex: 1 0 100px;margin: 0;min-width: 100px;">Add
            a comment</h4>

        <input type="file" class="bca-file-input"
            accept=".jpg, .jpeg, .png, .gif, .bmp, image/jpeg, image/png, image/gif, image/bmp"
            style="display:none" onchange="handleFileUpload(this.files)">

    </div>

    <div class="bca-editor" contenteditable="true"
        placeholder="Discuss something with this topic..."></div>
    <div class="bca-formattings-container">
        <button onclick="execCmd('createLink')"
            title="Link">🔗Link</button><button
            onclick="document.querySelector('.bca-file-input').click()">🖼️Image</button><button
            onclick="addYoutubeVideo()">🎥Youtube</button>
            <button onclick="execCmd('reset')" title="Code"><b>🚫Reset</b></button>
            </div>
    <div class="bca-footer">
        <div class="bca-user-info">
            <span id="location-text">Posting from: </span>
            <img id="user-flag" src="https://flagcdn.com/w40/ph.png" width="25"
                style="display: inline-block;" alt="Flag">
        </div>

        <div class="bca-actions" style="
    flex: 1 0 150px;
    width: 100%;
">
            <button class="bca-submit-btn" onclick="submitComment()">Post
                Comment</button>
        </div>
    </div>
</div>`;

    window.requestIdleCallback(initializeComment);

    let user_email = '';

    async function initializeComment() {
        appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
        appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/3b4ec0fd70bcfe7d39b8fc09672e9d0bbd73ed54/bca-comment-editor.css');

        // Check session first
        user_email = await checkSession();
        let fragment = document.createDocumentFragment();
        let temp_div = document.createElement('div');

        if (!user_email) {
            temp_div.innerHTML = signin_html;
            fragment.appendChild(temp_div);
            document.getElementById('bca_comment_editor').appendChild(fragment);
            return;
        }


        temp_div.innerHTML = comment_html;
        fragment.appendChild(temp_div);
        document.getElementById('bca_comment_editor').appendChild(fragment);

        // 1. Core Editor Commands
        window.execCmd = (command) => {
            const editor = document.querySelector('.bca-editor');

            document.execCommand('defaultParagraphSeparator', false, 'code');

            switch (command) {
                case 'createLink':
                    {
                        let url = prompt("Enter the URL:", "https://");
                        if (url) document.execCommand(command, false, url);
                    }
                    break;
                case 'code':
                    {
                        applyCustomCodeBlock('code', 'code-box');
                    }
                    break;
                case 'warning':
                    {
                        applyCustomCodeBlock('div', 'alert-message warning');
                    }
                    break;
                case 'info':
                    {
                        applyCustomCodeBlock('div', 'alert-message passed');
                    }
                    break;
                case 'error':
                    {
                        applyCustomCodeBlock('div', 'alert-message error');
                    }
                    break;
                case 'success':
                    {
                        applyCustomCodeBlock('div', 'alert-message success');
                    }
                    break;
                case 'reset':
                    {
                        let clear = window.confirm('Do you want to clear the editor?');
                        if (clear) editor.innerHTML = '';
                    }
                    break;
            }
            editor.focus();
        }

        function applyCustomCodeBlock(tag, className) {
            const selection = window.getSelection();

            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const selectedContent = range.toString();

            // Create your custom HTML structure
            // You can add your 'Menu Cream' background or specific font here
            const customHtml = `<${tag} class="${className}" ><p>${selectedContent || ' '}</p></${tag}><div><br/></div>`;

            // Use insertHTML to inject the custom div
            document.execCommand('insertHTML', false, customHtml);
        }

        // Example Usage:
        // applyCustomCodeBlock('comment-code-block');

        // 3. Character Counter & Editor Logic
        const main_editor = document.getElementById('bca_comment_editor');
        const editor = document.querySelector('.bca-editor');
        const submitBtn = document.querySelector('.bca-submit-btn');

        // 4. Timezone to Country Flag Logic
        window.setFlag = () => {
            const tzMap = {
                'Asia/Manila': 'ph',
                'America/New_York': 'us',
                'Europe/London': 'gb',
                'Asia/Tokyo': 'jp',
                'Asia/Seoul': 'kr'
            };
            const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const countryCode = tzMap[userTz] || null;
            const flagImg = document.getElementById('user-flag'); // Assuming this ID stays for the <img>
            const locText = document.getElementById('location-text'); // Assuming this ID stays for the text

            if (countryCode && flagImg && locText) {
                flagImg.src = `https://flagcdn.com/w40/${countryCode}.png`;
                flagImg.style.display = 'inline-block';
                locText.innerText = `Posting from: `;
            } else if (locText) {
                locText.innerText = `System Timezone: ${userTz}`;
            }
        }

        // 5. Submit Function
        window.submitComment = async() => {
            await processComment();
        }

        // 6. Selection Handling
        let savedRange = null;

        function saveSelection() {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                savedRange = sel.getRangeAt(0);
            }
        }

        editor.addEventListener('mouseup', saveSelection);
        editor.addEventListener('keyup', saveSelection);
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            // Get only the plain text from the clipboard
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            // Insert it at the cursor
            document.execCommand('insertText', false, text);
        });

        function restoreSelection() {
            const sel = window.getSelection();
            if (savedRange) {
                sel.removeAllRanges();
                sel.addRange(savedRange);
            }

            if (document.activeElement !== editor) {
                editor.focus();
            }
        }

        // 7. Image Upload Logic
        window.handleFileUpload = async function(files) {
            if (!files.length) return;

            restoreSelection();

            const file = files[0];
            const formData = new FormData();
            formData.append('image', file);

            const loadingId = "img-" + new Date().getTime();
            insertHTMLAtCursor(`<img class='bca-img-attachment' loading='lazy' alt='upload-img-${loadingId}' id="${loadingId}" src="https://i.imgur.com/vGKqN5O.gif" style="display: block; width: 90%; box-shadow: 1px 1px 5px 1px #909090;">`);

            try {
                const response = await fetch('https://api.imgur.com/3/image', {
                    method: 'POST',
                    headers: { Authorization: `Client-ID 33f63d5902f27e5` },
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    const imgElement = document.getElementById(loadingId);
                    imgElement.src = result.data.link;
                    imgElement.style.width = "auto";
                    imgElement.addEventListener('click', () => window.location.href = `https://battlecatsarchive.blogspot.com/p/image-viewer.html?view=${btoa(result.data.link)}`);
                }
            } catch (err) {
                console.error("Upload error:", err);
                const loader = document.getElementById(loadingId);
                if (loader) loader.remove();
            }
        }

        // 8. HTML Insertion Helper
        window.insertHTMLAtCursor = function(html) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();

                const el = document.createElement("div");
                el.innerHTML = html + '<br>&#8203;';
                const frag = document.createDocumentFragment();
                let node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);

                if (lastNode) {
                    const newRange = range.cloneRange();
                    newRange.setStartAfter(lastNode);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                    savedRange = newRange;
                }
            }
        }

        // 9. YouTube Embed Logic
        window.addYoutubeVideo = function() {
            const url = prompt("Paste the YouTube URL (e.g., https://youtu.be/...):");
            if (!url) return;

            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);

            if (match && match[2].length === 11) {
                const videoId = match[2];

                // Use the new bca-video-container class
                const embedHtml = `
            <div class="bca-video-container" contenteditable="false" style="margin: 10px 0;">
                <iframe 
                    width="100%" 
                    height="315" 
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
                <br>&#8203;
            </div>`;

                restoreSelection();
                insertHTMLAtCursor(embedHtml);
            } else {
                alert("Invalid YouTube URL. Please try again.");
            }
        }

        // 10. Clear All / Delete Logic
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const selection = window.getSelection();

                if (selection.toString().length >= editor.innerText.length && editor.innerText.length > 0) {
                    e.preventDefault();
                    editor.innerHTML = '';

                    const range = document.createRange();
                    range.selectNodeContents(editor);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        });

        setFlag();

        async function processComment() {
            // ASAP get the ids of parent and root                        
            let target_ids = {
                parent: main_editor.dataset.parentid,
                root: main_editor.dataset.rootid
            }

            console.log('my ids: ', target_ids);

            disable(submitBtn, 'Posting...');
            disable(main_editor, null);

            // Get the content of the comments
            let content = gatherCommentInfo();

            if (!content) {
                window.alert(`Please type anything before submitting a comment. Thank you!`);
                enable(submitBtn, 'Post Comment');
                enable(main_editor, null);
                return;
            }

            await initFunctions(['supabase', 'FirebaseModule']);

            // First check if the url existing in the "bca-website-posts"
            // if does not exist then store
            let website_post_id = await upsertUrlSPDB();
            if (!website_post_id) {
                enable(submitBtn, 'Post Comment');
                enable(main_editor, null);
                return;
            }

            // Second create the comment, first gather all specific elements from the comment such as useremail or userid.
            let user_id = await gatherUserInfo();
            if (!user_id) {
                enable(submitBtn, 'Post Comment');
                enable(main_editor, null);
                return;
            }

            // Create a record to Firebase
            let fbid = await postCommentToFirebase(user_id, content);

            // Create a record to Supabase
            let res = await postCommentToSupabase(fbid, website_post_id, user_id, target_ids);
            if (!res)
                return;

            // Add user XP
            await addUserXP(1);

            // Add newly added comment to the thread
            appendComment(target_ids);
            editor.innerHTML = ``;
            enable(main_editor, null);

            // Cooldown the comment editor for 5 seconds
            await cooldown();

            // Enable the editor again.
            enable(submitBtn, 'Post Comment');
        }

        async function upsertUrlSPDB() {
            let pathname = new URL(window.location.href).pathname;

            let { data, error } = await supabase.from('bca-website-posts').upsert({
                date: 'now()',
                url: pathname
            }, {
                onConflict: 'url'
            }).select().single();

            if (error) {
                window.alert(`Error in adding new url in spdb: ${error.message}`);
                return;
            }

            // returns ID
            return data.id;
        }

        async function gatherUserInfo() {
            if (!user_email) {
                window.alert(`User email is empty, aborting process.`);
                return;
            }

            // Get user id based on the user email
            let { data, error } = await supabase.from('users').select('id').eq('email', user_email).single();

            if (error) {
                window.alert(`Error in getting user id: ${error.message}`);
                return;
            }

            // Register the user in the Firebase
            await FirebaseModule.patch(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_users.json`, JSON.stringify({
                [data.id]: new Date().getTime()
            }));

            return data.id;
        }

        function gatherCommentInfo() {
            const editor = document.querySelector('.bca-editor');
            const content = editor.innerHTML;
            const plainText = editor.innerText.trim();

            if (plainText === "" || content.length == 0)
                return;

            return sanitizeBCA(content);
        }

        function sanitizeBCA(htmlInput) {
            if (!htmlInput) return "";

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlInput.trim();

            // 1. The "Keepers" (White-list)
            // Added 'br' so your line breaks don't vanish!
            const allowedTags = ['b', 'strong', 'i', 'em', 'a', 'img', 'iframe', 'br', 'div'];

            // 2. The "Functional Attributes"
            const allowedAttrs = {
                'a': ['href', 'target'],
                'img': ['src', 'alt', 'width', 'height', 'class', 'loading'],
                'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
                'div': ['class'],
                'pre': ['class']
            };

            const cleanNode = (node) => {
                const children = Array.from(node.childNodes);

                children.forEach(child => {
                    // Check if it's an Element (nodeType 1)
                    if (child.nodeType === 1) {
                        const tag = child.tagName.toLowerCase();

                        if (allowedTags.includes(tag)) {
                            // --- STEP A: Keep the Tag, but Strip Attributes ---
                            const attrs = Array.from(child.attributes);
                            const safe = allowedAttrs[tag] || [];

                            attrs.forEach(attr => {
                                if (!safe.includes(attr.name)) {
                                    child.removeAttribute(attr.name);
                                }
                            });

                            // --- STEP B: Enforce YouTube Embed Only ---
                            if (tag === 'iframe') {
                                const src = child.getAttribute('src') || '';
                                if (!src.includes('youtube.com/embed/')) {
                                    child.remove();
                                    return;
                                }
                            }

                            // Clean deeper
                            cleanNode(child);
                        } else {
                            // --- STEP C: Melt the Tag (Keep text, delete wrapper) ---
                            cleanNode(child);
                            child.replaceWith(...child.childNodes);
                        }
                    }
                });
            };

            // Run the recursion
            cleanNode(tempDiv);
            trimContentEditable(tempDiv);

            // 3. Get innerHTML and perform Final Polish
            let result = tempDiv.innerHTML;

            if (result.length > 0) {
                // 1. Remove Zero-Width Spaces (Ghost characters)
                const divBreakPattern = /(<div><br\s*\/?>\s*<\/div>[\s\n]*){2,}/gi;
                result = result.replace(divBreakPattern, '<div><br/></div>');
                result = result.replace(/\n/g, '<br/>');
                result = result.replace(/\u200B/g, ''); // Clear ghosts
                result = result.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>'); // Collapse Enters
            }

            return result;
        }

        function trimContentEditable(el) {
            while (el.lastChild) {
                const last = el.lastChild;

                // If it's a <br>, remove it
                if (last.nodeName === 'BR') {
                    el.removeChild(last);
                    continue;
                }

                // If it's an empty div like <div><br></div> or just empty
                if (
                    last.nodeName === 'DIV' &&
                    (last.innerHTML.trim() === '' || last.innerHTML.trim() === '<br>')
                ) {
                    el.removeChild(last);
                    continue;
                }

                break; // stop when last node has real content
            }
        }

        async function postCommentToFirebase(user_id, content) {
            // Post to Firebase first and get the fbid
            let fbid = new Date().getTime();

            await FirebaseModule.patch(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments/${fbid}.json`,
                JSON.stringify({
                    auth: `${user_id}`,
                    content: content
                })
            )

            // check if record exists!
            let record = await FirebaseModule.fetchJSON(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments/${fbid}/content.json`);

            if (!record) {
                window.alert('Failed to write comment, please try again!');
                window.location.reload();
            }

            return fbid;
        }

        async function postCommentToSupabase(fbid, website_post_id, user_id, target_ids) {
            // Post to supabase
            let payload = {};

            // check if the comment is reply state.
            if (target_ids.parent)
                payload = {
                    date: 'now()',
                    fb_id: fbid,
                    bca_posts: website_post_id,
                    user_id: user_id,
                    parent_id: target_ids.parent.replace('bca-comment-', ''),
                    root_id: target_ids.root.replace('bca-comment-', '')
                }
            else {
                payload = {
                    date: 'now()',
                    fb_id: fbid,
                    bca_posts: website_post_id,
                    user_id: user_id,
                    parent_id: target_ids.parent
                }
            }

            let { data, error } = await supabase.from('bca-comments').insert(payload).select().single();

            if (error) {
                window.alert(`Error postCommentToSupabase: ${error.message}`);
                return;
            }

            if (!target_ids.parent && data) {
                // this adds the root_id same as comments_id
                let update_data = await supabase
                    .from('bca-comments')
                    .update({
                        root_id: data.id
                    }).eq('id', data.id);

                if (update_data.error) {
                    window.alert(`Update error: ${update_data.error.message}`);
                    return;
                } else
                    return true;
            } else
                return true;
        }

        async function checkSession() {
            let { data, error } = await supabase.auth.getSession();

            if (error) {
                window.alert(`Error in session. ${error.message}`);
                return;
            }

            if (!data.session)
                return;

            return data.session.user.email;
        }

        async function addUserXP(xp) {
            // must be online
            // must complete the following task
            // must finish the assignment

            let {
                data,
                error
            } = await supabase.auth.getSession();

            if (error)
                return;

            if (!data.session)
                return;

            let email = data.session.user.email;

            await supabase.rpc('add_xp_to_user', {
                user_email: email,
                xp_to_add: xp
            });
        }

        function disable(elem, str) {
            elem.style.pointerEvents = 'none';
            elem.style.opacity = '0.7';

            if (str)
                elem.textContent = str;
        }

        function enable(elem, str) {
            elem.style.pointerEvents = 'auto';
            elem.style.opacity = '1';

            if (str)
                elem.textContent = str;
        }

        async function cooldown() {
            const editor = document.getElementById('bca_comment_editor');
            let max_count = 10;

            while (max_count > -1) {
                editor.querySelector('.bca-submit-btn').textContent = `Cooldown in ${max_count}...`;
                max_count--;
                await sleep(1000);
            }
        }

        function appendComment(target_ids) {
            let clone = document.querySelector('[comment-wrapper-template]').content.cloneNode(true).children[0];
            let parent_editor;

            // select the parent container to be appended to.
            // if it has parent_id, then append next to the parent_id
            // if it has no parent_id then append next to comment button

            if(target_ids.parent)
                parent_editor = document.getElementById(target_ids.parent);
            else 
                parent_editor = document.getElementById('trigger_comment_editor');

            console.log(parent_editor);

            // get user info from localstorage
            let user_data = localStorage.getItem('user');
            user_data = JSON.parse(atob(user_data));

            if (!user_data)
                window.location.reload();

            let user_email = user_data.email;

            clone.querySelector('.bca-desc-avatar').src = `https://i.imgur.com/XJaJkyM.gif`;
            clone.querySelector('.bca-desc-name').textContent = user_email;
            clone.querySelector('.bca-desc-rarity').textContent = `You've earned 1 XP.`;
            clone.querySelector('.bca-desc-rank').textContent = `Your comment has been added.`;
            clone.querySelector('.bca-desc-stats').remove();
            clone.querySelector('.bca-btn-reply').remove();
            clone.querySelector('.bca-btn-replies').remove();
            clone.querySelector('.bca-btn-timeago').textContent = `${new Date()}`;
            clone.querySelector('.bca-desc-header').style.background = `beige`;
            clone.querySelector('.bca-desc-name').style.color = `#252525`;
            clone.querySelector('.bca-desc-rarity').style.color = `#252525`;
            clone.querySelector('.bca-desc-rank').style.color = `#252525`;
            clone.querySelector('.bca-desc-text').innerHTML = editor.innerHTML;

            parent_editor.after(clone);
        }
    }

})();
