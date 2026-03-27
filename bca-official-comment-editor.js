(async() => {

    window.requestIdleCallback(createCommentSkeleton);

    async function createCommentSkeleton() {
        const data = await getDataFromWorker();
        console.log("I already got the data", data);
        const payload = data.payload;
        const container = document.querySelector('.bca-comment-section');
        const fragment = document.createDocumentFragment();

        payload.forEach(item => {
            const template = document.querySelector('[comment-wrapper-template]');

            let clone = template.content.cloneNode(true).children[0];

            clone.id = `bca-comment-${item.comment_id}`;

            clone.querySelector('.bca-desc-avatar').src = item.prof_img;
            clone.querySelector('.bca-desc-name').textContent = item.username;
            clone.querySelector('.bca-desc-rank').textContent = item.rank_name;
            clone.querySelector('.bca-desc-rarity').textContent = item.rarity;
            clone.querySelector('.bca-desc-lvl').textContent = `Lvl. ${item.rank_id}`;
            clone.querySelector('.bca-desc-xp').textContent = `${item.xp} XP`;

            clone.querySelector('.bca-desc-text').innerHTML = item.content.hasOwnProperty('val') ? item.content.val : item.content;

            // adding listeners to the REPLY Button
            clone.querySelector('.bca-btn-reply').addEventListener('click', () => {
                const editor = document.getElementById('bca_comment_editor');
                clone.after(editor);
                editor.querySelector('#bca_action_status').textContent = `Add a reply`;
                document.querySelector('.bca-comment-editor').classList.add('bca-reply-mode');
                document.querySelector('.bca-editor').setAttribute('placeholder', `Reply to ${item.username}`);
            });

            container.appendChild(clone);
        });

        container.appendChild(fragment);
    }

    async function getDataFromWorker() {
        return new Promise(async(resolve, reject) => {
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

                async function getDataSupabase() {
                    await initFunctions(['supabase']);
                    let { data, error } = await supabase.rpc('get_all_comments', {
                        post_url: '/p/comment-editor.html',
                        page_size: 50,
                        page_number: 0
                    });

                    if (error) {
                        window.alert(`Error in getting comments data: ${error.message}`);
                        return;
                    }

                    return data;
                }

                myWorker.postMessage({
                    action: 'GET_ALL_FB_DATA',
                    payload: await getDataSupabase()
                });

                myWorker.onmessage = (e) => {
                    resolve(e.data);
                }

                myWorker.onerror = (e) => {
                    window.alert("Error in worker: ", e);
                    reject(e);
                }

                function createWorker(workerStr) {
                    const blob = new Blob([workerStr], { type: 'application/javascript' });
                    const workerUrl = URL.createObjectURL(blob);
                    const myWorker = new Worker(workerUrl);

                    return myWorker;
                }
            }
        });
    }
})();
