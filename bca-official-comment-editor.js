(async() => {
    let comment_html = `
    <div class="bca-comment-editor">
        <div class="bca-toolbar">
            <button onclick="execCmd('bold')" title="Bold"><b>B</b></button>
            <button onclick="execCmd('italic')" title="Italic"><i>I</i></button>
            <button onclick="execCmd('createLink')" title="Link">🔗</button>            
            <button onclick="document.querySelector('.bca-file-input').click()">🖼️</button>
            <input type="file" class="bca-file-input" accept=".jpg, .jpeg, .png, .gif, .bmp, image/jpeg, image/png, image/gif, image/bmp" style="display:none" onchange="handleFileUpload(this.files)">            
            <button onclick="addYoutubeVideo()">🎥 </button>            
            <h4 id='bca_action_status' style="margin-left: auto; text-align: right;">Add a comment</h4>
        </div>

        <div class="bca-editor" contenteditable="true" placeholder="Discuss something with this topic..."></div>

        <div class="bca-footer">
            <div class="bca-user-info">
                <span id="location-text">Detecting location...</span>
                <img id="user-flag" src="" width="25" style="display:none;" alt="Flag">
            </div>
            
            <div class="bca-actions">
                <button class="bca-submit-btn" onclick="submitComment()">Post Comment</button>
            </div>
        </div>
    </div>`;

    let signin_html = `<div class="bca-comment-section">
  <div class="bca-lock-container">
    <div class="bca-is-locked">
      
      <div class="bca-lock-content">
        <div class="bca-lock-icon">🔒</div>
        
        <h2 class="bca-lock-title">COMMUNICATION BLOCKED</h2>
        <p class="bca-lock-text">
          "The Cat God requires identification before you can transmit data to the archive."
        </p>
        
        <div class="bca-lock-actions">
          <a href='https://battlecatsarchive.blogspot.com/p/signin-to-bca.html' class="bca-btn-game bca-btn-confirm" id="bca-login-trigger">
            LOGIN / SIGN UP
          </a>
        </div>
      </div>

    </div>
  </div>
</div>`;

    window.requestIdleCallback(initializeComment);

    let user_email = '';

    async function initializeComment() {
        appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
        appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/b382b6842ffbc853111f02cc3f94617f862ed15a/bca-comment-editor.css');

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

            if (command === 'createLink') {
                let url = prompt("Enter the URL:", "https://");
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, null);
            }
            editor.focus();
        }

        // 3. Character Counter & Editor Logic
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
            disable(submitBtn, 'Posting...');
            disable(editor, null);

            // Get the content of the comments
            let content = gatherCommentInfo();

            if (!content) {
                window.alert(`Please type anything before submitting a comment. Thank you!`);
                enable(submitBtn, 'Post Comment');
                enable(editor, null);
                return;
            }

            await initFunctions(['supabase', 'FirebaseModule']);

            // First check if the url existing in the "bca-website-posts"
            // if does not exist then store
            let website_post_id = await upsertUrlSPDB();
            if (!website_post_id) {
                enable(submitBtn, 'Post Comment');
                enable(editor, null);
                return;
            }

            // Second create the comment, first gather all specific elements from the comment such as useremail or userid.
            let user_id = await gatherUserInfo();
            if (!user_id) {
                enable(submitBtn, 'Post Comment');
                enable(editor, null);
                return;
            }

            // Create a record to Firebase
            let fbid = await postCommentToFirebase(user_id, content);

            // Create a record to Supabase
            await postCommentToSupabase(fbid, website_post_id, user_id);

            // Add user XP
            await addUserXP(1);

            window.location.reload();
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
                'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen']
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

        async function postCommentToSupabase(fbid, website_post_id, user_id) {
            // Post to supabase
            let target_ids = getTargetCommentIDS();
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
                window.alert(`Error message: ${error.message}`);
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
                }
            }
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


        function getTargetCommentIDS() {
            // IF THE NEXT ELEMENT has root id
            // COPY the root it and add it to the new reply to be comment
            const editor = document.getElementById('bca_comment_editor');
            let previousElem = editor.previousElementSibling;

            let root_id = previousElem.dataset.rootid || (previousElem.id.includes('bca-comment-') ? previousElem.id : null);
            let parent_id = (previousElem.id.includes('bca-comment-') ? previousElem.id : null);

            return {
                root: root_id,
                parent: parent_id
            }
        }
    }

})();
