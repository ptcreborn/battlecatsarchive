
// March 3, 2026
// COMMENT VIEWER

(async () => {

    let total_page = 0;
    let current_page = 1;
    let isFetching = false;
    let hasMoreComments = false;

    initialize();

    async function initialize() {
        appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');
        await createCommentSkeleton(current_page);
        const url = new URL(window.location.href).pathname;
        const load_more_btn = document.getElementById('trigger_load_comments');
        let all_comment_counts = await getCommentCount(url);
        total_page = Math.ceil((all_comment_counts || 0) / 10);

        // add the comment count to webpage.
        let comment_top_count_snippet = document.querySelector('.comment-bubble');
        let comment_bottom_count_snippet = document.querySelector('.comment-contentl p');

        comment_top_count_snippet.textContent = `${all_comment_counts == 0 ? `` : all_comment_counts}`;
        comment_bottom_count_snippet.textContent = `${all_comment_counts == 0 ? `` : `${all_comment_counts} ${all_comment_counts > 1 ? `comments` : `comment`}`}`;

        load_more_btn.textContent = `You've reached the end`;
        load_more_btn.style.opacity = `0.7`;

        hasMoreComments = total_page > 1;

        if (!total_page || total_page == 0) {
            load_more_btn.style.opacity = '0.7';
            load_more_btn.textContent = "Be the first to comment!";
            return;
        }
        if (hasMoreComments && !isFetching) {
            load_more_btn.addEventListener('click', () => {
                triggerLoadMore();
            });
            load_more_btn.style.opacity = `1`;
            load_more_btn.textContent = `Load Comments (${current_page}/${total_page})`;
            isFetching = true;
        }
    }

    async function triggerLoadMore() {
        // activate button load more comments
        // increment the counter as load comment button is triggered
        let trigger_btn = document.getElementById('trigger_load_comments');
        trigger_btn.style.display = 'block';
        trigger_btn.textContent = "Loading more comments...";
        trigger_btn.style.opacity = "0.7";
        trigger_btn.style.pointerEvents = "none";

        await sleep(1000);
        isFetching = true;

        current_page++;
        await createCommentSkeleton(current_page);

        hasMoreComments = current_page < total_page;

        await sleep(1000);
        isFetching = false;
        if (!hasMoreComments) {
            trigger_btn.style.opacity = '0.7';
            trigger_btn.textContent = "You've reached the end.";
        } else {
            trigger_btn.style.opacity = "1";
            trigger_btn.style.pointerEvents = "auto";
            trigger_btn.textContent = `Load Comments (${current_page}/${total_page})`;
        }
    }

    async function createCommentSkeleton(page_number) {
        let sp_data = await getDataSupabase(page_number);
        const data = await fetchFBContents(sp_data);
        const payload = data.payload;

        const container = document.querySelector('.bca-comment-section');
        const fragment = document.createDocumentFragment();

        await initFunctions(['moment']);

        payload.forEach(item => {
            const template = document.querySelector('[comment-wrapper-template]');

            let clone = template.content.cloneNode(true).children[0];

            clone.id = `bca-comment-${item.comment_id}`;

            clone.querySelector('.bca-desc-avatar').src = item.prof_img;
            clone.querySelector('.bca-desc-name').textContent = item.username;
            clone.querySelector('.bca-desc-avatar-wrap').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}`;
            clone.querySelector('.bca-desc-rank').textContent = item.rank_name;
            clone.querySelector('.bca-desc-rarity').textContent = item.rank_rarity;
            clone.querySelector('.bca-desc-lvl').textContent = `Lvl. ${item.rank}`;
            clone.querySelector('.bca-desc-xp').textContent = `${item.xp} XP`;
            clone.querySelector('.bca-btn-timeago').textContent = `${moment(item.fb_id).fromNow()}`;

            // checking for replies in the comment
            if (item.reply_count > 0) {
                clone.querySelector('.bca-btn-replies').textContent = `${item.reply_count} ${item.reply_count == 1 ? ` REPLY` : ` REPLIES`}`;
                clone.querySelector('.bca-btn-replies').dataset.rootid = item.comment_id;
                clone.querySelector('.bca-btn-replies').addEventListener('click', async (e) => {
                    await buildReply(e, `bca-comment-${item.comment_id}`);
                });
            } else
                clone.querySelector('.bca-btn-replies').remove();

            clone.querySelector('.bca-desc-text').innerHTML = item.content.hasOwnProperty('val') ? item.content.val : item.content;

            // adding listeners to the REPLY Button
            clone.querySelector('.bca-btn-reply').addEventListener('click', async () => {
                await triggerReplyBtn(clone, item);
            });

            container.appendChild(clone);
        });

        container.appendChild(fragment);
    }

    async function triggerReplyBtn(clone, item) {
        const editor = document.getElementById('bca_comment_editor');
        while (!document.querySelector('.bca-editor') && !document.querySelector('.bca-login-prompt')) {
            document.getElementById('trigger_comment_editor').click();
            await sleep(1000);
        }
        clone.after(editor);
        editor.dataset.parentid = clone.id;
        editor.dataset.rootid = clone.dataset.rootid || clone.id;
        if (document.querySelector('.bca-editor')) {
            editor.querySelector('#bca_action_status').textContent = `Add a reply`;
            document.querySelector('.bca-editor').setAttribute('placeholder', `Reply to ${item.username}...`);
            document.querySelector('.bca-toolbar h4').textContent = `Add a reply to @${item.username}`;
        }
    }

    async function buildReply(event, id) {
        // get the data first        
        event.target.classList.add('bca-btn-disabled');

        // check if there's an element next to the triggering element with a classname "bca-replies-list"
        const triggering_element = document.getElementById(id);

        if (triggering_element?.nextElementSibling?.classList.contains('bca-replies-list'))
            return;

        let comment_parent_id = event.target.dataset.rootid;

        let {
            data,
            error
        } = await supabase.rpc('retrieve_replies', {
            rootid: comment_parent_id
        });

        let comment_parent = document.getElementById(`bca-comment-${comment_parent_id}`);

        if (error) {
            window.alert(`Error getting replies
                ${error.message}`);
            return;
        }

        // create a clone 
        const template = document.querySelector('[comment-wrapper-template]');
        const fragment = document.createDocumentFragment();
        const replies_parent = document.createElement('div')
        replies_parent.className = 'bca-replies-list';

        const fb_data = await fetchFBContents(data);

        if (fb_data.result != "successful") {
            window.alert("Error in getting replies data.");
            return;
        }

        fb_data.payload.forEach(item => {
            let clone = template.content.cloneNode(true).children[0];

            // setting dataset
            clone.dataset.parentid = item.parent_id;
            clone.dataset.rootid = item.root_id;
            clone.id = `bca-comment-${item.reply_id}`;

            clone.querySelector('.bca-btn-replies').remove();
            clone.querySelector('.bca-desc-avatar').src = item.prof_img;
            clone.querySelector('.bca-desc-name').textContent = item.username;
            clone.querySelector('.bca-desc-rank').textContent = item.rank_name;
            clone.querySelector('.bca-desc-rarity').textContent = item.rank_rarity;
            clone.querySelector('.bca-desc-lvl').textContent = `Lvl. ${item.rank}`;
            clone.querySelector('.bca-desc-avatar-wrap').href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}`;
            clone.querySelector('.bca-desc-xp').textContent = `${item.xp} XP`;
            clone.querySelector('.bca-btn-timeago').textContent = `${moment(item.fb_id).fromNow()}`;

            // adding listeners to the REPLY Button
            clone.querySelector('.bca-btn-reply').addEventListener('click', async () => {
                await triggerReplyBtn(clone, item);
            });

            // Building content of a reply
            // If someone reply to a reply, then the parent_id must not be of the same root_id
            if (item.parent_id != item.root_id) {
                let reply_widget_data = getParentCommentContent(item.parent_id, fb_data.payload);
                let reply_widget_clone = document.querySelector('[reply-widget-template]').content.cloneNode(true).children[0];
                let dummy_div = document.createElement('div');
                dummy_div.innerHTML = reply_widget_data.content;

                reply_widget_clone.querySelector('.bca-reply-widget-username').textContent = `@${reply_widget_data.username}`;
                reply_widget_clone.querySelector('.bca-reply-widget-profimg').src = `${reply_widget_data.prof_img}`;
                reply_widget_clone.querySelector('.bca-reply-widget-profimg').alt = `reply-widget-profile-picture`;
                reply_widget_clone.querySelector('.bca-reply-widget-content').textContent = `${dummy_div.textContent.substring(0, 300)}...`;
                reply_widget_clone.addEventListener('click', () => {
                    highlightAndCenter(`bca-comment-${item.parent_id}`);
                });
                clone.querySelector('.bca-desc-content').insertBefore(reply_widget_clone, clone.querySelector('.bca-desc-content').firstChild);
            }

            clone.querySelector('.bca-desc-text').innerHTML = item.content.hasOwnProperty('val') ? item.content.val : item.content;

            fragment.appendChild(clone);
        });

        replies_parent.appendChild(fragment);
        comment_parent.parentNode.insertBefore(replies_parent, comment_parent.nextElementSibling);
    }

    function getParentCommentContent(parent_id, data) {
        // map the data to match parent_id to reply_id
        let filtered_data = data.filter(item => item.reply_id == parent_id);
        return filtered_data[0];
    }

    const highlightAndCenter = (id) => {

        const el = document.getElementById(id);
        if (!el) return;

        // 1. Smooth Scroll to Center
        el.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // 2. High-Contrast "Flash" (Battle Cats Style)
        el.style.outline = "5px solid #ff0000"; // Bright yellow outline
        el.style.transform = "scale(1.02)"; // Subtle pop-out
        el.style.borderRadius = "12px";

        setTimeout(() => {
            el.style.transition = "all 0.5s ease";
            el.style.outline = "0px solid transparent";
            el.style.transform = "scale(1)";
        }, 2000);
    }

    async function getCommentCount(url) {
        await initFunctions(['supabase']);
        let {
            data,
            error
        } = await supabase.from('bca-website-posts').select("id, bca-comments(count)").eq('url', url).filter('bca-comments.parent_id', 'is', null);

        if (error) {
            window.alert(`Error detected: ${error.message}`);
            return;
        }

        return data?.[0]?.["bca-comments"]?.[0].count;
    }

    async function getDataSupabase(pagenumber) {
        await initFunctions(['supabase']);
        let {
            data,
            error
        } = await supabase.rpc('retrieve_comments', {
            pathname_url: new URL(window.location.href).pathname,
            pagesize: 10,
            pagenumber: pagenumber
        });

        if (error) {
            window.alert(`Error in getting comments data: ${error.message}`);
            return;
        }

        return data;
    }

    // 1. Define the observer
    // const observer = new IntersectionObserver((entries) => {
    //     const sentinel = entries[0];

    //     // isIntersecting is true when the element is visible in the viewport
    //     if (sentinel.isIntersecting && !isFetching && hasMoreComments) {
    //         triggerLoadMore(); // Your function that fetches from Supabase
    //     }
    // }, {
    //     root: null, // use the browser viewport
    //     rootMargin: '200px', // start loading 200px before the user hits the bottom
    //     threshold: 0.1 // trigger when 10% of the sentinel is visible
    // });

    // const target = document.querySelector('#trigger_load_comments');
    // observer.observe(target);

    async function fetchFBContents(data) {
        return new Promise(async (resolve, reject) => {
            if (window.Worker) {
                const workerCode = `self.onmessage = async function(e) {
                    let command = e.data.action;
                    let payload = e.data.payload;
                    let tasks = {
                        GET_ALL_FB_DATA: async function(comment_arr_data) {
                            if(!comment_arr_data)
                                return;

                            const fetchPromises = comment_arr_data.map(async(data) => {
                                const res = await fetch(\`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments/\${data.fb_id}/content.json\`);
                                data.content = await res.json();
                                return data;
                            });

                            const allCommentsData = await Promise.all(fetchPromises);

                            self.postMessage({
                                result: "successful",
                                payload: allCommentsData
                            });
                        }
                    }
                    if (typeof tasks[command] === 'function') {            
                        await tasks[command](payload);
                    } else {
                        console.error('Task not found: ', e.data);
                    }
                }`;
                let myWorker = createWorker(workerCode);

                myWorker.postMessage({
                    action: 'GET_ALL_FB_DATA',
                    payload: data
                });

                myWorker.onmessage = (e) => {
                    resolve(e.data);
                }

                myWorker.onerror = (e) => {
                    window.alert("Error in worker: ", e);
                    reject(e);
                }

                function createWorker(workerStr) {
                    const blob = new Blob([workerStr], {
                        type: 'application/javascript'
                    });
                    const workerUrl = URL.createObjectURL(blob);
                    const myWorker = new Worker(workerUrl);

                    return myWorker;
                }
            }
        });
    }
})();
